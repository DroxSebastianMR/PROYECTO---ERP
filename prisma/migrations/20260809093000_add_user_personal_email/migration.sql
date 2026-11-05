-- Correo externo del usuario. No se usa para iniciar sesión; se reserva para
-- comunicaciones personales, incluido el flujo de recuperación de contraseña.
ALTER TABLE "User" ADD COLUMN "personalEmail" TEXT;

CREATE UNIQUE INDEX "User_personalEmail_key" ON "User"("personalEmail");
