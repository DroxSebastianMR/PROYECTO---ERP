using System.Net;
using System.Globalization;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;

const string defaultPrinterName = "POS-80-Series";
const string bridgeAddress = "http://127.0.0.1:9415/";

var printerName = GetOption(args, "--printer") ?? defaultPrinterName;
var drawerPin = GetOption(args, "--drawer-pin") == "5" ? (byte)1 : (byte)0;
var allowedOrigins = GetAllowedOrigins();

using var listener = new HttpListener();
listener.Prefixes.Add(bridgeAddress);
listener.Start();

Console.WriteLine("Clienty POS Bridge activo.");
Console.WriteLine($"Impresora: {printerName}");
Console.WriteLine($"Escuchando en: {bridgeAddress}");

while (true)
{
  var context = await listener.GetContextAsync();
  _ = Task.Run(() => HandleRequestAsync(context, printerName, drawerPin, allowedOrigins));
}

static async Task HandleRequestAsync(
  HttpListenerContext context,
  string printerName,
  byte drawerPin,
  HashSet<string> allowedOrigins)
{
  var request = context.Request;
  var response = context.Response;
  var origin = request.Headers["Origin"];

  if (!string.IsNullOrWhiteSpace(origin) && !allowedOrigins.Contains(origin))
  {
    await WriteJsonAsync(response, 403, new { error = "Origen no autorizado." });
    return;
  }

  if (!string.IsNullOrWhiteSpace(origin))
  {
    response.Headers["Access-Control-Allow-Origin"] = origin;
    response.Headers["Vary"] = "Origin";
    response.Headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS";
    response.Headers["Access-Control-Allow-Headers"] = "Content-Type";
  }

  if (request.HttpMethod == "OPTIONS")
  {
    response.StatusCode = 204;
    response.Close();
    return;
  }

  if (request.HttpMethod == "GET" && request.Url?.AbsolutePath == "/health")
  {
    await WriteJsonAsync(response, 200, new { status = "ok", printer = printerName });
    return;
  }

  if (request.HttpMethod == "POST" && request.Url?.AbsolutePath == "/api/v1/receipts/print")
  {
    try
    {
      var ticket = await JsonSerializer.DeserializeAsync<ReceiptPrintRequest>(request.InputStream, new JsonSerializerOptions
      {
        PropertyNameCaseInsensitive = true,
      });
      if (ticket is null || string.IsNullOrWhiteSpace(ticket.Number) || ticket.Items is null || ticket.Items.Count == 0)
      {
        await WriteJsonAsync(response, 400, new { error = "Ticket de venta inválido." });
        return;
      }

      RawPrinter.PrintReceipt(printerName, ReceiptFormatter.Format(ticket), ticket.TicketImage);
      await WriteJsonAsync(response, 200, new { status = "printed" });
    }
    catch (Exception exception)
    {
      Console.Error.WriteLine($"No se pudo imprimir el ticket: {exception.Message}");
      await WriteJsonAsync(response, 503, new { error = "No se pudo comunicar con la impresora." });
    }
    return;
  }

  if (request.HttpMethod != "POST" || request.Url?.AbsolutePath != "/api/v1/cash-drawer/open")
  {
    await WriteJsonAsync(response, 404, new { error = "Ruta no encontrada." });
    return;
  }

  try
  {
    var payload = await JsonSerializer.DeserializeAsync<CashDrawerRequest>(request.InputStream, new JsonSerializerOptions
    {
      PropertyNameCaseInsensitive = true,
    });
    var isCashPayment = payload?.Reason == "cash-payment";
    var isManualOpen = payload?.Reason == "manual-cash-register";
    if (payload is null || (!isManualOpen && (!isCashPayment || string.IsNullOrWhiteSpace(payload.SaleId) || string.IsNullOrWhiteSpace(payload.SaleNumber))))
    {
      await WriteJsonAsync(response, 400, new { error = "Solicitud de venta inválida." });
      return;
    }

    RawPrinter.SendDrawerPulse(printerName, drawerPin);
    await WriteJsonAsync(response, 200, new { status = "opened" });
  }
  catch (Exception exception)
  {
    Console.Error.WriteLine($"No se pudo abrir la gaveta: {exception.Message}");
    await WriteJsonAsync(response, 503, new { error = "No se pudo comunicar con la impresora." });
  }
}

