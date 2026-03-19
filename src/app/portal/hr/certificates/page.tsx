"use client";

import { useEffect, useState, useCallback } from "react";
import PortalLayout from "@/components/PortalLayout";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { getCertificateTypeName, getCertificateStatusColor } from "@/lib/certificate-utils";

const HR_NAV = [
  { label: "Dashboard", href: "/portal/hr" },
  { label: "Employees", href: "/portal/hr/employees" },
  { label: "Candidates", href: "/portal/hr/candidates" },
  { label: "Interviews", href: "/portal/hr/interviews" },
  { label: "Leave Requests", href: "/portal/hr/leaves" },
  { label: "Attendance", href: "/portal/hr/attendance" },
  { label: "Payroll", href: "/portal/hr/payroll" },
  { label: "Offer Letters", href: "/portal/hr/offer-letters" },
  { label: "Certificates", href: "/portal/hr/certificates" },
  { label: "Send Email", href: "/portal/hr/send-email" },
  { label: "Email Logs", href: "/portal/hr/email-logs" },
];

interface Certificate {
  id: string;
  certificateNumber: string;
  type: string;
  status: string;
  candidateName: string;
  candidateEmail?: string;
  position?: string;
  department?: string;
  issuedAt: string;
  issuedBy: string;
  pdfUrl?: string;
  sentViaEmail: boolean;
  revokedAt?: string;
}

interface Candidate { id: string; name: string; email: string; position: string; department: string; }
interface Employee { id: string; name: string; email: string; designation: string; department: string; }

