# Correo en producción

El envío de recuperación de contraseña se realiza exclusivamente desde la API de Render. Para habilitarlo, registra estas variables en el servicio **districorp-erp-api** y vuelve a desplegarlo:

- `SMTP_HOST`: host SMTP del proveedor.
- `SMTP_PORT`: `587` para STARTTLS o `465` para TLS implícito.
- `SMTP_SECURE`: `false` con el puerto `587`; `true` con el puerto `465`.
- `SMTP_USERNAME` y `SMTP_PASSWORD`: credenciales SMTP o contraseña de aplicación.
- `SMTP_FROM_EMAIL`: dirección remitente verificada por el proveedor.
- `SMTP_FROM_NAME`: nombre visible del remitente.
- `CLIENT_URL`: URL pública exacta del frontend, sin una ruta adicional.

No uses variables `VITE_` para los valores SMTP: esas variables se publican en el navegador. Tras un intento de recuperación, los registros de Render mostrarán el código SMTP (por ejemplo `EAUTH`, `ECONNECTION` o `ETIMEDOUT`) sin revelar contraseñas ni el destinatario.

Si el proveedor bloquea conexiones SMTP salientes, utiliza el puerto y mecanismo admitidos por ese proveedor (normalmente `587` con STARTTLS) o un proveedor de correo transaccional compatible con SMTP.
