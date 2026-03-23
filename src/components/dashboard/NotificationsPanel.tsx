"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Briefcase,
  Star,
  Calendar,
  User,
  Lightbulb,
  Inbox,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  message: string;
  type: "JOB_MATCH" | "STATUS_UPDATE" | "INTERVIEW" | "PROFILE_TIP" | "GENERAL";
  read: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

// Icon map for notification types
const TYPE_ICONS: Record<Notification["type"], React.ReactNode> = {
  JOB_MATCH: <Briefcase className="w-4 h-4" />,
  STATUS_UPDATE: <Star className="w-4 h-4" />,
  INTERVIEW: <Calendar className="w-4 h-4" />,
  PROFILE_TIP: <Lightbulb className="w-4 h-4" />,
  GENERAL: <Bell className="w-4 h-4" />,
};

const TYPE_COLORS: Record<Notification["type"], string> = {
  JOB_MATCH: "bg-[#22C55E]/10 text-[#22C55E]",
  STATUS_UPDATE: "bg-[#3B82F6]/10 text-[#3B82F6]",
  INTERVIEW: "bg-[#7C5CFC]/10 text-[#9F7FFF]",
  PROFILE_TIP: "bg-[#F59E0B]/10 text-[#F59E0B]",
  GENERAL: "bg-white/[0.06] text-[#8B8A99]",
};

// Notification item component
function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative px-4 py-3 border-b border-white/[0.04] last:border-0",
        "transition-colors duration-150",
        !notification.read && "bg-[#7C5CFC]/[0.03]"
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            TYPE_COLORS[notification.type]
          )}
        >
          {TYPE_ICONS[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-snug",
              notification.read ? "text-[#8B8A99]" : "text-[#F1F0F5]"
            )}
          >
            {notification.message}
          </p>
          <p className="text-[10px] text-[#52515E] mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Mark read button */}
        <AnimatePresence>
          {!notification.read && isHovered && onMarkRead && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onMarkRead(notification.id)}
              className="absolute right-3 top-3 p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-[#8B8A99] hover:text-[#F1F0F5] transition-colors"
              aria-label="Mark as read"
            >
              <Check className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Unread indicator */}
        {!notification.read && (
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#7C5CFC]" />
        )}
      </div>
    </motion.div>
  );
}

// Empty state
function EmptyNotifications() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="w-14 h-14 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-4">
        <Inbox className="w-6 h-6 text-[#22C55E]" />
      </div>
      <h3 className="text-sm font-semibold text-[#F1F0F5] mb-1">
        You're all caught up!
      </h3>
      <p className="text-xs text-[#8B8A99] text-center max-w-[200px]">
        No new notifications. We'll let you know when something happens.
      </p>
    </motion.div>
  );
}

export function NotificationsPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
  isOpen,
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-50",
              "bg-[#13161E] border-l border-white/[0.06]",
              "shadow-[0_24px_64px_rgba(0,0,0,0.6)]",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-[#F1F0F5]">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#7C5CFC]/10 text-[#9F7FFF] text-[10px] font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && onMarkAllRead && (
                  <button
                    onClick={onMarkAllRead}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#7C5CFC] hover:bg-[#7C5CFC]/10 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.06] transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyNotifications />
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={onMarkRead}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Bell button component with shake animation
interface NotificationBellProps {
  count: number;
  onClick: () => void;
  hasNew?: boolean;
}

export function NotificationBell({ count, onClick, hasNew = false }: NotificationBellProps) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (hasNew) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasNew]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-xl text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.06] transition-colors",
        shake && "animate-shake"
      )}
      aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ""}`}
    >
      <Bell className="w-5 h-5" />

      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#EF4444] text-white text-[10px] font-bold"
        >
          {count > 9 ? "9+" : count}
        </motion.span>
      )}
    </button>
  );
}
