"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Send, Users, BarChart3, Settings, Sparkles, Mail,
  Plus, ChevronRight, Loader2, CheckCircle, AlertCircle,
  Play, Pause, StopCircle, Eye, Pencil, Trash2, RefreshCw
} from "lucide-react";

interface DashboardData {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalEmailsSent: number;
    totalUsers: number;
    activeTriggers: number;
    unsubscribedUsers: number;
  };
  metrics: {
    deliveryRate: string;
    openRate: string;
    clickRate: string;
    bounceRate: string;
    unsubscribeRate: string;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    subject: string;
    status: string;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    createdAt: string;
  }>;
  segments: Array<{
    id: string;
    name: string;
    userCount: number;
  }>;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  senderType: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  isAiGenerated: boolean;
  createdAt: string;
  openRate: string;
  clickRate: string;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  type: string;
  count: number;
}

interface Trigger {
  id: string;
  name: string;
  description: string;
  conditionType: string;
  conditionDescription: string;
  senderType: string;
  emailSubject: string;
  isActive: boolean;
  totalFired: number;
  lastFiredAt: string | null;
}

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignStep, setCampaignStep] = useState(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Segment users modal state
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [segmentUsers, setSegmentUsers] = useState<any[]>([]);
  const [loadingSegmentUsers, setLoadingSegmentUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    senderType: "news",
    subject: "",
    bodyHtml: "",
    bodyText: "",
    segmentType: "all_users",
    scheduledAt: "",
    sendNow: false,
    aiPrompt: "",
    aiTone: "professional",
  });

  useEffect(() => {
    fetchDashboard();
    fetchCampaigns();
    fetchSegments();
    fetchTriggers();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/marketing");
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/admin/marketing/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Campaigns fetch error:", error);
    }
  };

  const fetchSegments = async () => {
    try {
      const res = await fetch("/api/admin/marketing/segments?predefined=true");
      if (res.ok) {
        const data = await res.json();
        setSegments(data.segments || []);
      }
    } catch (error) {
      console.error("Segments fetch error:", error);
    }
  };

  const fetchTriggers = async () => {
    try {
      const res = await fetch("/api/admin/marketing/triggers");
      if (res.ok) {
        const data = await res.json();
        setTriggers(data.triggers || []);
      }
    } catch (error) {
      console.error("Triggers fetch error:", error);
    }
  };

  // Fetch users in a segment
  const fetchSegmentUsers = async (segment: Segment) => {
    setSelectedSegment(segment);
    setLoadingSegmentUsers(true);
    try {
      const res = await fetch("/api/admin/marketing/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentType: segment.type, fullList: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setSegmentUsers(data.users || []);
      }
    } catch (error) {
      console.error("Segment users fetch error:", error);
    } finally {
      setLoadingSegmentUsers(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!campaignForm.aiPrompt) return;
    
    setAiGenerating(true);
    try {
      const res = await fetch("/api/admin/marketing/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          prompt: campaignForm.aiPrompt,
          senderType: campaignForm.senderType,
          tone: campaignForm.aiTone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.email) {
          setCampaignForm({
            ...campaignForm,
            subject: data.email.subject,
            bodyHtml: data.email.bodyHtml,
            bodyText: data.email.bodyText,
          });
        }
      }
    } catch (error) {
      console.error("AI generate error:", error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveCampaign = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignForm.name,
          subject: campaignForm.subject,
          bodyHtml: campaignForm.bodyHtml,
          bodyText: campaignForm.bodyText,
          senderType: campaignForm.senderType,
          segmentFilters: { conditions: [{ type: campaignForm.segmentType }], logic: "AND" },
          scheduledAt: campaignForm.scheduledAt || undefined,
          sendNow: campaignForm.sendNow,
          isAiGenerated: !!campaignForm.aiPrompt,
          aiPrompt: campaignForm.aiPrompt || undefined,
          aiTone: campaignForm.aiTone || undefined,
        }),
      });

      if (res.ok) {
        setShowCampaignModal(false);
        setCampaignStep(1);
        setCampaignForm({
          name: "", senderType: "news", subject: "", bodyHtml: "", bodyText: "",
          segmentType: "all_users", scheduledAt: "", sendNow: false, aiPrompt: "", aiTone: "professional",
        });
        fetchCampaigns();
        fetchDashboard();
      }
    } catch (error) {
      console.error("Save campaign error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTrigger = async (triggerId: string) => {
    try {
      const res = await fetch(`/api/admin/marketing/triggers/${triggerId}`, {
        method: "POST",
      });
      if (res.ok) {
        fetchTriggers();
      }
    } catch (error) {
      console.error("Toggle trigger error:", error);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/marketing/campaigns/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchCampaigns();
        fetchDashboard();
      }
    } catch (error) {
      console.error("Campaign action error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      sending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      sent: "bg-green-500/20 text-green-400 border-green-500/30",
      paused: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[status] || colors.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Marketing & Communications</h2>
          <p className="text-sm text-slate-400">Email campaigns, user segments, and automation</p>
        </div>
        <Button
          onClick={() => setShowCampaignModal(true)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-violet-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-violet-600">
            <Mail className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="segments" className="data-[state=active]:bg-violet-600">
            <Users className="w-4 h-4 mr-2" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="automation" className="data-[state=active]:bg-violet-600">
            <Settings className="w-4 h-4 mr-2" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#0d1220] border-[#1e2a40]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Campaigns</p>
                    <p className="text-2xl font-bold text-white">{dashboard?.overview.totalCampaigns || 0}</p>
                  </div>
                  <Mail className="w-8 h-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0d1220] border-[#1e2a40]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Emails Sent</p>
                    <p className="text-2xl font-bold text-white">{dashboard?.overview.totalEmailsSent || 0}</p>
                  </div>
                  <Send className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0d1220] border-[#1e2a40]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Open Rate</p>
                    <p className="text-2xl font-bold text-white">{dashboard?.metrics.openRate || "0"}%</p>
                  </div>
                  <Eye className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0d1220] border-[#1e2a40]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Users</p>
                    <p className="text-2xl font-bold text-white">{dashboard?.overview.totalUsers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Delivery Rate", value: dashboard?.metrics.deliveryRate, color: "text-green-400" },
              { label: "Open Rate", value: dashboard?.metrics.openRate, color: "text-blue-400" },
              { label: "Click Rate", value: dashboard?.metrics.clickRate, color: "text-violet-400" },
              { label: "Bounce Rate", value: dashboard?.metrics.bounceRate, color: "text-orange-400" },
              { label: "Unsubscribe", value: dashboard?.metrics.unsubscribeRate, color: "text-red-400" },
            ].map((metric) => (
              <div key={metric.label} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                <p className="text-xs text-slate-400">{metric.label}</p>
                <p className={`text-xl font-bold ${metric.color}`}>{metric.value || "0"}%</p>
              </div>
            ))}
          </div>

          {/* Recent Campaigns */}
          <Card className="bg-[#0d1220] border-[#1e2a40]">
            <CardHeader>
              <CardTitle className="text-white">Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.recentCampaigns && dashboard.recentCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                      <div>
                        <p className="text-white font-medium">{campaign.name}</p>
                        <p className="text-sm text-slate-400">{campaign.subject}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-300">{campaign.totalSent} sent</p>
                          <p className="text-xs text-slate-400">{campaign.totalOpened} opened</p>
                        </div>
                        <Badge className={getStatusBadge(campaign.status)}>{campaign.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No campaigns yet. Create your first campaign!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6 mt-6">
          <Card className="bg-[#0d1220] border-[#1e2a40]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">All Campaigns</CardTitle>
              <Button variant="outline" onClick={fetchCampaigns} className="border-slate-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Campaign</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Sent</TableHead>
                    <TableHead className="text-slate-400">Open Rate</TableHead>
                    <TableHead className="text-slate-400">Click Rate</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="border-slate-700/50">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{campaign.name}</p>
                          <p className="text-xs text-slate-400">{campaign.subject}</p>
                          {campaign.isAiGenerated && (
                            <Badge className="mt-1 bg-violet-500/20 text-violet-400 border-violet-500/30 text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(campaign.status)}>{campaign.status}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{campaign.totalSent} / {campaign.totalRecipients}</TableCell>
                      <TableCell className="text-green-400">{campaign.openRate}%</TableCell>
                      <TableCell className="text-blue-400">{campaign.clickRate}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {campaign.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handleCampaignAction(campaign.id, "send")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Send
                            </Button>
                          )}
                          {campaign.status === "sending" && (
                            <Button
                              size="sm"
                              onClick={() => handleCampaignAction(campaign.id, "pause")}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              <Pause className="w-3 h-3 mr-1" />
                              Pause
                            </Button>
                          )}
                          {campaign.status === "paused" && (
                            <Button
                              size="sm"
                              onClick={() => handleCampaignAction(campaign.id, "resume")}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Resume
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaigns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                        No campaigns yet. Click "New Campaign" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {segments.map((segment) => (
              <Card 
                key={segment.id} 
                className="bg-[#0d1220] border-[#1e2a40] hover:border-violet-500/50 transition-colors cursor-pointer"
                onClick={() => fetchSegmentUsers(segment)}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto text-violet-500 mb-2" />
                    <p className="text-white font-medium">{segment.name}</p>
                    <p className="text-2xl font-bold text-violet-400">{segment.count.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">users</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="mt-3 border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchSegmentUsers(segment);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6 mt-6">
          <Card className="bg-[#0d1220] border-[#1e2a40]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Automation Triggers</CardTitle>
                <CardDescription className="text-slate-400">
                  Automatically send emails based on user behavior
                </CardDescription>
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                New Trigger
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggers.map((trigger) => (
                  <div key={trigger.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${trigger.isActive ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
                        <Settings className={`w-5 h-5 ${trigger.isActive ? 'text-green-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{trigger.name}</p>
                        <p className="text-sm text-slate-400">{trigger.conditionDescription}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {trigger.totalFired} emails sent • Subject: {trigger.emailSubject}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={`${trigger.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                        {trigger.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch
                        checked={trigger.isActive}
                        onCheckedChange={() => handleToggleTrigger(trigger.id)}
                      />
                    </div>
                  </div>
                ))}
                {triggers.length === 0 && (
                  <p className="text-slate-400 text-center py-8">
                    No automation triggers configured. Create your first trigger to automate email outreach.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Creation Modal */}
      <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
        <DialogContent className="max-w-2xl bg-[#0d1220] border-[#1e2a40] text-white">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription className="text-slate-400">
              Step {campaignStep} of 4
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Name & Sender */}
          {campaignStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="e.g., Re-engagement Campaign Q1"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <Label>Sender Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { value: "news", label: "News", desc: "news@fluenzyai.app" },
                    { value: "contact", label: "Contact", desc: "contact@fluenzyai.app" },
                    { value: "careers", label: "Careers", desc: "careers@fluenzyai.app" },
                    { value: "support", label: "Support", desc: "support@fluenzyai.app" },
                  ].map((sender) => (
                    <div
                      key={sender.value}
                      onClick={() => setCampaignForm({ ...campaignForm, senderType: sender.value })}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        campaignForm.senderType === sender.value
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <p className="font-medium">{sender.label}</p>
                      <p className="text-xs text-slate-400">{sender.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {campaignStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Target Audience</Label>
                <Select
                  value={campaignForm.segmentType}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, segmentType: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="inactive">Inactive Users (7 days)</SelectItem>
                    <SelectItem value="new_users">New Users (7 days)</SelectItem>
                    <SelectItem value="low_score">Low Scorers</SelectItem>
                    <SelectItem value="power_users">Power Users</SelectItem>
                    <SelectItem value="plan">Free Plan Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={campaignForm.scheduledAt}
                  onChange={(e) => setCampaignForm({ ...campaignForm, scheduledAt: e.target.value })}
                  className="bg-slate-800 border-slate-600"
                />
                <p className="text-xs text-slate-400 mt-1">Leave empty to save as draft</p>
              </div>
            </div>
          )}

          {/* Step 3: Compose */}
          {campaignStep === 3 && (
            <div className="space-y-4">
              {/* AI Generation */}
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <Label className="text-violet-300">AI Email Generator</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={campaignForm.aiPrompt}
                    onChange={(e) => setCampaignForm({ ...campaignForm, aiPrompt: e.target.value })}
                    placeholder="Describe the email you want to create..."
                    className="bg-slate-800 border-slate-600"
                  />
                  <Button
                    onClick={handleAiGenerate}
                    disabled={aiGenerating || !campaignForm.aiPrompt}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Subject Line</Label>
                <Input
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  placeholder="Email subject"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <Label>Email Body (HTML)</Label>
                <Textarea
                  value={campaignForm.bodyHtml}
                  onChange={(e) => setCampaignForm({ ...campaignForm, bodyHtml: e.target.value })}
                  placeholder="Email content (HTML supported)"
                  rows={8}
                  className="bg-slate-800 border-slate-600 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {campaignStep === 4 && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 text-black max-h-96 overflow-auto">
                <p className="text-xs text-gray-500 mb-2">Subject: {campaignForm.subject}</p>
                <div dangerouslySetInnerHTML={{ __html: campaignForm.bodyHtml }} />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={campaignForm.sendNow}
                  onCheckedChange={(checked) => setCampaignForm({ ...campaignForm, sendNow: checked })}
                />
                <Label>Send immediately after saving</Label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCampaignStep(Math.max(1, campaignStep - 1))}
              disabled={campaignStep === 1}
              className="border-slate-600"
            >
              Back
            </Button>
            {campaignStep < 4 ? (
              <Button
                onClick={() => setCampaignStep(campaignStep + 1)}
                disabled={campaignStep === 1 && !campaignForm.name}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSaveCampaign}
                disabled={saving || !campaignForm.subject || !campaignForm.bodyHtml}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : campaignForm.sendNow ? (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Save & Send
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Campaign
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Segment Users Modal */}
      <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
        <DialogContent className="max-w-4xl bg-[#0d1220] border-[#1e2a40] text-white max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-500" />
              {selectedSegment?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedSegment?.count.toLocaleString()} users in this segment
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {loadingSegmentUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Plan</TableHead>
                    <TableHead className="text-slate-300">Usage</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-700/50">
                      <TableCell className="font-medium text-white">{user.name || "—"}</TableCell>
                      <TableCell className="text-slate-400">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={user.plan === "PRO" ? "bg-violet-500/20 text-violet-400" : "bg-slate-700 text-slate-300"}>
                          {user.plan || "Free"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {user.sessionsCount || 0}/{user.sessionLimit || 3}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {segmentUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                        No users found in this segment
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
              <div>
                <h2 className="text-white font-bold text-lg">{selectedUser.name || "Unknown User"}</h2>
                <p className="text-slate-400 text-sm">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Account Info */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Account Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Plan", value: selectedUser.plan || "Free" },
                    { label: "Role", value: selectedUser.role || "User" },
                    { label: "Sessions", value: `${selectedUser.sessionsCount || 0}/${selectedUser.sessionLimit || 3}` },
                    { label: "Disabled", value: selectedUser.disabled ? "Yes" : "No" },
                    { label: "Created", value: selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                    { label: "Last Active", value: selectedUser.lastActiveAt ? new Date(selectedUser.lastActiveAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                      <p className="text-slate-200 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Stats */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Activity Stats</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Sessions", value: selectedUser.sessionsCount || 0 },
                    { label: "HR Sessions", value: selectedUser.hrSessions || 0 },
                    { label: "GD Sessions", value: selectedUser.gdSessions || 0 },
                    { label: "Technical", value: selectedUser.technicalSessions || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-violet-500/10 rounded-xl p-3 border border-violet-500/20 text-center">
                      <p className="text-2xl font-bold text-violet-400">{value}</p>
                      <p className="text-slate-400 text-xs">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-3">
                <a 
                  href={`/superadmin/users/${selectedUser.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm text-center transition-all"
                >
                  Full Details
                </a>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