static HashSet<string> GetAllowedOrigins()
{
  var configured = Environment.GetEnvironmentVariable("CLIENTY_ALLOWED_ORIGINS");
  var origins = string.IsNullOrWhiteSpace(configured)
    ? ["http://localhost:5173", "https://districorp-erp-web.onrender.com"]
    : configured.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

  return new HashSet<string>(origins, StringComparer.OrdinalIgnoreCase);
}

static string? GetOption(string[] args, string option)
{
  var index = Array.FindIndex(args, value => string.Equals(value, option, StringComparison.OrdinalIgnoreCase));
  return index >= 0 && index + 1 < args.Length ? args[index + 1] : null;
}

static async Task WriteJsonAsync(HttpListenerResponse response, int statusCode, object body)
{
  var json = JsonSerializer.Serialize(body);
  var bytes = Encoding.UTF8.GetBytes(json);
  response.StatusCode = statusCode;
  response.ContentType = "application/json; charset=utf-8";
  response.ContentLength64 = bytes.Length;
  await response.OutputStream.WriteAsync(bytes);
  response.Close();
}

file sealed record CashDrawerRequest(string? SaleId, string? SaleNumber, string Reason);
file sealed record ReceiptPrintRequest(
  string Number,
  string CustomerName,
  string? CustomerDocument,
  string PaymentMethod,
  decimal Total,
  decimal SubtotalAmount,
  decimal IgvAmount,
  string CreatedAt,
  string CreatedBy,
  List<ReceiptItem> Items,
  string? TicketImage = null);
file sealed record ReceiptItem(string ProductName, decimal Quantity, decimal UnitPrice, decimal Subtotal);

file static class ReceiptFormatter
{
  private const int LineWidth = 42;

  internal static string Format(ReceiptPrintRequest receipt)
  {
    var date = DateTimeOffset.TryParse(receipt.CreatedAt, out var parsedDate) ? parsedDate.LocalDateTime : DateTime.Now;
    var ticketNumber = $"T001-{new string(receipt.Number.Where(char.IsDigit).ToArray()).PadLeft(8, '0')}";
    var lines = new List<string>
    {
      Center("NORTIVA S.A.C."),
      Center("DISTRIBUIDORA DE BEBIDAS"),
      Center("RUC: 20XXXXXXXXX"),
      Center("Tel.: 999 999 999"),
      Center("ventas@nortiva.com"),
      Separator(),
      Center($"TICKET: {ticketNumber}"),
      $"FECHA: {date:dd/MM/yy}   HORA: {date:HH:mm}",
      Fit($"VENDEDOR: {receipt.CreatedBy.ToUpperInvariant()}", "CAJA: 01"),
      Separator(),
      $"CLIENTE: {receipt.CustomerName.ToUpperInvariant()}",
      $"DOCUMENTO: {receipt.CustomerDocument ?? "SIN DOCUMENTO"}",
      Separator(),
      "CANT DESCRIPCION             P/U   TOTAL",
      Separator(),
    };

    foreach (var item in receipt.Items)
    {
      var description = item.ProductName.Length > 22 ? item.ProductName[..22] : item.ProductName;
      lines.Add($"{item.Quantity,4:0} {description,-22} {item.UnitPrice,5:0.00} {item.Subtotal,7:0.00}");
    }

    lines.AddRange([
      Separator(),
      Fit("SUBTOTAL:", Money(receipt.SubtotalAmount)),
      Fit("IGV (18%):", Money(receipt.IgvAmount)),
      Fit("TOTAL:", Money(receipt.Total)),
      Separator(),
      $"METODO DE PAGO: {PaymentLabel(receipt.PaymentMethod)}",
      Separator(),
      Center("CALIDAD, VARIEDAD Y CONFIANZA"),
      Center("!SIEMPRE CONTIGO!"),
      Center("Gracias por su compra"),
    ]);

    return string.Join("\n", lines) + "\n\n\n";
  }

  private static string PaymentLabel(string method) => method switch
  {
    "CASH" => "EFECTIVO",
    "YAPE_PLIN" => "YAPE / PLIN",
    "BANK_TRANSFER" => "TRANSFERENCIA",
    "CARD" => "TARJETA",
    _ => method,
  };

  private static string Money(decimal value) => $"S/ {value:0.00}";
  private static string Separator() => new('-', LineWidth);
  private static string Center(string text) => text.PadLeft((LineWidth + text.Length) / 2).PadRight(LineWidth);
  private static string Fit(string left, string right) => left.Length + right.Length >= LineWidth ? left : left + new string(' ', LineWidth - left.Length - right.Length) + right;
}

