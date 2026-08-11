import nodemailer from "nodemailer";
import { buildAppUrl } from "@shared/appUrl";

/**
 * Configure Nodemailer Transporter.
 * Uses Gmail SMTP when EMAIL_USER/EMAIL_PASS are set.
 */
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Gets a clean, formatted sender address.
 * Ensures the EMAIL_USER address is used as the email mailbox to prevent SPF/DMARC alignment spoofing flags.
 */
export function getSenderAddress(): string {
  const userEmail = process.env.EMAIL_USER?.trim() || "";
  const fromEnv = process.env.EMAIL_FROM?.trim() || "";

  // If EMAIL_FROM is fully formatted with name and brackets (e.g. "MCQGyaan AI <user@gmail.com>")
  if (fromEnv.includes("<") && fromEnv.includes(">")) {
    return fromEnv;
  }

  // Ensure the From email matches the authenticated EMAIL_USER to prevent SPF/DMARC spoofing placement into Spam
  const activeEmail = userEmail || fromEnv;
  if (activeEmail) {
    return `"MCQGyaan AI" <${activeEmail}>`;
  }

  return `"MCQGyaan AI"`;
}

/**
 * Gets the Reply-To address.
 */
export function getReplyToAddress(): string {
  return process.env.EMAIL_USER?.trim() || process.env.EMAIL_FROM?.trim() || "";
}

/**
 * Standard email headers for deliverability.
 */
function getStandardHeaders() {
  return {
    "X-Mailer": "MCQGyaan-AI Mailer v1.0",
    "X-Priority": "3", // Normal Priority
  };
}

// ==========================
// Test Email
// ==========================

export async function sendTestEmail(to: string) {
  const from = getSenderAddress();
  const replyTo = getReplyToAddress();

  const textBody = `MCQGyaan AI Service Check\n\nYour email service is configured and operational.`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:24px; border:1px solid #e2e8f0; border-radius:12px; background-color:#ffffff;">
      <h2 style="color:#1e40af; margin-top:0; font-size:20px;">MCQGyaan AI</h2>
      <p style="color:#334155; font-size:14px; line-height:1.5;">Your email service is configured and operating successfully.</p>
      <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;" />
      <p style="color:#64748b; font-size:12px; margin:0;">© MCQGyaan AI</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    replyTo,
    headers: getStandardHeaders(),
    subject: "MCQGyaan AI - Email Service Status",
    text: textBody,
    html: htmlBody,
  });
}

// ==========================
// Teacher Verification Email
// ==========================

export async function sendTeacherVerificationEmail(
  email: string,
  fullName: string,
  token: string,
  appUrl?: string
) {
  const verificationUrl = buildAppUrl(
    appUrl ?? process.env.APP_URL ?? process.env.BASE_URL ?? "",
    `/api/teacher/email-verify?token=${token}`,
  );

  const from = getSenderAddress();
  const replyTo = getReplyToAddress();

  const textBody = `Hello ${fullName},\n\nThank you for registering as a teacher on MCQGyaan AI. Please verify your account using the following link:\n\n${verificationUrl}\n\nIf you did not create this account, please ignore this email.\n\n© MCQGyaan AI`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:30px; border:1px solid #e5e7eb; border-radius:10px; background:#ffffff;">
      <h2 style="color:#2563eb; margin-top:0;">
        Welcome to MCQGyaan AI
      </h2>

      <p style="color:#334155;">Hello <strong>${fullName}</strong>,</p>

      <p style="color:#334155;">
        Thank you for registering as a teacher on <strong>MCQGyaan AI</strong>.
      </p>

      <p style="color:#334155;">
        Before accessing teacher features, please verify your account.
      </p>

      <p style="color:#334155;">
        By clicking the button below, you confirm that:
      </p>

      <ul style="color:#334155; line-height:1.6;">
        <li>You are a teacher or educator.</li>
        <li>The information provided is accurate.</li>
        <li>You agree to MCQGyaan AI Terms & Conditions.</li>
        <li>You understand that false information may lead to account suspension.</li>
      </ul>

      <br>

      <a href="${verificationUrl}"
        style="
          background:#2563eb;
          color:#ffffff;
          padding:14px 24px;
          text-decoration:none;
          border-radius:8px;
          display:inline-block;
          font-weight:bold;
        ">
        Verify Teacher Account
      </a>

      <br><br>

      <p style="color:#64748b; font-size:13px;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="word-break:break-all; font-size:13px;">
        <a href="${verificationUrl}" style="color:#2563eb;">
          ${verificationUrl}
        </a>
      </p>

      <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0 16px 0;">

      <p style="font-size:12px; color:#64748b; margin:0 0 4px 0;">
        If you did not create this account, you can safely ignore this email.
      </p>

      <p style="font-size:12px; color:#64748b; margin:0;">
        © MCQGyaan AI
      </p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: email,
    replyTo,
    headers: getStandardHeaders(),
    subject: "Verify your Teacher Account - MCQGyaan AI",
    text: textBody,
    html: htmlBody,
  });
}

