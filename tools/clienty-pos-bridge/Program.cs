using System.Net;
using System.Net.Sockets;
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

using var listener = new TcpListener(IPAddress.Loopback, 9415);
listener.Start();

Console.WriteLine("Clienty POS Bridge activo.");
Console.WriteLine($"Impresora: {printerName}");
Console.WriteLine($"Escuchando en: {bridgeAddress}");

while (true)
{
  var client = await listener.AcceptTcpClientAsync();
  _ = Task.Run(() => HandleRequestAsync(client, printerName, drawerPin, allowedOrigins));
}

static async Task HandleRequestAsync(
  TcpClient client,
  string printerName,
  byte drawerPin,
  HashSet<string> allowedOrigins)
{
  using (client)
  {
    using var stream = client.GetStream();
    var request = await ReadRequestAsync(stream);
    if (request is null) return;

    var origin = request.Origin;

    if (!string.IsNullOrWhiteSpace(origin) && !allowedOrigins.Contains(origin))
    {
      await WriteJsonAsync(stream, 403, new { error = "Origen no autorizado." });
      return;
    }

    if (request.Method == "OPTIONS")
    {
      await WriteResponseAsync(stream, 204, null, origin);
      return;
    }

    if (request.Method == "GET" && request.Path == "/health")
    {
      await WriteJsonAsync(stream, 200, new { status = "ok", printer = printerName }, origin);
      return;
    }

    if (request.Method == "POST" && request.Path == "/api/v1/receipts/print")
    {
    try
    {
      var ticket = JsonSerializer.Deserialize<ReceiptPrintRequest>(request.Body, new JsonSerializerOptions
      {
        PropertyNameCaseInsensitive = true,
      });
      if (ticket is null || string.IsNullOrWhiteSpace(ticket.Number) || ticket.Items is null || ticket.Items.Count == 0)
      {
        await WriteJsonAsync(stream, 400, new { error = "Ticket de venta inválido." }, origin);
        return;
      }

      RawPrinter.PrintReceipt(printerName, ReceiptFormatter.Format(ticket), ticket.TicketImage);
      await WriteJsonAsync(stream, 200, new { status = "printed" }, origin);
    }
    catch (Exception exception)
    {
      Console.Error.WriteLine($"No se pudo imprimir el ticket: {exception.Message}");
      await WriteJsonAsync(stream, 503, new { error = "No se pudo comunicar con la impresora." }, origin);
    }
      return;
    }

    if (request.Method != "POST" || request.Path != "/api/v1/cash-drawer/open")
    {
      await WriteJsonAsync(stream, 404, new { error = "Ruta no encontrada." }, origin);
      return;
    }

    try
    {
    var payload = JsonSerializer.Deserialize<CashDrawerRequest>(request.Body, new JsonSerializerOptions
    {
      PropertyNameCaseInsensitive = true,
    });
    var isCashPayment = payload?.Reason == "cash-payment";
    var isManualOpen = payload?.Reason == "manual-cash-register";
    if (payload is null || (!isManualOpen && (!isCashPayment || string.IsNullOrWhiteSpace(payload.SaleId) || string.IsNullOrWhiteSpace(payload.SaleNumber))))
    {
      await WriteJsonAsync(stream, 400, new { error = "Solicitud de venta inválida." }, origin);
      return;
    }

    RawPrinter.SendDrawerPulse(printerName, drawerPin);
    await WriteJsonAsync(stream, 200, new { status = "opened" }, origin);
    }
    catch (Exception exception)
    {
      Console.Error.WriteLine($"No se pudo abrir la gaveta: {exception.Message}");
      await WriteJsonAsync(stream, 503, new { error = "No se pudo comunicar con la impresora." }, origin);
    }
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

static async Task<BridgeRequest?> ReadRequestAsync(NetworkStream stream)
{
  using var reader = new StreamReader(stream, Encoding.UTF8, false, 8192, true);
  var requestLine = await reader.ReadLineAsync();
  if (string.IsNullOrWhiteSpace(requestLine)) return null;

  var parts = requestLine.Split(' ', StringSplitOptions.RemoveEmptyEntries);
  if (parts.Length < 2) return null;
  var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
  string? line;
  while (!string.IsNullOrEmpty(line = await reader.ReadLineAsync()))
  {
    var separator = line.IndexOf(':');
    if (separator > 0) headers[line[..separator].Trim()] = line[(separator + 1)..].Trim();
  }

  var contentLength = headers.TryGetValue("Content-Length", out var rawLength) && int.TryParse(rawLength, out var length) ? length : 0;
  var body = new char[contentLength];
  var read = 0;
  while (read < contentLength)
  {
    var count = await reader.ReadAsync(body.AsMemory(read, contentLength - read));
    if (count == 0) break;
    read += count;
  }

  return new BridgeRequest(parts[0].ToUpperInvariant(), parts[1].Split('?')[0], headers.GetValueOrDefault("Origin"), new string(body, 0, read));
}

static Task WriteJsonAsync(NetworkStream stream, int statusCode, object body, string? origin = null) =>
  WriteResponseAsync(stream, statusCode, JsonSerializer.Serialize(body), origin);

static async Task WriteResponseAsync(NetworkStream stream, int statusCode, string? body, string? origin = null)
{
  var content = body ?? string.Empty;
  var bytes = Encoding.UTF8.GetBytes(content);
  var reason = statusCode switch { 200 => "OK", 204 => "No Content", 400 => "Bad Request", 403 => "Forbidden", 404 => "Not Found", 503 => "Service Unavailable", _ => "Error" };
  var cors = string.IsNullOrWhiteSpace(origin) ? string.Empty : $"Access-Control-Allow-Origin: {origin}\r\nVary: Origin\r\nAccess-Control-Allow-Methods: POST, GET, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n";
  var headers = $"HTTP/1.1 {statusCode} {reason}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {bytes.Length}\r\nConnection: close\r\n{cors}\r\n";
  await stream.WriteAsync(Encoding.UTF8.GetBytes(headers));
  if (bytes.Length > 0) await stream.WriteAsync(bytes);
}

file sealed record BridgeRequest(string Method, string Path, string? Origin, string Body);
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
