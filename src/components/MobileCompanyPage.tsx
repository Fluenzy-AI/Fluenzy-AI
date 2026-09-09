'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Plus, SlidersHorizontal, ChevronRight, ChevronDown,
  Home, Link2, BarChart3, User, Target, Sparkles, X, Check,
  Building2, Briefcase, Award, Zap
} from 'lucide-react';
import { useTheme, themeConfig, ThemeName } from '@/contexts/ThemeContext';
import { ModuleType } from '../../Learn_English/types';

/* ─── Header 3D Briefcase & Building Illustration ───────────────────────── */
const HeaderIllustration = () => (
  <svg width="84" height="74" viewBox="0 0 120 100" fill="none">
    {/* Briefcase */}
    <rect x="22" y="28" width="72" height="52" rx="14" fill="url(#briefcaseGrad)" />
    <rect x="44" y="16" width="28" height="16" rx="6" stroke="#4C1D95" strokeWidth="5.5" fill="none" />
    <rect x="52" y="46" width="12" height="10" rx="3" fill="#FFFFFF" />
    {/* Building */}
    <rect x="74" y="38" width="36" height="52" rx="6" fill="url(#bldgGrad)" />
    <rect x="81" y="46" width="7" height="7" rx="1.5" fill="#C4B5FD" />
    <rect x="94" y="46" width="7" height="7" rx="1.5" fill="#C4B5FD" />
    <rect x="81" y="58" width="7" height="7" rx="1.5" fill="#C4B5FD" />
    <rect x="94" y="58" width="7" height="7" rx="1.5" fill="#C4B5FD" />
    <rect x="81" y="70" width="7" height="7" rx="1.5" fill="#C4B5FD" />
    <rect x="94" y="70" width="7" height="7" rx="1.5" fill="#C4B5FD" />
    {/* Plant */}
    <path d="M14 78C14 70 20 64 20 64C20 64 26 70 26 78Z" fill="#10B981" />
    <defs>
      <linearGradient id="briefcaseGrad" x1="22" y1="28" x2="94" y2="80" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6D28D9" />
        <stop offset="1" stopColor="#4C1D95" />
      </linearGradient>
      <linearGradient id="bldgGrad" x1="74" y1="38" x2="110" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EDE9FE" />
        <stop offset="1" stopColor="#DDD6FE" />
      </linearGradient>
    </defs>
  </svg>
);

/* ─── Company Logos ─────────────────────────────────────────────────────── */
const GoogleLogo = () => (
  <svg width="34" height="34" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.3-7.7 19.3-20 0-1.3-.1-2.7-.3-4H43.6z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.3l-6.5 5C9.8 39.7 16.5 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.4 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z" />
  </svg>
);

const MicrosoftLogo = () => (
  <svg width="32" height="32" viewBox="0 0 21 21">
    <rect x="0" y="0" width="10" height="10" fill="#F25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
    <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
);

const AmazonLogo = () => (
  <svg width="42" height="30" viewBox="0 0 80 48">
    <text x="6" y="32" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="34" fill="#000000">a</text>
    <path d="M4 40 Q35 56 68 40" stroke="#FF9900" strokeWidth="4.5" fill="none" strokeLinecap="round" />
  </svg>
);

