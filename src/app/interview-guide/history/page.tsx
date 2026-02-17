"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  Calendar,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface GuideHistoryItem {
  id: string;
  targetRole: string;
  targetCompany: string | null;
  experienceLevel: string;
  communicationLevel: string;
  createdAt: string;
}

const InterviewGuideHistoryPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<GuideHistoryItem[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/interview-guide/history");
      if (response.ok) {
        const data = await response.json();
        setGuides(data.guides || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGuide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this guide?")) return;
    
    setDeleting(id);
    try {
      const response = await fetch(`/api/interview-guide/history/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setGuides(guides.filter((g) => g.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete guide:", error);
    } finally {
      setDeleting(null);
    }
  };

  const downloadPDF = async (id: string, targetRole: string, targetCompany: string | null) => {
    try {
      // Open PDF HTML in a new window with print functionality
      const printWindow = window.open(`/api/interview-guide/pdf/${id}`, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Failed to download PDF");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Radial Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] -z-10 rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] -z-10 rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
                  <FileText size={14} className="text-purple-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-purple-300">
                    Guide History
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Your Generated Guides
                </h1>
                <p className="text-slate-400 mt-1 text-sm font-medium">
                  Review and manage your personalized interview material.
                </p>
              </div>
              <Link href="/interview-guide">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-xs font-bold px-6">
                  <Plus size={16} className="mr-2" />
                  New Guide
                </Button>
              </Link>
            </div>

          {/* Guides List */}
          {guides.length === 0 ? (
          <Card className="border-white/10 bg-slate-900/40 backdrop-blur-2xl rounded-[2rem]">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
                  <FileText size={40} className="text-slate-600" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No Guides Yet</h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  You haven't generated any interview guides yet. Create your first 
                  personalized guide to ace your interviews!
                </p>
                <Link href="/interview-guide">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Sparkles size={18} className="mr-2" />
                    Generate Your First Guide
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {guides.map((guide) => (
                <Card
                  key={guide.id}
                  className="border-white/5 bg-slate-900/40 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300 rounded-2xl group"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Target size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">
                              {guide.targetRole}
                            </h3>
                            {guide.targetCompany && (
                              <div className="flex items-center gap-1 text-slate-400 text-sm">
                                <Building2 size={14} />
                                {guide.targetCompany}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30">
                            {guide.experienceLevel}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                            {guide.communicationLevel}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <Calendar size={12} />
                            {formatDate(guide.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/interview-guide?id=${guide.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold"
                          >
                            <Eye size={16} className="mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold"
                          onClick={() => downloadPDF(guide.id, guide.targetRole, guide.targetCompany)}
                        >
                          <Download size={16} className="mr-2" />
                          PDF
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl"
                          onClick={() => deleteGuide(guide.id)}
                          disabled={deleting === guide.id}
                        >
                          {deleting === guide.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats Card */}
          {guides.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-white/5 bg-slate-900/40 rounded-2xl">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-black text-purple-400">{guides.length}</p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Guides</p>
                </CardContent>
              </Card>
              <Card className="border-white/5 bg-slate-900/40 rounded-2xl">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-black text-emerald-400">
                    {new Set(guides.map((g) => g.targetRole)).size}
                  </p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Unique Roles</p>
                </CardContent>
              </Card>
              <Card className="border-white/5 bg-slate-900/40 rounded-2xl">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-black text-amber-400">
                    {guides.filter((g) => g.targetCompany).length}
                  </p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Company-Specific</p>
                </CardContent>
              </Card>
              <Card className="border-white/5 bg-slate-900/40 rounded-2xl">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-black text-pink-400">
                    {guides.filter((g) => g.experienceLevel === "Fresher").length}
                  </p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Fresher Guides</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewGuideHistoryPage;
