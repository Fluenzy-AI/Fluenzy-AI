"use client";
import { useCallback, useRef, useState } from "react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import CollegeProtectedLayout from "../../components/CollegeProtectedLayout";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, ChevronLeft, Download } from "lucide-react";
import Link from "next/link";

interface ParsedRow {
  studentName: string;
  email: string;
  department?: string;
  year?: string;
  rollNumber?: string;
}

interface UploadResult {
  email: string;
  status: "success" | "error" | "duplicate";
  message: string;
}

interface UploadSummary {
  total: number;
  success: number;
  duplicates: number;
  errors: number;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
    return {
      studentName: row["studentname"] || row["student name"] || row["name"] || "",
      email: row["email"] || "",
      department: row["department"] || row["dept"] || undefined,
      year: row["year"] || row["graduationyear"] || undefined,
      rollNumber: row["rollnumber"] || row["roll"] || row["rollno"] || undefined,
    };
  }).filter((r) => r.email || r.studentName);
}

export default function BulkUploadPage() {
  const { token, admin } = useCollegeAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [batchId, setBatchId] = useState("");
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) { setParseError("Please upload a .csv file."); return; }
    setParseError("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) { setParseError("No valid rows found. Check CSV format."); return; }
      setRows(parsed);
      setPreview(true);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleUpload = async () => {
    if (!token || rows.length === 0) return;
    setUploading(true);
    try {
      const res = await fetch("/api/college/upload-students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ students: rows, ...(batchId ? { batchId } : {}) }),
      });
      const data = await res.json();
      setResults(data.results);
      setSummary(data.summary);
      setPreview(false);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `studentName,email,department,year,rollNumber\nJohn Doe,john@${admin?.domain ?? "university.ac.in"},Computer Science,2026,CS001\nJane Smith,jane@${admin?.domain ?? "university.ac.in"},Electronics,2026,EC002`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setRows([]); setPreview(false); setResults(null); setSummary(null); setFileName(""); };

  return (
    <CollegeProtectedLayout>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/college/students" className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Bulk Upload Students</h1>
            <p className="text-slate-400 text-sm mt-0.5">Upload a CSV file to enroll multiple students at once</p>
          </div>
        </div>

        {/* Results Summary */}
        {summary && results && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total", value: summary.total, color: "indigo" },
                { label: "Enrolled", value: summary.success, color: "green" },
                { label: "Duplicates", value: summary.duplicates, color: "amber" },
                { label: "Errors", value: summary.errors, color: "red" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`bg-${color}-500/10 border border-${color}-500/20 rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
                  <p className={`text-xs text-${color}-300 mt-1`}>{label}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/30 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Email</th>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Status</th>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t border-slate-700/20">
                      <td className="px-4 py-2 text-slate-300 text-xs">{r.email}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          r.status === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                          r.status === "duplicate" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                          "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}>
                          {r.status === "success" ? "✓" : r.status === "duplicate" ? "≈" : "✕"} {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-all">
                Upload Another File
              </button>
              <Link href="/college/students" className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
                View All Students
              </Link>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!summary && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">Students must have @{admin?.domain} email addresses.</p>
              <button onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
                <Download className="w-3.5 h-3.5" /> CSV Template
              </button>
            </div>

            {parseError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" /> {parseError}
              </div>
            )}

            {/* Drop zone */}
            {!preview && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-slate-600/50 hover:border-indigo-500/50 hover:bg-slate-800/30"
                }`}>
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? "text-indigo-400" : "text-slate-500"}`} />
                <p className="text-slate-200 font-medium">Drop your CSV file here</p>
                <p className="text-slate-500 text-sm mt-1">or click to browse — .csv files only</p>
                <p className="text-slate-600 text-xs mt-3">Required columns: studentName, email | Optional: department, year, rollNumber</p>
              </div>
            )}

            {/* Preview Table */}
            {preview && rows.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <p className="text-slate-300 font-medium">{fileName}</p>
                    <span className="text-xs text-slate-500">— {rows.length} rows detected</span>
                  </div>
                  <button onClick={reset} className="text-slate-400 hover:text-slate-200 text-sm">Clear</button>
                </div>

                {/* Domain validation summary */}
                {(() => {
                  const invalid = rows.filter((r) => !r.email.endsWith(`@${admin?.domain}`));
                  return invalid.length > 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {invalid.length} row(s) have incorrect domain (not @{admin?.domain}). These will be rejected.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      All {rows.length} emails match @{admin?.domain}
                    </div>
                  );
                })()}

                <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/30 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-slate-400 font-medium">#</th>
                        <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Name</th>
                        <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Email</th>
                        <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Department</th>
                        <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((row, i) => {
                        const validDomain = row.email.endsWith(`@${admin?.domain}`);
                        return (
                          <tr key={i} className={`border-t border-slate-700/20 ${!validDomain ? "bg-red-500/5" : ""}`}>
                            <td className="px-4 py-2 text-slate-500 text-xs">{i + 1}</td>
                            <td className="px-4 py-2 text-slate-200 text-xs">{row.studentName || <span className="text-red-400">Missing!</span>}</td>
                            <td className={`px-4 py-2 text-xs ${validDomain ? "text-slate-300" : "text-red-400"}`}>{row.email}</td>
                            <td className="px-4 py-2 text-slate-400 text-xs">{row.department ?? "—"}</td>
                            <td className="px-4 py-2 text-slate-400 text-xs">{row.year ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && <p className="text-xs text-slate-500 text-center">Showing first 50 of {rows.length} rows</p>}

                <button onClick={handleUpload} disabled={uploading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25">
                  {uploading ? "Enrolling students…" : `Confirm & Enroll ${rows.length} Students`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CollegeProtectedLayout>
  );
}
