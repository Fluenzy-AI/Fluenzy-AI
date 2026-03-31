"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Briefcase,
  Calendar,
  MessageSquare,
  AlertCircle,
  Trash2,
  ChevronRight,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bgColor: string }> = {
  APPLICATION_UPDATE: { icon: Briefcase, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  INTERVIEW_SCHEDULED: { icon: Calendar, color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
  MESSAGE: { icon: MessageSquare, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  ALERT: { icon: AlertCircle, color: "text-amber-400", bgColor: "bg-amber-500/10" },
  DEFAULT: { icon: Bell, color: "text-violet-400", bgColor: "bg-violet-500/10" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/candidates/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/candidates/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/candidates/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/candidates/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-8 sm:h-10 bg-white/5 rounded-xl w-36 sm:w-48" />
        <div className="h-72 sm:h-96 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-violet-400 hover:bg-violet-500/10 active:bg-violet-500/20 transition-colors w-full sm:w-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No notifications</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              When there are updates on your applications, you'll see them here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notification, index) => {
              const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.DEFAULT;
              const Icon = config.icon;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`p-3 sm:p-4 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors ${
                    !notification.read ? "bg-violet-500/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${notification.read ? "text-slate-300" : "text-white"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 sm:mt-3">
                        <span className="text-[10px] sm:text-xs text-slate-600">
                          {new Date(notification.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {notification.linkUrl && (
                          <Link
                            href={notification.linkUrl}
                            className="text-[10px] sm:text-xs text-violet-400 hover:text-violet-300 active:text-violet-500 transition-colors flex items-center gap-1"
                          >
                            View
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-[10px] sm:text-xs text-slate-500 hover:text-white active:text-slate-300 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-[10px] sm:text-xs text-slate-600 hover:text-red-400 active:text-red-500 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
