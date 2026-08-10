import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../config/env.js";
import { EmailConfigurationError, EmailDeliveryError } from "./email.errors.js";
import type { EmailRecipient, EmailServiceStatus, SendEmailInput, SentEmail } from "./email.types.js";

const toAddress = ({ email, name }: EmailRecipient) => (name ? `${name} <${email}>` : email);

/**
 * Singleton for all transactional emails sent by Clienty.
 * It uses standard SMTP so the same provider can be configured in Supabase Auth
 * and in this backend without exposing secrets to the browser.
 */
class EmailService {
  private transporter: Transporter | null = null;

  status(): EmailServiceStatus {
    return { configured: this.isConfigured(), transport: "smtp" };
  }

  async verifyConnection() {
    await this.getTransporter().verify();
  }

  async send(input: SendEmailInput): Promise<SentEmail> {
    try {
      const result = await this.getTransporter().sendMail({
        from: toAddress({ email: env.SMTP.fromEmail!, name: env.SMTP.fromName }),
        to: (Array.isArray(input.to) ? input.to : [input.to]).map(toAddress).join(", "),
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo,
      });

      return { messageId: result.messageId, accepted: result.accepted };
    } catch (error) {
      if (error instanceof EmailConfigurationError) throw error;
      throw new EmailDeliveryError(error);
    }
  }

  private isConfigured() {
    const { host, username, password, fromEmail } = env.SMTP;
    return Boolean(host && username && password && fromEmail);
  }

  private getTransporter() {
    if (!this.isConfigured()) throw new EmailConfigurationError();
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: env.SMTP.host,
      port: env.SMTP.port,
      secure: env.SMTP.secure,
      auth: { user: env.SMTP.username, pass: env.SMTP.password },
    });
    return this.transporter;
  }
}

export const emailService = new EmailService();