file static class RawPrinter
{
  private const int ErrorInvalidPrinterName = 1801;

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  private sealed class DocInfo
  {
    [MarshalAs(UnmanagedType.LPStr)] public string DocumentName = "Clienty - Apertura de gaveta";
    [MarshalAs(UnmanagedType.LPStr)] public string? OutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string DataType = "RAW";
  }

  [DllImport("winspool.Drv", SetLastError = true, CharSet = CharSet.Ansi)]
  private static extern bool OpenPrinter(string printerName, out IntPtr printerHandle, IntPtr defaults);

  [DllImport("winspool.Drv", SetLastError = true)]
  private static extern bool ClosePrinter(IntPtr printerHandle);

  [DllImport("winspool.Drv", SetLastError = true, CharSet = CharSet.Ansi)]
  private static extern int StartDocPrinter(IntPtr printerHandle, int level, [In] DocInfo documentInfo);

  [DllImport("winspool.Drv", SetLastError = true)]
  private static extern bool EndDocPrinter(IntPtr printerHandle);

  [DllImport("winspool.Drv", SetLastError = true)]
  private static extern bool StartPagePrinter(IntPtr printerHandle);

  [DllImport("winspool.Drv", SetLastError = true)]
  private static extern bool EndPagePrinter(IntPtr printerHandle);

  [DllImport("winspool.Drv", SetLastError = true)]
  private static extern bool WritePrinter(IntPtr printerHandle, byte[] bytes, int count, out int written);

  internal static void SendDrawerPulse(string printerName, byte pin)
  {
    if (!OperatingSystem.IsWindows()) throw new PlatformNotSupportedException("El puente POS requiere Windows.");

    if (!OpenPrinter(printerName, out var printerHandle, IntPtr.Zero))
    {
      var error = Marshal.GetLastWin32Error();
      var message = error == ErrorInvalidPrinterName
        ? $"No se encontró la impresora '{printerName}'."
        : $"Windows no pudo abrir la impresora (error {error}).";
      throw new InvalidOperationException(message);
    }

    try
    {
      if (StartDocPrinter(printerHandle, 1, new DocInfo()) == 0)
        throw new InvalidOperationException($"No se pudo iniciar el trabajo RAW (error {Marshal.GetLastWin32Error()}).");

      try
      {
        if (!StartPagePrinter(printerHandle))
          throw new InvalidOperationException($"No se pudo iniciar la página RAW (error {Marshal.GetLastWin32Error()}).");

        try
        {
          // ESC p m t1 t2: m=0 is drawer pin 2, m=1 is drawer pin 5.
          Send(printerHandle, new byte[] { 0x1B, 0x70, pin, 0x19, 0xFA }, "pulso de gaveta");
        }
        finally
        {
          EndPagePrinter(printerHandle);
        }
      }
      finally
      {
        EndDocPrinter(printerHandle);
      }
    }
    finally
    {
      ClosePrinter(printerHandle);
    }
  }

  internal static void PrintReceipt(string printerName, string receipt, string? ticketImage)
  {
    var normalized = receipt.Normalize(NormalizationForm.FormD);
    var plainText = string.Concat(normalized.Where(character => CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark));
    var bytes = new List<byte>(new byte[] { 0x1B, 0x40, 0x1B, 0x61, 0x00 });
    if (!string.IsNullOrWhiteSpace(ticketImage))
    {
      bytes.AddRange(EscPosImage.RenderDataUrl(ticketImage, 576));
    }
    else
    {
      bytes.AddRange(new byte[] { 0x1B, 0x61, 0x01 });
      var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "src", "assets", "img", "logo.png");
      if (File.Exists(logoPath)) bytes.AddRange(EscPosImage.Render(logoPath, 360));
      bytes.AddRange(Encoding.ASCII.GetBytes(plainText));
    }
    // Feed then partial-cut. POS-80 compatible printers ignore this safely when
    // a cutter is not fitted.
    bytes.AddRange(new byte[] { 0x1B, 0x64, 0x05, 0x1D, 0x56, 0x42, 0x00 });
    SendRaw(printerName, bytes.ToArray(), "ticket");
  }

  private static void SendRaw(string printerName, byte[] command, string operation)
  {
    if (!OperatingSystem.IsWindows()) throw new PlatformNotSupportedException("El puente POS requiere Windows.");

    if (!OpenPrinter(printerName, out var printerHandle, IntPtr.Zero))
      throw new InvalidOperationException($"Windows no pudo abrir la impresora (error {Marshal.GetLastWin32Error()}).");

    try
    {
      if (StartDocPrinter(printerHandle, 1, new DocInfo()) == 0)
        throw new InvalidOperationException($"No se pudo iniciar el trabajo RAW (error {Marshal.GetLastWin32Error()}).");
      try
      {
        if (!StartPagePrinter(printerHandle))
          throw new InvalidOperationException($"No se pudo iniciar la página RAW (error {Marshal.GetLastWin32Error()}).");
        try { Send(printerHandle, command, operation); }
        finally { EndPagePrinter(printerHandle); }
      }
      finally { EndDocPrinter(printerHandle); }
    }
    finally { ClosePrinter(printerHandle); }
  }

  private static void Send(IntPtr printerHandle, byte[] command, string operation)
  {
    if (!WritePrinter(printerHandle, command, command.Length, out var written) || written != command.Length)
      throw new InvalidOperationException($"No se pudo enviar el {operation} (error {Marshal.GetLastWin32Error()}).");
  }
}

