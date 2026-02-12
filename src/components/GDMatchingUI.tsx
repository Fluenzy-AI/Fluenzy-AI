'use client';

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
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center">
          
          {/* Animated Search Icon */}
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center">
               <div className="absolute w-full h-full border-4 border-blue-500/30 rounded-full animate-ping"></div>
               <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
               </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Matching in Progress</h2>
          <p className="text-slate-300 mb-8 min-h-[3rem]">
            {queueInfo?.message || 'Connecting you with peers who share your interests...'}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-8 overflow-hidden">
             <div className="h-full bg-blue-500 animate-loading-bar w-1/3 rounded-full"></div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onLeave}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-slate-600 hover:border-slate-500"
            >
              Cancel Queue
            </button>
            
            <button
              onClick={onRetry}
              className="text-sm text-slate-400 hover:text-white transition-colors py-2"
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