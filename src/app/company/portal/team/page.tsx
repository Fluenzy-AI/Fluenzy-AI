"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PortalLayout, DataTable, StatCard, EmptyState, PortalStatusBadge } from "@/components/portal";
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

const roleColors: Record<string, { icon: any; color: string }> = {
  ADMIN: { icon: Crown, color: "var(--portal-primary)" },
  HR_RECRUITER: { icon: Users, color: "var(--portal-info)" },
  HIRING_MANAGER: { icon: Shield, color: "var(--portal-success)" },
};

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("HR_RECRUITER");
  const [isInviting, setIsInviting] = useState(false);
  const [companyDomain, setCompanyDomain] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    fetchTeamMembers();
    fetchCompanyDomain();
  }, []);

  const fetchCompanyDomain = async () => {
    try {
      const res = await fetch("/api/company/settings");
      if (res.ok) {
        const data = await res.json();
        setCompanyDomain(data.settings?.domain || null);
      }
    } catch (error) {
      console.error("Failed to fetch company domain:", error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/company/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvite = async () => {
    setInviteError("");

    if (companyDomain) {
      const inviteDomain = inviteEmail.split("@")[1]?.toLowerCase();
      if (inviteDomain !== companyDomain.toLowerCase()) {
        setInviteError(`Email must be from @${companyDomain}`);
        return;
      }
    }

    const personalDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com", "protonmail.com"];
    const emailDomain = inviteEmail.split("@")[1]?.toLowerCase();
    if (personalDomains.includes(emailDomain)) {
      setInviteError("Please use a work email address");
      return;
    }

    try {
      setIsInviting(true);
      const res = await fetch("/api/company/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (res.ok) {
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteRole("HR_RECRUITER");
        setInviteError("");
        fetchTeamMembers();
      } else {
        const data = await res.json();
        setInviteError(data.error || "Failed to send invite");
      }
    } catch (error) {
      console.error("Failed to send invite:", error);
      setInviteError("Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const updateMemberStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/company/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchTeamMembers();
      }
    } catch (error) {
      console.error("Failed to update member:", error);
    }
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "ACTIVE").length,
    admins: members.filter((m) => m.role === "ADMIN").length,
    recruiters: members.filter((m) => m.role === "HR_RECRUITER").length,
  };

  const columns = useMemo<ColumnDef<TeamMember, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Member",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--portal-primary-muted)] text-[var(--portal-primary)] flex items-center justify-center font-bold text-sm">
              {row.original.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--portal-text-primary)" }}>{row.original.name}</p>
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--portal-text-muted)" }}>
                <Mail className="w-3 h-3" /> {row.original.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role / Permission",
        cell: ({ row }) => {
          const role = row.original.role;
          const conf = roleColors[role] || { icon: Users, color: "var(--portal-text-secondary)" };
          const RoleIcon = conf.icon;
          return (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, ${conf.color} 10%, transparent)`,
                color: conf.color,
              }}
            >
              <RoleIcon className="w-3 h-3" />
              {role.replace(/_/g, " ")}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <PortalStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "joinedAt",
        header: "Joined Date",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--portal-text-secondary)" }}>
            Joined {new Date(row.original.joinedAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const member = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[var(--portal-sidebar-hover)]">
                  <MoreVertical className="w-4 h-4 text-[var(--portal-text-muted)]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[var(--portal-bg-elevated)] border-[var(--portal-border)]">
                {member.status === "ACTIVE" ? (
                  <DropdownMenuItem
                    onClick={() => updateMemberStatus(member.id, "SUSPENDED")}
                    className="text-[var(--portal-danger)] focus:text-[var(--portal-danger)]"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Suspend Member
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => updateMemberStatus(member.id, "ACTIVE")}
                    className="text-[var(--portal-success)] focus:text-[var(--portal-success)]"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate Member
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [members]
  );

  return (
    <PortalLayout title="Team Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--portal-text-primary)" }}>Team Members</h1>
            <p className="text-sm" style={{ color: "var(--portal-text-muted)" }}>Manage your company team members and permissions</p>
          </div>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="transition-colors font-semibold"
            style={{
              backgroundColor: "var(--portal-primary)",
              color: "var(--portal-primary-text)",
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Members" value={stats.total} variant="compact" loading={isLoading} icon={<Users className="w-5 h-5" />} />
          <StatCard label="Active" value={stats.active} variant="compact" loading={isLoading} icon={<UserCheck className="w-5 h-5" />} />
          <StatCard label="Admins" value={stats.admins} variant="compact" loading={isLoading} icon={<Crown className="w-5 h-5" />} />
          <StatCard label="Recruiters" value={stats.recruiters} variant="compact" loading={isLoading} icon={<Shield className="w-5 h-5" />} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--portal-text-muted)" }} />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md text-sm outline-none transition-colors"
            style={{
              backgroundColor: "var(--portal-bg-elevated)",
              border: "1px solid var(--portal-border)",
              color: "var(--portal-text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--portal-primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--portal-border)";
            }}
          />
        </div>

        {/* Members List */}
        <DataTable
          data={filteredMembers}
          columns={columns}
          loading={isLoading}
          emptyState={
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No team members found"
              description={searchQuery ? "Try adjusting your search query." : "Invite team members to collaborate."}
              action={
                !searchQuery
                  ? { label: "Invite Member", onClick: () => setShowInviteModal(true) }
                  : undefined
              }
            />
          }
        />

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border rounded-xl p-6 max-w-md w-full shadow-[var(--portal-shadow-modal)]"
              style={{
                backgroundColor: "var(--portal-bg-elevated)",
                borderColor: "var(--portal-border)",
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--portal-text-primary)" }}>Invite Team Member</h2>

              {inviteError && (
                <div className="mb-4 p-3 border rounded-lg text-sm" style={{
                  backgroundColor: "var(--portal-danger-muted)",
                  borderColor: "var(--portal-danger)",
                  color: "var(--portal-danger)",
                }}>
                  {inviteError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
                    Work Email Address <span className="text-[var(--portal-danger)]">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteError("");
                    }}
                    placeholder={companyDomain ? `colleague@${companyDomain}` : "colleague@company.com"}
                    className="w-full px-4 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--portal-bg-base)",
                      border: "1px solid var(--portal-border)",
                      color: "var(--portal-text-primary)",
                    }}
                  />
                  {companyDomain && (
                    <p className="text-xs mt-1" style={{ color: "var(--portal-text-muted)" }}>
                      Invite email must be from @{companyDomain}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--portal-text-secondary)" }}>
                    Role <span className="text-[var(--portal-danger)]">*</span>
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "var(--portal-bg-base)",
                      border: "1px solid var(--portal-border)",
                      color: "var(--portal-text-primary)",
                    }}
                  >
                    <option value="HR_RECRUITER">HR Recruiter</option>
                    <option value="HIRING_MANAGER">Hiring Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--portal-text-muted)" }}>
                    {inviteRole === "ADMIN" && "Full access to all company settings and team management"}
                    {inviteRole === "HR_RECRUITER" && "Can manage job postings and applications"}
                    {inviteRole === "HIRING_MANAGER" && "Can review applications and schedule interviews"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteError("");
                  }}
                  className="flex-1 border-[var(--portal-border)] hover:bg-[var(--portal-sidebar-hover)]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendInvite}
                  disabled={isInviting || !inviteEmail}
                  className="flex-1 text-white font-semibold"
                  style={{
                    backgroundColor: "var(--portal-primary)",
                  }}
                >
                  {isInviting ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
