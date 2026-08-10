[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string]$PrinterName,
  [switch]$DrawerPin5
)

$packagePath = Join-Path $PSScriptRoot "publish\Clienty.PosBridge.exe"
if (-not (Test-Path -LiteralPath $packagePath)) {
  throw "No se encontró el ejecutable publicado en '$packagePath'. Primero ejecuta el comando dotnet publish indicado en README.md."
}

$installDirectory = Join-Path $env:LOCALAPPDATA "Clienty\PosBridge"
New-Item -ItemType Directory -Path $installDirectory -Force | Out-Null

$targetPath = Join-Path $installDirectory "Clienty.PosBridge.exe"
Copy-Item -LiteralPath $packagePath -Destination $targetPath -Force

$arguments = "--printer `"$PrinterName`""
if ($DrawerPin5) {
  $arguments += " --drawer-pin 5"
}

$startupDirectory = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupDirectory "Clienty POS Bridge.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $installDirectory
$shortcut.Description = "Puente local de impresión y gaveta para Clienty"
$shortcut.Save()

Start-Process -FilePath $targetPath -ArgumentList $arguments -WorkingDirectory $installDirectory
Write-Host "Clienty POS Bridge instalado para '$PrinterName' y configurado para iniciar con Windows." -ForegroundColor Green
