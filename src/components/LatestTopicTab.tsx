"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, ArrowUpDown,
  Check, X, Upload, MessageSquare, Briefcase, Code2, FileDown, AlertCircle
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LatestTopic {
  id: string;
  companyName: string;
  gdTopic: string | null;
  gdQuestion: string | null;
  gdDifficulty: string | null;
  personalInterviewTopic: string | null;
  personalInterviewQuestion: string | null;
  personalInterviewDifficulty: string | null;
  technicalInterviewTopic: string | null;
  technicalInterviewQuestion: string | null;
  technicalInterviewDifficulty: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TopicFormData {
  companyName: string;
  gdTopic: string;
  gdQuestion: string;
  gdDifficulty: string;
  personalInterviewTopic: string;
  personalInterviewQuestion: string;
  personalInterviewDifficulty: string;
  technicalInterviewTopic: string;
  technicalInterviewQuestion: string;
  technicalInterviewDifficulty: string;
}

const emptyForm: TopicFormData = {
  companyName: "",
  gdTopic: "", gdQuestion: "", gdDifficulty: "",
  personalInterviewTopic: "", personalInterviewQuestion: "", personalInterviewDifficulty: "",
  technicalInterviewTopic: "", technicalInterviewQuestion: "", technicalInterviewDifficulty: "",
};

type TopicType = "gd" | "personal" | "technical";

const TYPE_META: Record<TopicType, { label: string; icon: typeof MessageSquare; color: string; topicKey: string; questionKey: string; difficultyKey: string }> = {
  gd: { label: "GD Topic", icon: MessageSquare, color: "text-blue-500", topicKey: "gdTopic", questionKey: "gdQuestion", difficultyKey: "gdDifficulty" },
  personal: { label: "Personal Interview", icon: Briefcase, color: "text-green-500", topicKey: "personalInterviewTopic", questionKey: "personalInterviewQuestion", difficultyKey: "personalInterviewDifficulty" },
  technical: { label: "Technical Interview", icon: Code2, color: "text-orange-500", topicKey: "technicalInterviewTopic", questionKey: "technicalInterviewQuestion", difficultyKey: "technicalInterviewDifficulty" },
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

interface CsvRow {
  companyName: string;
  topic: string;
  question: string;
  difficulty: string;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { fields.push(current); current = ""; }
      else { current += ch; }
    }
  }
  fields.push(current);
  return fields;
}

