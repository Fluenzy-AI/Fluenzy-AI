'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-200 flex flex-col items-center justify-center px-6 text-center">
      <img 
        src="/favicon/apple-touch-icon.png" 
        alt="Fluenzy AI Logo" 
        className="w-32 h-32 rounded-3xl mb-6 shadow-2xl shadow-blue-500/30"
      />
      <h1 className="text-2xl font-black text-white mb-2">You're Offline</h1>
      <p className="text-slate-400 max-w-sm mb-8">
        No internet connection detected. Some content may still be available from your last visit.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </div>
  );
}
