"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  FileText,
  Users,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const COMPANY_EMAIL_TEMPLATES = [
  {
    id: "interviewInvite",
    name: "Interview Invitation",
    subject: "Interview Invitation for {position} at {company}",
    body: `Dear {candidateName},

We are pleased to invite you for an interview for the position of {position} at {company}.

Interview Date: {date}
Interview Time: {time}
Mode: Video Interview via HireLens AI / Google Meet
Meeting Link: {link}

Please confirm your availability by replying to this email.

Best regards,
Recruitment Team
{company}`,
  },
  {
    id: "assessmentInvite",
    name: "Assessment Assignment",
    subject: "Skills Assessment Request — {position} at {company}",
    body: `Dear {candidateName},

Thank you for applying for the {position} role at {company}.

As the next step in our evaluation process, please complete the technical assessment at your earliest convenience:

Assessment Link: {link}
Estimated Duration: 45 minutes

Best regards,
Recruitment Team
{company}`,
  },
  {
    id: "statusUpdate",
    name: "Shortlist Status Update",
    subject: "Application Update — {position} at {company}",
    body: `Dear {candidateName},

We have reviewed your application for the {position} role at {company} and are excited to inform you that your profile has been shortlisted!

Our hiring team will reach out shortly with schedule details for the upcoming evaluation round.

Best regards,
Recruitment Team
{company}`,
  },
  {
    id: "custom",
    name: "Custom Email",
    subject: "",
    body: "",
  },
];

export default function CompanySendEmailPage() {
  const searchParams = useSearchParams();
  const { company, user } = useCompanyAuth();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const toParam = searchParams.get("to");
    if (toParam) setTo(toParam);
  }, [searchParams]);

  function applyTemplate(templateId: string) {
    setSelectedTemplate(templateId);
    const tmpl = COMPANY_EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl && templateId !== "custom") {
      let subj = tmpl.subject.replace("{company}", company?.name || "Company");
      let bdy = tmpl.body.replace(/{company}/g, company?.name || "Company");
      setSubject(subj);
      setBody(bdy);
    } else if (templateId === "custom") {
      setSubject("");
      setBody("");
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const recipients = to
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipients.length === 0) return setErrorMsg("Add at least one recipient email address.");
    if (!subject.trim() || !body.trim()) return setErrorMsg("Subject and body are required.");

    try {
      setSending(true);
      const res = await fetch("/api/company/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients.length === 1 ? recipients[0] : recipients,
          subject,
          body,
          templateId: selectedTemplate,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`✓ Email successfully sent to ${recipients.join(", ")}`);
        setTo("");
        setSubject("");
        setBody("");
        setSelectedTemplate("custom");
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed to send email.");
      }
    } catch (err) {
      setErrorMsg("Network error sending email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Mail className="w-6 h-6 text-purple-400" />
          Candidate Email Communication
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Send recruitment emails directly to candidates on behalf of {company?.name || "your company"}
        </p>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Templates Picker Sidebar */}
        <div className="md:col-span-1 space-y-3 bg-slate-900/60 p-4 rounded-xl border border-white/10 h-fit">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Email Templates
          </h2>
          <div className="space-y-2">
            {COMPANY_EMAIL_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => applyTemplate(tmpl.id)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                  selectedTemplate === tmpl.id
                    ? "bg-purple-600/20 border-purple-500/40 text-purple-200 font-semibold shadow-sm"
                    : "bg-slate-950/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSend}
          className="md:col-span-2 space-y-4 bg-slate-900/60 p-6 rounded-xl border border-white/10"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Recipient Email(s) *
            </label>
            <input
              type="text"
              required
              placeholder="candidate@example.com (comma-separated for multiple)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Subject Line *
            </label>
            <input
              type="text"
              required
              placeholder="Enter subject line..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Body *
            </label>
            <textarea
              rows={12}
              required
              placeholder="Compose your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors border border-white/10"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Preview Email</span>
            </button>

            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-md shadow-purple-950/40"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? "Sending..." : "Send Email"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                Email Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="bg-white text-slate-900 p-6 rounded-xl space-y-4 font-sans text-xs shadow-inner max-h-[400px] overflow-y-auto">
              <div className="border-b border-slate-200 pb-3">
                <div className="font-bold text-slate-800 text-sm">{company?.name}</div>
                <div className="text-[11px] text-slate-500">To: {to || "candidate@example.com"}</div>
                <div className="text-[11px] text-slate-500">Subject: [{company?.name}] {subject}</div>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-slate-700">{body}</div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
