'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Lock, 
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function CreatePrivateRoomPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate private room
  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/gd/private-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create room');
        return;
      }

      // Store session data in sessionStorage for the room page to use
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('privateRoomData', JSON.stringify({
          roomId: data.roomId,
          sessionId: data.sessionId,
          channelName: data.channelName,
          hostId: data.hostId,
          isHost: true
        }));
      }

      // Redirect to the generated room
      router.push(`/train/gd/private/${data.roomId}`);
    } catch (err) {
      setError('Failed to create room. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/train/gd"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GD Modes</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full text-sm mb-4">
            <Sparkles size={16} />
            <span>Private Discussion</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Create Private Discussion Room
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Generate a unique invite link to start your private GD session. 
            Share it with participants to join your free-flowing discussion.
          </p>
        </div>

        {/* Generate Button Card */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold mb-4">Start Your Private Discussion</h2>
          
          <p className="text-gray-400 mb-8">
            Click below to generate a unique, secure room link that you can share with others.
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateLink}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Link...</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-5 h-5" />
                <span>Generate Private Link</span>
              </>
            )}
          </button>

          <p className="text-gray-500 text-sm mt-6">
            Your unique room link will be created instantly
          </p>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 rounded-xl p-4 text-center">
            <div className="text-purple-400 font-semibold mb-2">🔒 Secure</div>
            <p className="text-gray-500 text-sm">Unique, randomly generated room IDs that can't be guessed</p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-4 text-center">
            <div className="text-pink-400 font-semibold mb-2">👥 Unlimited</div>
            <p className="text-gray-500 text-sm">No participant limits - invite as many as you want</p>
          </div>
          <div className="bg-slate-800/30 rounded-xl p-4 text-center">
            <div className="text-blue-400 font-semibold mb-2">🎯 Flexible</div>
            <p className="text-gray-500 text-sm">Set your own topic and roles - or discuss freely</p>
          </div>
        </div>
      </div>
    </div>
  );
}
