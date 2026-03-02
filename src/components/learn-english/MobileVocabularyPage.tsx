'use client';

import React, { useState } from 'react';
import {
  BookA,
  ArrowRight,
  Users,
  FileText,
  Sparkles,
  Bookmark,
  Mic,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues (speech APIs etc.)
const VocabularyBooster = dynamic(
  () => import('../../../Learn_English/components/VocabularyBooster'),
  { ssr: false }
);

interface UserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  [key: string]: unknown;
}

const SECTIONS = [
  { id: 'vocabulary', label: 'Vocab', icon: BookA },
  { id: 'replacements', label: 'Upgrades', icon: ArrowRight },
  { id: 'gd-phrases', label: 'GD Phrases', icon: Users },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'power-phrases', label: 'Power', icon: Sparkles },
  { id: 'cheat-sheet', label: 'Cheat', icon: Bookmark },
  { id: 'voice-practice', label: 'Voice', icon: Mic },
];

export default function MobileVocabularyPage({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('vocabulary');

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <button
          onClick={() => router.push('/train')}
          className="p-2 rounded-xl bg-slate-800/60 text-slate-400 active:bg-slate-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black truncate">Vocabulary Booster</h1>
          <p className="text-xs text-slate-400 truncate">
            {SECTIONS.find((s) => s.id === activeSection)?.label ?? 'Vocabulary'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
          <BookA size={18} className="text-white" />
        </div>
      </div>

      {/* Content — scrollable, padded for bottom nav */}
      <div className="flex-1 overflow-y-auto pb-24 px-3 pt-3">
        <VocabularyBooster
          user={user as any}
          isMobile={true}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>

      {/* Sticky bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur border-t border-slate-800/70 pb-safe">
        <div className="grid grid-cols-7 h-16">
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-orange-400' : 'text-slate-500 active:text-slate-300'
                }`}
              >
                <div className={`relative flex items-center justify-center`}>
                  {active && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-orange-500" />
                  )}
                  <Icon size={20} />
                </div>
                <span className="text-[9px] font-semibold leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
