export interface EmailMessage {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface EmailProvider {
  readonly name: 'mock' | 'resend' | 'smtp' | 'brevo';
  send(message: EmailMessage): Promise<void>;
}
