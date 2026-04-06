"use client";

import { useState, useEffect, useRef } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Trash2,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSpreadsheet,
  UserPlus,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

interface Recipient {
  id: string;
  email: string;
  name: string;
  status: "active" | "unsubscribed" | "bounced";
  tags: string[];
  createdAt: string;
  lastEmailedAt?: string;
}

interface BulkUploadResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

export default function RecipientsPage() {
  const { user, loading: authLoading } = usePortalAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form states
  const [newRecipient, setNewRecipient] = useState({ name: "", email: "", tags: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Send email states
  const [emailForm, setEmailForm] = useState({
    subject: "",
    bodyHtml: "",
    senderType: "news",
    aiPrompt: "",
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchRecipients();
    }
  }, [authLoading, user, page, statusFilter, searchQuery]);

  async function fetchRecipients() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });
      
      const res = await fetch(`/api/admin/marketing/recipients?${params}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch recipients:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRecipient() {
    if (!newRecipient.email) return;
    
    try {
      setAdding(true);
      const res = await fetch("/api/admin/marketing/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: newRecipient.email.trim(),
          name: newRecipient.name.trim(),
          tags: newRecipient.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setNewRecipient({ name: "", email: "", tags: "" });
        fetchRecipients();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add recipient");
      }
    } catch (error) {
      console.error("Failed to add recipient:", error);
      alert("Failed to add recipient");
    } finally {
      setAdding(false);
    }
  }

  async function handleBulkUpload() {
    if (!uploadFile) return;
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      
      const res = await fetch("/api/admin/marketing/recipients/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUploadResult(data);
        fetchRecipients();
      } else {
        alert(data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Failed to upload:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteSelected() {
    if (selectedRecipients.length === 0) return;
    
    try {
      setDeleting(true);
      const res = await fetch("/api/admin/marketing/recipients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedRecipients }),
      });
      
      if (res.ok) {
        setSelectedRecipients([]);
        setShowDeleteConfirm(false);
        fetchRecipients();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleting(false);
    }
  }

  async function handleGenerateWithAI() {
    if (!emailForm.aiPrompt) return;
    
    try {
      setAiGenerating(true);
      const res = await fetch("/api/admin/marketing/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prompt: emailForm.aiPrompt,
          tone: "professional",
          includePersonalization: true,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setEmailForm(prev => ({
          ...prev,
          subject: data.subject || prev.subject,
          bodyHtml: data.bodyHtml || data.body || "",
        }));
      }
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleSendToSelected() {
    if (selectedRecipients.length === 0 || !emailForm.subject || !emailForm.bodyHtml) return;
    
    try {
      setSending(true);
      const res = await fetch("/api/admin/marketing/send-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientIds: selectedRecipients,
          subject: emailForm.subject,
          bodyHtml: emailForm.bodyHtml,
          senderType: emailForm.senderType,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Email sent successfully to ${data.sent} recipients!`);
        setShowSendModal(false);
        setSelectedRecipients([]);
        setEmailForm({ subject: "", bodyHtml: "", senderType: "news", aiPrompt: "" });
        fetchRecipients();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send emails");
      }
    } catch (error) {
      console.error("Failed to send:", error);
      alert("Failed to send emails");
    } finally {
      setSending(false);
    }
  }

  function downloadTemplate() {
    const csv = "name,email,tags\nJohn Doe,john@example.com,\"newsletter,promo\"\nJane Smith,jane@example.com,newsletter";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipients_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelectAll() {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map(r => r.id));
    }
  }

  function toggleSelectRecipient(id: string) {
    setSelectedRecipients(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Recipients</h1>
          <p className="text-slate-400">Manage your email list and send campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Recipient
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCount}</p>
              <p className="text-xs text-slate-400">Total Recipients</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {recipients.filter(r => r.status === "active").length}
              </p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <XCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {recipients.filter(r => r.status === "unsubscribed").length}
              </p>
              <p className="text-xs text-slate-400">Unsubscribed</p>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {recipients.filter(r => r.status === "bounced").length}
              </p>
              <p className="text-xs text-slate-400">Bounced</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-[#0d1220] border border-[#1e2a40] rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>
        </div>
        
        {selectedRecipients.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {selectedRecipients.length} selected
            </span>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Email
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Recipients Table */}
      <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRecipients.length === recipients.length && recipients.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {recipients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No recipients found. Add recipients manually or upload a CSV file.
                </td>
              </tr>
            ) : (
              recipients.map((recipient) => (
                <tr key={recipient.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(recipient.id)}
                      onChange={() => toggleSelectRecipient(recipient.id)}
                      className="rounded border-slate-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">{recipient.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-300">{recipient.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      recipient.status === "active" ? "bg-green-500/20 text-green-400" :
                      recipient.status === "unsubscribed" ? "bg-amber-500/20 text-amber-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {recipient.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {recipient.tags?.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {new Date(recipient.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-slate-800 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-slate-800 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Recipient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add New Recipient</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newRecipient.tags}
                  onChange={(e) => setNewRecipient(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="newsletter, promo"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecipient}
                disabled={adding || !newRecipient.email}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Recipient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Upload Recipients CSV</h2>
            
            {!uploadResult ? (
              <>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
                  <FileSpreadsheet className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-white mb-2">Drop your CSV file here or click to browse</p>
                  <p className="text-sm text-slate-400 mb-4">
                    CSV format: name, email, tags (tags are comma-separated in quotes)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Choose File
                    </button>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>
                
                {uploadFile && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg flex items-center justify-between">
                    <span className="text-white">{uploadFile.name}</span>
                    <button
                      onClick={() => setUploadFile(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                    }}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={uploading || !uploadFile}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Upload
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{uploadResult.success}</p>
                    <p className="text-xs text-green-400">Imported</p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">{uploadResult.duplicates}</p>
                    <p className="text-xs text-amber-400">Duplicates</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{uploadResult.failed}</p>
                    <p className="text-xs text-red-400">Failed</p>
                  </div>
                </div>
                
                {uploadResult.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-400 mb-2">Errors:</p>
                    <ul className="text-sm text-red-300 space-y-1">
                      {uploadResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadResult(null);
                  }}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              Send Email to {selectedRecipients.length} Recipients
            </h2>
            
            <div className="space-y-4">
              {/* AI Generation */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-white">Generate with AI (Gemini)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={emailForm.aiPrompt}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, aiPrompt: e.target.value }))}
                    placeholder="Describe the email you want to create..."
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={aiGenerating || !emailForm.aiPrompt}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate
                  </button>
                </div>
              </div>

              {/* Sender Type */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Send From</label>
                <select
                  value={emailForm.senderType}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, senderType: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="news">News (news@fluenzyai.app)</option>
                  <option value="contact">Contact (contact@fluenzyai.app)</option>
                  <option value="careers">Careers (careers@fluenzyai.app)</option>
                  <option value="support">Support (support@fluenzyai.app)</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Subject *</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject line"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Email Body * <span className="text-xs text-purple-400">(Use {"{{name}}"} for personalization)</span>
                </label>
                <textarea
                  value={emailForm.bodyHtml}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, bodyHtml: e.target.value }))}
                  placeholder="Dear {{name}},&#10;&#10;Your email content here..."
                  rows={10}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToSelected}
                disabled={sending || !emailForm.subject || !emailForm.bodyHtml}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send to {selectedRecipients.length} Recipients
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0d1220] border border-[#1e2a40] rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-2">Delete Recipients</h2>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete {selectedRecipients.length} recipient(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
