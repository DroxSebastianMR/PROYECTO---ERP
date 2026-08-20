# Handoff técnico para IA

Antes de intervenir Clienty:

1. Lee [README.md](../README.md), `.env.example`, `package.json` y el módulo relacionado.
2. Identifica UI, hook, servicio frontend, endpoint, controller, service, repository y Prisma antes de editar.
3. Conserva la arquitectura existente; no crees una arquitectura paralela.
4. No uses ni expongas secretos, credenciales o datos reales.
5. Si cambia la base de datos, actualiza Prisma, crea migración y valida consultas afectadas.
6. Para ventas, compras o inventario, verifica transacciones y kardex.
7. Ejecuta `pnpm lint` y `pnpm build` antes de publicar.

## Convenciones

- Frontend: `src/features/<modulo>` con componentes, hooks y services.
- Backend: `server/modules/<modulo>` con responsabilidades separadas.
- Permisos: provenientes de base de datos, no por condiciones de rol dispersas.
- Flujo Git: ramas desde `develop`; solo `main` llega a Render.
- POS: `tools/clienty-pos-bridge` es local y nunca se despliega ni expone fuera de `127.0.0.1`.
