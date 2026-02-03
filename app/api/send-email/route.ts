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
    const additionalFiles = formData.getAll("attachments") as File[];

    // Quick validation
    if (!email || !appPassword || !recipients || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let totalSize = resume ? resume.size : 0;
    for (const file of additionalFiles) {
      totalSize += file.size;
    }

    if (totalSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Total attachment size exceeds 10MB limit" },
        { status: 400 },
      );
    }

    if (!resume && additionalFiles.length === 0) {
       // It seems resume is required by frontend, but strict check here:
       if (!resume) {
          return NextResponse.json(
            { error: "Resume file is missing" },
            { status: 400 },
          );
       }
    }


    // Parse recipients (comma-separated or newline-separated)
    const recipientList = recipients
      .split(/[\n,]/)
      .map((recipient) => recipient.trim())
      .filter((recipient) => recipient.length > 0);

    if (recipientList.length === 0) {
      return NextResponse.json(
        { error: "No valid recipients provided" },
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

    // Prepare attachments
    const mailAttachments = [];
    if (resume) {
      mailAttachments.push({
        filename: resume.name || "resume.pdf",
        content: Buffer.from(await resume.arrayBuffer()),
      });
    }

    for (const file of additionalFiles) {
      if (file.size > 0) {
        mailAttachments.push({
            filename: file.name,
            content: Buffer.from(await file.arrayBuffer()),
        });
      }
    }

    // Send emails individually with delays
    const results = [];
    const sentEmails = [];

    for (let i = 0; i < recipientList.length; i++) {
      const recipient = recipientList[i];

      try {
        console.log(
          `Sending email to: ${recipient} (${i + 1}/${recipientList.length})`,
        );

        // Add timeout to email sending
        const emailPromise = transporter.sendMail({
          from: email,
          to: recipient, // Send to individual recipient
          subject: subject,
          text: body,
          attachments: mailAttachments,
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

        console.log(`✅ Email sent to: ${recipient}`);

        // Add delay between emails (1 second delay)
        if (i < recipientList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error(`❌ Failed to send to ${recipient}:`, errorMessage);

        results.push({
          recipient,
          status: "error",
          message: errorMessage,
        });

        // Continue with next email even if one fails
        continue;
      }
    }

    await transporter.close();

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    console.log(`Email sending completed in ${totalDuration}ms`);
    console.log(
      `Results: ${sentEmails.length}/${recipientList.length} emails sent successfully`,
    );

    return NextResponse.json({
      status: "completed",
      message: `Sent ${sentEmails.length}/${recipientList.length} emails successfully`,
      results: results,
      summary: {
        total: recipientList.length,
        successful: sentEmails.length,
        failed: recipientList.length - sentEmails.length,
      },
      duration: `${totalDuration}ms`,
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