file static class EscPosImage
{
  internal static byte[] Render(string imagePath, int maxWidth)
  {
    using var source = new Bitmap(imagePath);
    return Render(source, maxWidth);
  }

  internal static byte[] RenderDataUrl(string dataUrl, int maxWidth)
  {
    var separatorIndex = dataUrl.IndexOf(',');
    if (separatorIndex < 0) throw new InvalidOperationException("La imagen del ticket no tiene un formato vÃ¡lido.");

    var imageBytes = Convert.FromBase64String(dataUrl[(separatorIndex + 1)..]);
    using var stream = new MemoryStream(imageBytes);
    using var source = new Bitmap(stream);
    return Render(source, maxWidth);
  }

  private static byte[] Render(Bitmap source, int maxWidth)
  {
    var targetWidth = Math.Min(maxWidth, source.Width);
    var targetHeight = Math.Max(1, (int)Math.Round(source.Height * (targetWidth / (double)source.Width)));
    using var bitmap = new Bitmap(targetWidth, targetHeight);
    using (var graphics = Graphics.FromImage(bitmap))
    {
      graphics.Clear(Color.White);
      graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
      graphics.DrawImage(source, new Rectangle(0, 0, targetWidth, targetHeight));
    }

    var widthBytes = (targetWidth + 7) / 8;
    var bytes = new List<byte>
    {
      0x1D, 0x76, 0x30, 0x00,
      (byte)(widthBytes & 0xFF), (byte)(widthBytes >> 8),
      (byte)(targetHeight & 0xFF), (byte)(targetHeight >> 8),
    };

    for (var y = 0; y < targetHeight; y++)
    {
      for (var xByte = 0; xByte < widthBytes; xByte++)
      {
        byte value = 0;
        for (var bit = 0; bit < 8; bit++)
        {
          var x = xByte * 8 + bit;
          if (x >= targetWidth) continue;
          var pixel = bitmap.GetPixel(x, y);
          var luminance = pixel.R * 0.299 + pixel.G * 0.587 + pixel.B * 0.114;
          // A softer threshold prevents colored details in the Nortiva logo
          // from becoming a solid dark block, while the near-black ticket text
          // remains crisp on thermal paper.
          if (luminance < 145) value |= (byte)(0x80 >> bit);
        }
        bytes.Add(value);
      }
    }

    bytes.AddRange(new byte[] { 0x0A, 0x1B, 0x61, 0x00 });
    return bytes.ToArray();
  }
}
