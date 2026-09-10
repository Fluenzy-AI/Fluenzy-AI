'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Info, Megaphone, AlertTriangle, CheckCircle2,
  Shield, Building2, X, ChevronRight,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import MobileNavShell from '@/components/MobileNavShell';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  sentByRole: string;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  info: <Info size={18} className="text-blue-400   flex-shrink-0" />,
  announcement: <Megaphone size={18} className="text-violet-400 flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-400  flex-shrink-0" />,
  success: <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />,
};

const TYPE_BG: Record<string, string> = {
  info: 'border-blue-500/25   bg-blue-500/10',
  announcement: 'border-violet-500/25 bg-violet-500/10',
  warning: 'border-amber-500/25  bg-amber-500/10',
  success: 'border-emerald-500/25 bg-emerald-500/10',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatFull(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'platform' | 'college'>('all');
  const [selectedItem, setSelectedItem] = useState<Notification | null>(null);

  const t = resolvedTheme as string;
  const isLight = t === 'light' || t === 'parchment';

  /* ---------- Fetch ---------- */
  const fetchNotifications = useCallback(async (p: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => p === 1 ? data.notifications : [...prev, ...data.notifications]);
        setTotalCount(data.total ?? 0);
        setUnreadCount(data.unread ?? 0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (session?.user) fetchNotifications(1);
  }, [session, status, router, fetchNotifications]);

  /* ---------- Actions ---------- */
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    setSelectedItem(n);
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  /* ---------- Filtered List ---------- */
  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'platform') return n.sentByRole === 'SUPER_ADMIN';
    if (activeTab === 'college') return n.sentByRole === 'COLLEGE';
    return true;
  });

  /* ---------- Tabs ---------- */
  const TABS = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'platform', label: 'Platform', count: undefined },
    { id: 'college', label: 'College', count: undefined },
  ] as const;

  /* ---------- Theme Color Map ---------- */
  const THEME_COLORS: Record<string, { pageBg: string; cardBg: string; border: string; text: string; muted: string; tabHeaderBg: string }> = {
    light: { pageBg: '#F8FAFC', cardBg: '#FFFFFF', border: '#E5E7EB', text: '#0F0B2E', muted: '#6B7280', tabHeaderBg: 'rgba(248,250,252,0.95)' },
    parchment: { pageBg: '#F5EFEB', cardBg: '#FFFDF9', border: '#E2D9CF', text: '#212529', muted: '#6C757D', tabHeaderBg: 'rgba(245,239,235,0.95)' },
    dark: { pageBg: '#0D0F1A', cardBg: '#161B2E', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', tabHeaderBg: 'rgba(22,27,46,0.95)' },
    midnight: { pageBg: '#0A1929', cardBg: 'rgba(15,39,68,0.9)', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', tabHeaderBg: 'rgba(10,25,41,0.95)' },
    forest: { pageBg: '#0B140E', cardBg: 'rgba(17,28,20,0.9)', border: 'rgba(180,120,30,0.2)', text: '#E8E4D9', muted: '#9AAD8E', tabHeaderBg: 'rgba(11,20,14,0.95)' },
    codeterm: { pageBg: '#0D0D0D', cardBg: '#141414', border: 'rgba(204,65,37,0.25)', text: '#F0EDE8', muted: '#888580', tabHeaderBg: 'rgba(13,13,13,0.95)' },
  };

  const themeColors = THEME_COLORS[t] ?? THEME_COLORS.dark;
  const { pageBg, cardBg, border, text, muted, tabHeaderBg } = themeColors;

  /* ================================================================ */
  return (
    <MobileNavShell activeHref="/notifications">
      <div style={{ background: pageBg, minHeight: '100%' }}>

        {/* ── FILTER TABS ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: tabHeaderBg,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${border}`,
          padding: '10px 16px',
          display: 'flex', gap: 8, overflowX: 'auto',
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: active ? 'none' : `1px solid ${border}`,
                  background: active ? '#7C3AED' : cardBg,
                  color: active ? '#ffffff' : text,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                  boxShadow: active ? '0 2px 8px rgba(124,58,237,0.35)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, minWidth: 16,
                    padding: '0 5px', borderRadius: 10,
                    background: active ? 'rgba(255,255,255,0.25)' : (isLight ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.25)'),
                    color: active ? '#ffffff' : (isLight ? '#7C3AED' : '#A78BFA'),
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
          {/* Mark all read — compact right side */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                flexShrink: 0, marginLeft: 'auto',
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 20,
                background: 'rgba(124,58,237,0.12)', color: isLight ? '#6D28D9' : '#A78BFA',
                fontSize: 11, fontWeight: 700, border: '1px solid rgba(124,58,237,0.25)', cursor: 'pointer',
              }}
            >
              <CheckCheck size={12} /> All read
            </button>
          )}
        </div>


        {/* ── NOTIFICATION LIST ── */}
        <div style={{ padding: '12px 16px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  height: 80, borderRadius: 16, border: `1px solid ${border}`,
                  background: cardBg, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: isLight ? '#E5E7EB' : '#1E293B' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, width: '40%', borderRadius: 6, background: isLight ? '#E5E7EB' : '#1E293B', marginBottom: 8 }} />
                    <div style={{ height: 10, width: '70%', borderRadius: 6, background: isLight ? '#F3F4F6' : '#162032' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
              borderRadius: 20, border: `1px solid ${border}`, background: cardBg,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Bell size={28} color="#A78BFA" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 6 }}>No notifications</p>
              <p style={{ fontSize: 12, color: muted }}>
                {activeTab === 'unread' ? "You're all caught up!" : "Nothing here yet."}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((n, idx) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18, delay: idx * 0.03 }}
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px',
                    borderRadius: 16,
                    border: `1px solid ${n.isRead ? border : 'rgba(124,58,237,0.4)'}`,
                    background: n.isRead ? cardBg : (isLight ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.06)'),
                    marginBottom: 10,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Type icon */}
                  <div
                    style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    className={TYPE_BG[n.type] ?? TYPE_BG.info}
                  >
                    {TYPE_ICON[n.type] ?? TYPE_ICON.info}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{
                        fontSize: 13, fontWeight: n.isRead ? 600 : 800, color: text,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 'calc(100% - 50px)',
                      }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: 10, color: muted, flexShrink: 0, marginLeft: 6 }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p style={{
                      fontSize: 12, color: muted, lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: 8,
                    }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        border: '1px solid',
                        ...(n.sentByRole === 'SUPER_ADMIN'
                          ? { borderColor: isLight ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.3)', background: isLight ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.1)', color: isLight ? '#6D28D9' : '#A78BFA' }
                          : { borderColor: isLight ? 'rgba(37,99,235,0.3)' : 'rgba(59,130,246,0.3)', background: isLight ? 'rgba(37,99,235,0.08)' : 'rgba(59,130,246,0.1)', color: isLight ? '#1D4ED8' : '#60A5FA' }),
                      }}>
                        {n.sentByRole === 'SUPER_ADMIN'
                          ? <><Shield size={9} /> Platform</>
                          : <><Building2 size={9} /> College</>}
                      </span>
                      <span style={{ fontSize: 11, color: isLight ? '#6D28D9' : '#A78BFA', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                        View full <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <span style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#7C3AED',
                    }} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Load More */}
          {!loading && notifications.length < totalCount && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchNotifications(next); }}
                style={{
                  padding: '10px 24px', borderRadius: 12,
                  border: `1px solid ${border}`, background: cardBg,
                  fontSize: 12, fontWeight: 700, color: '#A78BFA', cursor: 'pointer',
                }}
              >
                Load older notifications
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── DETAIL BOTTOM SHEET ─── */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 400,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
              }}
              onClick={() => setSelectedItem(null)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{
                position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 410,
                background: cardBg,
                borderTop: `1px solid ${border}`,
                borderRadius: '24px 24px 0 0',
                maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: isLight ? '#D1D5DB' : '#334155' }} />
              </div>

              {/* Sheet Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 20px 14px', borderBottom: `1px solid ${border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    className={TYPE_BG[selectedItem.type] ?? TYPE_BG.info}
                  >
                    {TYPE_ICON[selectedItem.type] ?? TYPE_ICON.info}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid',
                    ...(selectedItem.sentByRole === 'SUPER_ADMIN'
                      ? { borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.1)', color: '#A78BFA' }
                      : { borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }),
                  }}>
                    {selectedItem.sentByRole === 'SUPER_ADMIN' ? '🛡 Platform Notification' : '🏫 College Announcement'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    width: 34, height: 34, borderRadius: '50%', border: `1px solid ${border}`,
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <X size={16} color={muted} />
                </button>
              </div>

              {/* Sheet Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: text, marginBottom: 8, lineHeight: 1.3 }}>
                  {selectedItem.title}
                </h2>

                <div style={{ fontSize: 11, color: muted, marginBottom: 16 }}>
                  {formatFull(selectedItem.createdAt)}
                </div>

                <div style={{
                  fontSize: 14, color: text, lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  padding: '16px',
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: isLight ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.06)',
                }}>
                  {selectedItem.message}
                </div>
              </div>

              {/* Sheet Footer */}
              <div style={{
                padding: '14px 20px',
                borderTop: `1px solid ${border}`,
                paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
              }}>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14,
                    background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
                    color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                  }}
                >
                  Got it ✓
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MobileNavShell>
  );
}
