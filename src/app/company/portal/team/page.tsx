"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

const roleColors: Record<string, { bg: string; text: string; icon: any }> = {
  ADMIN: { bg: "bg-purple-500/10", text: "text-purple-400", icon: Crown },
  HR_RECRUITER: { bg: "bg-blue-500/10", text: "text-blue-400", icon: Users },
  HIRING_MANAGER: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: Shield },
};

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  ACTIVE: { bg: "bg-emerald-500/10", text: "text-emerald-400", icon: CheckCircle2 },
  PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", icon: Clock },
  SUSPENDED: { bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
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

  useEffect(() => {
    fetchTeamMembers();
  }, []);

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
        fetchTeamMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send invite");
      }
    } catch (error) {
      console.error("Failed to send invite:", error);
      alert("Failed to send invite");
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Team</h1>
          <p className="text-slate-400 mt-1">Manage your company team members</p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Members</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Members</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Admins</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Recruiters</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.recruiters}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search members by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Members List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No team members found</h3>
          <p className="text-slate-400 mb-4">
            {searchQuery ? "Try adjusting your search" : "Invite team members to collaborate"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member, index) => {
            const RoleIcon = roleColors[member.role]?.icon || Users;
            const StatusIcon = statusColors[member.status]?.icon || Clock;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{member.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full ${roleColors[member.role]?.bg} ${roleColors[member.role]?.text} text-xs font-medium flex items-center gap-1`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {member.role.replace("_", " ")}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full ${statusColors[member.status]?.bg} ${statusColors[member.status]?.text} text-xs font-medium flex items-center gap-1`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {member.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      {member.status === "ACTIVE" ? (
                        <DropdownMenuItem
                          onClick={() => updateMemberStatus(member.id, "SUSPENDED")}
                          className="text-amber-400 hover:text-amber-300"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Suspend Member
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => updateMemberStatus(member.id, "ACTIVE")}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Activate Member
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Invite Team Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="HR_RECRUITER">HR Recruiter</option>
                  <option value="HIRING_MANAGER">Hiring Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                className="flex-1 border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={sendInvite}
                disabled={isInviting || !inviteEmail}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isInviting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
