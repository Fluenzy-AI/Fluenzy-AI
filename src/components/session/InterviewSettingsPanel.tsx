'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
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

interface InterviewSettingsPanelProps {
  isPro?: boolean;
  /** Called whenever settings change so parent can react */
  onChange?: (settings: InterviewSettings) => void;
  alwaysExpanded?: boolean;
}

const COLLAPSED_HEIGHT = '44px';

const InterviewSettingsPanel: React.FC<InterviewSettingsPanelProps> = ({
  isPro = false,
  onChange,
  alwaysExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState<InterviewSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage immediately, then reconcile from DB in background
  useEffect(() => {
    const local = getInterviewSettings();
    setSettings(local);
    setLoaded(true);
    onChange?.(local);

    // Background DB sync — updates state if DB has different values (cross-device)
    syncFromDb().then((synced) => {
      setSettings(synced);
      onChange?.(synced);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<InterviewSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveInterviewSettings(next);
    onChange?.(next);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fluenzy_settings_updated', { detail: next }));
    }
  };

  if (!loaded) return null;

  return (
    <div className="w-full text-left">
      {/* Divider */}
      {!alwaysExpanded && <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent my-3" />}

      {/* Collapsible toggle row */}
      {!alwaysExpanded && (
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-1 py-1.5 text-slate-300 hover:text-white transition-colors group"
          style={{ minHeight: COLLAPSED_HEIGHT }}
          aria-expanded={isExpanded}
          aria-controls="interview-settings-panel-body"
        >
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center">
              <Settings size={10} className="text-pink-400" />
            </span>
            Voice &amp; Interview Settings
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 text-slate-400 group-hover:text-white ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Expanded body — max-height transition */}
      <div
        id="interview-settings-panel-body"
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: (alwaysExpanded || isExpanded) ? '800px' : '0px' }}
      >
        <div className="space-y-3 pb-3 pt-1">

          {/* Setting 1: Voice Speed */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Speed
            </label>
            <div className="flex flex-wrap gap-1">
              {VOICE_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => update({ voiceSpeed: speed as VoiceSpeed })}
                  className={`
                    px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all border
                    ${settings.voiceSpeed === speed
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-sm shadow-pink-500/30'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-pink-500/40 hover:text-slate-200'
                    }
                  `}
                  title={VOICE_SPEED_LABELS[speed]}
                >
                  {speed === 1 ? '● 1x' : `${speed}x`}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-500 leading-snug pl-0.5">
              {VOICE_SPEED_LABELS[settings.voiceSpeed]}
            </p>
          </div>

          {/* Setting 2: Interviewer Voice */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Voice
            </label>
            <VoiceSelector
              selectedVoiceId={settings.voiceId}
              onSelect={(id: VoiceId) => update({ voiceId: id })}
              isPro={isPro}
              compact
            />
          </div>

          {/* Setting 3: Interview Style */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Style
            </label>
            <div className="flex gap-1.5">
              {PRESSURE_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => update({ pressureStyle: opt.id as PressureStyle })}
                  className={`
                    flex-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all border text-center
                    ${settings.pressureStyle === opt.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-sm shadow-pink-500/30'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-pink-500/40 hover:text-slate-200'
                    }
                  `}
                  title={opt.uiCopy}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Setting 4: AI Response Timing */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              AI Response Time
            </label>
            <div className="flex gap-1.5">
              {RESPONSE_TIMING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => update({ responseTiming: opt.id as ResponseTiming })}
                  className={`
                    flex-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all border text-center
                    ${settings.responseTiming === opt.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-sm shadow-pink-500/30'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-pink-500/40 hover:text-slate-200'
                    }
                  `}
                  title={opt.useCase}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-500 leading-snug pl-0.5 mt-1">
              Controls if the AI replies immediately as soon as you speak, or takes a pause.
            </p>
          </div>

        </div>
      </div>

      {/* Divider below */}
      {!alwaysExpanded && <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent mt-1 mb-3" />}
    </div>
  );
};

export default InterviewSettingsPanel;
