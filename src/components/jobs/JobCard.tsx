"use client";

import { JobMatch } from "@/types/jobs";

interface Props {
  job: JobMatch;
  onSave: (job: JobMatch) => void;
  onApply: (job: JobMatch) => void;
  isSaved?: boolean;
  theme?: string;
}

export function JobCard({ job, onSave, onApply, isSaved, theme = "dark" }: Props) {
  const isLight = theme === 'light';
  const isParchment = theme === 'parchment';
  const isForest = theme === 'forest';
  const isCode = theme === 'code';

  // Dynamic Theme Colors
  let bgStyle = { background: '#1E293B', borderColor: '#334155' };
  let titleColor = '#F8FAFC';
  let companyColor = '#94A3B8';
  let mutedColor = '#64748B';
  let badgeBg = 'rgba(255,255,255,0.06)';
  let primaryBtnBg = 'linear-gradient(135deg, #3B82F6, #6366F1)';
  let accentHex = '#818CF8';

  if (isLight) {
    bgStyle = { background: '#FFFFFF', borderColor: '#E2E8F0' };
    titleColor = '#0F172A';
    companyColor = '#475569';
    mutedColor = '#64748B';
    badgeBg = '#F1F5F9';
    primaryBtnBg = 'linear-gradient(135deg, #2563EB, #4F46E5)';
    accentHex = '#4F46E5';
  } else if (isParchment) {
    bgStyle = { background: '#FBF7EE', borderColor: '#E2D7C5' };
    titleColor = '#2D241E';
    companyColor = '#786C5E';
    mutedColor = '#A39585';
    badgeBg = 'rgba(120,108,94,0.12)';
    primaryBtnBg = 'linear-gradient(135deg, #9A3412, #C2410C)';
    accentHex = '#9A3412';
  } else if (isForest) {
    bgStyle = { background: '#064E3B', borderColor: '#047857' };
    titleColor = '#ECFDF5';
    companyColor = '#A7F3D0';
    mutedColor = '#6EE7B7';
    badgeBg = 'rgba(255,255,255,0.08)';
    primaryBtnBg = 'linear-gradient(135deg, #059669, #10B981)';
    accentHex = '#34D399';
  } else if (isCode) {
    bgStyle = { background: '#0A0F0D', borderColor: '#1F2937' };
    titleColor = '#22C55E';
    companyColor = '#4ADE80';
    mutedColor = '#10B981';
    badgeBg = 'rgba(34,197,94,0.1)';
    primaryBtnBg = 'linear-gradient(135deg, #16A34A, #15803D)';
    accentHex = '#22C55E';
  }

  // Match score colors
  const matchPercent = job.matchScore || 0;
  const isHighMatch = matchPercent >= 75;
  const isMediumMatch = matchPercent >= 45;

  let scoreStyle = {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#10B981',
  };
  if (!isHighMatch && isMediumMatch) {
    scoreStyle = {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#F59E0B',
    };
  } else if (!isHighMatch && !isMediumMatch) {
    scoreStyle = {
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.3)',
      text: '#F43F5E',
    };
  }

  // Location clean-up
  const isRemoteClean = job.remote || job.location?.toLowerCase().includes('remote');
  const displayLocation = job.location && !job.location.toLowerCase().includes('remote') 
    ? job.location 
    : (isRemoteClean ? 'Remote' : 'Flexible');

  return (
    <div 
      className="rounded-2xl border p-3 shadow-xs transition-all duration-150 space-y-2 relative overflow-hidden"
      style={{
        background: bgStyle.background,
        borderColor: bgStyle.borderColor,
      }}
    >
      {/* ── HEADER: TITLE + MATCH SCORE (NO AVATAR OR ICONS) ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 
            className="font-bold text-sm tracking-tight leading-tight truncate"
            style={{ color: titleColor, WebkitTextFillColor: titleColor }}
            title={job.title}
          >
            {job.title}
          </h3>
          
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] truncate">
            <span className="font-semibold truncate" style={{ color: companyColor, WebkitTextFillColor: companyColor }}>
              {job.company}
            </span>
            <span style={{ color: mutedColor }}>•</span>
            <span className="font-medium truncate" style={{ color: mutedColor, WebkitTextFillColor: mutedColor }}>
              {displayLocation}
            </span>
          </div>
        </div>

        {/* Match Score Text Pill */}
        <div 
          className="flex items-center px-2 py-0.5 rounded-lg border shrink-0 text-[11px] font-black"
          style={{
            background: scoreStyle.bg,
            borderColor: scoreStyle.border,
            color: scoreStyle.text,
          }}
        >
          {matchPercent}% match
        </div>
      </div>

      {/* ── SALARY & BADGES STRIP (NO ICONS) ── */}
      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
        {job.salary && (
          <span 
            className="px-2 py-0.5 rounded-md font-bold"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: isLight ? '#047857' : (isParchment ? '#15803D' : '#34D399'),
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            {job.salary}
          </span>
        )}

        {isRemoteClean && (
          <span 
            className="px-2 py-0.5 rounded-md font-semibold"
            style={{ background: badgeBg, color: titleColor }}
          >
            Remote
          </span>
        )}

        {job.jobType && (
          <span 
            className="px-2 py-0.5 rounded-md font-semibold capitalize"
            style={{ background: badgeBg, color: titleColor }}
          >
            {job.jobType}
          </span>
        )}

        {job.postedAt && (
          <span 
            className="text-[10px] font-medium ml-auto opacity-70"
            style={{ color: mutedColor }}
          >
            {new Date(job.postedAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* ── SKILLS CHIPS (NO ICONS) ── */}
      {((job.matchedSkills && job.matchedSkills.length > 0) || (job.missingSkills && job.missingSkills.length > 0)) && (
        <div className="flex items-center gap-1 flex-wrap text-[10px] pt-0.5">
          {job.matchedSkills?.slice(0, 3).map((skill) => (
            <span 
              key={skill}
              className="px-1.5 py-0.5 rounded-md font-semibold"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: isLight ? '#065F46' : (isParchment ? '#166534' : '#6EE7B7'),
              }}
            >
              {skill}
            </span>
          ))}

          {job.missingSkills?.slice(0, 1).map((skill) => (
            <span 
              key={skill}
              className="px-1.5 py-0.5 rounded-md font-medium opacity-70"
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                color: isLight ? '#9F1239' : (isParchment ? '#991B1B' : '#FDA4AF'),
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* ── ACTION BUTTONS (NO ICONS) ── */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <a 
          href={job.applyLink} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => onApply(job)}
          className="flex-1 text-white text-xs font-bold py-1.5 px-3 rounded-xl text-center active:scale-[0.98] transition-transform shadow-xs"
          style={{
            background: primaryBtnBg,
          }}
        >
          Apply Now
        </a>

        <button 
          onClick={() => onSave(job)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 shrink-0"
          style={{
            background: isSaved 
              ? (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.12)')
              : 'transparent',
            borderColor: isSaved 
              ? accentHex 
              : bgStyle.borderColor,
            color: isSaved 
              ? accentHex 
              : titleColor,
          }}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
