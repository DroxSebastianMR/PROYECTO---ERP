export type EmailRecipient = {
  email: string;
  name?: string;
};

export type SendEmailInput = {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SentEmail = {
  messageId: string;
  accepted: string[];
};

export type EmailServiceStatus = {
  configured: boolean;
  transport: "smtp";
};
