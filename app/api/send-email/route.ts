// app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const appPassword = formData.get("app_password") as string;
    const recipients = formData.get("recipients") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const resume = formData.get("resume") as File;

    // Quick validation
    if (!email || !appPassword || !recipients || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!resume || resume.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large or missing" },
        { status: 400 },
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: email, pass: appPassword },
      pool: true,
      maxConnections: 1,
      maxMessages: 1,
    });

    // Convert File to Buffer
    const resumeBuffer = Buffer.from(await resume.arrayBuffer());

    // Send with timeout
    const emailPromise = transporter.sendMail({
      from: email,
      to: recipients,
      subject: subject,
      text: body,
      attachments: [
        {
          filename: resume.name || "resume.pdf",
          content: resumeBuffer,
        },
      ],
    });

    // Add timeout to email sending
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Email sending timeout")), 8000);
    });

    await Promise.race([emailPromise, timeoutPromise]);
    await transporter.close();

    const endTime = Date.now();
    console.log(`Email sent in ${endTime - startTime}ms`);

    return NextResponse.json({
      status: "success",
      message: "✅ Email sent successfully!",
      duration: `${endTime - startTime}ms`,
    });
  } catch (error) {
    const endTime = Date.now();
    console.error(`Error after ${endTime - startTime}ms:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        status: "error",
        message: errorMessage,
        duration: `${endTime - startTime}ms`,
      },
      { status: 500 },
    );
  }
}

// Optional: Add other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
