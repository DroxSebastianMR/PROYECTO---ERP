# Clienty · Sistema de Ventas

ERP web para productos, inventario, compras, ventas POS, caja, clientes,
proveedores, usuarios, permisos, reportes, códigos de barras e impresión térmica.

Esta guía permite preparar otra computadora sin copiar secretos ni datos de producción.

## Tipos de computadora

| Equipo | Uso | Instalación |
| --- | --- | --- |
| Desarrollo | Modificar el sistema con Codex o VS Code | Git, Node.js, pnpm, Supabase y .NET SDK si modifica POS |
| Caja / POS | Vender, imprimir y abrir gaveta | Navegador, driver de impresora y Clienty POS Bridge |

La PC de caja no necesita Node.js ni Codex si solo utilizará el sistema publicado en Render.

## Instalar Codex en otra PC

1. Instala la aplicación de escritorio de ChatGPT/Codex para Windows desde la descarga oficial de OpenAI.
2. Inicia sesión con la cuenta autorizada.
3. Clona este repositorio y en Codex selecciona **Open folder**.
4. Elige la carpeta raíz `PROYECTO - ERP`.
5. Pide a Codex que lea este archivo antes de modificar código.

Prompt recomendado para iniciar una sesión:

```text
Lee README.md, docs/AI-HANDOFF.md, .env.example y package.json.
Este es Clienty, un ERP/POS. Conserva la arquitectura modular existente,
no expongas secretos ni modifiques la base de datos sin migración Prisma.
Antes de editar, revisa el flujo afectado y valida con lint o build.
```

## Requisitos de desarrollo

- Windows 10/11, Git y Node.js 22 LTS.
- pnpm mediante Corepack.
- Acceso autorizado a Supabase y Render si se modificará infraestructura.
- .NET 8 SDK solo para desarrollar el puente de impresora/gaveta.

Comprueba las herramientas:

```powershell
git --version
node --version
corepack --version
dotnet --version
```

## Preparar el repositorio

```powershell
git clone https://github.com/DroxSebastianMR/PROYECTO---ERP.git
Set-Location "PROYECTO---ERP"
corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

No compartas `.env` por Git, chat o correo. Configura en el nuevo `.env` tus propios valores para `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SMTP_*`, `VITE_API_URL` y las variables `VITE_SUPABASE_*`.

Las contraseñas, JWT, SMTP y service keys nunca se exponen como `VITE_*`.

## Base de datos

Con `.env` configurado:

```powershell
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

Seeds opcionales de desarrollo:

```powershell
pnpm db:seed:catalog
pnpm db:seed:suppliers
```

No ejecutes scripts de limpieza contra producción sin respaldo y autorización.

## Ejecución local

```powershell
pnpm dev
```

Inicia web (`http://localhost:5173`), API (`http://localhost:3001/api`) y el puente POS. Para trabajar sin impresora, usa dos terminales:

```powershell
pnpm dev:web
pnpm dev:api
```

Antes de publicar cambios:

```powershell
pnpm lint
pnpm build
```

## PC de caja: impresora y gaveta

1. Instala el driver y confirma el nombre de impresora en Windows. Actualmente: `POS-80-Series`.
2. Copia `tools/clienty-pos-bridge/publish/` e `install.ps1` a la PC, o clona el repositorio.
3. Ejecuta desde PowerShell:

```powershell
.\tools\clienty-pos-bridge\install.ps1 -PrinterName "POS-80-Series"
```

El instalador crea la tarea de Windows **Clienty POS Bridge**. Se inicia al abrir sesión, permanece invisible, se reinicia si falla y solo escucha en esa PC (`127.0.0.1`). No es necesario mantener una consola abierta.

Comprobación:

```powershell
Invoke-RestMethod http://127.0.0.1:9415/health
```

Debe responder `status: ok` y el nombre de impresora.

## Despliegue y ramas

- Las ramas de trabajo nacen desde `develop`: `feature/`, `fix/`, `refactor/`, `hotfix/`, `chore/` o `release/`, en minúsculas y `kebab-case`.
- `develop` integra los cambios revisados.
- Solo `main` se publica en Render.
- Render despliega automáticamente los commits recibidos en `main`.

Las variables privadas de backend en Render son `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SMTP_*` y `CLIENT_URL`. Las variables `VITE_*` se incorporan durante el build web; tras cambiarlas, vuelve a desplegar.

## Arquitectura

```text
src/                         React + Vite + React Query
server/modules/              API Express por módulos
server/modules/<modulo>/     routes, controllers, services, repositories,
                             schemas, errors y types
prisma/                      Schema, migraciones y seeds
tools/clienty-pos-bridge/    Impresión térmica y apertura de gaveta local
```

Reglas: reutilizar componentes y servicios, mantener permisos desde BD, crear migración Prisma para cambios de modelo y revisar el flujo completo antes de tocar ventas, compras, stock o kardex.

## Diagnóstico rápido

| Síntoma | Revisión |
| --- | --- |
| Web no conecta API | `VITE_API_URL`, API, CORS y `CLIENT_URL` |
| No imprime o abre gaveta | `Invoke-RestMethod http://127.0.0.1:9415/health` |
| No carga imagen | Variables Supabase, bucket y políticas Storage |
| No llega recuperación | Variables `SMTP_*` en backend/Render |
