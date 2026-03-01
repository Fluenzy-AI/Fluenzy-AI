import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SIGNUP_OTP_EMAIL_USER,
      pass: process.env.SIGNUP_OTP_EMAIL_PASS,
    },
  });
}

export async function sendCollegeOtpEmail(email: string, otp: string, collegeName?: string) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Fluenzy AI - College Portal" <${process.env.SIGNUP_OTP_EMAIL_USER}>`,
    to: email,
    subject: "Verify Your College Admin Account – Fluenzy AI",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
          <h1 style="margin:0;font-size:26px;color:#fff;">Fluenzy AI</h1>
          <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">College Partner Portal</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#a5b4fc;font-size:20px;margin-bottom:8px;">Verify Your Account</h2>
          ${collegeName ? `<p style="color:#94a3b8;margin-bottom:20px;">College: <strong style="color:#e2e8f0">${collegeName}</strong></p>` : ""}
          <p style="color:#94a3b8;margin-bottom:24px;">Use the OTP below to verify your institutional email. Valid for <strong style="color:#e2e8f0">5 minutes</strong>.</p>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#a5b4fc;">${otp}</span>
          </div>
          <p style="font-size:12px;color:#64748b;text-align:center;">Do not share this OTP with anyone. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
}

export async function sendStudentInviteEmail(
  email: string,
  studentName: string,
  collegeName: string,
  tempPassword: string,
  inviteToken: string
) {
  const transporter = createTransporter();
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/college/student-onboard?token=${inviteToken}`;
  await transporter.sendMail({
    from: `"Fluenzy AI – ${collegeName}" <${process.env.SIGNUP_OTP_EMAIL_USER}>`,
    to: email,
    subject: `Welcome to Fluenzy AI – Your college has provided you access!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
          <h1 style="margin:0;font-size:26px;color:#fff;">Fluenzy AI</h1>
          <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">Your institution has activated your access</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#a5b4fc;font-size:20px;">Hi ${studentName}! 👋</h2>
          <p style="color:#94a3b8;"><strong style="color:#e2e8f0">${collegeName}</strong> has enrolled you on Fluenzy AI — your AI-powered career & communication platform.</p>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:18px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Your temporary login credentials:</p>
            <p style="margin:4px 0;"><span style="color:#64748b;">Email:</span> <strong style="color:#e2e8f0">${email}</strong></p>
            <p style="margin:4px 0;"><span style="color:#64748b;">Password:</span> <strong style="color:#e2e8f0">${tempPassword}</strong></p>
          </div>
          <a href="${loginUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;padding:14px;font-weight:600;margin-top:20px;">Activate Account & Get Started</a>
          <p style="font-size:12px;color:#64748b;text-align:center;margin-top:16px;">Change your password after first login. This invitation is valid for 7 days.</p>
        </div>
      </div>
    `,
  });
}

export async function sendCollegeApprovalEmail(
  email: string,
  adminName: string,
  collegeName: string,
  approved: boolean,
  reason?: string
) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Fluenzy AI – Partner Program" <${process.env.SIGNUP_OTP_EMAIL_USER}>`,
    to: email,
    subject: approved
      ? `🎉 Your College Partnership Application is Approved – ${collegeName}`
      : `College Partnership Application Update – ${collegeName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:${approved ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#ef4444,#dc2626)"};padding:32px 24px;text-align:center;">
          <h1 style="margin:0;font-size:26px;color:#fff;">Fluenzy AI</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${approved ? "Partnership Approved" : "Application Update"}</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:${approved ? "#34d399" : "#f87171"};font-size:20px;">Hi ${adminName},</h2>
          <p style="color:#94a3b8;">
            ${approved
              ? `Your institution <strong style="color:#e2e8f0">${collegeName}</strong> has been approved as a Fluenzy AI College Partner. You can now log in and start managing students.`
              : `Your application for <strong style="color:#e2e8f0">${collegeName}</strong> was not approved at this time.${reason ? `<br/><br/>Reason: <em>${reason}</em>` : ""}`
            }
          </p>
          ${approved ? `<a href="${process.env.NEXT_PUBLIC_APP_URL}/college/login" style="display:block;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;padding:14px;font-weight:600;margin-top:20px;">Go to College Admin Portal</a>` : ""}
        </div>
      </div>
    `,
  });
}