const MetaLogo = () => (
  <svg width="40" height="30" viewBox="0 0 100 50">
    <path d="M28.3 10C18.2 10 10 17.5 10 27.5C10 37.5 17.5 44 26 44C35 44 43 33 50 25C57 17 65 6 74 6C82.5 6 90 12.5 90 22.5C90 32.5 81.8 40 71.7 40C61.8 40 54 30 50 25C46 20 38 10 28.3 10Z" fill="none" stroke="#0081FB" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AppleLogo = () => (
  <svg width="30" height="34" viewBox="0 0 170 170" fill="#000000">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-5.02.24-9.94-1.87-14.76-6.35-3.26-3.03-7.16-7.85-11.69-14.48-6.19-9.15-11.05-19.86-14.58-32.13-3.53-12.27-5.3-23.77-5.3-34.5 0-14.67 3.53-26.69 10.59-36.06 7.06-9.37 16.03-14.17 26.91-14.41 5.37 0 11.16 1.3 17.37 3.91 6.21 2.6 10.37 3.91 12.48 3.91 1.8 0 5.92-1.3 12.36-3.91 6.44-2.61 11.97-3.86 16.59-3.75 11.99.6 21.68 5.2 29.08 13.8-10.63 6.44-15.83 15.43-15.6 26.98.24 9.38 3.9 17.07 11 23.08 4.3 3.63 9.17 6.09 14.61 7.38-2.64 7.64-6.3 15.93-10.97 24.87zM119.22 31.42c0-7.07 2.58-13.78 7.74-20.13 5.16-6.35 11.75-10.32 19.78-11.29.12 1.08.18 1.93.18 2.53 0 7.07-2.67 13.9-8.01 20.49-5.34 6.59-11.97 10.46-19.89 11.61-.12-1.09-.18-2.17-.18-3.21z"/>
  </svg>
);

const NetflixLogo = () => (
  <svg width="26" height="34" viewBox="0 0 111 200">
    <path d="M0 0h34v200H0z" fill="#E50914"/>
    <path d="M77 0h34v200H77z" fill="#E50914"/>
    <path d="M0 0l77 200h34L34 0z" fill="#B81D24"/>
  </svg>
);

const FlipkartLogo = () => (
  <div style={{ position: 'relative', width: '36px', height: '36px' }}>
    <div style={{ background: '#F6B400', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '20px', fontFamily: 'Arial Black, Arial', lineHeight: 1 }}>F</span>
    </div>
    <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '13px', height: '13px', background: '#2874F0', borderRadius: '50%', border: '1.5px solid white' }} />
  </div>
);

