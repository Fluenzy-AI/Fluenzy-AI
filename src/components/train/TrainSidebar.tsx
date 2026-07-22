'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BookOpen,
  MessageSquare,
  UserPlus,
  Code,
  Building2,
  Briefcase,
  GraduationCap,
  BookMarked,
  Phone,
  Zap,
  Target,
  Home,
  Settings,
  Bell,
  FileText,
  Clock,
  Activity,
  CheckCircle,
  Award,
  Bookmark,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface NavigationItem {
  title: string;
  icon: any;
  href: string;
  badge?: string;
  isActive?: boolean;
}

interface AutoApplySetupStatus {
  completed: boolean;
  enabled: boolean;
}

export function TrainSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { toggleSidebar } = useSidebar();
  const { resolvedTheme } = useTheme();
  const [autoApplyStatus, setAutoApplyStatus] = useState<AutoApplySetupStatus>({
    completed: false,
    enabled: false,
  });

  // Fetch auto-apply setup status
  useEffect(() => {
    const fetchAutoApplyStatus = async () => {
      try {
        const response = await fetch('/api/candidates/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.preferences) {
            setAutoApplyStatus({
              completed: !!data.preferences.targetRoles?.length || !!data.preferences.preferredLocations?.length,
              enabled: data.preferences.autoApplyEnabled || false,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching auto-apply status:', error);
      }
    };

    if (session?.user) {
      fetchAutoApplyStatus();
    }
  }, [session]);

  // Training modules
  const trainingModules: NavigationItem[] = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/train',
      isActive: pathname === '/train',
    },
    {
      title: 'Competitions',
      icon: Trophy,
      href: '/train/competitions',
      badge: 'New',
      isActive: pathname.startsWith('/train/competitions'),
    },
    {
      title: 'HR Interview',
      icon: UserPlus,
      href: '/train/hr',
      badge: 'Popular',
      isActive: pathname === '/train/hr',
    },
    {
      title: 'GD Coach',
      icon: GraduationCap,
      href: '/train/gd-coach',
      badge: 'Pro',
      isActive: pathname === '/train/gd-coach',
    },
    {
      title: 'GD Agent',
      icon: Target,
      href: '/train/gd-agent',
      badge: 'AI',
      isActive: pathname === '/train/gd-agent',
    },
    {
      title: 'Technical',
      icon: Code,
      href: '/train/technical',
      isActive: pathname === '/train/technical',
    },
    {
      title: 'Company Tracks',
      icon: Building2,
      href: '/train/company',
      badge: 'HOT 🔥',
      isActive: pathname === '/train/company',
    },
    {
      title: 'Daily Conversation',
      icon: MessageSquare,
      href: '/train/daily',
      isActive: pathname === '/train/daily',
    },
    {
      title: 'Latest Topics',
      icon: Zap,
      href: '/train/latest-topics',
      isActive: pathname === '/train/latest-topics',
    },
    {
      title: 'English Learning',
      icon: BookOpen,
      href: '/train/english',
      isActive: pathname === '/train/english',
    },
    {
      title: 'Vocabulary Booster',
      icon: BookMarked,
      href: '/train/vocabulary',
      isActive: pathname === '/train/vocabulary',
    },
    {
      title: 'Voice Practice',
      icon: Phone,
      href: '/train/corporate-voice',
      isActive: pathname === '/train/corporate-voice',
    },
  ];

  // Job & Career items
  const careerItems: NavigationItem[] = [
    {
      title: 'Auto-Apply Setup',
      icon: Settings,
      href: '/train/auto-apply-setup',
      isActive: pathname === '/train/auto-apply-setup',
    },
    {
      title: 'AI Job Search',
      icon: Zap,
      href: '/train/job-search',
      badge: 'New',
      isActive: pathname === '/train/job-search',
    },
    {
      title: 'Saved Jobs',
      icon: Bookmark,
      href: '/train/saved-jobs',
      isActive: pathname === '/train/saved-jobs',
    },
    {
      title: 'My Applications',
      icon: FileText,
      href: '/train/applications',
      isActive: pathname === '/train/applications',
    },
    {
      title: 'My Assessments',
      icon: Award,
      href: '/train/assessments',
      isActive: pathname === '/train/assessments',
    },
    {
      title: 'Auto-Apply Activity',
      icon: Activity,
      href: '/train/auto-apply-activity',
      isActive: pathname === '/train/auto-apply-activity',
    },
    {
      title: 'Browse Jobs',
      icon: Briefcase,
      href: '/jobs',
      isActive: pathname === '/jobs',
    },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-1 rounded-xl transition-all ${
              resolvedTheme === 'parchment'
                ? 'bg-gradient-to-br from-red-600 to-rose-600 shadow-md shadow-red-500/25 border border-red-500/30'
                : resolvedTheme === 'forest'
                ? 'bg-gradient-to-br from-emerald-600 to-amber-600 shadow-md shadow-emerald-500/25'
                : resolvedTheme === 'midnight'
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-md shadow-purple-500/25'
                : 'bg-gradient-to-br from-red-600 to-rose-600 shadow-md'
            }`}>
              <img 
                src="/favicon/apple-touch-icon.png" 
                alt="Fluenzy AI Logo" 
                className="w-7 h-7 rounded-lg object-contain"
              />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Fluenzy <span className={resolvedTheme === 'parchment' ? 'text-red-500 font-black' : 'text-primary'}>AI</span>
            </span>
          </div>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Training Modules Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Training Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {trainingModules.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    onClick={() => router.push(item.href)}
                  >
                    <Button variant="ghost" className="w-full justify-start">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <SidebarMenuBadge className="ml-auto">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Job & Career Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Job & Career</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {careerItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    onClick={() => item.href.startsWith('/train/auto-apply-setup') ?
                      router.push('/train/auto-apply-setup') :
                      router.push(item.href)}
                  >
                    <Button variant="ghost" className="w-full justify-start">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {/* Special badge for Auto-Apply Setup */}
                      {item.href === '/train/auto-apply-setup' && (
                        <SidebarMenuBadge className={cn(
                          "ml-auto",
                          autoApplyStatus.completed
                            ? "bg-green-500/20 text-green-400"
                            : "bg-orange-500/20 text-orange-400"
                        )}>
                          {autoApplyStatus.completed ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                        </SidebarMenuBadge>
                      )}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}