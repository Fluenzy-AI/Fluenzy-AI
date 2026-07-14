'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, QrCode, Keyboard, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import QRScanner from '@/components/interview/QRScanner';

import { useEffect } from 'react';

export default function PhonePairingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'qr' | 'manual'>('qr');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasteButton, setShowPasteButton] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      setShowPasteButton(true);
    }
  }, []);

  const cleanAndSetCode = (val: string) => {
    // Extract code from pasted URLs or formatted texts
    const match = val.match(/\/pair\/([0-9a-zA-Z\-]+)/);
    let extracted = match && match[1] ? match[1] : val;
    
    // Filter only alphanumeric characters and limit to 6
    const clean = extracted.replace(/[^0-9a-zA-Z]/g, '').slice(0, 6);
    setCode(clean);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const val = text.trim();
      if (val) {
        cleanAndSetCode(val);
        setError(null);
      } else {
        setError("Clipboard is empty.");
      }
    } catch (err) {
      setError("Could not read clipboard. Please paste manually into the input box.");
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setError("Pairing code must be exactly 6 digits.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    // Redirect to the pairingCode route which will handle verification & context loading
    router.push(`/pair/${cleanCode}`);
  };

  const handleScanSuccess = (scannedCode: string) => {
    setError(null);
    router.push(`/pair/${scannedCode}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col justify-between p-6">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center pt-8 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Fluenzy AI
          </span>
        </div>
        <h1 className="text-white text-base font-medium">HireLens Device Pairing</h1>
      </div>

      {/* Main Scanner/Manual Box */}
      <div className="flex-1 flex flex-col items-center justify-center my-6">
        <AnimatePresence mode="wait">
          {mode === 'qr' ? (
            <motion.div
              key="qr-scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onClose={() => setMode('manual')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="manual-entry"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-xl space-y-6"
            >
              <div>
                <h3 className="text-white font-semibold text-sm flex items-center gap-1.5 mb-1">
                  <Keyboard className="w-4 h-4 text-indigo-400" />
                  Enter pairing code
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Type the 6-digit numeric pairing code displayed on your laptop screen.
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code or paste link"
                    value={code}
                    onChange={(e) => {
                      setError(null);
                      cleanAndSetCode(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-xl py-4 px-4 text-white placeholder-slate-700 text-lg font-mono focus:outline-none transition-all pr-16"
                    disabled={isSubmitting}
                  />
                  {showPasteButton && (
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="absolute right-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Paste
                    </button>
                  )}
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center leading-normal">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || code.trim().length < 6}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Confirm Pairing
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Toggle Controls */}
        <div className="mt-8 flex items-center bg-slate-900 border border-slate-850 p-1.5 rounded-xl">
          <button
            onClick={() => setMode('qr')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'qr'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Scan QR
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Manual Code
          </button>
        </div>
      </div>

      {/* Helper footer tips */}
      <div className="text-center pb-6">
        <p className="text-slate-600 text-[10px] leading-relaxed max-w-xs mx-auto">
          Need help? Navigate to the HireLens Dashboard on your corporate laptop and select <strong>New Interview Session</strong>.
        </p>
      </div>

    </div>
  );
}
