import type { SendEmailInput } from "../email.types.js";

type PasswordRecoveryTemplateInput = {
  recipientName?: string;
  resetUrl: string;
  expiresInMinutes?: number;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!,
  );

/** Renders a compatible transactional email for the password recovery flow. */
export const createPasswordRecoveryEmail = ({
  recipientName,
  resetUrl,
  expiresInMinutes = 30,
}: PasswordRecoveryTemplateInput): Omit<SendEmailInput, "to"> => {
  const recipient = recipientName?.trim() || "usuario";
  const safeRecipient = escapeHtml(recipient);
  const safeUrl = escapeHtml(resetUrl);
  const subject = "Restablece tu contraseña de Clienty";

  return {
    subject,
    text: [
      `Hola, ${recipient}.`,
      "",
      "Recibimos una solicitud para restablecer la contraseña de tu cuenta de Clienty.",
      `Ingresa al siguiente enlace para crear una nueva contraseña: ${resetUrl}`,
      "",
      `Por seguridad, este enlace vence en ${expiresInMinutes} minutos.`,
      "",
      "Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña seguirá protegida.",
      "",
      "Clienty · Sistema de Ventas",
    ].join("\n"),
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f7fb;padding:36px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #dce6f5;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:28px 34px;background:#1d4ed8;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
              <td style="width:38px;height:38px;border-radius:10px;background:#ffffff;color:#1d4ed8;text-align:center;font-size:22px;font-weight:700;line-height:38px;">C</td>
              <td style="padding-left:12px;color:#ffffff;">
                <div style="font-size:20px;font-weight:700;line-height:24px;">Clienty</div>
                <div style="font-size:12px;line-height:18px;color:#dbeafe;">Sistema de Ventas</div>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:34px;">
            <div style="display:inline-block;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:700;letter-spacing:.04em;padding:7px 11px;">SEGURIDAD DE CUENTA</div>
            <h1 style="margin:18px 0 12px;font-size:26px;line-height:32px;letter-spacing:-.4px;color:#172033;">Restablece tu contraseña</h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#52647d;">Hola, ${safeRecipient}. Recibimos una solicitud para crear una nueva contraseña para tu cuenta.</p>
            <p style="margin:0 0 26px;font-size:15px;line-height:24px;color:#52647d;">Haz clic en el botón para continuar. Por seguridad, el enlace vencerá en <strong style="color:#172033;">${expiresInMinutes} minutos</strong>.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px;"><tr>
              <td align="center" bgcolor="#2563eb" style="border-radius:10px;">
                <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;">Restablecer contraseña</a>
              </td>
            </tr></table>
            <div style="border-top:1px solid #e7edf6;margin:0 0 20px;"></div>
            <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:#7b8ba3;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="margin:0;word-break:break-all;font-size:12px;line-height:18px;color:#2563eb;">${safeUrl}</p>
          </td></tr>
          <tr><td style="padding:20px 34px;background:#f8fafc;border-top:1px solid #e7edf6;">
            <p style="margin:0;font-size:12px;line-height:18px;color:#64748b;">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña seguirá protegida.</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Clienty · Sistema de Ventas</p>
      </td></tr>
    </table>
  </body>
</html>`,
  };
};