const TCSLogo = () => (
  <span style={{ fontWeight: 900, fontSize: '20px', fontFamily: 'Arial, sans-serif', background: 'linear-gradient(135deg,#E91E8C,#7B2D8B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>tcs</span>
);

const InfosysLogo = () => (
  <span style={{ fontWeight: 800, fontSize: '18px', fontFamily: 'sans-serif', color: '#007CC3', letterSpacing: '-0.5px' }}>Infosys</span>
);

const DeloitteLogo = () => (
  <div style={{ display: 'flex', alignItems: 'baseline', fontWeight: 900, fontSize: '24px', fontFamily: 'Arial Black, sans-serif', color: '#000000' }}>
    D<span style={{ color: '#86BC25', fontSize: '26px', lineHeight: 0 }}>.</span>
  </div>
);

const GoldmanSachsLogo = () => (
  <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', fontFamily: 'Georgia, serif', color: '#1B365D', lineHeight: 1.1 }}>
    Goldman<br/>Sachs
  </div>
);

const JPMorganLogo = () => (
  <svg width="34" height="34" viewBox="0 0 100 100" fill="#1175E8">
    <path d="M50 5L95 50L50 95L5 50Z" />
    <path d="M50 20L80 50L50 80L20 50Z" fill="#FFFFFF" />
    <path d="M50 32L68 50L50 68L32 50Z" fill="#1175E8" />
  </svg>
);

/* ─── Company Data List ─────────────────────────────────────────────────── */
interface CompanyItem {
  id: string;
  name: string;
  category: 'Tech' | 'Product' | 'Finance';
  iconUrl?: string;
  logo?: React.ComponentType;
}

const ALL_COMPANIES: CompanyItem[] = [
  { id: 'google', name: 'Google', category: 'Tech', iconUrl: '/companeyicon/Google-Logo.wine.svg' },
  { id: 'microsoft', name: 'Microsoft', category: 'Tech', iconUrl: '/companeyicon/Microsoft-Logo.wine.svg' },
  { id: 'amazon', name: 'Amazon', category: 'Product', iconUrl: '/companeyicon/Amazon_(company)-Logo.wine.svg' },
  { id: 'meta', name: 'Meta', category: 'Tech', iconUrl: '/companeyicon/Meta_Platforms-Logo.wine.svg' },
  { id: 'apple', name: 'Apple', category: 'Product', iconUrl: '/companeyicon/Apple_Inc.-Logo.wine.svg' },
  { id: 'netflix', name: 'Netflix', category: 'Product', logo: NetflixLogo },
  { id: 'flipkart', name: 'Flipkart', category: 'Product', iconUrl: '/companeyicon/Flipkart-Logo.wine.svg' },
  { id: 'tcs', name: 'TCS', category: 'Tech', iconUrl: '/companeyicon/Tata_Consultancy_Services_Logo_2020.svg' },
  { id: 'infosys', name: 'Infosys', category: 'Tech', iconUrl: '/companeyicon/Infosys_Consulting-Logo.wine.svg' },
  { id: 'deloitte', name: 'Deloitte', category: 'Finance', iconUrl: '/companeyicon/deloitte.svg' },
  { id: 'goldmansachs', name: 'Goldman Sachs', category: 'Finance', iconUrl: '/companeyicon/goldmansachs-ar21.svg' },
  { id: 'jpmorgan', name: 'JPMorgan Chase', category: 'Finance', iconUrl: '/companeyicon/icons8-chase-bank-480.svg' },
  { id: 'capgemini', name: 'Capgemini', category: 'Tech', iconUrl: '/companeyicon/Capgemini-Logo.wine.svg' },
  { id: 'nvidia', name: 'NVIDIA', category: 'Tech', iconUrl: '/companeyicon/Nvidia-Logo.wine.svg' },
];

/* ─── Bottom Tabs ────────────────────────────────────────────────────────── */
const TABS = [
  { label: 'Quick Links', icon: Link2, href: '/train', tabColor: '#8B5CF6' },
  { label: 'Practice', icon: Target, href: '/train/hr', tabColor: '#10B981' },
  { label: 'Home', icon: Home, href: '/train', tabColor: '#7C3AED' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics', tabColor: '#F97316' },
  { label: 'Profile', icon: User, href: '/profile', tabColor: '#0EA5E9' },
];

export default function MobileCompanyPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Tech' | 'Product' | 'Finance'>('All');
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);

  /* Modal Form State */
  const [role, setRole] = useState('Software Engineer');
  const [customRoleText, setCustomRoleText] = useState('');
  const [experience, setExperience] = useState('Fresher');
  const [roundType, setRoundType] = useState('Technical');
  const [customCompanyName, setCustomCompanyName] = useState('');

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const ROLES_LIST = [
    'Software Engineer',
    'Frontend Engineer',
    'Backend Engineer',
    'Full Stack Developer',
    'Product Manager',
    'Data Analyst',
    'Data Scientist',
    'UI/UX Designer',
    'DevOps Engineer',
  ];

  const isDarkTheme = resolvedTheme === 'dark' || resolvedTheme === 'midnight' || resolvedTheme === 'forest' || resolvedTheme === 'codeterm';
  const isLight = !isDarkTheme;

  /* Explicit fail-safe colour tokens matching MobileTrainPage */
  const accentHex = isDarkTheme ? '#7C3AED' : '#5A2D82';
  const cardBgHex = isDarkTheme ? '#161B2E' : '#FFFFFF';
  const pageBgHex = isDarkTheme ? '#0D0F1A' : 'hsl(42 18% 93%)';
  const tileBg = isDarkTheme ? '#1a2340' : '#FFFFFF';
  const textHex = isDarkTheme ? '#F8FAFC' : '#1C1917';
  const mutedHex = isDarkTheme ? '#94A3B8' : '#57534E';
  const borderHex = isDarkTheme ? 'rgba(255,255,255,0.08)' : '#E6E2D8';

  /* Filtered company list */
  const filteredCompanies = useMemo(() => {
    return ALL_COMPANIES.filter(c => {
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  /* Start Interview Handler -> Routes to Resume Upload/Paste Step */
  const handleStartSession = (companyName: string) => {
    const selectedRole = role === 'Custom' ? (customRoleText.trim() || 'Software Engineer') : role;
    router.push(
      `/train/company/resume?company=${encodeURIComponent(companyName)}` +
      `&role=${encodeURIComponent(selectedRole)}` +
      `&experience=${encodeURIComponent(experience)}` +
      `&roundType=${encodeURIComponent(roundType)}`
    );
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col sm:hidden overflow-hidden"
      style={{ background: pageBgHex }}
    >
      {/* ── HEADER SECTION (Matching Mockup) ───────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 shrink-0" style={{ background: pageBgHex }}>
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <button
              onClick={() => router.push('/train')}
              className="p-1.5 -ml-1 rounded-full flex items-center justify-center mb-2 active:opacity-60"
              style={{ color: textHex }}
              aria-label="Back"
            >
              <ArrowLeft size={22} style={{ color: textHex, stroke: textHex }} />
            </button>
            <h1 className="text-xl font-black tracking-tight" style={{ color: textHex, WebkitTextFillColor: textHex }}>
              Company Wise Interview
            </h1>
            <p className="text-xs font-medium mt-1 leading-snug" style={{ color: mutedHex }}>
              Practice company-specific interviews and ace your dream job.
            </p>
          </div>

          {/* 3D Illustration */}
          <div className="shrink-0 pt-1">
            <HeaderIllustration />
          </div>
        </div>

        {/* ── SEARCH & ADD CUSTOM COMPANY ROW ───────────────────────────────── */}
        <div className="flex items-center gap-2 mt-4">
          {/* Search Input */}
          <div
            className="flex-1 min-w-0 flex items-center gap-2 px-3.5 h-11 rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500"
            style={{
              background: cardBgHex,
              borderColor: borderHex,
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <Search size={16} className="shrink-0" style={{ color: mutedHex }} />
            <input
              type="text"
              placeholder="Search for a company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-clean w-full min-w-0 text-xs font-semibold !bg-transparent !border-none !shadow-none !outline-none"
              style={{ color: textHex }}
            />
          </div>

          {/* Add Custom Company Button */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 px-3 h-11 rounded-2xl font-bold border text-xs shrink-0 active:scale-95 transition-transform"
            style={{
              background: cardBgHex,
              borderColor: borderHex,
              color: textHex,
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
            }}
          >
            <div className="plus-badge-solid w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#5B21E6', backgroundColor: '#5B21E6' }}>
              <Plus size={13} strokeWidth={3} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            </div>
            <span className="whitespace-nowrap font-bold text-xs" style={{ color: textHex, WebkitTextFillColor: textHex }}>
              Add Custom
            </span>
          </button>
        </div>

        {/* ── CATEGORY FILTER PILLS ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 mt-4 overflow-x-auto scrollbar-none pb-1">
          <div className="flex items-center gap-2">
            {(['All', 'Tech', 'Product', 'Finance'] as const).map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap"
                  style={{
                    background: isActive ? accentHex : cardBgHex,
                    color: isActive ? '#FFFFFF' : mutedHex,
                    border: isActive ? 'none' : `1px solid ${borderHex}`,
                  }}
                >
                  {cat === 'All' ? 'All Companies' : cat}
                </button>
              );
            })}
          </div>

          <button
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold shrink-0 border"
            style={{
              background: cardBgHex,
              color: textHex,
              borderColor: borderHex,
            }}
          >
            <SlidersHorizontal size={14} style={{ color: mutedHex }} />
            Filter
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE COMPANY GRID (3 COLUMNS!) ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-28">
        <div className="grid grid-cols-3 gap-3">
          {filteredCompanies.map((company, index) => {
            const LogoComp = company.logo;
            return (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035, type: 'spring', stiffness: 300, damping: 24 }}
                onClick={() => setSelectedCompany(company)}
                className="flex flex-col items-center justify-center rounded-2xl p-3 h-28 border transition-all active:scale-95 text-center"
                style={{
                  background: tileBg,
                  borderColor: borderHex,
                  boxShadow: isLight
                    ? '0 2px 10px rgba(0,0,0,0.04)'
                    : '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                  {company.iconUrl ? (
                    <img src={company.iconUrl} alt={company.name} className="max-h-full max-w-full object-contain" />
                  ) : LogoComp ? (
                    <div className="flex items-center justify-center">
                      <LogoComp />
                    </div>
                  ) : null}
                </div>
                <span
                  className="font-extrabold text-[12px] mt-2.5 leading-tight line-clamp-1 w-full text-center tracking-tight"
                  style={{ color: textHex, WebkitTextFillColor: textHex }}
                >
                  {company.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="py-12 text-center">
            <Building2 size={36} className="mx-auto mb-2 opacity-40" style={{ color: mutedHex }} />
            <p className="text-sm font-semibold" style={{ color: textHex }}>No companies found</p>
            <p className="text-xs mt-1" style={{ color: mutedHex }}>Try searching for a different company or category.</p>
          </div>
        )}
      </div>

      {/* ── ASK AI FAB ─────────────────────────────────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => window.dispatchEvent(new CustomEvent('open-side-chatbot'))}
        className="fixed right-5 z-[210] sm:hidden w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5 active:scale-95"
        style={{
          bottom: '80px',
          background: '#6C2BD9',
          boxShadow: '0 8px 24px rgba(108,43,217,0.5)',
        }}
        aria-label="Ask AI"
      >
        <Sparkles size={18} className="text-white" />
        <span className="text-white font-black tracking-wide" style={{ fontSize: '8px' }}>Ask AI</span>
      </motion.button>

      {/* ── FLOATING BOTTOM TAB BAR ────────────────────────────────────────── */}
      {/* ── BOTTOM TAB BAR (Downward Concave Scoop Curve around Home Tab) ──── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[210] sm:hidden flex items-end justify-around"
        style={{
          height: '64px',
          paddingBottom: 'env(safe-area-inset-bottom, 4px)',
        }}
      >
        {/* Background Downward Curvy SVG shape */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 375 64"
            preserveAspectRatio="none"
            className="w-full h-full"
            style={{
              filter: isLight
                ? 'drop-shadow(0px -4px 12px rgba(0,0,0,0.08))'
                : 'drop-shadow(0px -4px 16px rgba(0,0,0,0.3))',
            }}
          >
            <path
              d="M 0,0 L 132,0 C 152,0 160,24 187.5,24 C 215,24 223,0 243,0 L 375,0 L 375,64 L 0,64 Z"
              fill={isLight ? '#FFFFFF' : cardBgHex}
              stroke={isLight ? '#E2E8F0' : borderHex}
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Tab Items */}
        <div className="relative z-10 flex items-center justify-around w-full h-full pt-1 px-1">
          {TABS.map((tab) => {
            const isHome = tab.label === 'Home';
            const activeColor = isLight ? '#7C3AED' : accentHex;
            const inactiveIconColor = isLight ? '#475569' : mutedHex;
            const inactiveTextColor = isLight ? '#334155' : mutedHex;

            const iconColor = isHome ? activeColor : inactiveIconColor;
            const textColor = isHome ? activeColor : inactiveTextColor;

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] flex-1 active:opacity-75 ${
                  isHome ? '-mt-5' : 'pb-1'
                }`}
                aria-label={tab.label}
              >
                {isHome ? (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0 force-purple-bg force-white"
                    style={{
                      backgroundColor: '#7C3AED',
                      background: '#7C3AED',
                      boxShadow: '0 6px 16px rgba(124, 58, 237, 0.45)',
                    }}
                  >
                    <Home
                      size={22}
                      className="force-white"
                      strokeWidth={2.2}
                      style={{
                        color: '#FFFFFF',
                        stroke: '#FFFFFF',
                        fill: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <tab.icon size={22} style={{ color: iconColor, stroke: iconColor }} />
                )}
                <span
                  className="font-extrabold"
                  style={{
                    fontSize: '10px',
                    color: textColor,
                    WebkitTextFillColor: textColor,
                    marginTop: isHome ? '1px' : '0px',
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── COMPANY SETUP MODAL SHEET ───────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCompany && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[220]"
              onClick={() => setSelectedCompany(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[230] rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto shadow-2xl"
              style={{ background: cardBgHex, borderTop: `1px solid ${borderHex}` }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: borderHex }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl border flex items-center justify-center p-1.5 shrink-0" style={{ borderColor: borderHex }}>
                    {selectedCompany.iconUrl ? (
                      <img src={selectedCompany.iconUrl} alt={selectedCompany.name} className="max-h-full max-w-full object-contain" />
                    ) : selectedCompany.logo ? (
                      <selectedCompany.logo />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-bold text-base" style={{ color: textHex }}>{selectedCompany.name} Interview</h3>
                    <p className="text-xs" style={{ color: mutedHex }}>Tailored company tracks & questions</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 rounded-full"
                  style={{ color: mutedHex }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="py-4 space-y-4">
                {/* Target Role */}
                <div className="relative">
                  <label
                    className="text-xs font-extrabold block mb-1.5"
                    style={{
                      color: isLight ? '#1C1917' : textHex,
                      WebkitTextFillColor: isLight ? '#1C1917' : textHex,
                    }}
                  >
                    Target Role
                  </label>

                  {/* Custom Trigger Box */}
                  <button
                    type="button"
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="w-full h-11 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-98"
                    style={{
                      background: isLight ? '#F5F2EB' : pageBgHex,
                      backgroundColor: isLight ? '#F5F2EB' : pageBgHex,
                      borderColor: isLight ? '#D6D1C4' : borderHex,
                      color: isLight ? '#1C1917' : textHex,
                    }}
                  >
                    <span
                      className="truncate font-extrabold"
                      style={{
                        color: isLight ? '#1C1917' : textHex,
                        WebkitTextFillColor: isLight ? '#1C1917' : textHex,
                      }}
                    >
                      {role === 'Custom'
                        ? (customRoleText.trim() || '+ Custom Role...')
                        : role}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`}
                      style={{
                        color: isLight ? '#44403C' : mutedHex,
                        stroke: isLight ? '#44403C' : mutedHex,
                      }}
                    />
                  </button>

                  {/* Custom In-Flow Dropdown List */}
                  <AnimatePresence>
                    {roleDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="mt-1.5 rounded-xl border overflow-hidden shadow-2xl max-h-48 overflow-y-auto space-y-0.5 p-1.5 z-50 relative"
                        style={{
                          background: isLight ? '#FFFFFF' : cardBgHex,
                          backgroundColor: isLight ? '#FFFFFF' : cardBgHex,
                          borderColor: isLight ? '#D6D1C4' : borderHex,
                        }}
                      >
                        {/* Custom Role Option (at top) */}
                        <button
                          type="button"
                          onClick={() => {
                            setRole('Custom');
                            setRoleDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-extrabold transition-colors flex items-center justify-between border-b mb-0.5"
                          style={{
                            background: role === 'Custom' ? (isLight ? '#F0EBFA' : `${accentHex}25`) : 'transparent',
                            borderColor: isLight ? '#E6E2D8' : borderHex,
                          }}
                        >
                          <span
                            className="flex items-center gap-1.5 font-extrabold"
                            style={{
                              color: isLight ? '#7C3AED' : accentHex,
                              WebkitTextFillColor: isLight ? '#7C3AED' : accentHex,
                            }}
                          >
                            <Plus size={14} strokeWidth={2.5} style={{ color: isLight ? '#7C3AED' : accentHex, stroke: isLight ? '#7C3AED' : accentHex }} />
                            Custom Role (Type your own)
                          </span>
                          {role === 'Custom' && <Check size={14} style={{ color: isLight ? '#7C3AED' : accentHex, stroke: isLight ? '#7C3AED' : accentHex }} />}
                        </button>

                        {ROLES_LIST.map((r) => {
                          const isSelected = role === r;
                          const itemColor = isSelected ? (isLight ? '#7C3AED' : accentHex) : (isLight ? '#1C1917' : textHex);
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setRole(r);
                                setRoleDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-extrabold transition-colors flex items-center justify-between"
                              style={{
                                background: isSelected ? (isLight ? '#F0EBFA' : `${accentHex}25`) : 'transparent',
                              }}
                            >
                              <span
                                className="truncate font-extrabold"
                                style={{
                                  color: itemColor,
                                  WebkitTextFillColor: itemColor,
                                }}
                              >
                                {r}
                              </span>
                              {isSelected && <Check size={14} style={{ color: itemColor, stroke: itemColor }} />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Custom Role Input Box */}
                  {role === 'Custom' && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        placeholder="Type custom role (e.g. iOS Developer)..."
                        value={customRoleText}
                        onChange={(e) => setCustomRoleText(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border text-xs font-bold outline-none"
                        style={{
                          background: isLight ? '#F5F2EB' : pageBgHex,
                          backgroundColor: isLight ? '#F5F2EB' : pageBgHex,
                          color: isLight ? '#1C1917' : textHex,
                          WebkitTextFillColor: isLight ? '#1C1917' : textHex,
                          borderColor: isLight ? '#D6D1C4' : borderHex,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Round Type */}
                <div>
                  <label
                    className="text-xs font-extrabold block mb-1.5"
                    style={{
                      color: isLight ? '#1C1917' : textHex,
                      WebkitTextFillColor: isLight ? '#1C1917' : textHex,
                    }}
                  >
                    Interview Round
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Technical', 'PI'] as const).map((round) => {
                      const isSelected = roundType === round;
                      return (
                        <button
                          key={round}
                          type="button"
                          onClick={() => setRoundType(round)}
                          className="h-10 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5"
                          style={{
                            background: isSelected ? '#5B21E6' : (isLight ? '#F5F2EB' : pageBgHex),
                            color: isSelected ? '#FFFFFF' : (isLight ? '#1C1917' : textHex),
                            WebkitTextFillColor: isSelected ? '#FFFFFF' : (isLight ? '#1C1917' : textHex),
                            borderColor: isSelected ? '#5B21E6' : (isLight ? '#D6D1C4' : borderHex),
                          }}
                        >
                          {round === 'Technical' ? 'Technical Round' : 'HR & Behavioral'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label
                    className="text-xs font-extrabold block mb-1.5"
                    style={{
                      color: isLight ? '#1C1917' : textHex,
                      WebkitTextFillColor: isLight ? '#1C1917' : textHex,
                    }}
                  >
                    Experience Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Fresher', '1-3 Years', '3+ Years'] as const).map((exp) => {
                      const isSelected = experience === exp;
                      return (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => setExperience(exp)}
                          className="h-9 rounded-xl text-xs font-bold border transition-colors"
                          style={{
                            background: isSelected ? '#5B21E6' : (isLight ? '#F5F2EB' : pageBgHex),
                            color: isSelected ? '#FFFFFF' : (isLight ? '#1C1917' : textHex),
                            WebkitTextFillColor: isSelected ? '#FFFFFF' : (isLight ? '#1C1917' : textHex),
                            borderColor: isSelected ? '#5B21E6' : (isLight ? '#D6D1C4' : borderHex),
                          }}
                        >
                          {exp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartSession(selectedCompany.name)}
                className="w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform force-white"
                style={{ background: 'linear-gradient(135deg,#5B21E6,#7C3AED)', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
              >
                <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Upload or Paste Resume</span>
                <ChevronRight size={16} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD CUSTOM COMPANY MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCustomModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[220]"
              onClick={() => setShowCustomModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-4 right-4 -translate-y-1/2 z-[230] rounded-3xl p-5 shadow-2xl"
              style={{ background: cardBgHex, border: `1px solid ${borderHex}` }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: borderHex }}>
                <h3 className="font-bold text-base" style={{ color: textHex }}>Add Custom Company</h3>
                <button onClick={() => setShowCustomModal(false)} style={{ color: mutedHex }}>
                  <X size={20} />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: textHex }}>Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. OpenAI, Stripe, Swiggy..."
                    value={customCompanyName}
                    onChange={(e) => setCustomCompanyName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border text-xs font-medium outline-none"
                    style={{ background: pageBgHex, color: textHex, borderColor: borderHex }}
                  />
                </div>
              </div>

              <button
                disabled={!customCompanyName.trim()}
                onClick={() => {
                  setShowCustomModal(false);
                  handleStartSession(customCompanyName.trim());
                }}
                className="w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#5B21E6,#7C3AED)' }}
              >
                Create Track & Start <ChevronRight size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
