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

function createCollegeTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.College_EMAIL_USER,
      pass: process.env.College_EMAIL_PASS,
    },
  });
}

const PLAN_COLORS: Record<string, string> = {
  Free: "#10b981",
  Standard: "#6366f1",
  Pro: "#8b5cf6",
  Enterprise: "#f59e0b",
};

const PLAN_LABELS: Record<string, string> = {
  Free: "Free",
  Standard: "Standard",
  Pro: "Pro",
  Enterprise: "Enterprise",
};

export async function sendStudentActivationEmail({
  studentEmails,
  collegeName,
  plan,
  seats,
  validTill,
  invoiceId,
}: {
  studentEmails: string[];
  collegeName: string;
  plan: string;
  seats: number;
  validTill: Date;
  invoiceId: string;
}) {
  const transporter = createCollegeTransporter();
  const planColor = PLAN_COLORS[plan] ?? "#6366f1";
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const validTillStr = validTill.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://fluenzyai.app"}/login`;

  const sendPromises = studentEmails.map((email) => {
    const studentName = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return transporter.sendMail({
      from: `"${collegeName} via Fluenzy AI" <${process.env.College_EMAIL_USER}>`,
      to: email,
      subject: `Your Fluenzy AI Access is Active – ${collegeName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,${planColor},#6366f1);padding:36px 28px;text-align:center;">
            <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Fluenzy AI</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your AI-Powered Career & Communication Platform</p>
          </div>

          <!-- Body -->
          <div style="padding:32px 28px;">
            <h2 style="color:#a5b4fc;font-size:20px;margin:0 0 6px;">Hi ${studentName}! 🎉</h2>
            <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6;">
              <strong style="color:#e2e8f0">${collegeName}</strong> has activated your Fluenzy AI subscription.
              You now have full access to sharpen your communication, interview prep, and career skills.
            </p>

            <!-- Plan Info Card -->
            <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 14px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Your Subscription Details</p>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:7px 0;color:#94a3b8;font-size:14px;">Institution</td>
                  <td style="padding:7px 0;color:#e2e8f0;font-weight:600;font-size:14px;text-align:right;">${collegeName}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0;color:#94a3b8;font-size:14px;">Plan</td>
                  <td style="padding:7px 0;text-align:right;">
                    <span style="background:${planColor}22;color:${planColor};border:1px solid ${planColor}55;border-radius:20px;padding:3px 12px;font-size:13px;font-weight:700;">${planLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:7px 0;color:#94a3b8;font-size:14px;">Total Seats</td>
                  <td style="padding:7px 0;color:#e2e8f0;font-weight:600;font-size:14px;text-align:right;">${seats}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0;color:#94a3b8;font-size:14px;">Valid Till</td>
                  <td style="padding:7px 0;color:#34d399;font-weight:600;font-size:14px;text-align:right;">${validTillStr}</td>
                </tr>
                <tr>
                  <td style="padding:7px 0;color:#94a3b8;font-size:14px;">Invoice</td>
                  <td style="padding:7px 0;color:#64748b;font-size:12px;font-family:monospace;text-align:right;">${invoiceId}</td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <a href="${loginUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;padding:15px;font-weight:700;font-size:16px;margin-bottom:20px;">
              Start Learning on Fluenzy AI &rarr;
            </a>

            <!-- What's included -->
            <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;">
              <p style="margin:0 0 10px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What's Included</p>
              <ul style="margin:0;padding:0 0 0 18px;color:#94a3b8;font-size:13px;line-height:1.9;">
                <li>AI-powered mock interviews &amp; GD practice</li>
                <li>Real-time communication feedback</li>
                <li>Corporate voice &amp; professional English training</li>
                <li>Progress tracking &amp; performance analytics</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #1e293b;padding:16px 28px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#475569;">
              This email was sent on behalf of <strong>${collegeName}</strong> via Fluenzy AI.<br/>
              Questions? Contact your college admin or <a href="mailto:support@fluenzyai.app" style="color:#6366f1;text-decoration:none;">support@fluenzyai.app</a>
            </p>
          </div>
        </div>
      `,
    });
  });

  // Send all in parallel, don't let email failure break activation
  await Promise.allSettled(sendPromises);
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

// ── receipt PDF helpers ──────────────────────────────────────────────────────

function formatIstDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

function buildStudentReceiptHtml({
  studentName,
  studentEmail,
  collegeName,
  plan,
  validFrom,
  validTill,
  invoiceId,
  seats,
  pricePerSeat,
  totalAmount,
}: {
  studentName: string;
  studentEmail: string;
  collegeName: string;
  plan: string;
  validFrom: Date;
  validTill: Date;
  invoiceId: string;
  seats: number;
  pricePerSeat: number;
  totalAmount: number;
}): string {
  const planColor = PLAN_COLORS[plan] ?? "#6366f1";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Fluenzy AI – Plan Receipt</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: Helvetica, Arial, sans-serif; color: #0f172a; margin:0; padding:0; font-size:11pt; }
    .container { padding:20px 24px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:12px; border-bottom:2px solid #e2e8f0; }
    .logo-badge { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#4f46e5,#7c3aed); display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:20px; line-height:44px; text-align:center; }
    .company h1 { font-size:18pt; margin:0 0 2px; }
    .company p { margin:2px 0; color:#475569; font-size:9.5pt; }
    .doc-type .type-label { font-size:15pt; font-weight:700; color:#4f46e5; }
    .doc-type .inv-no { font-size:9pt; color:#64748b; margin-top:4px; }
    .divider { margin:14px 0; height:1px; background:#e2e8f0; }
    .section-title { font-size:9.5pt; font-weight:700; margin-bottom:10px; color:#1e293b; text-transform:uppercase; letter-spacing:.5px; }
    .grid { display:grid; grid-template-columns:repeat(2,1fr); gap:7px 28px; font-size:10pt; }
    .grid div { display:flex; justify-content:space-between; border-bottom:1px dashed #f1f5f9; padding-bottom:4px; }
    .label { color:#64748b; font-weight:600; }
    .value { color:#0f172a; font-weight:700; }
    table { width:100%; border-collapse:collapse; margin-top:6px; font-size:10pt; }
    th, td { border:1px solid #e2e8f0; padding:7px 10px; text-align:left; }
    th { background:#f8fafc; font-weight:700; color:#334155; }
    .total td { font-weight:700; background:#f8fafc; }
    .status-box { margin:14px 0; padding:12px 16px; border-radius:10px; background:#ecfdf5; border:1px solid #34d399; color:#065f46; font-weight:600; font-size:10.5pt; }
    .college-badge { display:inline-block; background:${planColor}22; color:${planColor}; border:1px solid ${planColor}55; border-radius:20px; padding:3px 12px; font-size:9pt; font-weight:700; }
    .footer { margin-top:20px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:9pt; color:#64748b; text-align:center; line-height:1.7; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="logo-badge">F</div>
      <div class="company">
        <h1>Fluenzy AI</h1>
        <p>AI Interview &amp; Communication Coach</p>
        <p>support@fluenzyai.app</p>
      </div>
    </div>
    <div class="doc-type" style="text-align:right;">
      <div class="type-label">PLAN RECEIPT</div>
      <div class="inv-no">${invoiceId}</div>
      <div style="margin-top:4px;font-size:9pt;color:#64748b;">${formatIstDate(validFrom)}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div>
    <div class="section-title">Student Details</div>
    <div class="grid">
      <div><span class="label">Name</span><span class="value">${studentName}</span></div>
      <div><span class="label">Email</span><span class="value">${studentEmail}</span></div>
      <div><span class="label">Institution</span><span class="value">${collegeName}</span></div>
      <div><span class="label">Invoice #</span><span class="value">${invoiceId}</span></div>
    </div>
  </div>

  <div class="divider"></div>

  <div>
    <div class="section-title">Subscription Details</div>
    <table>
      <thead><tr><th>Item</th><th>Detail</th></tr></thead>
      <tbody>
        <tr><td>Plan</td><td><span class="college-badge">${plan}</span></td></tr>
        <tr><td>Pricing per seat</td><td>₹${pricePerSeat.toFixed(0)}</td></tr>
        <tr><td>Valid From</td><td>${formatIstDate(validFrom)}</td></tr>
        <tr><td>Valid Till</td><td>${formatIstDate(validTill)}</td></tr>
        <tr><td>Paid By</td><td><strong>${collegeName}</strong> (Institution)</td></tr>
        <tr class="total"><td><strong>Your Cost</strong></td><td><strong>${totalAmount === 0 ? "FREE (Paid by Institution)" : `₹${totalAmount}`}</strong></td></tr>
      </tbody>
    </table>
  </div>

  <div class="status-box">✅ &nbsp; Your <strong>${plan}</strong> plan is active until <strong>${formatIstDate(validTill)}</strong>. Activated by <strong>${collegeName}</strong>.</div>

  <div class="footer">
    This is a system-generated receipt. No signature required.<br/>
    Activated on behalf of <strong>${collegeName}</strong> via Fluenzy AI • support@fluenzyai.app
  </div>
</div>
</body>
</html>`;
}

function buildAdminBulkReceiptHtml({
  collegeName,
  adminEmail,
  invoiceId,
  plan,
  seats,
  pricePerSeat,
  totalAmount,
  couponCode,
  couponDiscount,
  validFrom,
  validTill,
  students,
}: {
  collegeName: string;
  adminEmail: string;
  invoiceId: string;
  plan: string;
  seats: number;
  pricePerSeat: number;
  totalAmount: number;
  couponCode?: string | null;
  couponDiscount?: number;
  validFrom: Date;
  validTill: Date;
  students: Array<{ email: string; name?: string }>;
}): string {
  const planColor = PLAN_COLORS[plan] ?? "#6366f1";
  const subtotal = pricePerSeat * seats;
  const studentRows = students
    .map(
      (s, i) =>
        `<tr><td>${i + 1}</td><td>${s.name ?? s.email.split("@")[0]}</td><td>${s.email}</td><td><span style="background:${planColor}22;color:${planColor};border:1px solid ${planColor}55;border-radius:20px;padding:2px 10px;font-size:9pt;font-weight:700;">${plan}</span></td><td>${formatIstDate(validTill)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Fluenzy AI – Bulk Purchase Receipt</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: Helvetica, Arial, sans-serif; color: #0f172a; margin:0; padding:0; font-size:11pt; }
    .container { padding:20px 24px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:12px; border-bottom:2px solid #e2e8f0; }
    .logo-badge { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; font-weight:700; font-size:20px; line-height:44px; text-align:center; }
    .company h1 { font-size:18pt; margin:0 0 2px; }
    .company p { margin:2px 0; color:#475569; font-size:9.5pt; }
    .doc-type .type-label { font-size:15pt; font-weight:700; color:#4f46e5; }
    .doc-type .inv-no { font-size:9pt; color:#64748b; margin-top:4px; }
    .divider { margin:14px 0; height:1px; background:#e2e8f0; }
    .section-title { font-size:9.5pt; font-weight:700; margin-bottom:10px; color:#1e293b; text-transform:uppercase; letter-spacing:.5px; }
    .grid { display:grid; grid-template-columns:repeat(2,1fr); gap:7px 28px; font-size:10pt; }
    .grid div { display:flex; justify-content:space-between; border-bottom:1px dashed #f1f5f9; padding-bottom:4px; }
    .label { color:#64748b; font-weight:600; }
    .value { color:#0f172a; font-weight:700; }
    table { width:100%; border-collapse:collapse; margin-top:6px; font-size:10pt; }
    th, td { border:1px solid #e2e8f0; padding:7px 10px; text-align:left; }
    th { background:#f8fafc; font-weight:700; color:#334155; }
    .total td { font-weight:700; background:#f8fafc; }
    .status-box { margin:14px 0; padding:12px 16px; border-radius:10px; background:#ecfdf5; border:1px solid #34d399; color:#065f46; font-weight:600; }
    .footer { margin-top:20px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:9pt; color:#64748b; text-align:center; line-height:1.7; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="logo-badge" style="display:flex;align-items:center;justify-content:center;">F</div>
      <div class="company">
        <h1>Fluenzy AI</h1>
        <p>College Partner Portal</p>
        <p>support@fluenzyai.app</p>
      </div>
    </div>
    <div class="doc-type" style="text-align:right;">
      <div class="type-label">BULK PURCHASE RECEIPT</div>
      <div class="inv-no">${invoiceId}</div>
      <div style="margin-top:4px;font-size:9pt;color:#64748b;">${formatIstDate(validFrom)}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div>
    <div class="section-title">Institution Details</div>
    <div class="grid">
      <div><span class="label">Institution</span><span class="value">${collegeName}</span></div>
      <div><span class="label">Admin Email</span><span class="value">${adminEmail}</span></div>
      <div><span class="label">Invoice #</span><span class="value">${invoiceId}</span></div>
      <div><span class="label">Date</span><span class="value">${formatIstDate(validFrom)}</span></div>
    </div>
  </div>

  <div class="divider"></div>

  <div>
    <div class="section-title">Purchase Summary</div>
    <table>
      <thead><tr><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
      <tbody>
        <tr><td>${plan} Plan × ${seats} seat${seats !== 1 ? "s" : ""} (₹${pricePerSeat}/seat)</td><td style="text-align:right;">₹${subtotal.toFixed(0)}</td></tr>
        ${couponCode && couponDiscount ? `<tr><td>Coupon Discount (${couponCode})</td><td style="text-align:right;color:#16a34a;">-₹${couponDiscount.toFixed(0)}</td></tr>` : ""}
        <tr class="total"><td><strong>Total Paid</strong></td><td style="text-align:right;"><strong>${totalAmount === 0 ? "FREE" : `₹${totalAmount.toFixed(0)}`}</strong></td></tr>
        <tr><td>Valid From</td><td style="text-align:right;">${formatIstDate(validFrom)}</td></tr>
        <tr><td>Valid Till</td><td style="text-align:right;">${formatIstDate(validTill)}</td></tr>
        <tr><td>Total Students Activated</td><td style="text-align:right;"><strong>${students.length}</strong></td></tr>
      </tbody>
    </table>
  </div>

  <div class="divider"></div>

  <div>
    <div class="section-title">Activated Students (${students.length})</div>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Plan</th><th>Valid Till</th></tr></thead>
      <tbody>${studentRows}</tbody>
    </table>
  </div>

  <div class="status-box">✅ &nbsp; Payment confirmed. <strong>${students.length} student${students.length !== 1 ? "s" : ""}</strong> have been activated under the <strong>${plan}</strong> plan until <strong>${formatIstDate(validTill)}</strong>.</div>

  <div class="footer">
    This is a system-generated receipt. No signature required.<br/>
    For support: support@fluenzyai.app
  </div>
</div>
</body>
</html>`;
}

function buildStudentsCsv(students: Array<{ name?: string; email: string; plan: string; validTill: Date; invoiceId: string }>): string {
  const header = "Name,Email,Plan,Valid Till,Invoice ID";
  const rows = students.map((s) => {
    const name = (s.name ?? s.email.split("@")[0]).replace(/,/g, " ");
    const email = s.email;
    const plan = s.plan;
    const validTill = formatIstDate(s.validTill);
    const inv = s.invoiceId;
    return `"${name}","${email}","${plan}","${validTill}","${inv}"`;
  });
  return [header, ...rows].join("\n");
}

async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  try {
    return Buffer.from(
      await page.pdf({ format: "A4", printBackground: true, margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" } })
    );
  } finally {
    await browser.close();
  }
}

/** Send an individual PDF receipt to each student who was activated by the college. */
export async function sendStudentReceiptEmails({
  students,
  collegeName,
  plan,
  pricePerSeat,
  validFrom,
  validTill,
  invoiceId,
  seats,
}: {
  students: Array<{ email: string; name?: string }>;
  collegeName: string;
  plan: string;
  pricePerSeat: number;
  validFrom: Date;
  validTill: Date;
  invoiceId: string;
  seats: number;
}) {
  const transporter = createCollegeTransporter();
  const planColor = PLAN_COLORS[plan] ?? "#6366f1";
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://fluenzyai.app"}/login`;

  const sendPromises = students.map(async (s) => {
    try {
      const studentName = s.name ?? s.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const html = buildStudentReceiptHtml({
        studentName,
        studentEmail: s.email,
        collegeName,
        plan,
        validFrom,
        validTill,
        invoiceId,
        seats,
        pricePerSeat,
        totalAmount: 0, // college pays for student
      });
      const pdfBuffer = await generatePdfFromHtml(html);

      await transporter.sendMail({
        from: `"${collegeName} via Fluenzy AI" <${process.env.College_EMAIL_USER}>`,
        to: s.email,
        subject: `Your ${plan} Plan Receipt – Activated by ${collegeName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
            <div style="background:linear-gradient(135deg,${planColor},#6366f1);padding:36px 28px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;">Fluenzy AI</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Plan Receipt – Activated by Your Institution</p>
            </div>
            <div style="padding:32px 28px;">
              <h2 style="color:#a5b4fc;font-size:20px;margin:0 0 8px;">Hi ${studentName}! 🎉</h2>
              <p style="color:#94a3b8;margin:0 0 20px;line-height:1.6;">
                <strong style="color:#e2e8f0">${collegeName}</strong> has activated your <strong style="color:#e2e8f0">${plan}</strong> plan on Fluenzy AI.
                Your receipt is attached as a PDF.
              </p>
              <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Invoice #</td><td style="padding:7px 0;color:#e2e8f0;font-size:12px;font-family:monospace;text-align:right;">${invoiceId}</td></tr>
                  <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Plan</td><td style="padding:7px 0;text-align:right;"><span style="background:${planColor}22;color:${planColor};border:1px solid ${planColor}55;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700;">${plan}</span></td></tr>
                  <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Paid By</td><td style="padding:7px 0;color:#e2e8f0;font-weight:600;font-size:14px;text-align:right;">${collegeName}</td></tr>
                  <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Your Cost</td><td style="padding:7px 0;color:#34d399;font-weight:700;font-size:16px;text-align:right;">FREE</td></tr>
                  <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Valid Till</td><td style="padding:7px 0;color:#34d399;font-weight:600;font-size:14px;text-align:right;">${formatIstDate(validTill)}</td></tr>
                </table>
              </div>
              <a href="${loginUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;padding:15px;font-weight:700;font-size:16px;">
                Open Fluenzy AI &rarr;
              </a>
            </div>
            <div style="border-top:1px solid #1e293b;padding:16px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">PDF receipt attached. Sent on behalf of <strong>${collegeName}</strong> via Fluenzy AI.</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `FluenzyAI_Receipt_${invoiceId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    } catch (err) {
      console.error(`[sendStudentReceiptEmails] failed for ${s.email}:`, err);
    }
  });

  await Promise.allSettled(sendPromises);
}

/** Send a bulk receipt (PDF + CSV) to the college admin after a purchase. */
export async function sendAdminBulkReceiptEmail({
  adminEmail,
  collegeName,
  plan,
  seats,
  pricePerSeat,
  couponCode,
  couponDiscount,
  totalAmount,
  validFrom,
  validTill,
  invoiceId,
  students,
}: {
  adminEmail: string;
  collegeName: string;
  plan: string;
  seats: number;
  pricePerSeat: number;
  couponCode?: string | null;
  couponDiscount?: number;
  totalAmount: number;
  validFrom: Date;
  validTill: Date;
  invoiceId: string;
  students: Array<{ email: string; name?: string }>;
}) {
  const transporter = createCollegeTransporter();
  const planColor = PLAN_COLORS[plan] ?? "#6366f1";

  const receiptHtml = buildAdminBulkReceiptHtml({
    collegeName, adminEmail, invoiceId, plan, seats, pricePerSeat, totalAmount, couponCode, couponDiscount, validFrom, validTill, students,
  });
  const pdfBuffer = await generatePdfFromHtml(receiptHtml);
  const csvContent = buildStudentsCsv(
    students.map((s) => ({ ...s, plan, validTill, invoiceId }))
  );

  await transporter.sendMail({
    from: `"Fluenzy AI – College Portal" <${process.env.College_EMAIL_USER}>`,
    to: adminEmail,
    subject: `Purchase Confirmed: ${students.length} Students Activated – ${collegeName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
        <div style="background:linear-gradient(135deg,${planColor},#6366f1);padding:36px 28px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;">Fluenzy AI</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Bulk Purchase Confirmed – College Admin Receipt</p>
        </div>
        <div style="padding:32px 28px;">
          <h2 style="color:#a5b4fc;font-size:20px;margin:0 0 8px;">Purchase Successful! ✅</h2>
          <p style="color:#94a3b8;margin:0 0 20px;line-height:1.6;">
            Your bulk purchase for <strong style="color:#e2e8f0">${collegeName}</strong> has been confirmed. 
            The full receipt PDF and activated students CSV are attached below.
          </p>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Invoice #</td><td style="padding:7px 0;color:#e2e8f0;font-size:12px;font-family:monospace;text-align:right;">${invoiceId}</td></tr>
              <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Plan</td><td style="padding:7px 0;text-align:right;"><span style="background:${planColor}22;color:${planColor};border:1px solid ${planColor}55;border-radius:20px;padding:2px 10px;font-size:13px;font-weight:700;">${plan}</span></td></tr>
              <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Total Students</td><td style="padding:7px 0;color:#e2e8f0;font-weight:600;font-size:14px;text-align:right;">${students.length}</td></tr>
              <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Seats Purchased</td><td style="padding:7px 0;color:#e2e8f0;font-weight:600;font-size:14px;text-align:right;">${seats}</td></tr>
              ${couponCode && couponDiscount ? `<tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Coupon (${couponCode})</td><td style="padding:7px 0;color:#34d399;font-weight:600;font-size:14px;text-align:right;">-₹${couponDiscount.toFixed(0)}</td></tr>` : ""}
              <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Total Paid</td><td style="padding:7px 0;color:#34d399;font-weight:700;font-size:18px;text-align:right;">${totalAmount === 0 ? "FREE" : `₹${totalAmount.toFixed(0)}`}</td></tr>
              <tr><td style="padding:7px 0;color:#94a3b8;font-size:14px;">Valid Till</td><td style="padding:7px 0;color:#34d399;font-weight:600;text-align:right;">${formatIstDate(validTill)}</td></tr>
            </table>
          </div>
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">📎 Attachments</p>
            <p style="margin:4px 0;font-size:13px;color:#94a3b8;">1. <strong style="color:#e2e8f0">FluenzyAI_BulkReceipt_${invoiceId}.pdf</strong> – Full purchase receipt</p>
            <p style="margin:4px 0;font-size:13px;color:#94a3b8;">2. <strong style="color:#e2e8f0">Students_${invoiceId}.csv</strong> – Activated students list</p>
          </div>
        </div>
        <div style="border-top:1px solid #1e293b;padding:16px 28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#475569;">
            For support: <a href="mailto:support@fluenzyai.app" style="color:#6366f1;text-decoration:none;">support@fluenzyai.app</a>
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `FluenzyAI_BulkReceipt_${invoiceId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
      {
        filename: `Students_${invoiceId}.csv`,
        content: Buffer.from(csvContent, "utf-8"),
        contentType: "text/csv",
      },
    ],
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
