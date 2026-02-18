"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Role } from "@prisma/client";
import LatestTopicTab from "@/components/LatestTopicTab";

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

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <Badge variant="destructive" className="mt-2">SUPER_ADMIN</Badge>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
          <TabsTrigger value="login-logs">Login Logs</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="plan-settings">Plan Settings</TabsTrigger>
          <TabsTrigger value="plan-pricing">Plan Pricing</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="latest-topics">LatestTopic</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
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
        </TabsContent>

        <TabsContent value="analytics">
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
        </TabsContent>

        <TabsContent value="login-logs">
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
        </TabsContent>

        <TabsContent value="coupons">
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
                        <TableCell>{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}</TableCell>
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
                      <SelectItem value="FLAT">Flat Amount ($)</SelectItem>
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
        </TabsContent>

        <TabsContent value="payments">
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
        </TabsContent>

        <TabsContent value="plan-settings">
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
        </TabsContent>

        <TabsContent value="plan-pricing">
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
        </TabsContent>

        <TabsContent value="logs">
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
        </TabsContent>

        <TabsContent value="latest-topics">
          <LatestTopicTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}