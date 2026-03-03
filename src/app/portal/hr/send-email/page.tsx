"use client";

import { useEffect, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr" },
  { label: "Employees", href: "/portal/hr/employees" },
  { label: "Candidates", href: "/portal/hr/candidates" },
  { label: "Interviews", href: "/portal/hr/interviews" },
  { label: "Leave Requests", href: "/portal/hr/leaves" },
  { label: "Attendance", href: "/portal/hr/attendance" },
  { label: "Payroll", href: "/portal/hr/payroll" },
  { label: "Offer Letters", href: "/portal/hr/offer-letters" },
  { label: "Send Email", href: "/portal/hr/send-email" },
  { label: "Email Logs", href: "/portal/hr/email-logs" },
  { label: "Manage Jobs", href: "/portal/hr/jobs" },
  { label: "Job Applications", href: "/portal/hr/job-applications" },
];const TEMPLATES = [
  { id: "interviewInvite", name: "Interview Invitation", subject: "Interview Invitation — {position} at Fluenzy AI", body: `Dear {name},\n\nWe are pleased to invite you for an interview for the position of {position} at Fluenzy AI.\n\nInterview Date: {date}\nInterview Time: {time}\nMode: {mode}\n{link}\n\nPlease confirm your availability by replying to this email.\n\nBest regards,\nHR Team\nFluenzy AI` },
  { id: "offerLetter", name: "Offer Letter", subject: "Job Offer — {position} at Fluenzy AI", body: `Dear {name},\n\nWe are delighted to extend an offer of employment for the position of {position} at Fluenzy AI.\n\nStart Date: {date}\nCompensation: {salary} per annum\n\nPlease review the attached offer letter and revert with your acceptance at the earliest.\n\nWelcome to the team!\n\nBest regards,\nHR Team\nFluenzy AI` },
  { id: "leaveApproval", name: "Leave Approval", subject: "Leave Request {status} — {dates}", body: `Dear {name},\n\nYour leave request from {startDate} to {endDate} has been {status}.\n\n{remark}\n\nFor any queries, please contact HR.\n\nBest regards,\nHR Team\nFluenzy AI` },
  { id: "custom", name: "Custom Email", subject: "", body: "" },
];

export default function SendEmailPage() {
  const { user } = usePortalAuth();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [toList, setToList] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");

  function applyTemplate(id: string) {
    setSelectedTemplate(id);
    const t = TEMPLATES.find(t => t.id === id);
    if (t && id !== "custom") { setSubject(t.subject); setBody(t.body); }
    if (id === "custom") { setSubject(""); setBody(""); }
  }

  function addRecipient() {
    if (newRecipient && !toList.includes(newRecipient)) { setToList(p => [...p, newRecipient]); setNewRecipient(""); }
  }

  async function handleSend() {
    const recipients = bulk ? toList : to.split(",").map(e => e.trim()).filter(Boolean);
    if (recipients.length === 0) return alert("Add at least one recipient.");
    if (!subject.trim() || !body.trim()) return alert("Subject and body are required.");
    setSending(true);
    try {
      const res = await fetch("/api/portal/hr/send-email", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipients, cc: cc ? cc.split(",").map(e => e.trim()) : [], subject, body, templateId: selectedTemplate }),
      });
      if (res.ok) { setSuccess(true); setTo(""); setCc(""); setSubject(""); setBody(""); setToList([]); setTimeout(() => setSuccess(false), 5000); }
      else { const d = await res.json(); alert(d.error || "Failed to send."); }
    } catch { alert("Network error."); }
    setSending(false);
  }

  return (
    <PortalLayout navItems={HR_NAV} title="Send Email" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="max-w-2xl space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">Send Email</h2>
          <p className="text-slate-400 text-sm mt-0.5">Emails are sent via HR email account ({process.env.NEXT_PUBLIC_HR_EMAIL || "hr@fluenzy.ai"})</p>
        </div>

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-400 text-sm">✓ Email sent successfully!</div>
        )}

        {/* Template Picker */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Email Template</h3>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => applyTemplate(t.id)}
                className={`text-left p-3 rounded-xl border transition ${selectedTemplate === t.id ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/3 hover:bg-white/5"}`}>
                <p className={`text-sm font-medium ${selectedTemplate === t.id ? "text-indigo-300" : "text-slate-300"}`}>{t.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recipients */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Recipients</h3>
            <button onClick={() => setBulk(!bulk)} className={`text-xs px-2 py-1 rounded-lg transition ${bulk ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400"}`}>
              {bulk ? "Bulk Mode ON" : "Bulk Mode"}
            </button>
          </div>
          {!bulk ? (
            <div>
              <label className="text-xs text-slate-500 block mb-1">To * <span className="text-slate-600">(comma-separated for multiple)</span></label>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="john@example.com, jane@example.com"
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={newRecipient} onChange={e => setNewRecipient(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addRecipient()} placeholder="Add email and press Enter"
                  className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                <button onClick={addRecipient} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm transition">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {toList.map(email => (
                  <span key={email} className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 text-xs px-2 py-1 rounded-full">
                    {email}
                    <button onClick={() => setToList(p => p.filter(e => e !== email))} className="text-indigo-400/50 hover:text-indigo-400">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-500 block mb-1">CC <span className="text-slate-600">(optional)</span></label>
            <input value={cc} onChange={e => setCc(e.target.value)} placeholder="manager@example.com"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
          </div>
        </div>

        {/* Compose */}
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Compose</h3>
            <button onClick={() => setPreview(!preview)} className="text-xs text-indigo-400 hover:text-indigo-300">{preview ? "← Edit" : "Preview →"}</button>
          </div>
          {!preview ? (
            <>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Body * <span className="text-slate-600">(Use {`{name}`}, {`{position}`}, etc. as placeholders)</span></label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white resize-none font-mono text-xs leading-relaxed" />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-5 overflow-auto max-h-96">
              <h2 className="text-gray-900 font-bold mb-3">{subject || "(No subject)"}</h2>
              <div className="text-gray-700 text-sm whitespace-pre-wrap">{body || "(No content)"}</div>
            </div>
          )}
        </div>

        <button onClick={handleSend} disabled={sending}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition font-medium">
          {sending ? "Sending..." : `Send Email${bulk && toList.length > 1 ? ` to ${toList.length} recipients` : ""}`}
        </button>
      </div>
    </PortalLayout>
  );
}