function parseTypedCsv(text: string): { rows: CsvRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row"] };

  const headerRaw = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));

  const colMap: Record<string, number> = {};
  headerRaw.forEach((h, i) => {
    if (h.includes("company")) colMap.company = i;
    else if (h.includes("topic")) colMap.topic = i;
    else if (h.includes("question")) colMap.question = i;
    else if (h.includes("difficult") || h.includes("level")) colMap.difficulty = i;
  });

  if (colMap.company === undefined) {
    return { rows: [], errors: ["CSV must have a 'Company' column"] };
  }
  if (colMap.topic === undefined && colMap.question === undefined) {
    return { rows: [], errors: ["CSV must have a 'Topic' or 'Question' column"] };
  }

  const rows: CsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const company = fields[colMap.company]?.trim() || "";
    if (!company) { errors.push(`Row ${i + 1}: Missing company name, skipped`); continue; }

    const topic = colMap.topic !== undefined ? fields[colMap.topic]?.trim() || "" : "";
    const question = colMap.question !== undefined ? fields[colMap.question]?.trim() || "" : "";
    const difficulty = colMap.difficulty !== undefined ? fields[colMap.difficulty]?.trim() || "" : "";

    if (!topic && !question) { errors.push(`Row ${i + 1}: No topic/question for "${company}", skipped`); continue; }

    rows.push({ companyName: company, topic, question, difficulty });
  }

  return { rows, errors };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LatestTopicTab() {
  // Data
  const [topics, setTopics] = useState<LatestTopic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("latest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Full add/edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<LatestTopic | null>(null);
  const [form, setForm] = useState<TopicFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Inline edit
  const [inlineEdit, setInlineEdit] = useState<{
    topicId: string;
    field: string;
    value: string;
  } | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);

  // Quick add per-type
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TopicType>("gd");
  const [quickAddCompany, setQuickAddCompany] = useState("");
  const [quickAddTopic, setQuickAddTopic] = useState("");
  const [quickAddQuestion, setQuickAddQuestion] = useState("");
  const [quickAddDifficulty, setQuickAddDifficulty] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<"form" | "csv">("form");

  // Per-type CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ success: number; failed: number } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch ───

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "10", sortBy });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/latest-topics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, search]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  // ─── Search ───

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const handleSearchKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };

  // ─── Full Add/Edit ───

  const openAddModal = () => { setEditingTopic(null); setForm(emptyForm); setIsModalOpen(true); };

  const openEditModal = (topic: LatestTopic) => {
    setEditingTopic(topic);
    setForm({
      companyName: topic.companyName,
      gdTopic: topic.gdTopic || "", gdQuestion: topic.gdQuestion || "", gdDifficulty: topic.gdDifficulty || "",
      personalInterviewTopic: topic.personalInterviewTopic || "", personalInterviewQuestion: topic.personalInterviewQuestion || "", personalInterviewDifficulty: topic.personalInterviewDifficulty || "",
      technicalInterviewTopic: topic.technicalInterviewTopic || "", technicalInterviewQuestion: topic.technicalInterviewQuestion || "", technicalInterviewDifficulty: topic.technicalInterviewDifficulty || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.companyName.trim()) { alert("Company name is required"); return; }
    const hasAny = form.gdTopic.trim() || form.gdQuestion.trim() ||
      form.personalInterviewTopic.trim() || form.personalInterviewQuestion.trim() ||
      form.technicalInterviewTopic.trim() || form.technicalInterviewQuestion.trim();
    if (!hasAny) { alert("At least one topic or question field is required"); return; }

    setSaving(true);
    try {
      const method = editingTopic ? "PUT" : "POST";
      const body: any = {};
      if (editingTopic) body.id = editingTopic.id;
      Object.entries(form).forEach(([k, v]) => { body[k] = v.trim() || null; });
      const res = await fetch("/api/admin/latest-topics", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setIsModalOpen(false); setForm(emptyForm); setEditingTopic(null); fetchTopics(); }
      else { const err = await res.json().catch(() => null); alert(err?.error || "Failed to save topic"); }
    } catch (error) { console.error("Failed to save:", error); alert("Error saving topic"); }
    finally { setSaving(false); }
  };

  // ─── Delete ───

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/latest-topics?id=${id}`, { method: "DELETE" });
      if (res.ok) { setDeleteConfirmId(null); fetchTopics(); }
      else { alert("Failed to delete topic"); }
    } catch (error) { console.error("Failed to delete:", error); alert("Error deleting topic"); }
  };

  // ─── Inline Edit ───

  const startInlineEdit = (topic: LatestTopic, field: string) => {
    setInlineEdit({ topicId: topic.id, field, value: (topic as any)[field] || "" });
  };

  const cancelInlineEdit = () => setInlineEdit(null);

  const saveInlineEdit = async () => {
    if (!inlineEdit) return;
    setInlineSaving(true);
    try {
      const topic = topics.find((t) => t.id === inlineEdit.topicId);
      if (!topic) return;
      const body: any = { id: topic.id, companyName: topic.companyName };
      // Copy all existing fields
      Object.keys(emptyForm).forEach((k) => { if (k !== "companyName") body[k] = (topic as any)[k]; });
      body[inlineEdit.field] = inlineEdit.value.trim() || null;

      const res = await fetch("/api/admin/latest-topics", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setInlineEdit(null); fetchTopics(); }
      else { const err = await res.json().catch(() => null); alert(err?.error || "Failed to update"); }
    } catch (error) { console.error("Inline edit failed:", error); alert("Error updating topic"); }
    finally { setInlineSaving(false); }
  };

  // ─── Quick Add Per-Type ───

  const openQuickAdd = (type: TopicType) => {
    setQuickAddType(type);
    setQuickAddCompany(""); setQuickAddTopic(""); setQuickAddQuestion(""); setQuickAddDifficulty("");
    setCsvFile(null); setCsvPreview([]); setCsvErrors([]); setCsvResult(null);
    setQuickAddTab("form");
    setQuickAddOpen(true);
  };

  const handleQuickAddSave = async () => {
    if (!quickAddCompany.trim()) { alert("Company name is required"); return; }
    if (!quickAddTopic.trim() && !quickAddQuestion.trim()) { alert("Topic or Question is required"); return; }

    setQuickAddSaving(true);
    try {
      const meta = TYPE_META[quickAddType];
      const body: any = { companyName: quickAddCompany.trim() };
      // Set all nulls first
      Object.values(TYPE_META).forEach((m) => { body[m.topicKey] = null; body[m.questionKey] = null; body[m.difficultyKey] = null; });
      body[meta.topicKey] = quickAddTopic.trim() || null;
      body[meta.questionKey] = quickAddQuestion.trim() || null;
      body[meta.difficultyKey] = quickAddDifficulty || null;

      const res = await fetch("/api/admin/latest-topics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setQuickAddOpen(false); fetchTopics(); }
      else { const err = await res.json().catch(() => null); alert(err?.error || "Failed to add topic"); }
    } catch (error) { console.error("Quick add failed:", error); alert("Error adding topic"); }
    finally { setQuickAddSaving(false); }
  };

  // ─── Per-Type CSV ───

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file); setCsvPreview([]); setCsvErrors([]); setCsvResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows, errors } = parseTypedCsv(ev.target?.result as string);
      setCsvPreview(rows); setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = async () => {
    if (csvPreview.length === 0) { alert("No valid rows to upload"); return; }
    setCsvUploading(true); setCsvResult(null);
    try {
      const payload = csvPreview.map((row) => ({
        companyName: row.companyName,
        type: quickAddType === "gd" ? "gd" : quickAddType === "personal" ? "personal" : "technical",
        topic: row.topic,
        question: row.question,
        difficulty: row.difficulty,
      }));
      const res = await fetch("/api/admin/latest-topics/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topics: payload }) });
      if (res.ok) { const data = await res.json(); setCsvResult({ success: data.created, failed: data.failed }); fetchTopics(); }
      else { const err = await res.json().catch(() => null); alert(err?.error || "Failed to upload CSV"); }
    } catch (error) { console.error("CSV upload failed:", error); alert("Error uploading CSV"); }
    finally { setCsvUploading(false); }
  };

  const resetCsvState = () => {
    setCsvFile(null); setCsvPreview([]); setCsvErrors([]); setCsvResult(null);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const csv = `Company,Topic,Question,Difficulty\nTCS,"AI in Healthcare","Discuss the role of AI in modern healthcare",Medium\nInfosys,"Remote Work Debate","Is remote work better than office work?",Easy\nGoogle,"System Design","Design a URL shortener",Hard`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${TYPE_META[quickAddType].label.replace(/\s/g, "_")}_template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Helpers ───

  const truncate = (text: string | null, max = 50) => {
    if (!text) return <span className="text-muted-foreground italic text-xs">—</span>;
    return text.length > max ? text.slice(0, max) + "…" : text;
  };

  const diffBadge = (d: string | null) => {
    if (!d) return null;
    const color = d === "Easy" ? "bg-green-500/15 text-green-500" : d === "Medium" ? "bg-yellow-500/15 text-yellow-500" : "bg-red-500/15 text-red-500";
    return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${color} border-0`}>{d}</Badge>;
  };

  // Renders an inline-editable cell
  const renderCell = (topic: LatestTopic, field: string, maxW = "max-w-[180px]") => {
    if (inlineEdit?.topicId === topic.id && inlineEdit.field === field) {
      return (
        <div className="flex items-start gap-1">
          <Textarea value={inlineEdit.value} onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
            rows={2} className="text-xs min-w-[140px]" autoFocus onKeyDown={(e) => { if (e.key === "Escape") cancelInlineEdit(); if (e.key === "Enter" && e.ctrlKey) saveInlineEdit(); }} />
          <div className="flex flex-col gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveInlineEdit} disabled={inlineSaving}><Check className="h-3 w-3 text-green-500" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelInlineEdit} disabled={inlineSaving}><X className="h-3 w-3 text-red-500" /></Button>
          </div>
        </div>
      );
    }
    return (
      <div className={`group flex items-center gap-1 cursor-pointer ${maxW}`} onClick={() => startInlineEdit(topic, field)}>
        <span className="text-xs">{truncate((topic as any)[field])}</span>
        <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Title */}
          <div className="space-y-1">
            <CardTitle className="text-xl">Latest Topics</CardTitle>
            <CardDescription>Manage the latest GD, Personal Interview, and Technical Interview topics asked by companies</CardDescription>
          </div>

          {/* Action buttons — clean 2-row grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <Button size="sm" onClick={openAddModal} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add All
            </Button>
            <Button size="sm" variant="outline" onClick={() => openQuickAdd("gd")} className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> GD Topic
            </Button>
            <Button size="sm" variant="outline" onClick={() => openQuickAdd("personal")} className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-green-500" /> Personal
            </Button>
            <Button size="sm" variant="outline" onClick={() => openQuickAdd("technical")} className="gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-orange-500" /> Technical
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by company name..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyDown} className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
            {search && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>Clear</Button>}
          </div>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-9">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest First</SelectItem>
              <SelectItem value="company">Company Name</SelectItem>
              <SelectItem value="date">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Count */}
        <div className="text-sm text-muted-foreground">
          {total} topic{total !== 1 ? "s" : ""} found{search && <> for &quot;{search}&quot;</>}
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] text-xs">Company</TableHead>
                <TableHead className="text-xs">
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3 text-blue-500" />GD Topic</span>
                </TableHead>
                <TableHead className="text-xs">
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3 text-green-500" />Personal Interview</span>
                </TableHead>
                <TableHead className="text-xs">
                  <span className="flex items-center gap-1"><Code2 className="h-3 w-3 text-orange-500" />Technical Interview</span>
                </TableHead>
                <TableHead className="w-[80px] text-xs">Date</TableHead>
                <TableHead className="w-[90px] text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : topics.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No topics found. Click a button above to add one.</TableCell></TableRow>
              ) : topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell><Badge variant="outline" className="text-xs">{topic.companyName}</Badge></TableCell>
                  {/* GD */}
                  <TableCell className="align-top">
                    <div className="space-y-0.5">
                      {renderCell(topic, "gdTopic")}
                      {topic.gdQuestion && <div className="text-[10px] text-muted-foreground italic pl-0.5">Q: {truncate(topic.gdQuestion, 40)}</div>}
                      {diffBadge(topic.gdDifficulty)}
                    </div>
                  </TableCell>
                  {/* Personal */}
                  <TableCell className="align-top">
                    <div className="space-y-0.5">
                      {renderCell(topic, "personalInterviewTopic")}
                      {topic.personalInterviewQuestion && <div className="text-[10px] text-muted-foreground italic pl-0.5">Q: {truncate(topic.personalInterviewQuestion, 40)}</div>}
                      {diffBadge(topic.personalInterviewDifficulty)}
                    </div>
                  </TableCell>
                  {/* Technical */}
                  <TableCell className="align-top">
                    <div className="space-y-0.5">
                      {renderCell(topic, "technicalInterviewTopic")}
                      {topic.technicalInterviewQuestion && <div className="text-[10px] text-muted-foreground italic pl-0.5">Q: {truncate(topic.technicalInterviewQuestion, 40)}</div>}
                      {diffBadge(topic.technicalInterviewDifficulty)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(topic.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(topic)} title="Edit all">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {deleteConfirmId === topic.id ? (
                        <>
                          <Button variant="destructive" size="sm" className="h-7 text-xs px-2" onClick={() => handleDelete(topic.id)}>Yes</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setDeleteConfirmId(null)}>No</Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirmId(topic.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /> Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* ─── Full Add/Edit Modal ─── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Edit Topic Entry" : "Add New Topic Entry"}</DialogTitle>
            <DialogDescription>
              {editingTopic ? "Update the details below." : "Fill in company name and at least one section."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input placeholder="e.g. Google, TCS, Infosys..." value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            {/* GD Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" /><span className="font-medium text-sm">GD Topic</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Topic</Label><Input placeholder="Topic name..." value={form.gdTopic} onChange={(e) => setForm({ ...form, gdTopic: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Difficulty</Label>
                  <Select value={form.gdDifficulty} onValueChange={(v) => setForm({ ...form, gdDifficulty: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Question</Label><Textarea placeholder="Enter the GD question..." value={form.gdQuestion} onChange={(e) => setForm({ ...form, gdQuestion: e.target.value })} rows={2} /></div>
            </div>
            {/* Personal Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-green-500" /><span className="font-medium text-sm">Personal Interview</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Topic</Label><Input placeholder="Topic name..." value={form.personalInterviewTopic} onChange={(e) => setForm({ ...form, personalInterviewTopic: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Difficulty</Label>
                  <Select value={form.personalInterviewDifficulty} onValueChange={(v) => setForm({ ...form, personalInterviewDifficulty: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Question</Label><Textarea placeholder="Enter the interview question..." value={form.personalInterviewQuestion} onChange={(e) => setForm({ ...form, personalInterviewQuestion: e.target.value })} rows={2} /></div>
            </div>
            {/* Technical Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-orange-500" /><span className="font-medium text-sm">Technical Interview</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Topic</Label><Input placeholder="Topic name..." value={form.technicalInterviewTopic} onChange={(e) => setForm({ ...form, technicalInterviewTopic: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Difficulty</Label>
                  <Select value={form.technicalInterviewDifficulty} onValueChange={(v) => setForm({ ...form, technicalInterviewDifficulty: v })}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Question</Label><Textarea placeholder="Enter the technical question..." value={form.technicalInterviewQuestion} onChange={(e) => setForm({ ...form, technicalInterviewQuestion: e.target.value })} rows={2} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingTopic ? "Update" : "Add Topic"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Quick Add Per-Type Modal (Form + CSV tabs) ─── */}
      <Dialog open={quickAddOpen} onOpenChange={(open) => { if (!open) { resetCsvState(); setQuickAddOpen(false); } else setQuickAddOpen(true); }}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => { const Icon = TYPE_META[quickAddType].icon; return <Icon className={`h-5 w-5 ${TYPE_META[quickAddType].color}`} />; })()}
              Add {TYPE_META[quickAddType].label}
            </DialogTitle>
            <DialogDescription>
              Add a single entry or bulk-import via CSV.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={quickAddTab} onValueChange={(v) => setQuickAddTab(v as "form" | "csv")} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Single Entry</TabsTrigger>
              <TabsTrigger value="csv" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload CSV</TabsTrigger>
            </TabsList>

            {/* ── Form Tab ── */}
            <TabsContent value="form" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input placeholder="e.g. Google, TCS, Infosys..." value={quickAddCompany} onChange={(e) => setQuickAddCompany(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Topic *</Label>
                  <Input placeholder="Topic name..." value={quickAddTopic} onChange={(e) => setQuickAddTopic(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Difficulty Level</Label>
                  <Select value={quickAddDifficulty} onValueChange={setQuickAddDifficulty}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Question</Label>
                <Textarea placeholder="Enter the question..." value={quickAddQuestion} onChange={(e) => setQuickAddQuestion(e.target.value)} rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setQuickAddOpen(false)} disabled={quickAddSaving}>Cancel</Button>
                <Button onClick={handleQuickAddSave} disabled={quickAddSaving}>{quickAddSaving ? "Saving..." : "Add Topic"}</Button>
              </div>
            </TabsContent>

            {/* ── CSV Tab ── */}
            <TabsContent value="csv" className="space-y-4 pt-4">
              {/* Format guide */}
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium">CSV Format: <code className="text-[10px] bg-background rounded px-1 py-0.5">Company, Topic, Question, Difficulty</code></p>
                <code className="text-[10px] block bg-background rounded p-2 overflow-x-auto whitespace-pre leading-relaxed">
{`Company,Topic,Question,Difficulty
TCS,AI in Healthcare,"Discuss the role of AI in modern healthcare",Medium
Infosys,Remote Work,"Is remote work better than office work?",Easy
Google,System Design,"Design a URL shortener",Hard`}
                </code>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1" onClick={downloadTemplate}>
                  <FileDown className="h-3 w-3" /> Download template
                </Button>
              </div>

              {/* File input */}
              <div className="space-y-1">
                <Label className="text-xs">Select CSV File</Label>
                <Input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvFileChange} className="cursor-pointer h-9" />
              </div>

              {/* Errors */}
              {csvErrors.length > 0 && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-500"><AlertCircle className="h-3.5 w-3.5" /> Warnings ({csvErrors.length})</div>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5 max-h-20 overflow-y-auto">
                    {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">{csvPreview.length} row{csvPreview.length !== 1 ? "s" : ""} ready to import as <Badge variant="secondary" className="text-[10px]">{TYPE_META[quickAddType].label}</Badge>:</p>
                  <div className="rounded-md border max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] py-1.5">Company</TableHead>
                          <TableHead className="text-[10px] py-1.5">Topic</TableHead>
                          <TableHead className="text-[10px] py-1.5">Question</TableHead>
                          <TableHead className="text-[10px] py-1.5 w-[70px]">Difficulty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvPreview.slice(0, 30).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-[10px] py-1 font-medium">{row.companyName}</TableCell>
                            <TableCell className="text-[10px] py-1">{row.topic || <span className="text-muted-foreground italic">—</span>}</TableCell>
                            <TableCell className="text-[10px] py-1">{row.question ? (row.question.length > 40 ? row.question.slice(0, 40) + "…" : row.question) : <span className="text-muted-foreground italic">—</span>}</TableCell>
                            <TableCell className="text-[10px] py-1">{row.difficulty ? diffBadge(row.difficulty) : <span className="text-muted-foreground italic">—</span>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {csvPreview.length > 30 && <div className="text-[10px] text-muted-foreground text-center py-1">...and {csvPreview.length - 30} more</div>}
                  </div>
                </div>
              )}

              {/* Result */}
              {csvResult && (
                <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
                  <p className="text-xs text-green-500 font-medium">
                    Import complete: {csvResult.success} created{csvResult.failed > 0 ? `, ${csvResult.failed} failed` : ""}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { resetCsvState(); setQuickAddOpen(false); }} disabled={csvUploading}>
                  {csvResult ? "Close" : "Cancel"}
                </Button>
                {!csvResult && (
                  <Button onClick={handleCsvUpload} disabled={csvUploading || csvPreview.length === 0} className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    {csvUploading ? "Uploading..." : `Import ${csvPreview.length} Row${csvPreview.length !== 1 ? "s" : ""}`}
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
