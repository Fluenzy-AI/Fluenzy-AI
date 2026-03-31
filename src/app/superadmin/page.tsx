"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Tabs replaced by sidebar nav
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Role } from "@prisma/client";
import LatestTopicTab from "@/components/LatestTopicTab";
import EmailManagement from "@/components/EmailManagement";
import SuperAdminNotifications from "@/components/SuperAdminNotifications";
import MarketingDashboard from "@/components/MarketingDashboard";

interface Analytics {
  totalUsers: number;
  activeSessions: number;
  totalSessions: number;
  resumeParses: number;
}

interface LoginLog {
  id: string;
  user: { name: string; email: string };
  loginTime: string;
  logoutTime?: string;
  sessionDuration?: number;
  deviceType?: string;
  os?: string;
  browser?: string;
  status: string;
}

interface CouponUsage {
  userId: string;
  appliedAt?: string | null;
  appliedPlan: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  couponCode: string;
  user: { email: string };
}

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUsage?: number;
  perUserLimit: number;
  startDate?: string;
  expiryDate?: string;
  applicablePlans: string[];
  status: string;
  usages: CouponUsage[];
}

interface CollegeCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUsage: number | null;
  usedCount: number;
  expiryDate: string | null;
  applicablePlans: string[];
  minSeats: number | null;
  status: string;
  createdAt: string;
}

interface PortalStaffMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'HR';
  status: string;
  department?: string;
  phone?: string;
  lastLoginAt?: string;
  loginAttempts: number;
  createdAt: string;
}

const toLocalInputValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
};

const toUtcISOStringFromLocalInput = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

