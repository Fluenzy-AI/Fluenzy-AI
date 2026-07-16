'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Rocket, ChevronRight, History } from 'lucide-react';
import {
  InterviewSettings,
  VoiceSpeed,
  VoiceId,
  PressureStyle,
  ResponseTiming,
  VOICE_SPEEDS,
  VOICE_SPEED_LABELS,
  PRESSURE_STYLE_OPTIONS,
  RESPONSE_TIMING_OPTIONS,
  DEFAULT_SETTINGS,
} from '@/types/interviewSettings';
import {
  getInterviewSettings,
  saveInterviewSettings,
  syncFromDb,
} from '@/lib/interviewSettingsStore';
import VoiceSelector from './VoiceSelector';

interface InterviewSettingsStepProps {
  isPro?: boolean;
  onLaunch: (settings: InterviewSettings) => void;
  onSkip: () => void;
}

const PillGroup: React.FC<{
  options: { id: string; emoji?: string; label: string; sublabel?: string }[];
  selected: string;
  onSelect: (id: string) => void;
}> = ({ options, selected, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt.id}
        onClick={() => onSelect(opt.id)}
        className={`
          flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200
          ${selected === opt.id
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-md shadow-pink-500/25'
            : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-pink-500/40 hover:text-white hover:bg-slate-800'
          }
        `}
      >
        {opt.emoji && <span>{opt.emoji}</span>}
        {opt.label}
      </button>
    ))}
  </div>
);

const InterviewSettingsStep: React.FC<InterviewSettingsStepProps> = ({
  isPro = false,
  onLaunch,
  onSkip,
}) => {
  const [settings, setSettings] = useState<InterviewSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const local = getInterviewSettings();
    setSettings(local);
    setLoaded(true);
    // Background DB reconcile
    syncFromDb().then(setSettings);
  }, []);

  const update = (patch: Partial<InterviewSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveInterviewSettings(next); // persist on every change
  };

  const handleLaunch = () => {
    saveInterviewSettings(settings);
    onLaunch(settings);
  };

  const handleSkip = () => {
    onSkip(); // caller uses DEFAULT_SETTINGS
  };

  if (!loaded) return null;

  return (
    <div className="p-6 sm:p-10 lg:p-12 flex-1 animate-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Settings size={18} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Interview Voice Settings
        </h2>
        <p className="text-slate-400 font-medium text-sm sm:text-base">
          Customize how your AI interviewer sounds and behaves.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">

        {/* Setting 1: AI Voice Speed */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
            AI Voice Speed
          </label>
          <PillGroup
            options={VOICE_SPEEDS.map((s) => ({
              id: String(s),
              label: s === 1 ? '●1x' : `${s}x`,
            }))}
            selected={String(settings.voiceSpeed)}
            onSelect={(id) => update({ voiceSpeed: parseFloat(id) as VoiceSpeed })}
          />
          <p className="text-xs text-slate-500 px-1 leading-snug">
            {VOICE_SPEED_LABELS[settings.voiceSpeed]}
          </p>
        </div>

        {/* Setting 2: Interviewer Voice */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
            Interviewer Voice
          </label>
          <VoiceSelector
            selectedVoiceId={settings.voiceId}
            onSelect={(id: VoiceId) => update({ voiceId: id })}
            isPro={isPro}
            compact={false}
          />
        </div>

        {/* Setting 3: Interview Style */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
            Interview Style
          </label>
          <PillGroup
            options={PRESSURE_STYLE_OPTIONS.map((o) => ({
              id: o.id,
              emoji: o.emoji,
              label: o.label,
            }))}
            selected={settings.pressureStyle}
            onSelect={(id) => update({ pressureStyle: id as PressureStyle })}
          />
          <p className="text-xs text-slate-500 px-1 leading-snug">
            {PRESSURE_STYLE_OPTIONS.find((o) => o.id === settings.pressureStyle)?.uiCopy}
          </p>
        </div>

        {/* Setting 4: AI Response Timing */}
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
            AI Response Timing
          </label>
          <PillGroup
            options={RESPONSE_TIMING_OPTIONS.map((o) => ({
              id: o.id,
              emoji: o.emoji,
              label: o.label,
            }))}
            selected={settings.responseTiming}
            onSelect={(id) => update({ responseTiming: id as ResponseTiming })}
          />
          <p className="text-xs text-slate-500 px-1 leading-snug">
            {RESPONSE_TIMING_OPTIONS.find((o) => o.id === settings.responseTiming)?.useCase}
          </p>
        </div>

        {/* Static note — always-on features */}
        <div className="flex items-start gap-2 px-1">
          <History size={12} className="text-slate-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Full performance report is automatically saved after every session in History.
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          {/* Primary: LAUNCH */}
          <button
            onClick={handleLaunch}
            className="w-full py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black uppercase tracking-[0.15em] text-sm shadow-2xl shadow-pink-500/30 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Rocket size={16} />
            Launch Real-Time Interview
          </button>

          {/* Secondary: Skip */}
          <button
            onClick={handleSkip}
            className="w-full py-2.5 text-slate-400 text-xs font-semibold hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
          >
            Skip &amp; use defaults
            <ChevronRight size={12} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default InterviewSettingsStep;
