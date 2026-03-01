"use client";
import { useCallback, useEffect, useState } from "react";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import CollegeProtectedLayout from "../components/CollegeProtectedLayout";
import {
  Search, Plus, Upload, Download, Filter, MoreHorizontal,
  User, Mail, Building, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Trash2, Edit3, Eye,
} from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  studentName: string;
  email: string;
  department?: string;
  year?: number;
  rollNumber?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onboardedAt?: string | null;
  inviteSentAt?: string | null;
  tags: string[];
  warningFlags: string[];
  adminNotes?: string;
  batch?: { id: string; name: string; department?: string } | null;
  performance?: { lastLogin: string | null; sessions: number; avgScore: number | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-500/10 border-green-500/30 text-green-400",
  INACTIVE: "bg-slate-500/10 border-slate-500/30 text-slate-400",
  SUSPENDED: "bg-red-500/10 border-red-500/30 text-red-400",
};

export default function CollegeStudentsPage() {
  const { token, admin } = useCollegeAdmin();
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  const LIMIT = 25;

  const fetchStudents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    try {
      const res = await fetch(`/api/college/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { if (page !== 1) setPage(1); fetchStudents(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this student from your college?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/college/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStudents();
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    window.open(`/api/college/export-report?${params}`, "_blank");
  };

  const totalPages = Math.ceil(total / LIMIT);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <CollegeProtectedLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Students</h1>
            <p className="text-slate-400 text-sm mt-1">{total} students enrolled under @{admin?.domain}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <Link href="/college/students/upload"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 text-sm hover:bg-slate-700 transition-all">
              <Upload className="w-4 h-4" /> Bulk Upload
            </Link>
            <Link href="/college/students/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25">
              <Plus className="w-4 h-4" /> Add Student
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, email, or department…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {["", "ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  statusFilter === s ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:text-slate-200"
                }`}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium w-8">
                    <input type="checkbox" className="rounded border-slate-600 bg-slate-700"
                      checked={selectedIds.size === students.length && students.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(students.map((s) => s.id)) : new Set())} />
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Student</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Department</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Batch</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Onboarded</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Sessions</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Avg Score</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Last Login</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-700/30">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-slate-500">
                      <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No students found. <Link href="/college/students/upload" className="text-indigo-400 hover:underline">Upload CSV</Link> or <Link href="/college/students/new" className="text-indigo-400 hover:underline">add manually</Link>.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-b border-slate-700/20 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded border-slate-600 bg-slate-700"
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-300 text-xs font-bold">{student.studentName[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-slate-200 font-medium leading-none">{student.studentName}</p>
                            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {student.department ?? <span className="text-slate-600">—</span>}
                        {student.year && <span className="text-slate-500 ml-1">Y{student.year}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {student.batch?.name ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[student.status]}`}>
                          {student.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : student.status === "SUSPENDED" ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {student.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {student.onboardedAt ? new Date(student.onboardedAt).toLocaleDateString() : <span className="text-amber-400">Pending</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {student.performance?.sessions ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        {student.performance?.avgScore !== null && student.performance?.avgScore !== undefined
                          ? `${student.performance.avgScore.toFixed(1)}%`
                          : <span className="text-slate-600">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {student.performance?.lastLogin
                          ? new Date(student.performance.lastLogin).toLocaleDateString()
                          : <span className="text-slate-600">Never</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/college/students/${student.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 hover:text-indigo-200 text-xs font-medium transition-all whitespace-nowrap">
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </Link>
                          <Link href={`/college/students/${student.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all">
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(student.id)} disabled={deleting === student.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-400">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} students
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 hover:bg-slate-700/50 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-300">{page} / {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 hover:bg-slate-700/50 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CollegeProtectedLayout>
  );
}