function buildTeacherStatusEmailHtml({
  fullName,
  title,
  intro,
  buttonLabel,
  buttonUrl,
  buttonText,
  closingNote,
}: {
  fullName: string;
  title: string;
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  buttonText: string;
  closingNote: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:30px; border:1px solid #e5e7eb; border-radius:10px; background:#ffffff;">
      <h2 style="color:#2563eb; margin-top:0;">
        ${title}
      </h2>

      <p style="color:#334155;">Hello <strong>${fullName}</strong>,</p>

      <p style="color:#334155; line-height:1.6;">
        ${intro}
      </p>

      <div style="margin:28px 0;">
        <a href="${buttonUrl}"
          style="
            background:#2563eb;
            color:#ffffff;
            padding:14px 24px;
            text-decoration:none;
            border-radius:8px;
            display:inline-block;
            font-weight:bold;
          ">
          ${buttonLabel}
        </a>
      </div>

      <p style="margin-bottom:8px; color:#64748b; font-size:13px;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="word-break:break-all; font-size:13px;">
        <a href="${buttonUrl}" style="color:#2563eb;">
          ${buttonText}
        </a>
      </p>

      <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0 16px 0;">

      <p style="font-size:12px; color:#64748b; margin:0 0 4px 0;">
        ${closingNote}
      </p>

      <p style="font-size:12px; color:#64748b; margin:0;">
        © MCQGyaan AI
      </p>
    </div>
  `;
}

export async function sendTeacherApprovalEmail(
  email: string,
  fullName: string,
  appUrl?: string,
) {
  const loginUrl = buildAppUrl(
    appUrl ?? process.env.APP_URL ?? process.env.BASE_URL ?? "",
    "/teacher-auth",
  );

  const from = getSenderAddress();
  const replyTo = getReplyToAddress();

  const textBody = `Hello ${fullName},\n\nYour teacher account has been approved. The Teacher Dashboard is now active, and you can sign in to start using your teacher tools.\n\nLogin link: ${loginUrl}\n\n© MCQGyaan AI`;

  await transporter.sendMail({
    from,
    to: email,
    replyTo,
    headers: getStandardHeaders(),
    subject: "Your Teacher Account Has Been Approved | MCQGyaan AI",
    text: textBody,
    html: buildTeacherStatusEmailHtml({
      fullName,
      title: "Teacher Account Approved",
      intro:
        "Your teacher account has been approved. The Teacher Dashboard is now active, and you can sign in to start using your teacher tools.",
      buttonLabel: "Login to Teacher Dashboard",
      buttonUrl: loginUrl,
      buttonText: loginUrl,
      closingNote:
        "If you have trouble logging in, please contact the MCQGyaan AI support team.",
    }),
  });
}

export async function sendTeacherRejectionEmail(
  email: string,
  fullName: string,
  appUrl?: string,
) {
  const homepageUrl = buildAppUrl(
    appUrl ?? process.env.APP_URL ?? process.env.BASE_URL ?? "",
    "/",
  );

  const from = getSenderAddress();
  const replyTo = getReplyToAddress();

  const textBody = `Hello ${fullName},\n\nThank you for your interest in MCQGyaan AI. After review, we are unable to approve your application at this time.\n\n© MCQGyaan AI`;

  await transporter.sendMail({
    from,
    to: email,
    replyTo,
    headers: getStandardHeaders(),
    subject: "Teacher Account Review Update | MCQGyaan AI",
    text: textBody,
    html: buildTeacherStatusEmailHtml({
      fullName,
      title: "Teacher Account Review Update",
      intro:
        "Thank you for your interest in MCQGyaan AI. After review, we’re unable to approve your application at this time.",
      buttonLabel: "Visit MCQGyaan AI",
      buttonUrl: homepageUrl,
      buttonText: homepageUrl,
      closingNote:
        "Your Teacher Dashboard access remains unavailable unless your account is approved in the future.",
    }),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  fullName: string,
  token: string,
  role: "teacher" | "student",
  appUrl?: string
) {
  const resetUrl = buildAppUrl(
    appUrl ?? process.env.APP_URL ?? process.env.BASE_URL ?? "",
    `/${role}/reset-password?token=${token}`,
  );

  const from = getSenderAddress();
  const replyTo = getReplyToAddress();

  const textBody = `Hello ${fullName},\n\nWe received a request to reset your password. Use the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.\n\n© MCQGyaan AI`;

  await transporter.sendMail({
    from,
    to: email,
    replyTo,
    headers: getStandardHeaders(),
    subject: "Reset Your Password | MCQGyaan AI",
    text: textBody,
    html: buildTeacherStatusEmailHtml({
      fullName,
      title: "Reset Your Password",
      intro:
        "We received a request to reset your password. Click the button below to create a new password. This link is valid for 1 hour.",
      buttonLabel: "Reset Password",
      buttonUrl: resetUrl,
      buttonText: resetUrl,
      closingNote:
        "If you didn't request a password reset, you can safely ignore this email.",
    }),
  });
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function verifyTransporterConnection(): Promise<{ ok: boolean; message: string }> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return {
      ok: false,
      message: "SMTP credentials (EMAIL_USER / EMAIL_PASS) are missing in server environment.",
    };
  }

  try {
    await transporter.verify();
    return { ok: true, message: "SMTP server connection verified successfully." };
  } catch (err: any) {
    console.error("[SMTP VERIFY ERROR]", err?.message || err);
    return {
      ok: false,
      message: `SMTP authentication/connection failed: ${err?.message || "Unable to connect to mail server"}`,
    };
  }
}

export async function sendAdminPersonalEmail({
  to,
  subject,
  message,
  recipientName,
}: {
  to: string;
  subject: string;
  message: string;
  recipientName: string;
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "[ADMIN EMAIL] Warning: EMAIL_USER or EMAIL_PASS environment variables are missing."
    );
  }

  const safeName = escapeHtml(recipientName);
  const safeMessageHtml = message
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin-bottom:12px; line-height:1.6; color:#334155;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");

  const from = getSenderAddress();
  const replyTo = getReplyToAddress();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:28px; border:1px solid #e2e8f0; border-radius:12px; background-color:#ffffff;">
      <div style="margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid #f1f5f9;">
        <h2 style="color:#1e3a8a; margin:0 0 4px 0; font-size:20px; font-weight:700;">MCQGyaan AI</h2>
        <p style="color:#64748b; margin:0; font-size:12px;">Admin Communication</p>
      </div>

      <p style="color:#1e293b; font-size:14px; font-weight:600; margin-bottom:16px;">
        Hello ${safeName},
      </p>

      <div style="font-size:14px; color:#334155;">
        ${safeMessageHtml}
      </div>

      <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0 16px 0;" />

      <p style="color:#94a3b8; font-size:12px; margin:0;">
        This message was sent from the MCQGyaan AI Admin Portal. If you have any questions, please reply directly to this email.
      </p>
    </div>
  `;

  console.log(`[ADMIN EMAIL SERVICE] Sending email to "${to}" with subject: "${subject.trim()}"`);

  await transporter.sendMail({
    from,
    to,
    replyTo,
    headers: getStandardHeaders(),
    subject: subject.trim(),
    text: message.trim(),
    html,
  });

  console.log(`[ADMIN EMAIL SERVICE] Nodemailer sendMail completed for "${to}"`);
}
