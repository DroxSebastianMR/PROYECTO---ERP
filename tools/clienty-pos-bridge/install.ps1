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
$taskName = "Clienty POS Bridge"

# Stop a previous local installation before updating the executable. This keeps
# reinstalls deterministic and prevents Windows from locking the target file.
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
}

Get-Process -Name "Clienty.PosBridge" -ErrorAction SilentlyContinue |
  Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 300

Copy-Item -LiteralPath $packagePath -Destination $targetPath -Force

$arguments = "--printer `"$PrinterName`""
if ($DrawerPin5) {
  $arguments += " --drawer-pin 5"
}

$startupDirectory = [Environment]::GetFolderPath("Startup")
$legacyShortcutPath = Join-Path $startupDirectory "Clienty POS Bridge.lnk"

# Remove the previous startup shortcut so the bridge is never started twice.
if (Test-Path -LiteralPath $legacyShortcutPath) {
  Remove-Item -LiteralPath $legacyShortcutPath -Force
}

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$taskAction = New-ScheduledTaskAction `
  -Execute $targetPath `
  -Argument $arguments `
  -WorkingDirectory $installDirectory
$taskTrigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$taskSettings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Days 365)
$taskPrincipal = New-ScheduledTaskPrincipal `
  -UserId $currentUser `
  -LogonType Interactive `
  -RunLevel Limited

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $taskAction `
  -Trigger $taskTrigger `
  -Settings $taskSettings `
  -Principal $taskPrincipal `
  -Description "Puente local de impresión y gaveta para Clienty." `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName
$health = $null
for ($attempt = 1; $attempt -le 10 -and -not $health; $attempt++) {
  Start-Sleep -Milliseconds 500

  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:9415/health" -TimeoutSec 1
  } catch {
    # The executable may still be reserving the local port.
  }
}

if (-not $health) {
  throw "La tarea se creó, pero el puente no respondió. Verifica el driver y el nombre de impresora '$PrinterName'."
}

Write-Host "Clienty POS Bridge instalado en segundo plano para '$($health.printer)'." -ForegroundColor Green
Write-Host "Se iniciará automáticamente al abrir sesión en Windows, sin mostrar consola." -ForegroundColor Green
