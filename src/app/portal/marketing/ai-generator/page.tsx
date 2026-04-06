"use client";

import { useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Sparkles,
  Send,
  Copy,
  RefreshCw,
  Wand2,
  Target,
  Lightbulb,
  Mail,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface GeneratedEmail {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  spamScore?: number;
  suggestions?: string[];
}

const toneOptions = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "urgent", label: "Urgent", description: "Action-oriented and time-sensitive" },
  { value: "motivational", label: "Motivational", description: "Inspiring and encouraging" },
  { value: "casual", label: "Casual", description: "Relaxed and conversational" },
];

const improveOptions = [
  { value: "deliverability", label: "Deliverability", description: "Reduce spam triggers" },
  { value: "engagement", label: "Engagement", description: "Improve open & click rates" },
  { value: "conversion", label: "Conversion", description: "Better CTAs and persuasion" },
  { value: "clarity", label: "Clarity", description: "Clearer messaging" },
];

export default function AIGeneratorPage() {
  const { loading: authLoading } = usePortalAuth();
  const [activeTab, setActiveTab] = useState<"generate" | "improve" | "subject">("generate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedEmail | null>(null);
  const [subjectResults, setSubjectResults] = useState<string[]>([]);

  // Generate form
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");

  // Improve form
  const [existingEmail, setExistingEmail] = useState("");
  const [improveFocus, setImproveFocus] = useState("engagement");

  // Subject form
  const [emailContent, setEmailContent] = useState("");

  async function handleGenerate() {
    if (!prompt) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/marketing/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "generate",
          prompt,
          tone,
          senderType: "news",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate email");
      }
      const data = await res.json();
      setResult(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    if (!existingEmail) return;
    try {
      setLoading(true);
      setError(null);
      // Parse subject from first line if possible
      const lines = existingEmail.trim().split('\n');
      const subject = lines[0].replace(/^Subject:\s*/i, '').trim() || 'Email Subject';
      const body = lines.slice(1).join('\n').trim() || existingEmail;
      
      const res = await fetch("/api/admin/marketing/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "improve",
          subject,
          body,
          focus: improveFocus,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to improve email");
      }
      const data = await res.json();
      setResult(data.improved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to improve email");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSubjects() {
    if (!emailContent) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/marketing/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "subject-lines",
          context: emailContent,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate subject lines");
      }
      const data = await res.json();
      setSubjectResults(data.subjects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate subject lines");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          AI Email Generator
        </h1>
        <p className="text-slate-400 mt-1">Generate professional marketing emails with AI</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 w-fit">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "bg-purple-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Wand2 className="h-4 w-4 inline-block mr-2" />
          Generate
        </button>
        <button
          onClick={() => setActiveTab("improve")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "improve"
              ? "bg-purple-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Target className="h-4 w-4 inline-block mr-2" />
          Improve
        </button>
        <button
          onClick={() => setActiveTab("subject")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "subject"
              ? "bg-purple-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Lightbulb className="h-4 w-4 inline-block mr-2" />
          Subject Lines
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input section */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">
              {activeTab === "generate" && "Generate New Email"}
              {activeTab === "improve" && "Improve Existing Email"}
              {activeTab === "subject" && "Generate Subject Lines"}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {activeTab === "generate" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Describe your email *
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Write a re-engagement email for users who haven't logged in for 7 days. Encourage them to try our new interview practice feature. Include a 20% discount code."
                    rows={6}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Tone</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {toneOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTone(option.value)}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          tone === option.value
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                        }`}
                      >
                        <p className="text-sm font-medium text-white">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Email
                    </>
                  )}
                </button>
              </>
            )}

            {activeTab === "improve" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Paste your existing email *
                  </label>
                  <textarea
                    value={existingEmail}
                    onChange={(e) => setExistingEmail(e.target.value)}
                    placeholder="Paste your email HTML or text content here..."
                    rows={8}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Improvement Focus</label>
                  <div className="grid grid-cols-2 gap-2">
                    {improveOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setImproveFocus(option.value)}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          improveFocus === option.value
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                        }`}
                      >
                        <p className="text-sm font-medium text-white">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleImprove}
                  disabled={loading || !existingEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      Improve Email
                    </>
                  )}
                </button>
              </>
            )}

            {activeTab === "subject" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email content *
                  </label>
                  <textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Paste your email content to generate matching subject lines..."
                    rows={8}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                  />
                </div>
                <button
                  onClick={handleGenerateSubjects}
                  disabled={loading || !emailContent}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4" />
                      Generate Subject Lines
                    </>
                  )}
                </button>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output section */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">
              {activeTab === "subject" ? "Subject Line Suggestions" : "Generated Email"}
            </h2>
          </div>
          <div className="p-6">
            {activeTab === "subject" ? (
              subjectResults.length > 0 ? (
                <div className="space-y-3">
                  {subjectResults.map((subject, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors"
                    >
                      <p className="text-white flex-1">{subject}</p>
                      <button
                        onClick={() => copyToClipboard(subject)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyResult message="Generated subject lines will appear here" />
              )
            ) : result ? (
              <div className="space-y-4">
                {result.subject && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Subject Line</p>
                      <button
                        onClick={() => copyToClipboard(result.subject)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-white font-medium p-3 rounded-lg bg-white/5">{result.subject}</p>
                  </div>
                )}

                {result.spamScore !== undefined && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      result.spamScore < 3 ? "bg-green-500/20 text-green-400" :
                      result.spamScore < 5 ? "bg-amber-500/20 text-amber-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {result.spamScore < 3 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white">Spam Score: {result.spamScore}/10</p>
                      <p className="text-xs text-slate-500">
                        {result.spamScore < 3 ? "Low risk" : result.spamScore < 5 ? "Medium risk" : "High risk"}
                      </p>
                    </div>
                  </div>
                )}

                {result.bodyHtml && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Email Preview</p>
                      <button
                        onClick={() => copyToClipboard(result.bodyHtml)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white p-4 max-h-[400px] overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: result.bodyHtml }} />
                    </div>
                  </div>
                )}

                {result.suggestions && result.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">AI Suggestions</p>
                    <div className="space-y-2">
                      {result.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-purple-500/10">
                          <Lightbulb className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-300">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyResult message="Generated email will appear here" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyResult({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
        <Mail className="h-8 w-8 text-purple-400" />
      </div>
      <p className="text-slate-400">{message}</p>
    </div>
  );
}
