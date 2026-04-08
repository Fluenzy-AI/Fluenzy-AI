'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Users, BookOpen, BarChart3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/train',
    icon: BookOpen,
  },
  {
    label: 'Messages',
    href: '/train/chat',
    icon: MessageSquare,
  },
  {
    label: 'Friends',
    href: '/train/friends',
    icon: Users,
  },
];

export function TrainNavigation() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo/Title */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Train
          </span>
        </div>

        {/* Middle: Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/train' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Mobile Menu Button (optional) */}
        <div className="md:hidden flex gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
                title={item.label}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
