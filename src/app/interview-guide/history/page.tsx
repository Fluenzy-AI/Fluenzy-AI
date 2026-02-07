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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
                <FileText size={18} className="text-purple-400" />
                <span className="text-sm font-medium text-purple-300">
                  Interview Guide History
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Your Generated Guides
              </h1>
              <p className="text-slate-300 mt-2">
                View, download, and manage all your previously generated interview guides.
              </p>
            </div>
            <Link href="/interview-guide">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus size={18} className="mr-2" />
                Generate New Guide
              </Button>
            </Link>
          </div>

          {/* Guides List */}
          {guides.length === 0 ? (
            <Card className="border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
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
                  className="border-slate-700/50 bg-slate-900/50 backdrop-blur-xl hover:border-purple-500/30 transition-colors"
                >
                  <CardContent className="p-6">
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
                            variant="outline"
                            size="sm"
                            className="border-slate-700 hover:bg-slate-800"
                          >
                            <Eye size={16} className="mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/30"
                          onClick={() => downloadPDF(guide.id, guide.targetRole, guide.targetCompany)}
                        >
                          <Download size={16} className="mr-2" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-700 text-red-400 hover:bg-red-900/30"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-slate-700/50 bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-purple-400">{guides.length}</p>
                  <p className="text-slate-400 text-sm">Total Guides</p>
                </CardContent>
              </Card>
              <Card className="border-slate-700/50 bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-emerald-400">
                    {new Set(guides.map((g) => g.targetRole)).size}
                  </p>
                  <p className="text-slate-400 text-sm">Unique Roles</p>
                </CardContent>
              </Card>
              <Card className="border-slate-700/50 bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-amber-400">
                    {guides.filter((g) => g.targetCompany).length}
                  </p>
                  <p className="text-slate-400 text-sm">Company-Specific</p>
                </CardContent>
              </Card>
              <Card className="border-slate-700/50 bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-pink-400">
                    {guides.filter((g) => g.experienceLevel === "Fresher").length}
                  </p>
                  <p className="text-slate-400 text-sm">Fresher Guides</p>
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
