import { InterviewMode } from '@/types/interview';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'wss://techsevaweb.onrender.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://techsevaweb.onrender.com';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export function connectHireLensSocket(sessionId: string): WebSocket {
  // sessionId is the InterviewSession ID used as the identifier
  const cleanBase = WS_BASE.replace(/\/+$/, '');
  const ws = new WebSocket(`${cleanBase}/ws/behavioral/${sessionId}`);
  return ws;
}

export async function fetchSessionAnalytics(sessionId: string) {
  const cleanBase = API_BASE.replace(/\/+$/, '');
  const res = await fetch(`${cleanBase}/analytics/${sessionId}`);
  if (!res.ok) throw new Error(`Analytics fetch failed: ${res.status}`);
  return res.json();
}
