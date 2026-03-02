'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Briefcase, Code2, Copy, CheckCheck, Loader2 } from 'lucide-react';

type InterviewType = 'PI' | 'Technical';

export default function PrivateInterviewPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState<InterviewType>('PI');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ roomId: string; inviteUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!session?.user?.id) { setError('Please log in first.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/interview/private-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          userName: session.user.name ?? 'Host',
          interviewType: selectedType,
          topic: topic.trim() || `${selectedType} Interview`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create room');
      setCreated({ roomId: data.roomId, inviteUrl: data.inviteUrl });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const enterRoom = () => {
    if (created) router.push(`/train/interview/private/${created.roomId}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/train/interview" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>

        {!created ? (
          <>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <Users size={12} /> Private Interview
            </div>
            <h1 className="text-2xl font-extrabold mb-1">Create a Private Room</h1>
            <p className="text-slate-400 text-sm mb-8">Invite specific people via a link. Up to 10 participants.</p>

            {/* Interview type */}
            <p className="text-sm font-semibold text-slate-300 mb-3">Interview Type</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: 'PI' as InterviewType, label: 'Personal Interview', icon: Briefcase, gradient: 'from-purple-500 to-pink-500' },
                { value: 'Technical' as InterviewType, label: 'Technical Interview', icon: Code2, gradient: 'from-blue-500 to-cyan-500' },
              ].map(({ value, label, icon: Icon, gradient }) => (
                <button
                  key={value}
                  onClick={() => setSelectedType(value)}
                  className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left ${
                    selectedType === value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-2`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm">{label}</p>
                </button>
              ))}
            </div>

            {/* Topic */}
            <p className="text-sm font-semibold text-slate-300 mb-2">Topic <span className="text-slate-500 font-normal">(optional)</span></p>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`e.g. ${selectedType === 'PI' ? 'Behavioral Questions, Leadership' : 'System Design, DSA'}`}
              maxLength={80}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-6"
            />

            {error && (
              <div className="mb-4 text-sm bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : 'Create Room'}
            </button>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <CheckCheck size={12} /> Room Created
            </div>
            <h1 className="text-2xl font-extrabold mb-2">Your Room is Ready!</h1>
            <p className="text-slate-400 text-sm mb-6">Share the invite link with participants. Click &quot;Enter Room&quot; to start whenever you&apos;re ready.</p>

            {/* Invite link */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-4">
              <p className="text-xs text-slate-500 mb-2">Invite Link</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm text-indigo-300 font-mono truncate">{created.inviteUrl}</p>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  {copied ? <><CheckCheck size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Room ID */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6">
              <p className="text-xs text-slate-500 mb-1">Room ID</p>
              <p className="text-sm font-mono text-white">{created.roomId}</p>
            </div>

            <button
              onClick={enterRoom}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              Enter Room →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
