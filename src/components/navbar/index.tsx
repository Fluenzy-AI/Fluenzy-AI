"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, Sparkles, X, User, CreditCard, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import SidebarContent from "./SidebarContent";

const Navbar = ({ showSidebar }: { showSidebar?: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const handleSubmit = async () => {
    if (session?.user) {
      scrollToSection("editor");
    } else {
      await signIn("google", { callbackUrl: "/train" });
    }
  };

  // Hide navbar for superadmin
  if (pathname.startsWith('/superadmin')) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 right-0 z-40 bg-slate-900/80 backdrop-blur-2xl border-b border-white/5 transition-all duration-300 ${showSidebar ? 'md:left-[280px] left-0' : 'left-0'}`}
    >
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Left Sidebar Menu (Mobile Only Trigger) */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl">
                    <Menu className="h-6 w-6 text-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-slate-950 border-r border-white/5 p-0 overflow-y-auto">
                  <SheetHeader className="p-3 border-b border-white/5 bg-slate-900/50">
                    <SheetTitle className="flex items-center space-x-3">
                      <img src="/image/fluenzyAI.jpeg" alt="Logo" className="h-8 w-auto rounded-lg" />
                      <span className="text-xl font-black bg-gradient-primary !bg-clip-text text-transparent">Menu</span>
                    </SheetTitle>
                  </SheetHeader>
                  <SidebarContent session={session} pathname={pathname} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo (Hidden on desktop when sidebar is persistent) */}
            <motion.div
              className={`flex items-center space-x-3 cursor-pointer ${showSidebar ? 'md:hidden' : ''}`}
              whileHover={{ scale: 1.05 }}
              onClick={() => window.location.href = "/"}
            >
              <img 
                src="/image/fluenzyAI.jpeg" 
                alt="Fluenzy AI Logo" 
                className="h-8 w-auto rounded-lg object-contain shadow-lg"
              />
              <span className="text-xl font-black bg-gradient-primary !bg-clip-text text-transparent tracking-tight hidden sm:block">
                Fluenzy AI
              </span>
            </motion.div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full pr-4 p-1 transition-all">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white overflow-hidden uppercase border border-white/10">
                       {session.user.image ? (
                         <img 
                           src={session.user.image} 
                           alt="User" 
                           className="w-full h-full object-cover"
                           referrerPolicy="no-referrer"
                         />
                       ) : (
                         session.user.name?.charAt(0)
                       )}
                     </div>
                    <span className="hidden sm:inline-block text-xs font-bold pl-1 text-slate-200">{session.user.name?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass mt-2 border-white/10">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2 p-3">
                      <User className="h-4 w-4 text-purple-400" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing" className="flex items-center space-x-2 p-3">
                      <CreditCard className="h-4 w-4 text-blue-400" />
                      <span>Subscription</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => signOut()} className="flex items-center space-x-2 p-3 text-red-400 focus:text-red-300">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="hero"
                className="px-8 font-black text-xs uppercase tracking-widest rounded-full"
                onClick={handleSubmit}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
