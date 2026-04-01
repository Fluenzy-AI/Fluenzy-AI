"use client";

import { useState } from "react";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  FileText,
  Plus,
  Search,
  Copy,
  Eye,
  Edit,
  Trash2,
  Mail,
  XCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  category: string;
  variables: string[];
  createdAt: string;
}

// Pre-built email templates
const defaultTemplates: Template[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to Fluenzy AI! 🎉",
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Welcome to Fluenzy AI, {{first_name}}! 🎉</h1>
  <p>We're thrilled to have you join our community of learners!</p>
  <p>Here's what you can do with Fluenzy AI:</p>
  <ul>
    <li>Practice English conversation with AI tutors</li>
    <li>Prepare for job interviews with realistic simulations</li>
    <li>Improve your communication skills with instant feedback</li>
  </ul>
  <p>Ready to get started?</p>
  <a href="{{cta_url}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Start Learning Now</a>
  <p>Best regards,<br>The Fluenzy AI Team</p>
</div>`,
    category: "Onboarding",
    variables: ["first_name", "cta_url"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "inactive",
    name: "Re-engagement Email",
    subject: "We miss you, {{first_name}}! Come back and practice 💪",
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Hey {{first_name}}, we noticed you've been away!</h1>
  <p>It's been a while since your last practice session. Your English skills are waiting to level up! 🚀</p>
  <p>Just 10 minutes a day can make a huge difference:</p>
  <ul>
    <li>Build confidence in speaking</li>
    <li>Expand your vocabulary</li>
    <li>Ace your next interview</li>
  </ul>
  <a href="{{cta_url}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Continue Learning</a>
  <p>See you soon!<br>The Fluenzy AI Team</p>
</div>`,
    category: "Re-engagement",
    variables: ["first_name", "cta_url"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "upgrade",
    name: "Upgrade Reminder",
    subject: "Unlock unlimited features with Pro 🌟",
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Ready to take your learning to the next level?</h1>
  <p>Hi {{first_name}},</p>
  <p>You've been making great progress! Upgrade to Pro and unlock:</p>
  <ul>
    <li>✨ Unlimited practice sessions</li>
    <li>📊 Advanced analytics & insights</li>
    <li>🎯 Personalized learning paths</li>
    <li>🏆 Priority support</li>
  </ul>
  <a href="{{upgrade_url}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Upgrade to Pro</a>
  <p>Questions? Reply to this email - we're here to help!</p>
</div>`,
    category: "Upgrade",
    variables: ["first_name", "upgrade_url"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "achievement",
    name: "Achievement Unlocked",
    subject: "🏆 Congratulations! You've achieved a milestone!",
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="text-align: center; padding: 24px;">
    <div style="font-size: 64px;">🏆</div>
    <h1 style="color: #7c3aed;">Achievement Unlocked!</h1>
  </div>
  <p>Hi {{first_name}},</p>
  <p>Amazing work! You've completed <strong>{{achievement_name}}</strong>!</p>
  <p>Your dedication is paying off. Keep up the momentum!</p>
  <div style="background: #f8f4ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="margin: 0;"><strong>Your Stats:</strong></p>
    <p style="margin: 8px 0;">• Sessions completed: {{sessions_count}}</p>
    <p style="margin: 8px 0;">• Current streak: {{streak_days}} days</p>
  </div>
  <a href="{{cta_url}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Continue Your Journey</a>
</div>`,
    category: "Engagement",
    variables: ["first_name", "achievement_name", "sessions_count", "streak_days", "cta_url"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "tips",
    name: "Weekly Tips",
    subject: "📚 Your weekly English tips are here!",
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">This Week's English Tips 📚</h1>
  <p>Hi {{first_name}},</p>
  <p>Here are some tips to improve your English this week:</p>
  <div style="background: #f8f4ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <h3 style="color: #7c3aed; margin-top: 0;">💡 Tip of the Week</h3>
    <p>Practice speaking out loud for at least 10 minutes daily. This helps build muscle memory for pronunciation!</p>
  </div>
  <div style="background: #f8f4ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <h3 style="color: #7c3aed; margin-top: 0;">📖 Vocabulary Word</h3>
    <p><strong>Eloquent</strong> (adj.) - fluent or persuasive in speaking or writing.</p>
    <p><em>"She gave an eloquent speech about climate change."</em></p>
  </div>
  <a href="{{cta_url}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Practice Now</a>
</div>`,
    category: "Newsletter",
    variables: ["first_name", "cta_url"],
    createdAt: new Date().toISOString(),
  },
];

export default function TemplatesPage() {
  const { loading: authLoading } = usePortalAuth();
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    bodyHtml: "",
    category: "Custom",
  });

  const categories = ["all", ...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function handleCreateTemplate() {
    const variables = extractVariables(formData.bodyHtml);
    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      subject: formData.subject,
      bodyHtml: formData.bodyHtml,
      category: formData.category,
      variables,
      createdAt: new Date().toISOString(),
    };
    setTemplates([newTemplate, ...templates]);
    setShowCreateModal(false);
    setFormData({ name: "", subject: "", bodyHtml: "", category: "Custom" });
  }

  function extractVariables(html: string): string[] {
    const matches = html.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, "")))];
  }

  function handleCopyTemplate(template: Template) {
    navigator.clipboard.writeText(template.bodyHtml);
    alert("Template HTML copied to clipboard!");
  }

  function handleDeleteTemplate(id: string) {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter(t => t.id !== id));
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Templates</h1>
          <p className="text-slate-400 mt-1">Pre-built templates for your campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Templates grid */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/5 bg-slate-900/50">
          <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">No templates found</h3>
          <p className="text-sm text-slate-400 mt-1">
            {searchQuery ? "Try adjusting your search" : "Create your first template"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden hover:border-purple-500/30 transition-colors"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                    {template.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                <p className="text-sm text-slate-400 truncate">{template.subject}</p>
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.variables.slice(0, 3).map((v) => (
                      <span key={v} className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        {`{{${v}}}`}
                      </span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="text-[10px] text-slate-500">+{template.variables.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
              <div className="border-t border-white/5 px-5 py-3 flex items-center justify-between bg-white/[0.02]">
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyTemplate(template)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                    title="Copy HTML"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {template.id.startsWith("custom-") && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedTemplate.name}</h2>
                <p className="text-sm text-slate-400">{selectedTemplate.subject}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="rounded-xl border border-white/10 bg-white p-6 min-h-[300px]">
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.bodyHtml }} />
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Variables in this template:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((v) => (
                    <span key={v} className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Create Template</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Welcome Series - Day 1"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Subject Line *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Welcome to Fluenzy AI, {{first_name}}!"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Onboarding, Re-engagement"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Body (HTML) *</label>
                <textarea
                  value={formData.bodyHtml}
                  onChange={(e) => setFormData(prev => ({ ...prev, bodyHtml: e.target.value }))}
                  placeholder="<p>Hello {{first_name}},</p>..."
                  rows={10}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use {"{{variable}}"} syntax for personalization
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-slate-900 border-t border-white/5 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!formData.name || !formData.subject || !formData.bodyHtml}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
