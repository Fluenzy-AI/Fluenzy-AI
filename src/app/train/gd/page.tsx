'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Shuffle, 
  Bot, 
  ArrowRight, 
  Copy, 
  Check,
  Sparkles,
  Globe,
  Lock
} from 'lucide-react';

export default function GDSelectionPage() {
  const router = useRouter();

  // Create private room - redirects to create page
  const handleCreatePrivateRoom = () => {
    router.push('/train/gd/private');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm mb-4">
            <Sparkles size={16} />
            <span>Group Discussion</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Choose Your GD Mode
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Select your preferred way to practice group discussions
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* Card 1: Private GD */}
          <div className="group relative bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 overflow-hidden">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <div className="absolute inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-[1px] bg-slate-800 rounded-2xl" />
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-7 h-7 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-300 transition-colors">
                Private GD
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                Create a private group discussion room and share a unique invite link with others to join.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>Generate unique room ID</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>Share private invite link</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>Only invited users can join</span>
                </li>
              </ul>

              {/* CTA Button */}
              <Link
                href="/train/gd/private"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform group-hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                <span>Create / Join Private Room</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Random Matching (Live GD) */}
          <div className="group relative bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <div className="absolute inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-[1px] bg-slate-800 rounded-2xl" />
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shuffle className="w-7 h-7 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">
                Random Matching
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                Join a live discussion with random participants who selected the same configuration.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Match with random participants</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Choose participant count</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Select topic difficulty</span>
                </li>
              </ul>

              {/* CTA Button */}
              <Link
                href="/train/live-gd"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform group-hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Globe className="w-5 h-5" />
                <span>Start Live GD</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: AI Agents */}
          <div className="group relative bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 overflow-hidden">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
            <div className="absolute inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-[1px] bg-slate-800 rounded-2xl" />
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Bot className="w-7 h-7 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-green-300 transition-colors">
                AI Agents
              </h2>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                Practice GD with AI participants and assigned roles. Perfect for solo practice.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Practice with AI participants</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Assigned roles & positions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Available 24/7</span>
                </li>
              </ul>

              {/* CTA Button */}
              <Link
                href="/train/gd/ai"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform group-hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Bot className="w-5 h-5" />
                <span>Start with AI Agents</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link
            href="/train"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Training Modules</span>
          </Link>
        </div>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .group:hover .group-hover\\:scale-110 {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
