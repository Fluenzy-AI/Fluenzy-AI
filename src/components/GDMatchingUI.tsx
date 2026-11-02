'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface QueueInfo {
  queueId: string;
  message: string;
}

interface GDMatchingUIProps {
  queueInfo: QueueInfo | null;
  onLeave: () => void;
  onRetry: () => void;
}

export default function GDMatchingUI({ queueInfo, onLeave, onRetry }: GDMatchingUIProps) {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${isLight ? 'bg-slate-50' : 'bg-slate-900'}`}>
      <div className={`backdrop-blur-sm border rounded-2xl p-8 max-w-md w-full shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700'}`}>
        <div className="text-center">
          
          {/* Animated Search Icon */}
          <div className="mb-8 relative">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${isLight ? 'bg-slate-100' : 'bg-slate-700/50'}`}>
               <div className="absolute w-full h-full border-4 border-blue-500/30 rounded-full animate-ping"></div>
               <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
               </div>
            </div>
          </div>

          <h2 className={`text-2xl font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>Matching in Progress</h2>
          <p className={`mb-8 min-h-[3rem] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
            {queueInfo?.message || 'Connecting you with peers who share your interests...'}
          </p>

          {/* Progress Bar */}
          <div className={`w-full rounded-full h-1.5 mb-8 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
             <div className="h-full bg-blue-500 animate-loading-bar w-1/3 rounded-full"></div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onLeave}
              className={`w-full font-medium py-3 px-4 rounded-xl transition-all duration-200 border ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300' : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 hover:border-slate-500'}`}
            >
              Cancel Queue
            </button>
            
            <button
              onClick={onRetry}
              className={`text-sm transition-colors py-2 ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
            >
              Change Preferences
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s infinite linear;
        }
      `}</style>
    </div>
  );
}