'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import SidebarContent from '@/components/navbar/SidebarContent';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const hideFooter = ['/train', '/history', '/features', '/pricing'].some(path => pathname.startsWith(path));
  const hideNav = pathname.startsWith('/analytics/report');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  
  // Show persistent sidebar if logged in and not on a special page
  const showSidebar = !!session?.user && !hideNav && !isAuthPage;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <div className="flex flex-1">
        {showSidebar && (
          <aside className="fixed left-0 top-0 bottom-0 w-[280px] hidden md:block border-r border-white/5 bg-slate-900/40 backdrop-blur-xl z-50 overflow-y-auto">
            <SidebarContent session={session} pathname={pathname} />
          </aside>
        )}
        
        <main className={`flex-1 transition-all duration-300 ${showSidebar ? 'md:pl-[280px]' : ''}`}>
          {!hideNav && <Navbar showSidebar={showSidebar} />}
          <div className="pt-10">
            {children}
          </div>
          {!hideFooter && !hideNav && <Footer />}
        </main>
      </div>
    </div>
  );
}