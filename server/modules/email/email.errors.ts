export class EmailConfigurationError extends Error {
  constructor() {
    super("El servicio de correo no está configurado.");
    this.name = "EmailConfigurationError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(cause: unknown) {
    super("No se pudo enviar el correo.", { cause });
    this.name = "EmailDeliveryError";
  }
}
