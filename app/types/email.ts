// types/email.ts
export interface EmailRequest {
  email: string;
  app_password: string;
  recipients: string;
  subject: string;
  body: string;
  resume: File;
}

export interface SendMailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
  }>;
}
