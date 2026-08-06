import nodemailer from "nodemailer";
import { buildAppUrl } from "@shared/appUrl";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==========================
// Test Email
// ==========================

export async function sendTestEmail(to: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "MCQGyaan AI - Test Email",
    html: `
      <h2>MCQGyaan AI</h2>

      <p>Congratulations 🎉</p>

      <p>Your email service is working successfully.</p>
    `,
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

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your Teacher Account - MCQGyaan AI",
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:30px; border:1px solid #e5e7eb; border-radius:10px;">

        <h2 style="color:#2563eb;">
          Welcome to MCQGyaan AI
        </h2>

        <p>Hello <strong>${fullName}</strong>,</p>

        <p>
          Thank you for registering as a teacher on
          <strong>MCQGyaan AI</strong>.
        </p>

        <p>
          Before accessing teacher features, please verify your account.
        </p>

        <p>
          By clicking the button below, you confirm that:
        </p>

        <ul>
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

        <p>
          If the button doesn't work, copy and paste this link into your browser:
        </p>

        <p>
          <a href="${verificationUrl}">
            ${verificationUrl}
          </a>
        </p>

        <hr>

        <p style="font-size:13px;color:#666;">
          If you did not create this account, you can safely ignore this email.
        </p>

        <p style="font-size:13px;color:#666;">
          © MCQGyaan AI
        </p>

      </div>
    `,
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

      <p>Hello <strong>${fullName}</strong>,</p>

      <p>
        ${intro}
      </p>

      <div style="margin:30px 0;">
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

      <p style="margin-bottom:8px;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="word-break:break-word;">
        <a href="${buttonUrl}">
          ${buttonText}
        </a>
      </p>

      <hr>

      <p style="font-size:13px;color:#666;">
        ${closingNote}
      </p>

      <p style="font-size:13px;color:#666;">
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

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Teacher Account Has Been Approved | MCQGyaan AI",
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

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Teacher Account Review Update | MCQGyaan AI",
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

  await transporter.sendMail({

    from: process.env.EMAIL_FROM,

    to: email,

    subject: "Reset Your Password | MCQGyaan AI",

    html: buildTeacherStatusEmailHtml({

      fullName,

      title: "Reset Your Password",

      intro:
        "We received a request to reset your password. Click the button below to create a new password. This link is valid for 1 hour.",

      buttonLabel: "Reset Password",

      buttonUrl: resetUrl,

      buttonText: resetUrl,

      closingNote:
        "If you didn't request a password reset, you can safely ignore this email."

    }),

  });

}
