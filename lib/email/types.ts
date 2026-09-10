export type EmailAddress = {
  email: string;
  name?: string;
};

export type EmailMessage = {
  to: EmailAddress[];
  cc?: EmailAddress[];
  subject: string;
  text: string;
  html?: string;
  locale?: "fr" | "en";
  headers?: Record<string, string>;
};

export type EmailSendResult = {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  attempts: number;
};

export type EmailProvider = {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
};