interface PaymentAnalytics {
  paymentHistories: any[];
  revenue: { total: number; monthly: any[] };
  subscribers: { active: number };
  planDistribution: any[];
  couponLoss: number;
  conversionRate: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: string;
  usageCount: number;
  usageLimit: number;
  disabled?: boolean;
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ totalUsers: 0, activeSessions: 0, totalSessions: 0, resumeParses: 0 });
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxUsage: '',
    perUserLimit: '1',
    startDate: '',
    expiryDate: '',
    applicablePlans: [] as string[],
    status: 'active',
  });
  const [globalSettings, setGlobalSettings] = useState({
    Free: { monthlyLimit: 3, isUnlimited: false, status: 'active', updatedAt: null as Date | null },
    Standard: { monthlyLimit: null, isUnlimited: true, status: 'active', updatedAt: null as Date | null },
    Pro: { monthlyLimit: 100, isUnlimited: false, status: 'active', updatedAt: null as Date | null },
  });

  const [activeSection, setActiveSection] = useState('users');

  // ── College Partners state ──────────────────────────────────────────
  const [colleges, setColleges] = useState<any[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegeFiler, setCollegeFiler] = useState('ALL');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);
  const [collegeStudents, setCollegeStudents] = useState<Record<string, any[]>>({});
  const [collegeStudentsLoading, setCollegeStudentsLoading] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [collegeActionLoading, setCollegeActionLoading] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveSeats, setApproveSeats] = useState(200);
  const [approvePlan, setApprovePlan] = useState('Free');
  const [editPlanModal, setEditPlanModal] = useState<any | null>(null);
  const [editPlanSeats, setEditPlanSeats] = useState(200);
  const [editPlanValue, setEditPlanValue] = useState('Free');
  const [editPlanSuccess, setEditPlanSuccess] = useState(false);
  // ─────────────────────────────────────────────────────────────────────

  // ── College Coupons state ─────────────────────────────────────────────
  const [collegeCoupons, setCollegeCoupons] = useState<CollegeCoupon[]>([]);
  const [collegeCouponsLoading, setCollegeCouponsLoading] = useState(false);
  const [collegeCouponsError, setCollegeCouponsError] = useState<string | null>(null);
  const [collegeCouponForm, setCollegeCouponForm] = useState({
    code: '', discountType: 'PERCENTAGE', discountValue: '', maxUsage: '',
    expiryDate: '', applicablePlans: [] as string[], minSeats: '', status: 'active',
  });
  const [editingCollegeCoupon, setEditingCollegeCoupon] = useState<CollegeCoupon | null>(null);
  const [isCollegeCouponModalOpen, setIsCollegeCouponModalOpen] = useState(false);
  // ─────────────────────────────────────────────────────────────────────

  // ── Portal Staff state ───────────────────────────────────────────────
  const [portalStaff, setPortalStaff] = useState<PortalStaffMember[]>([]);
  const [portalStaffTotal, setPortalStaffTotal] = useState(0);
  const [portalStaffLoading, setPortalStaffLoading] = useState(false);
  const [showCreatePortalStaff, setShowCreatePortalStaff] = useState(false);
  const [editingPortalStaff, setEditingPortalStaff] = useState<PortalStaffMember | null>(null);
  const [portalStaffForm, setPortalStaffForm] = useState({ name: '', email: '', password: '', role: 'HR' as 'ADMIN' | 'HR', department: '', phone: '' });
  const [savingPortalStaff, setSavingPortalStaff] = useState(false);
  const [portalStaffError, setPortalStaffError] = useState<string | null>(null);
  const [confirmDeletePortalStaff, setConfirmDeletePortalStaff] = useState<PortalStaffMember | null>(null);
  const [portalStaffResetId, setPortalStaffResetId] = useState<string | null>(null);
  const [portalStaffResetPw, setPortalStaffResetPw] = useState('');
  const [portalStaffResetLoading, setPortalStaffResetLoading] = useState(false);
  // ─────────────────────────────────────────────────────────────────────

  const [planPricing, setPlanPricing] = useState({
    Free: { name: 'Free', price: 0, currency: 'INR', status: 'active', updatedAt: null as Date | null },
    Standard: { name: 'Standard', price: 150, currency: 'INR', status: 'active', updatedAt: null as Date | null },
    Pro: { name: 'Pro', price: 20, currency: 'INR', status: 'active', updatedAt: null as Date | null },
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      router.push("/");
      return;
    }
    fetchUsers();
    fetchAnalytics();
    fetchLoginLogs();
    fetchCoupons();
    fetchPaymentAnalytics();
    fetchGlobalSettings();
    fetchPortalStaff();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  const fetchLoginLogs = async () => {
    try {
      const res = await fetch("/api/admin/login-logs");
      if (res.ok) {
        const data = await res.json();
        setLoginLogs(data.loginLogs);
      }
    } catch (error) {
      console.error("Failed to fetch login logs:", error);
    }
  };

  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      setCouponsError(null);
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      } else {
        const errorData = await res.json().catch(() => null);
        setCouponsError(errorData?.error || "Failed to fetch coupons");
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setCouponsError("Failed to fetch coupons");
    } finally {
      setCouponsLoading(false);
    }
  };

  const fetchCollegeCoupons = async () => {
    setCollegeCouponsLoading(true); setCollegeCouponsError(null);
    try {
      const res = await fetch("/api/superadmin/college-coupons");
      if (!res.ok) { setCollegeCouponsError("Failed to load"); return; }
      setCollegeCoupons(await res.json());
    } catch { setCollegeCouponsError("Network error"); }
    finally { setCollegeCouponsLoading(false); }
  };

  const handleSaveCollegeCoupon = async () => {
    const method = editingCollegeCoupon ? "PUT" : "POST";
    const url = editingCollegeCoupon
      ? `/api/superadmin/college-coupons/${editingCollegeCoupon.id}`
      : "/api/superadmin/college-coupons";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...collegeCouponForm,
          discountValue: parseFloat(collegeCouponForm.discountValue),
          maxUsage: collegeCouponForm.maxUsage ? parseInt(collegeCouponForm.maxUsage) : null,
          minSeats: collegeCouponForm.minSeats ? parseInt(collegeCouponForm.minSeats) : null,
          expiryDate: collegeCouponForm.expiryDate || null,
        }),
      });
      if (res.ok) { setIsCollegeCouponModalOpen(false); fetchCollegeCoupons(); }
      else { const d = await res.json(); alert(d.error ?? "Failed to save"); }
    } catch { alert("Network error"); }
  };

  const handleToggleCollegeCoupon = async (id: string, currentStatus: string) => {
    await fetch(`/api/superadmin/college-coupons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: currentStatus === "active" ? "inactive" : "active" }),
    });
    fetchCollegeCoupons();
  };

  const handleDeleteCollegeCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/superadmin/college-coupons/${id}`, { method: "DELETE" });
    fetchCollegeCoupons();
  };

  const fetchPaymentAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/payment-analytics");
      if (res.ok) {
        const data = await res.json();
        setPaymentAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch payment analytics:", error);
    }
  };

  const fetchPortalStaff = async () => {
    setPortalStaffLoading(true);
    try {
      const res = await fetch('/api/superadmin/portal-staff');
      if (res.ok) {
        const d = await res.json();
        setPortalStaff(d.staff ?? []);
        setPortalStaffTotal(d.total ?? 0);
      }
    } catch (e) { console.error(e); } finally { setPortalStaffLoading(false); }
  };

  const handleSavePortalStaff = async () => {
    setSavingPortalStaff(true);
    setPortalStaffError(null);
    try {
      const method = editingPortalStaff ? 'PATCH' : 'POST';
      const url = editingPortalStaff ? `/api/superadmin/portal-staff/${editingPortalStaff.id}` : '/api/superadmin/portal-staff';
      const body: any = { ...portalStaffForm };
      if (!editingPortalStaff && !body.password) { setPortalStaffError('Password is required'); return; }
      if (editingPortalStaff) delete body.password;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setShowCreatePortalStaff(false);
        setEditingPortalStaff(null);
        setPortalStaffForm({ name: '', email: '', password: '', role: 'HR', department: '', phone: '' });
        fetchPortalStaff();
      } else {
        const d = await res.json();
        setPortalStaffError(d.error || 'Failed to save');
      }
    } catch (e) { setPortalStaffError('Network error'); } finally { setSavingPortalStaff(false); }
  };

  const handleDeletePortalStaff = async (id: string) => {
    try {
      const res = await fetch(`/api/superadmin/portal-staff/${id}`, { method: 'DELETE' });
      if (res.ok) { setConfirmDeletePortalStaff(null); fetchPortalStaff(); }
    } catch (e) { console.error(e); }
  };

  const handleResetPortalPassword = async () => {
    if (!portalStaffResetId || !portalStaffResetPw) return;
    setPortalStaffResetLoading(true);
    try {
      const res = await fetch(`/api/superadmin/portal-staff/${portalStaffResetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: portalStaffResetPw }),
      });
      if (res.ok) { setPortalStaffResetId(null); setPortalStaffResetPw(''); }
    } catch (e) { console.error(e); } finally { setPortalStaffResetLoading(false); }
  };

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch("/api/admin/global-settings");
      if (res.ok) {
        const data = await res.json();
        setGlobalSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch global settings:", error);
    }
  };

  const fetchPlanPricing = async () => {
    try {
      const res = await fetch("/api/admin/plan-pricing");
      if (res.ok) {
        const data = await res.json();
        setPlanPricing(data);
      }
    } catch (error) {
      console.error("Failed to fetch plan pricing:", error);
    }
  };

  const fetchCollegePartners = async (statusFilter = 'ALL') => {
    setCollegesLoading(true);
    try {
      const url = statusFilter !== 'ALL' ? `/api/superadmin/college-partners?status=${statusFilter}` : '/api/superadmin/college-partners';
      const res = await fetch(url);
      if (res.ok) { const d = await res.json(); setColleges(d.colleges ?? []); }
    } catch (e) { console.error(e); } finally { setCollegesLoading(false); }
  };

  const fetchCollegeStudents = async (collegeId: string) => {
    if (collegeStudents[collegeId]) { setExpandedCollege(expandedCollege === collegeId ? null : collegeId); return; }
    setCollegeStudentsLoading(collegeId);
    try {
      const res = await fetch(`/api/superadmin/college-partners?collegeId=${collegeId}&include=students`);
      if (res.ok) { const d = await res.json(); setCollegeStudents(prev => ({ ...prev, [collegeId]: d.students ?? [] })); }
    } catch (e) { console.error(e); } finally {
      setCollegeStudentsLoading(null);
      setExpandedCollege(collegeId);
    }
  };

  const doCollegeAction = async (collegeId: string, action: string, extra?: object) => {
    setCollegeActionLoading(collegeId + action);
    try {
      const res = await fetch('/api/superadmin/college-partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collegeAdminId: collegeId, action, ...extra }),
      });
      if (res.ok) { await fetchCollegePartners(collegeFiler); setApproveModal(null); setRejectModal(null); setRejectReason(''); }
    } catch (e) { console.error(e); } finally { setCollegeActionLoading(null); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleUserToggle = async (userId: string, disabled: boolean) => {
    try {
      const res = await fetch("/api/admin/users/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, disabled }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to toggle user:", error);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);
    }
  };

  const handleEditLimit = async (userId: string, currentLimit: number) => {
    const newLimit = prompt('Enter new usage limit:', currentLimit.toString());
    if (newLimit && !isNaN(Number(newLimit))) {
      try {
        const res = await fetch('/api/admin/users/limit', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, usageLimit: Number(newLimit) }),
        });
        if (res.ok) {
          fetchUsers();
        }
      } catch (error) {
        console.error("Failed to update limit:", error);
      }
    }
  };

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      maxUsage: '',
      perUserLimit: '1',
      startDate: '',
      expiryDate: '',
      applicablePlans: [],
      status: 'active',
    });
    setIsCouponModalOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      maxUsage: coupon.maxUsage?.toString() || '',
      perUserLimit: coupon.perUserLimit.toString(),
      startDate: toLocalInputValue(coupon.startDate),
      expiryDate: toLocalInputValue(coupon.expiryDate),
      applicablePlans: coupon.applicablePlans,
      status: coupon.status,
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async () => {
    try {
      const method = editingCoupon ? 'PUT' : 'POST';
      const body = {
        ...couponForm,
        discountValue: parseFloat(couponForm.discountValue),
        maxUsage: couponForm.maxUsage ? parseInt(couponForm.maxUsage) : null,
        perUserLimit: parseInt(couponForm.perUserLimit),
        startDate: toUtcISOStringFromLocalInput(couponForm.startDate),
        expiryDate: toUtcISOStringFromLocalInput(couponForm.expiryDate),
        id: editingCoupon?.id,
      };

      const res = await fetch('/api/admin/coupons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsCouponModalOpen(false);
        fetchCoupons();
      }
    } catch (error) {
      console.error('Failed to save coupon:', error);
    }
  };

  const handleToggleCouponStatus = async (couponId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: couponId, status: newStatus }),
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Failed to toggle coupon status:', error);
    }
  };

  const handleSaveGlobalSettings = async () => {
    try {
      const res = await fetch('/api/admin/global-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plans: globalSettings,
        }),
      });
      if (res.ok) {
        alert('Global settings updated successfully!');
        fetchGlobalSettings();
        fetchPlanPricing();
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to save global settings:', error);
      alert('Error saving settings');
    }
  };

  const handleSavePlanPricing = async () => {
    try {
      const res = await fetch('/api/admin/plan-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plans: planPricing,
        }),
      });
      if (res.ok) {
        alert('Plan pricing updated successfully!');
        fetchPlanPricing();
      } else {
        alert('Failed to update pricing');
      }
    } catch (error) {
      console.error('Failed to save plan pricing:', error);
      alert('Error saving pricing');
    }
  };

  const ADMIN_NAV = [
    { key: 'users',         label: 'User Management',  icon: '👥' },
    { key: 'analytics',    label: 'Usage Analytics',   icon: '📊' },
    { key: 'login-logs',   label: 'Login Logs',        icon: '🔐' },
    { key: 'coupons',      label: 'Coupons',           icon: '🏷️' },
    { key: 'payments',     label: 'Payments',          icon: '💳' },
    { key: 'plan-settings',label: 'Plan Settings',     icon: '⚙️' },
    { key: 'plan-pricing', label: 'Plan Pricing',      icon: '💰' },
    { key: 'logs',         label: 'System Logs',       icon: '📋' },
    { key: 'latest-topics',label: 'Latest Topics',     icon: '📰' },
    { key: 'email-management', label: 'Email Management', icon: '✉️' },
    { key: 'notifications',    label: 'Notifications',    icon: '🔔' },
    { key: 'college-partners', label: 'College Partners', icon: '🏫' },
    { key: 'college-coupons', label: 'College Coupons', icon: '🎟️' },
    { key: 'portal-staff',    label: 'Portal Staff',    icon: '🏢' },
    { key: 'marketing',       label: 'Marketing',       icon: '📢' },
  ];

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen">
      {/* Left sidebar navigation */}
      <aside className="w-56 flex-shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/10 bg-slate-900/50">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Admin Panel</p>
        </div>
        <nav className="p-2 space-y-0.5 py-3">
          {ADMIN_NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeSection === item.key
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {ADMIN_NAV.find(n => n.key === activeSection)?.label}
          </h1>
          <Badge variant="destructive" className="mt-2">SUPER_ADMIN</Badge>
        </div>

        {activeSection === 'users' && (<>
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "SUPER_ADMIN" ? "destructive" : "default"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.plan}</TableCell>
                      <TableCell>{user.usageCount}/{user.usageLimit}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(user.id, user.role === "Admin" ? "User" : "Admin")}
                          >
                            Toggle Role
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditLimit(user.id, user.usageLimit)}
                          >
                            Edit Limit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/superadmin/users/${user.id}`)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserToggle(user.id, !user.disabled)}
                          >
                            {user.disabled ? "Enable" : "Disable"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>)}

        {activeSection === 'analytics' && (<>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeSessions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalSessions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resume Parses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.resumeParses || 0}</div>
              </CardContent>
            </Card>
          </div>
        </>)}

        {activeSection === 'login-logs' && (<>
          <Card>
            <CardHeader>
              <CardTitle>Login Logs</CardTitle>
              <CardDescription>User authentication activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Logout Time</TableHead>
                    <TableHead>Duration (sec)</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.user.name} ({log.user.email})</TableCell>
                      <TableCell>{new Date(log.loginTime).toLocaleString()}</TableCell>
                      <TableCell>{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : '-'}</TableCell>
                      <TableCell>{log.sessionDuration || '-'}</TableCell>
                      <TableCell>{log.deviceType || '-'}</TableCell>
                      <TableCell>{log.os || '-'}</TableCell>
                      <TableCell>{log.browser || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>)}

        {activeSection === 'coupons' && (<>
          <Card>
            <CardHeader>
              <CardTitle>Coupon Management</CardTitle>
              <CardDescription>Manage discount coupons</CardDescription>
              <div className="flex justify-end">
                <Button onClick={handleCreateCoupon}>
                  <span className="mr-2">+</span> Create Coupon
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Max Usage</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Loading coupons...
                      </TableCell>
                    </TableRow>
                  ) : couponsError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-destructive">
                        {couponsError}
                      </TableCell>
                    </TableRow>
                  ) : coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No coupons found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>{coupon.code}</TableCell>
                        <TableCell>{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</TableCell>
                        <TableCell>{coupon.maxUsage || 'Unlimited'}</TableCell>
                        <TableCell>{coupon.usages.length}</TableCell>
                        <TableCell>
                          <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                            {coupon.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditCoupon(coupon)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleToggleCouponStatus(coupon.id, coupon.status)}>
                              {coupon.status === 'active' ? 'Disable' : 'Enable'}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCoupon(coupon.id)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Coupon Usage View</CardTitle>
              <CardDescription>Detailed breakdown of coupon usage with pricing information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Original Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Final Paid</TableHead>
                    <TableHead>Coupon Code</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Loading coupon usage...
                      </TableCell>
                    </TableRow>
                  ) : couponsError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-destructive">
                        {couponsError}
                      </TableCell>
                    </TableRow>
                  ) : coupons.flatMap((coupon) => coupon.usages).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No coupon usage found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.flatMap((coupon) =>
                      coupon.usages.map((usage) => (
                        <TableRow key={`${coupon.id}-${usage.userId}`}>
                          <TableCell>{usage.user.email}</TableCell>
                          <TableCell>{usage.appliedPlan}</TableCell>
                          <TableCell>₹{usage.originalPrice}</TableCell>
                          <TableCell>₹{usage.discountAmount}</TableCell>
                          <TableCell>₹{usage.finalPrice}</TableCell>
                          <TableCell>{usage.couponCode}</TableCell>
                          <TableCell>{usage.appliedAt ? new Date(usage.appliedAt).toLocaleDateString('en-IN') : '-'}</TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
                <DialogDescription>
                  {editingCoupon ? 'Update coupon details' : 'Create a new discount coupon'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    placeholder="PIXORA50"
                  />
                </div>
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select value={couponForm.discountType} onValueChange={(value) => setCouponForm({ ...couponForm, discountType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FLAT">Flat Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="maxUsage">Max Total Usage</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={couponForm.maxUsage}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUsage: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="perUserLimit">Per User Limit</Label>
                  <Input
                    id="perUserLimit"
                    type="number"
                    value={couponForm.perUserLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, perUserLimit: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Valid From</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={couponForm.startDate}
                    onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="datetime-local"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Applicable Plans</Label>
                  <div className="flex gap-4">
                    {['Standard', 'Pro'].map((plan) => (
                      <div key={plan} className="flex items-center space-x-2">
                        <Checkbox
                          id={plan}
                          checked={couponForm.applicablePlans.includes(plan)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCouponForm({ ...couponForm, applicablePlans: [...couponForm.applicablePlans, plan] });
                            } else {
                              setCouponForm({ ...couponForm, applicablePlans: couponForm.applicablePlans.filter(p => p !== plan) });
                            }
                          }}
                        />
                        <Label htmlFor={plan}>{plan}</Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Coupons will not apply to the Free plan</p>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={couponForm.status} onValueChange={(value) => setCouponForm({ ...couponForm, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCouponModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCoupon}>
                    {editingCoupon ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>)}

        {activeSection === 'payments' && (<>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${paymentAnalytics?.revenue.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentAnalytics?.subscribers.active || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Coupon Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${paymentAnalytics?.couponLoss || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentAnalytics?.conversionRate || '0%'}</div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent payments and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Final Amount</TableHead>
                    <TableHead>Coupon</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentAnalytics?.paymentHistories.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.user.name} ({payment.user.email})</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>${payment.discountAmount}</TableCell>
                      <TableCell>${payment.finalAmount}</TableCell>
                      <TableCell>{payment.couponUsed || '-'}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>)}

        {activeSection === 'plan-settings' && (<>
          <Card>
            <CardHeader>
              <CardTitle>Global Plan Settings</CardTitle>
              <CardDescription>Configure monthly usage limits for all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {['Free', 'Standard', 'Pro'].map((planName) => {
                const plan = globalSettings[planName as keyof typeof globalSettings];
                return (
                  <div key={planName} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{planName} Plan</h3>
                      <Badge variant={plan?.status === 'active' ? 'default' : 'secondary'}>
                        {plan?.status || 'active'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Monthly Limit</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={plan?.isUnlimited ? '' : (plan?.monthlyLimit || '')}
                            onChange={(e) => setGlobalSettings({
                              ...globalSettings,
                              [planName]: {
                                ...plan,
                                monthlyLimit: e.target.value ? parseInt(e.target.value) : null,
                                isUnlimited: false
                              }
                            })}
                            placeholder="Enter limit"
                            disabled={plan?.isUnlimited}
                          />
                          <span className="text-sm text-muted-foreground">OR</span>
                          <Button
                            type="button"
                            variant={plan?.isUnlimited ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setGlobalSettings({
                              ...globalSettings,
                              [planName]: {
                                ...plan,
                                isUnlimited: !plan?.isUnlimited,
                                monthlyLimit: plan?.isUnlimited ? (planName === 'Free' ? 3 : planName === 'Pro' ? 100 : null) : null
                              }
                            })}
                          >
                            Unlimited
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={plan?.status || 'active'}
                          onValueChange={(value) => setGlobalSettings({
                            ...globalSettings,
                            [planName]: { ...plan, status: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Last Updated</Label>
                        <p className="text-sm text-muted-foreground">
                          {plan?.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Changes apply to all existing and new users immediately
                </div>
                <Button onClick={handleSaveGlobalSettings}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </>)}

        {activeSection === 'plan-pricing' && (<>
          <Card>
            <CardHeader>
              <CardTitle>Plan Pricing Management</CardTitle>
              <CardDescription>Control pricing for all subscription plans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {['Free', 'Standard', 'Pro'].map((planName) => {
                const plan = planPricing[planName as keyof typeof planPricing];
                return (
                  <div key={planName} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{planName} Plan</h3>
                      <Badge variant={plan?.status === 'active' ? 'default' : 'secondary'}>
                        {plan?.status || 'active'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input
                          value={plan?.name || planName}
                          onChange={(e) => setPlanPricing({
                            ...planPricing,
                            [planName]: { ...plan, name: e.target.value }
                          })}
                          placeholder="Display name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Monthly Price</Label>
                        <Input
                          type="number"
                          value={plan?.price || 0}
                          onChange={(e) => setPlanPricing({
                            ...planPricing,
                            [planName]: { ...plan, price: parseFloat(e.target.value) || 0 }
                          })}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select
                          value={plan?.currency || 'INR'}
                          onValueChange={(value) => setPlanPricing({
                            ...planPricing,
                            [planName]: { ...plan, currency: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={plan?.status || 'active'}
                          onValueChange={(value) => setPlanPricing({
                            ...planPricing,
                            [planName]: { ...plan, status: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Last updated: {plan?.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end">
                <Button onClick={handleSavePlanPricing}>
                  Save Pricing Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </>)}

        {activeSection === 'logs' && (<>
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent system activities and errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Logs will be displayed here...
              </div>
            </CardContent>
          </Card>
        </>)}

        {activeSection === 'latest-topics' && (<>
          <LatestTopicTab />
        </>)}

        {activeSection === 'email-management' && (<>
          <EmailManagement />
        </>)}
        {activeSection === 'notifications' && (<>
          <SuperAdminNotifications />
        </>)}

        {activeSection === 'college-partners' && (() => {
          // Lazy-load on first visit
          if (!collegesLoading && colleges.length === 0) fetchCollegePartners(collegeFiler);
          const statusColors: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
            APPROVED: 'bg-green-500/20 text-green-400 border border-green-500/40',
            REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/40',
            SUSPENDED: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
          };
          const filtered = colleges.filter(c => {
            if (collegeFiler !== 'ALL' && c.status !== collegeFiler) return false;
            if (collegeSearch) { const q = collegeSearch.toLowerCase(); return c.collegeName?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q); }
            return true;
          });
          const stats = { total: colleges.length, pending: colleges.filter(c => c.status === 'PENDING').length, approved: colleges.filter(c => c.status === 'APPROVED').length, suspended: colleges.filter(c => c.status === 'SUSPENDED').length };
          return (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[['Total', stats.total, 'text-indigo-400'], ['Pending', stats.pending, 'text-yellow-400'], ['Approved', stats.approved, 'text-green-400'], ['Suspended', stats.suspended, 'text-orange-400']].map(([l, v, c]: any) => (
                  <div key={l} className="rounded-xl border border-white/10 bg-slate-800/60 p-4">
                    <p className={`text-2xl font-bold ${c}`}>{v}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{l} Colleges</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <input value={collegeSearch} onChange={e => setCollegeSearch(e.target.value)} placeholder="Search college / email / domain…" className="flex-1 min-w-[200px] bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
                <div className="flex gap-1.5">
                  {['ALL','PENDING','APPROVED','REJECTED','SUSPENDED'].map(s => (
                    <button key={s} onClick={() => { setCollegeFiler(s); fetchCollegePartners(s); }} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${ collegeFiler === s ? 'bg-violet-600/30 text-violet-300 border-violet-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white' }`}>{s}</button>
                  ))}
                </div>
                <button onClick={() => fetchCollegePartners(collegeFiler)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs transition-all">↻ Refresh</button>
              </div>

              {/* Table */}
              {collegesLoading ? (
                <div className="flex justify-center py-16 text-slate-400">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">No colleges found.</div>
              ) : (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10 bg-slate-900/60">
                      <tr className="text-xs text-slate-400 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">College</th>
                        <th className="text-left px-4 py-3">Domain</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Seats</th>
                        <th className="text-left px-4 py-3">Plan</th>
                        <th className="text-left px-4 py-3">Registered</th>
                        <th className="text-right px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filtered.map((c: any) => (
                        <>
                          <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-white">{c.collegeName}</p>
                              <p className="text-xs text-slate-500">{c.email}</p>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.domain}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ statusColors[c.status] ?? 'bg-slate-700 text-slate-400' }`}>{c.status}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              <p className="text-sm">{c.usedSeats ?? 0}/{c.totalSeats ?? 0}</p>
                              <div className="w-16 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${c.totalSeats > 0 ? Math.min(100, (c.usedSeats / c.totalSeats) * 100) : 0}%` }} />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{c.allocatedPlan ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => fetchCollegeStudents(c.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:text-white text-xs border border-slate-600 transition-all">{expandedCollege === c.id ? '▲ Hide' : '👥 Students'}</button>
                                {c.status === 'PENDING' && <button onClick={() => { setApproveModal(c); setApproveSeats(200); setApprovePlan('Free'); }} className="px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 text-xs transition-all">✓ Approve</button>}
                                {c.status === 'PENDING' && <button onClick={() => { setRejectModal(c); setRejectReason(''); }} className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-xs transition-all">✕ Reject</button>}
                                {c.status === 'APPROVED' && <button onClick={() => { setEditPlanModal(c); setEditPlanSeats(c.totalSeats ?? 200); setEditPlanValue(c.allocatedPlan ?? 'Free'); setEditPlanSuccess(false); }} className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 text-xs transition-all">✏ Edit Plan</button>}
                                {c.status === 'APPROVED' && <button onClick={() => doCollegeAction(c.id, 'suspend')} disabled={!!collegeActionLoading} className="px-2.5 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 text-xs transition-all disabled:opacity-50">⏸ Suspend</button>}
                                {(c.status === 'SUSPENDED' || c.status === 'REJECTED') && <button onClick={() => doCollegeAction(c.id, 'reactivate')} disabled={!!collegeActionLoading} className="px-2.5 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 text-xs transition-all disabled:opacity-50">↺ Reactivate</button>}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Students Row */}
                          {expandedCollege === c.id && (
                            <tr key={`students-${c.id}`}>
                              <td colSpan={7} className="bg-slate-900/60 border-t border-white/5 px-6 py-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Students — {c.collegeName}</p>
                                {collegeStudentsLoading === c.id ? (
                                  <p className="text-slate-500 text-sm">Loading students…</p>
                                ) : !collegeStudents[c.id] || collegeStudents[c.id].length === 0 ? (
                                  <p className="text-slate-500 text-sm">No students enrolled yet.</p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-slate-500 border-b border-white/5">
                                          <th className="text-left py-2 pr-4">Name</th>
                                          <th className="text-left py-2 pr-4">Email</th>
                                          <th className="text-left py-2 pr-4">Dept</th>
                                          <th className="text-left py-2 pr-4">Year</th>
                                          <th className="text-left py-2 pr-4">Plan</th>
                                          <th className="text-left py-2 pr-4">Status</th>
                                          <th className="text-left py-2 pr-4">Onboarded</th>
                                          <th className="text-left py-2">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                        {collegeStudents[c.id].map((s: any) => (
                                          <tr key={s.id} className="hover:bg-white/[0.02]">
                                            <td className="py-2 pr-4 text-slate-200">{s.studentName}</td>
                                            <td className="py-2 pr-4 text-slate-400">{s.email}</td>
                                            <td className="py-2 pr-4 text-slate-400">{s.department ?? '—'}</td>
                                            <td className="py-2 pr-4 text-slate-400">{s.year ?? '—'}</td>
                                            <td className="py-2 pr-4">
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ s.customPlan === 'Pro' ? 'bg-purple-500/20 text-purple-300' : s.customPlan === 'Standard' ? 'bg-indigo-500/20 text-indigo-300' : s.customPlan === 'Enterprise' ? 'bg-amber-500/20 text-amber-300' : s.user?.plan === 'Pro' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-400' }`}>{s.customPlan ?? s.user?.plan ?? 'Free'}</span>
                                            </td>
                                            <td className="py-2 pr-4">
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ s.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : s.status === 'SUSPENDED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400' }`}>{s.status}</span>
                                            </td>
                                            <td className="py-2 pr-4 text-slate-400">{s.onboardedAt ? new Date(s.onboardedAt).toLocaleDateString('en-IN') : <span className="text-yellow-500/70 text-[10px]">Invite Pending</span>}</td>
                                            <td className="py-2">
                                              <button onClick={() => setSelectedStudent({ ...s, collegeName: c.collegeName })} className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 text-[10px] font-medium transition-all">View Details</button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Approve Modal */}
              {approveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-1">Approve College Partner</h3>
                    <p className="text-sm text-slate-400 mb-5">{approveModal.collegeName} — <span className="font-mono text-xs">{approveModal.domain}</span></p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Total Seats</label>
                        <input type="number" min="1" value={approveSeats} onChange={e => setApproveSeats(+e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Allocated Plan</label>
                        <select value={approvePlan} onChange={e => setApprovePlan(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500">
                          <option value="Free">Free</option>
                          <option value="Standard">Standard — Rs.150/student/month</option>
                          <option value="Pro">Pro — Rs.20/student/month</option>
                          <option value="Enterprise">Enterprise (Custom)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setApproveModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-all">Cancel</button>
                      <button disabled={!!collegeActionLoading} onClick={() => doCollegeAction(approveModal.id, 'approve', { totalSeats: approveSeats, allocatedPlan: approvePlan })} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all disabled:opacity-50">{collegeActionLoading ? 'Approving...' : '✓ Confirm Approval'}</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Plan Modal — for already APPROVED colleges */}
              {editPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-1">Edit Plan &amp; Seats</h3>
                    <p className="text-sm text-slate-400 mb-5">{editPlanModal.collegeName} — <span className="font-mono text-xs">{editPlanModal.domain}</span></p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Total Seats</label>
                        <input type="number" min="1" value={editPlanSeats} onChange={e => setEditPlanSeats(+e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Allocated Plan</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[['Free', 'Rs.0'], ['Standard', 'Rs.150/student'], ['Pro', 'Rs.20/student'], ['Enterprise', 'Custom']].map(([p, price]) => (
                            <button key={p} onClick={() => setEditPlanValue(p)}
                              className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-sm transition-all ${editPlanValue === p ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'}`}>
                              <span className="font-semibold">{p}</span>
                              <span className="text-xs text-slate-500">{price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {editPlanSuccess && <p className="mt-3 text-green-400 text-sm text-center">✓ Plan updated successfully!</p>}
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setEditPlanModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-all">Close</button>
                      <button disabled={!!collegeActionLoading} onClick={async () => {
                        await doCollegeAction(editPlanModal.id, 'update', { totalSeats: editPlanSeats, allocatedPlan: editPlanValue });
                        setEditPlanSuccess(true);
                        setTimeout(() => setEditPlanModal(null), 1500);
                      }} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all disabled:opacity-50">{collegeActionLoading ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reject Modal */}
              {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                    <h3 className="text-lg font-semibold text-white mb-1">Reject Application</h3>
                    <p className="text-sm text-slate-400 mb-5">{rejectModal.collegeName} — <span className="font-mono text-xs">{rejectModal.email}</span></p>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Reason (shown to college admin)</label>
                      <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Optional reason…" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 resize-none" />
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-all">Cancel</button>
                      <button disabled={!!collegeActionLoading} onClick={() => doCollegeAction(rejectModal.id, 'reject', { reason: rejectReason })} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all disabled:opacity-50">{collegeActionLoading ? 'Rejecting…' : '✕ Confirm Rejection'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeSection === 'college-coupons' && (() => {
          if (!collegeCouponsLoading && collegeCoupons.length === 0 && !collegeCouponsError) fetchCollegeCoupons();
          const openCreate = () => {
            setEditingCollegeCoupon(null);
            setCollegeCouponForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', maxUsage: '', expiryDate: '', applicablePlans: [], minSeats: '', status: 'active' });
            setIsCollegeCouponModalOpen(true);
          };
          const openEdit = (c: CollegeCoupon) => {
            setEditingCollegeCoupon(c);
            setCollegeCouponForm({
              code: c.code, discountType: c.discountType,
              discountValue: String(c.discountValue),
              maxUsage: c.maxUsage != null ? String(c.maxUsage) : '',
              expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : '',
              applicablePlans: c.applicablePlans ?? [],
              minSeats: c.minSeats != null ? String(c.minSeats) : '',
              status: c.status,
            });
            setIsCollegeCouponModalOpen(true);
          };
          const togglePlan = (plan: string) => setCollegeCouponForm(f => ({
            ...f, applicablePlans: f.applicablePlans.includes(plan)
              ? f.applicablePlans.filter(p => p !== plan)
              : [...f.applicablePlans, plan],
          }));
          return (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Manage discount coupons for College Admin portal payments</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 text-sm font-medium transition-all">
                  + Create Coupon
                </button>
              </div>

              {collegeCouponsError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{collegeCouponsError}</div>}

              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10 bg-slate-900/60">
                    <tr className="text-xs text-slate-400 uppercase tracking-wide">
                      {['Code', 'Discount', 'Plans', 'Min Seats', 'Max Usage', 'Used', 'Expiry', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {collegeCouponsLoading ? (
                      <tr><td colSpan={9} className="text-center text-slate-500 py-8">Loading…</td></tr>
                    ) : collegeCoupons.length === 0 ? (
                      <tr><td colSpan={9} className="text-center text-slate-500 py-8">No college coupons yet. Create one above.</td></tr>
                    ) : collegeCoupons.map(c => (
                      <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white">{c.code}</td>
                        <td className="px-4 py-3 text-indigo-300 font-semibold">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {c.applicablePlans.length === 0 ? <span className="text-slate-600">All</span> : c.applicablePlans.join(', ')}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{c.minSeats ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{c.maxUsage ?? 'Unlimited'}</td>
                        <td className="px-4 py-3 text-slate-300 font-medium">{c.usedCount}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => openEdit(c)} className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-700/60 text-slate-300 border border-slate-600 hover:text-white transition-all">Edit</button>
                            <button onClick={() => handleToggleCollegeCoupon(c.id, c.status)} className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${c.status === 'active' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20' : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'}`}>
                              {c.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => handleDeleteCollegeCoupon(c.id)} className="px-2.5 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Create / Edit Modal */}
              {isCollegeCouponModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-4">{editingCollegeCoupon ? 'Edit' : 'Create'} College Coupon</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Coupon Code *</label>
                        <input value={collegeCouponForm.code} onChange={e => setCollegeCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                          placeholder="e.g. COLLEGE20" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white uppercase font-mono focus:outline-none focus:border-violet-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Discount Type *</label>
                          <select value={collegeCouponForm.discountType} onChange={e => setCollegeCouponForm(f => ({ ...f, discountType: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500">
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FLAT">Flat (₹)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Discount Value *</label>
                          <input type="number" min="0" value={collegeCouponForm.discountValue} onChange={e => setCollegeCouponForm(f => ({ ...f, discountValue: e.target.value }))}
                            placeholder={collegeCouponForm.discountType === 'PERCENTAGE' ? '20' : '500'}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Max Total Usage</label>
                          <input type="number" min="0" value={collegeCouponForm.maxUsage} onChange={e => setCollegeCouponForm(f => ({ ...f, maxUsage: e.target.value }))}
                            placeholder="Unlimited" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Min Seats Required</label>
                          <input type="number" min="0" value={collegeCouponForm.minSeats} onChange={e => setCollegeCouponForm(f => ({ ...f, minSeats: e.target.value }))}
                            placeholder="None" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Expiry Date</label>
                        <input type="date" value={collegeCouponForm.expiryDate} onChange={e => setCollegeCouponForm(f => ({ ...f, expiryDate: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-2">Applicable Plans <span className="text-slate-600">(empty = all plans)</span></label>
                        <div className="flex gap-2 flex-wrap">
                          {['Standard', 'Pro', 'Enterprise'].map(plan => (
                            <button key={plan} type="button" onClick={() => togglePlan(plan)}
                              className={`px-3 py-1.5 rounded-lg text-xs border font-medium transition-all ${collegeCouponForm.applicablePlans.includes(plan) ? 'bg-violet-600/30 text-violet-300 border-violet-500/50' : 'bg-slate-800 text-slate-400 border-slate-600'}`}>
                              {plan}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Status</label>
                        <select value={collegeCouponForm.status} onChange={e => setCollegeCouponForm(f => ({ ...f, status: e.target.value }))}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500">
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setIsCollegeCouponModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-all">Cancel</button>
                      <button onClick={handleSaveCollegeCoupon} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all">
                        {editingCollegeCoupon ? 'Save Changes' : 'Create Coupon'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeSection === 'portal-staff' && (
          <div className="space-y-6">
            {/* Header + Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Portal Staff</h2>
                <p className="text-sm text-slate-400">{portalStaffTotal} staff member{portalStaffTotal !== 1 ? 's' : ''} total</p>
              </div>
              <button
                onClick={() => { setEditingPortalStaff(null); setPortalStaffForm({ name: '', email: '', password: '', role: 'HR', department: '', phone: '' }); setPortalStaffError(null); setShowCreatePortalStaff(true); }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all"
              >
                + Add Staff
              </button>
            </div>

            {/* Staff Table */}
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-900/40">
              {portalStaffLoading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
              ) : portalStaff.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No portal staff found. Create the first admin or HR user.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700/50 bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Logins</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {portalStaff.map(s => (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-slate-300">{s.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            s.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>{s.role === 'ADMIN' ? 'Admin' : 'HR'}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{s.department || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            s.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' :
                            s.status === 'SUSPENDED' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                          }`}>{s.status}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date(s.lastLoginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}</td>
                        <td className="px-4 py-3 text-slate-300">{s.loginAttempts}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => { setEditingPortalStaff(s); setPortalStaffForm({ name: s.name, email: s.email, password: '', role: s.role, department: s.department || '', phone: s.phone || '' }); setPortalStaffError(null); setShowCreatePortalStaff(true); }}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-violet-500/20 text-slate-300 hover:text-violet-300 text-xs transition-all border border-white/10"
                            >Edit</button>
                            <button
                              onClick={() => { setPortalStaffResetId(s.id); setPortalStaffResetPw(''); }}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs transition-all border border-white/10"
                            >Reset PW</button>
                            <button
                              onClick={async () => {
                                const newStatus = s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                                await fetch(`/api/superadmin/portal-staff/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
                                fetchPortalStaff();
                              }}
                              className={`px-2 py-1 rounded-lg text-xs transition-all border border-white/10 ${
                                s.status === 'ACTIVE' ? 'bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300' : 'bg-white/5 hover:bg-green-500/20 text-slate-300 hover:text-green-300'
                              }`}
                            >{s.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button>
                            <button
                              onClick={() => setConfirmDeletePortalStaff(s)}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs transition-all border border-white/10"
                            >Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Create / Edit Modal */}
            {showCreatePortalStaff && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreatePortalStaff(false)}>
                <div className="w-full max-w-lg bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white mb-5">{editingPortalStaff ? 'Edit Portal Staff' : 'Add Portal Staff'}</h3>
                  {portalStaffError && <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{portalStaffError}</div>}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Full Name *</label>
                        <input value={portalStaffForm.name} onChange={e => setPortalStaffForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma"
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Email *</label>
                        <input value={portalStaffForm.email} onChange={e => setPortalStaffForm(f => ({ ...f, email: e.target.value }))} placeholder="rahul@company.com" type="email"
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
                      </div>
                    </div>
                    {!editingPortalStaff && (
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Password *</label>
                        <input value={portalStaffForm.password} onChange={e => setPortalStaffForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" type="password"
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Role *</label>
                        <select value={portalStaffForm.role} onChange={e => setPortalStaffForm(f => ({ ...f, role: e.target.value as any }))}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500">
                          <option value="HR">HR</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Department</label>
                        <input value={portalStaffForm.department} onChange={e => setPortalStaffForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Engineering"
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Phone</label>
                      <input value={portalStaffForm.phone} onChange={e => setPortalStaffForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. +91 98765 43210" type="tel"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowCreatePortalStaff(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-white text-sm transition-all">Cancel</button>
                    <button onClick={handleSavePortalStaff} disabled={savingPortalStaff} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm transition-all">
                      {savingPortalStaff ? 'Saving...' : editingPortalStaff ? 'Save Changes' : 'Create Staff'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reset Password Modal */}
            {portalStaffResetId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setPortalStaffResetId(null)}>
                <div className="w-full max-w-sm bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-base font-bold text-white mb-4">Reset Password</h3>
                  <div className="mb-4">
                    <label className="text-xs text-slate-400 block mb-1">New Password</label>
                    <input value={portalStaffResetPw} onChange={e => setPortalStaffResetPw(e.target.value)} placeholder="Min. 8 characters" type="password"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setPortalStaffResetId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm">Cancel</button>
                    <button onClick={handleResetPortalPassword} disabled={portalStaffResetLoading || !portalStaffResetPw} className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-sm">
                      {portalStaffResetLoading ? 'Saving...' : 'Reset'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation */}
            {confirmDeletePortalStaff && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDeletePortalStaff(null)}>
                <div className="w-full max-w-sm bg-[#0f172a] border border-red-500/30 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-base font-bold text-white mb-2">Delete Staff Member?</h3>
                  <p className="text-sm text-slate-400 mb-5">Are you sure you want to permanently delete <span className="text-white font-medium">{confirmDeletePortalStaff.name}</span>? This cannot be undone.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmDeletePortalStaff(null)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm">Cancel</button>
                    <button onClick={() => handleDeletePortalStaff(confirmDeletePortalStaff.id)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marketing Section */}
        {activeSection === 'marketing' && (
          <MarketingDashboard />
        )}

      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <div>
                <h2 className="text-white font-bold text-lg">{selectedStudent.studentName}</h2>
                <p className="text-slate-400 text-sm">{selectedStudent.email}</p>
                {selectedStudent.collegeName && <p className="text-indigo-400 text-xs mt-0.5">{selectedStudent.collegeName}</p>}
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Academic Info */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Academic Details</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Roll Number", value: selectedStudent.rollNumber ?? "—" },
                    { label: "Department", value: selectedStudent.department ?? "—" },
                    { label: "Year", value: selectedStudent.year ? `Year ${selectedStudent.year}` : "—" },
                    { label: "College Status", value: selectedStudent.status },
                    { label: "Invite Sent", value: selectedStudent.inviteSentAt ? new Date(selectedStudent.inviteSentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                    { label: "Onboarded", value: selectedStudent.onboardedAt ? new Date(selectedStudent.onboardedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Pending" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                      <p className="text-slate-200 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan Info */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Plan & Access</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Allocated Plan", value: selectedStudent.customPlan ?? selectedStudent.user?.plan ?? "Free", highlight: true },
                    { label: "Platform Plan", value: selectedStudent.user?.plan ?? "Free" },
                    { label: "Plan Valid Till", value: selectedStudent.customPlanExpiresAt ? new Date(selectedStudent.customPlanExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : selectedStudent.user?.renewalDate ? new Date(selectedStudent.user.renewalDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className={`rounded-xl p-3 border ${highlight ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-800/50 border-slate-700/40"}`}>
                      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                      <p className={`text-sm font-bold ${highlight ? "text-indigo-300" : "text-slate-200"}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Stats (from users table) */}
              {selectedStudent.user && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Usage Stats</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Total Sessions", value: selectedStudent.user.usageCount ?? 0, max: selectedStudent.user.usageLimit },
                      { label: "HR Interview", value: selectedStudent.user.hrUsage ?? 0 },
                      { label: "GD Practice", value: selectedStudent.user.gdUsage ?? 0 },
                      { label: "Technical", value: selectedStudent.user.technicalUsage ?? 0 },
                      { label: "Company Tracks", value: selectedStudent.user.companyUsage ?? 0 },
                      { label: "English", value: selectedStudent.user.englishUsage ?? 0 },
                    ].map(({ label, value, max }) => (
                      <div key={label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/40 text-center">
                        <p className="text-white font-bold text-lg">{value}{max !== undefined ? <span className="text-slate-500 text-xs font-normal">/{max}</span> : ""}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  {selectedStudent.user.disabled && (
                    <p className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">⚠ Account is disabled on the platform</p>
                  )}
                </div>
              )}

              {!selectedStudent.user && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-400 text-sm">
                  No platform account found. Student has not signed up yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}