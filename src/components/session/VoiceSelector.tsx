'use client';

import React, { useRef, useState } from 'react';
import { Play, Square, Check, Lock } from 'lucide-react';
import { VOICE_OPTIONS, VoiceId } from '@/types/interviewSettings';

interface VoiceSelectorProps {
  selectedVoiceId: VoiceId;
  onSelect: (id: VoiceId) => void;
  isPro?: boolean; // true if the user has a Pro plan
  compact?: boolean; // compact mode for collapsed panel
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelect,
  isPro = false,
  compact = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const handlePreview = (
    e: React.MouseEvent,
    voiceId: string,
    samplePath: string,
    isProVoice: boolean
  ) => {
    e.stopPropagation(); // don't trigger card select
    if (isProVoice && !isPro) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (previewingId === voiceId) {
      setPreviewingId(null);
      return;
    }

    try {
      const audio = new Audio(samplePath);
      audio.play().catch(() => {}); // silent fail if file missing
      audio.onended = () => setPreviewingId(null);
      audioRef.current = audio;
      setPreviewingId(voiceId);
    } catch {
      setPreviewingId(null);
    }
  };

  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {VOICE_OPTIONS.map((voice) => {
        const isSelected = selectedVoiceId === voice.id;
        const isLocked = voice.isPro && !isPro;
        const isPreviewing = previewingId === voice.id;

        return (
          <button
            key={voice.id}
            onClick={() => !isLocked && onSelect(voice.id)}
            disabled={isLocked}
            className={`
              relative group flex flex-col items-center gap-1 rounded-xl border transition-all duration-200
              ${compact ? 'p-1.5 text-[9px]' : 'p-3 sm:p-4 text-xs border-2'}
              ${isLocked
                ? 'opacity-50 cursor-not-allowed border-slate-700/50 bg-slate-800/30'
                : isSelected
                  ? 'border-transparent bg-gradient-to-br from-pink-500/20 to-purple-600/20 shadow-lg shadow-pink-500/10'
                  : 'border-slate-700/50 bg-slate-800/40 hover:border-pink-500/40 hover:bg-slate-800/60 cursor-pointer'
              }
            `}
            style={
              isSelected
                ? {
                    borderImage:
                      'linear-gradient(135deg, #ec4899, #9333ea) 1',
                    borderImageSlice: 1,
                    borderStyle: 'solid',
                    borderWidth: compact ? '1px' : '2px',
                  }
                : undefined
            }
            aria-label={`Select ${voice.name} voice${isLocked ? ' (Pro only)' : ''}`}
          >
            {/* Selected checkmark */}
            {isSelected && (
              <span className={`absolute ${compact ? 'top-1 right-1 w-3 h-3' : 'top-1.5 right-1.5 w-4 h-4'} rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow`}>
                <Check size={compact ? 7 : 9} className="text-white" strokeWidth={3} />
              </span>
            )}

            {/* Lock badge */}
            {isLocked && (
              <span className={`absolute ${compact ? 'top-1 right-1 w-3 h-3' : 'top-1.5 right-1.5 w-4 h-4'} rounded-full bg-slate-600 flex items-center justify-center`}>
                <Lock size={compact ? 6 : 8} className="text-slate-300" />
              </span>
            )}

            {/* Emoji avatar */}
            <span className={`${compact ? 'text-base' : 'text-2xl'} select-none`}>
              {voice.emoji}
            </span>

            {/* Name */}
            <span className={`font-black text-white leading-tight ${compact ? 'text-[8px]' : 'text-xs'}`}>
              {voice.name}
            </span>

            {/* Accent + descriptor */}
            {!compact && (
              <>
                <span className="text-[9px] text-slate-400 leading-tight text-center">
                  {voice.accent}
                </span>
                <span className="text-[9px] text-pink-400/80 font-semibold leading-tight">
                  {voice.descriptor}
                </span>
              </>
            )}

            {/* Pro badge */}
            {voice.isPro && !compact && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black uppercase tracking-wide">
                {isPro ? 'Pro' : 'Pro 🔒'}
              </span>
            )}

            {/* Preview button */}
            {!isLocked && !compact && (
              <button
                onClick={(e) => handlePreview(e, voice.id, voice.samplePath, voice.isPro)}
                className={`
                  mt-0.5 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold transition-all
                  ${isPreviewing
                    ? 'bg-pink-500/30 text-pink-300 border border-pink-500/50'
                    : 'bg-slate-700/60 text-slate-400 border border-slate-600/40 hover:bg-slate-700 hover:text-slate-200'
                  }
                `}
                aria-label={isPreviewing ? 'Stop preview' : 'Preview voice'}
              >
                {isPreviewing
                  ? <><Square size={7} /> Stop</>
                  : <><Play size={7} /> Preview</>
                }
              </button>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default VoiceSelector;