export default function CertificatesPage() {
  const { user } = usePortalAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<{ type?: string; status?: string }>({});
  
  const [form, setForm] = useState({
    type: "INTERNSHIP",
    candidateId: "",
    employeeId: "",
    recipientType: "candidate",
    candidateName: "",
    candidateEmail: "",
    position: "",
    department: "",
    startDate: "",
    endDate: "",
    joiningDate: "",
    salary: 0,
    projectDescription: "",
    performanceNotes: "",
    responsibilities: "",
    achievements: "",
    trainingName: "",
    grade: "",
    sendEmail: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const typeParam = filter.type ? `&type=${filter.type}` : "";
    const statusParam = filter.status ? `&status=${filter.status}` : "";
    
    const [certRes, candRes, empRes] = await Promise.all([
      fetch(`/api/portal/hr/certificates?page=${page}&limit=20${typeParam}${statusParam}`, { credentials: "include" }),
      fetch("/api/portal/hr/candidates?status=SELECTED&limit=100", { credentials: "include" }),
      fetch("/api/portal/hr/employees?status=ACTIVE&limit=100", { credentials: "include" }),
    ]);
    
    if (certRes.ok) {
      const d = await certRes.json();
      setCertificates(d.certificates || []);
      setTotal(d.total || 0);
    }
    if (candRes.ok) {
      const d = await candRes.json();
      setCandidates(d.candidates || []);
    }
    if (empRes.ok) {
      const d = await empRes.json();
      setEmployees(d.employees || []);
    }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  function prefillFromCandidate(id: string) {
    const c = candidates.find(x => x.id === id);
    if (c) setForm(f => ({ ...f, candidateId: id, candidateName: c.name, candidateEmail: c.email, position: c.position, department: c.department }));
  }

  function prefillFromEmployee(id: string) {
    const e = employees.find(x => x.id === id);
    if (e) setForm(f => ({ ...f, employeeId: id, candidateName: e.name, candidateEmail: e.email, position: e.designation, department: e.department }));
  }

  async function createCertificate() {
    if (!form.candidateName || !form.candidateEmail) {
      return alert("Candidate name and email are required.");
    }
    
    // Type-specific validation
    if (form.type === "INTERNSHIP" || form.type === "EXPERIENCE") {
      if (!form.startDate || !form.endDate || !form.position) {
        return alert("Start date, end date, and position are required for this certificate type.");
      }
    }

    setCreating(true);
    const res = await fetch("/api/portal/hr/certificates", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        candidateId: form.recipientType === "candidate" ? form.candidateId : undefined,
        employeeId: form.recipientType === "employee" ? form.employeeId : undefined,
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      alert(`Certificate generated successfully!\nCertificate Number: ${data.certificate.certificateNumber}`);
      await fetchData();
      setShowCreate(false);
      resetForm();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to generate certificate");
    }
    setCreating(false);
  }

  function resetForm() {
    setForm({
      type: "INTERNSHIP",
      candidateId: "",
      employeeId: "",
      recipientType: "candidate",
      candidateName: "",
      candidateEmail: "",
      position: "",
      department: "",
      startDate: "",
      endDate: "",
      joiningDate: "",
      salary: 0,
      projectDescription: "",
      performanceNotes: "",
      responsibilities: "",
      achievements: "",
      trainingName: "",
      grade: "",
      sendEmail: true,
    });
  }

  async function revokeCertificate(id: string) {
    const reason = prompt("Enter reason for revocation:");
    if (!reason) return;
    
    const res = await fetch(`/api/portal/hr/certificates/${id}/revoke`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    
    if (res.ok) {
      alert("Certificate revoked successfully");
      fetchData();
    } else {
      alert("Failed to revoke certificate");
    }
  }

  return (
    <PortalLayout navItems={HR_NAV} title="Certificates" roleLabel="HR Portal" roleColor="text-emerald-400">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Certificates</h2>
            <p className="text-slate-400 text-sm">{total} total certificates issued</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition">+ Generate Certificate</button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select value={filter.type || ""} onChange={(e) => setFilter(f => ({ ...f, type: e.target.value || undefined }))}
            className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white">
            <option value="">All Types</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="EXPERIENCE">Experience</option>
            <option value="OFFER">Offer Letter</option>
            <option value="RELIEVING">Relieving</option>
            <option value="APPRECIATION">Appreciation</option>
            <option value="TRAINING">Training</option>
          </select>
          
          <select value={filter.status || ""} onChange={(e) => setFilter(f => ({ ...f, status: e.target.value || undefined }))}
            className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white">
            <option value="">All Status</option>
            <option value="ISSUED">Issued</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> :
            certificates.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-slate-500">No certificates generated yet</p>
                <p className="text-slate-600 text-sm">Generate your first certificate to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/3 border-b border-white/5">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-4 py-3">Certificate #</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Issued</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {certificates.map(cert => (
                      <tr key={cert.id} className="hover:bg-white/2 transition">
                        <td className="px-4 py-3">
                          <p className="text-xs text-white font-mono">{cert.certificateNumber}</p>
                          {cert.sentViaEmail && <span className="text-xs text-green-400">✉ Sent</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-300">{getCertificateTypeName(cert.type)}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white font-medium">{cert.candidateName}</p>
                          <p className="text-xs text-slate-500">{cert.candidateEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">{cert.position || "-"}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{cert.department || "-"}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(cert.issuedAt).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCertificateStatusColor(cert.status)}`}>
                            {cert.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {cert.pdfUrl && (
                              <a href={`/api/portal/hr/certificates/${cert.id}/pdf`} target="_blank" rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded transition">
                                ⬇ PDF
                              </a>
                            )}
                            {cert.status !== "REVOKED" && (
                              <button onClick={() => revokeCertificate(cert.id)}
                                className="text-xs px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition">
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {total > 20 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-40">← Prev</button>
            <span className="px-3 py-1.5 text-slate-400 text-xs">{page} / {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-lg disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>

      {/* Generate Certificate Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-slate-900 z-10">
              <h3 className="font-semibold text-white">Generate Certificate</h3>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Certificate Type */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Certificate Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="INTERNSHIP">Internship Certificate</option>
                  <option value="EXPERIENCE">Experience Letter</option>
                  <option value="OFFER">Offer Letter</option>
                  <option value="RELIEVING">Relieving Letter</option>
                  <option value="APPRECIATION">Appreciation Certificate</option>
                  <option value="TRAINING">Training Completion Certificate</option>
                </select>
              </div>

              {/* Recipient Type */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Recipient Type *</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="radio" checked={form.recipientType === "candidate"} onChange={() => setForm(f => ({ ...f, recipientType: "candidate", employeeId: "" }))} />
                    Candidate
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="radio" checked={form.recipientType === "employee"} onChange={() => setForm(f => ({ ...f, recipientType: "employee", candidateId: "" }))} />
                    Employee
                  </label>
                </div>
              </div>

              {/* Select Candidate or Employee */}
              {form.recipientType === "candidate" ? (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Select Candidate</label>
                  <select value={form.candidateId} onChange={e => prefillFromCandidate(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="">Select or enter manually...</option>
                    {candidates.map(c => <option key={c.id} value={c.id}>{c.name} — {c.position}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Select Employee</label>
                  <select value={form.employeeId} onChange={e => prefillFromEmployee(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="">Select or enter manually...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.designation}</option>)}
                  </select>
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Full Name *</label>
                  <input value={form.candidateName} onChange={e => setForm(f => ({ ...f, candidateName: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Email *</label>
                  <input type="email" value={form.candidateEmail} onChange={e => setForm(f => ({ ...f, candidateEmail: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Position *</label>
                  <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Department</label>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>

              {/* Type-specific fields */}
              {(form.type === "INTERNSHIP" || form.type === "EXPERIENCE") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Start Date *</label>
                      <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">End Date *</label>
                      <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                    </div>
                  </div>
                  
                  {form.type === "INTERNSHIP" && (
                    <>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Project Description</label>
                        <textarea value={form.projectDescription} onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
                          rows={3} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Performance Notes</label>
                        <textarea value={form.performanceNotes} onChange={e => setForm(f => ({ ...f, performanceNotes: e.target.value }))}
                          rows={2} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                      </div>
                    </>
                  )}
                  
                  {form.type === "EXPERIENCE" && (
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Key Responsibilities</label>
                      <textarea value={form.responsibilities} onChange={e => setForm(f => ({ ...f, responsibilities: e.target.value }))}
                        rows={3} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                    </div>
                  )}
                </>
              )}

              {form.type === "TRAINING" && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Training Name *</label>
                    <input value={form.trainingName} onChange={e => setForm(f => ({ ...f, trainingName: e.target.value }))}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Start Date *</label>
                      <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">End Date *</label>
                      <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Grade</label>
                      <input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                        placeholder="A+, Pass, etc." className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                    </div>
                  </div>
                </>
              )}

              {/* Send Email */}
              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="sendEmail" checked={form.sendEmail} onChange={e => setForm(f => ({ ...f, sendEmail: e.target.checked }))} />
                <label htmlFor="sendEmail" className="text-sm text-slate-300">Send certificate via email (with PDF attachment)</label>
              </div>

              <button onClick={createCertificate} disabled={creating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-xl transition font-medium">
                {creating ? "Generating..." : "Generate Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}