import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { EmailRequest, SendMailOptions } from "@/app/types/email";

const parseEmailRequest = async (
  request: NextRequest,
): Promise<EmailRequest & { resume?: File; attachments: File[] }> => {
  const formData = await request.formData();

  const email = (formData.get("email") as string) ?? "";
  const app_password = (formData.get("app_password") as string) ?? "";
  const recipients = (formData.get("recipients") as string) ?? "";
  const subject = (formData.get("subject") as string) ?? "";
  const body = (formData.get("body") as string) ?? "";
  const resume = formData.get("resume") as File | null;
  const attachments = formData.getAll("attachments") as File[];

  return {
    email,
    app_password,
    recipients,
    subject,
    body,
    resume: resume ?? (undefined as unknown as File),
    attachments,
  };
};

const validateRequest = ({
  email,
  app_password,
  recipients,
  subject,
  body,
  resume,
  attachments,
}: Awaited<ReturnType<typeof parseEmailRequest>>) => {
  if (!email || !app_password || !recipients || !subject || !body) {
    return "Missing required fields";
  }

  let totalSize = resume ? resume.size : 0;
  for (const file of attachments) {
    totalSize += file.size;
  }

  if (totalSize > 10 * 1024 * 1024) {
    return "Total attachment size exceeds 10MB limit";
  }

  if (!resume && !attachments.length) {
    return "Resume file is missing";
  }

  return null;
};

const parseRecipients = (recipients: string) => {
  const list = recipients
    .split(/[\n,]/)
    .map((recipient) => recipient.trim())
    .filter((recipient) => recipient.length > 0);

  if (!list.length) {
    throw new Error("No valid recipients provided");
  }

  return list;
};

const createTransporter = (email: string, appPassword: string) =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: email, pass: appPassword },
    pool: true,
    maxConnections: 1,
    maxMessages: 1,
  });

const buildAttachments = async (resume?: File, attachments: File[] = []) => {
  const files = [];

  if (resume) {
    files.push({
      filename: resume.name || "resume.pdf",
      content: Buffer.from(await resume.arrayBuffer()),
    });
  }

  for (const file of attachments) {
    if (file.size > 0) {
      files.push({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
      });
    }
  }

  return files as SendMailOptions["attachments"];
};

const sendToRecipients = async (
  transporter: nodemailer.Transporter,
  { email, subject, body }: Pick<EmailRequest, "email" | "subject" | "body">,
  recipients: string[],
  attachments: SendMailOptions["attachments"],
) => {
  const results: Array<{ recipient: string; status: string; message: string }> =
    [];
  const sentEmails: string[] = [];

  for (let index = 0; index < recipients.length; index++) {
    const recipient = recipients[index];

    try {
      const emailPromise = transporter.sendMail({
        from: email,
        to: recipient,
        subject,
        text: body,
        attachments,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Email sending timeout for ${recipient}`)),
          8000,
        );
      });

      await Promise.race([emailPromise, timeoutPromise]);

      results.push({
        recipient,
        status: "success",
        message: "Email sent successfully",
      });
      sentEmails.push(recipient);

      if (index < recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      results.push({
        recipient,
        status: "error",
        message: errorMessage,
      });
    }
  }

  return { results, sentEmails };
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const parsed = await parseEmailRequest(request);
    const validationError = validateRequest(parsed);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const recipientList = parseRecipients(parsed.recipients);
    const transporter = createTransporter(parsed.email, parsed.app_password);
    const attachments = await buildAttachments(parsed.resume, parsed.attachments);

    const { results, sentEmails } = await sendToRecipients(
      transporter,
      {
        email: parsed.email,
        subject: parsed.subject,
        body: parsed.body,
      },
      recipientList,
      attachments,
    );

    await transporter.close();

    const totalDuration = Date.now() - startTime;

    return NextResponse.json({
      status: "completed",
      message: `Sent ${sentEmails.length}/${recipientList.length} emails successfully`,
      results,
      summary: {
        total: recipientList.length,
        successful: sentEmails.length,
        failed: recipientList.length - sentEmails.length,
      },
      duration: `${totalDuration}ms`,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        status: "error",
        message: errorMessage,
        duration: `${totalDuration}ms`,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
