[CmdletBinding()]
param()

$bridgeHealthUrl = "http://127.0.0.1:9415/health"
$printerName = if ($env:CLIENTY_POS_PRINTER) { $env:CLIENTY_POS_PRINTER } else { "POS-80-Series" }

try {
  $health = Invoke-RestMethod -Uri $bridgeHealthUrl -TimeoutSec 2
  Write-Host "Clienty POS Bridge ya está activo para '$($health.printer)'." -ForegroundColor Green
  exit 0
} catch {
  Write-Host "Iniciando Clienty POS Bridge para '$printerName'..." -ForegroundColor Magenta
}

$publishedBridge = Join-Path $PSScriptRoot "publish\Clienty.PosBridge.exe"
if (Test-Path -LiteralPath $publishedBridge) {
  Start-Process -FilePath $publishedBridge -ArgumentList "--printer `"$printerName`"" -WorkingDirectory (Split-Path $publishedBridge) -WindowStyle Hidden
  Start-Sleep -Milliseconds 700

  try {
    $health = Invoke-RestMethod -Uri $bridgeHealthUrl -TimeoutSec 3
    Write-Host "Clienty POS Bridge activo para '$($health.printer)'." -ForegroundColor Green
    exit 0
  } catch {
    throw "El puente POS no pudo iniciarse. Verifica que la impresora '$printerName' esté instalada en Windows."
  }
}

# Fallback para desarrolladores que aún no publicaron el ejecutable local.
& dotnet run --project tools/clienty-pos-bridge -- --printer $printerName
exit $LASTEXITCODE
