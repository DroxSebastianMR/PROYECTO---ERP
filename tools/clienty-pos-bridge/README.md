# Clienty POS Bridge

Utilidad local de Windows para imprimir tickets y abrir la gaveta RJ11 conectada
a una impresora térmica USB. No se despliega en Render ni se expone a la red.

## Ejecutar en la PC de caja

```powershell
dotnet run --project tools/clienty-pos-bridge -- --printer "POS-80-Series"
```

Para desarrollo, mantén esa consola abierta durante la operación de caja. La
aplicación escucha solo en `http://127.0.0.1:9415`, imprime en RAW ESC/POS y usa
`ESC p` para abrir la gaveta por el pin 2. Si el modelo usa el pin 5, ejecuta:

```powershell
dotnet run --project tools/clienty-pos-bridge -- --printer "POS-80-Series" --drawer-pin 5
```

## Configuración del frontend

En el `.env` que usa el frontend de la PC de caja:

```env
VITE_POS_DRAWER_ENABLED="true"
VITE_POS_DRAWER_BRIDGE_URL="http://127.0.0.1:9415/api/v1/cash-drawer/open"
```

Reinicia Vite después de modificar estas variables.

## Prueba segura

Con el puente activo, consulta el estado:

```powershell
Invoke-WebRequest http://127.0.0.1:9415/health
```

La apertura física se prueba únicamente realizando una venta de efectivo desde
Nueva Venta. Las ventas digitales no llaman al puente.

## Uso desde Clienty publicado en Render

El navegador de la PC de caja se comunica con `127.0.0.1`, por lo que también
funciona cuando Clienty se abre desde Render. Configura estas variables en el
servicio web de Render **antes de compilar el frontend** y vuelve a desplegar:

```env
VITE_POS_DRAWER_ENABLED="true"
VITE_POS_DRAWER_BRIDGE_URL="http://127.0.0.1:9415/api/v1/cash-drawer/open"
```

La impresora y la gaveta siguen siendo locales: Render nunca puede acceder por
sí mismo al USB de una computadora.

## Instalación para otra PC de caja

1. Instala el driver de la impresora y verifica el nombre en Windows.
2. Publica el puente como ejecutable autocontenido:

   ```powershell
   dotnet publish tools/clienty-pos-bridge/Clienty.PosBridge.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:PublishTrimmed=false -o tools/clienty-pos-bridge/publish
   ```

3. Copia la carpeta `publish` y el archivo `install.ps1` a la PC de caja.
4. Abre PowerShell en esa carpeta y ejecuta:

   ```powershell
   .\install.ps1 -PrinterName "POS-80-Series"
   ```

El instalador registra una tarea programada solo para el usuario actual de
Windows. El puente inicia al abrir sesión de forma invisible, se reinicia si
falla y permanece accesible únicamente desde esa PC. No cierres ni abras una
consola para el uso diario.
