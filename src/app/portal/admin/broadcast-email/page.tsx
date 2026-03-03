"use client";

import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/portal/admin" },
  { label: "User Management", href: "/portal/admin/users" },
  { label: "Subscriptions", href: "/portal/admin/subscriptions" },
  { label: "Payment Logs", href: "/portal/admin/payments" },
  { label: "Support Tickets", href: "/portal/admin/tickets" },
  { label: "Broadcast Email", href: "/portal/admin/broadcast-email" },
  { label: "Feature Toggles", href: "/portal/admin/feature-toggles" },
  { label: "Email History", href: "/portal/admin/email-logs" },
  { label: "Audit Logs", href: "/portal/admin/audit-logs" },
  { label: "Analytics", href: "/portal/admin/analytics" },
];

const SEGMENTS = [
  { value: "ALL", label: "All Users", desc: "Every registered user on the platform" },
  { value: "PRO", label: "Pro Plan", desc: "Users on the Pro subscription plan" },
  { value: "STANDARD", label: "Standard Plan", desc: "Users on the Standard subscription plan" },
  { value: "FREE", label: "Free Plan", desc: "Users on the Free/trial plan" },
  { value: "ACTIVE_30", label: "Active (30d)", desc: "Users who logged in within last 30 days" },
];

export default function BroadcastEmailPage() {
  const { user } = usePortalAuth();
  const [segment, setSegment] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return alert("Subject and body are required.");
    if (!confirm(`Send email to segment "${segment}"? This cannot be undone.`)) return;
    setSending(true);
    try {
      const res = await fetch("/api/portal/admin/broadcast-email", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment, subject, body }),
      });
      const data = await res.json();
      if (res.ok) { setResult(data); setSubject(""); setBody(""); }
      else alert(data.error || "Failed to send.");
    } catch { alert("Network error. Please try again."); }
    setSending(false);
  }

  return (
    <PortalLayout navItems={ADMIN_NAV} title="Broadcast Email" roleLabel="Admin Portal" roleColor="text-blue-400">
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Broadcast Email</h2>
          <p className="text-slate-400 text-sm mt-0.5">Send bulk emails to user segments using the Admin email account.</p>
        </div>

        {result && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-green-400 text-lg mt-0.5">✓</span>
            <div>
              <p className="text-green-400 font-medium">Email campaign sent!</p>
              <p className="text-green-400/70 text-sm">{result.sent} sent successfully, {result.failed} failed.</p>
              <button onClick={() => setResult(null)} className="text-xs text-green-400/50 hover:text-green-400 mt-1">Dismiss</button>
            </div>
          </div>
        )}

        {/* Segment Picker */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Target Segment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEGMENTS.map(s => (
              <button key={s.value} onClick={() => setSegment(s.value)}
                className={`text-left p-3 rounded-xl border transition ${segment === s.value ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/3 hover:bg-white/5"}`}>
                <p className={`text-sm font-medium ${segment === s.value ? "text-indigo-300" : "text-slate-300"}`}>{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Compose */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Compose Email</h3>
            <button onClick={() => setPreview(!preview)} className="text-xs text-indigo-400 hover:text-indigo-300 transition">
              {preview ? "← Edit" : "Preview →"}
            </button>
          </div>

          {!preview ? (
            <>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Important update about Fluenzy AI"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Message Body *</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} placeholder="Write your email here. You can use {{name}} as a placeholder for the recipient's name."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500" />
              </div>
              <p className="text-xs text-slate-600">Tip: Use <code className="text-indigo-400">{"{{name}}"}</code> for personalization.</p>
            </>
          ) : (
            <div className="bg-white rounded-xl p-6 overflow-auto max-h-96">
              <h2 className="text-gray-900 font-bold text-lg mb-3">{subject || "(No subject)"}</h2>
              <div className="text-gray-700 text-sm whitespace-pre-wrap">{body || "(No content)"}</div>
            </div>
          )}
        </div>

        {/* Send */}
        <div className="flex items-center justify-between bg-slate-900 rounded-2xl border border-white/5 p-4">
          <div>
            <p className="text-sm text-slate-300">Sending to: <span className="text-indigo-400 font-medium">{SEGMENTS.find(s => s.value === segment)?.label}</span></p>
            <p className="text-xs text-slate-500">Emails sent via Admin SMTP ({process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@fluenzy.ai"})</p>
          </div>
          <button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-xl transition font-medium">
            {sending ? "Sending..." : "Send Campaign"}
          </button>
        </div>
      </div>
    </PortalLayout>
  );
}
