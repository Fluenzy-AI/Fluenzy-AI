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

const Navbar = () => {
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
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/30 backdrop-blur-xl border-b border-slate-700/50 transition-all duration-300"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => scrollToSection("hero")}
          >
            <div className="relative">
              <Sparkles
                fill="transparent"
                className="h-8 w-8 text-primary animate-glow-pulse"
              />
              <div className="absolute inset-0 h-8 w-8 text-secondary animate-glow-pulse opacity-30" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary !bg-clip-text text-transparent">
              Fluenzy AI
            </span>
          </motion.div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {session?.user ? (
              <>
                <Link
                  href="/train"
                  className={`text-foreground hover:text-primary transition-colors font-semibold ${pathname === '/train' ? 'text-primary' : ''}`}
                >
                  Train Now
                </Link>
                <Link
                  href="/interview-guide"
                  className={`text-foreground hover:text-primary transition-colors font-semibold ${pathname === '/interview-guide' || pathname.startsWith('/interview-guide') ? 'text-primary' : ''}`}
                >
                  Interview Guide
                </Link>
                <Link
                  href="/history"
                  className={`text-foreground hover:text-primary transition-colors font-medium ${pathname === '/history' ? 'text-primary' : ''}`}
                >
                  History
                </Link>
                <Link
                  href="/features"
                  className={`text-foreground hover:text-primary transition-colors font-medium ${pathname === '/features' ? 'text-primary' : ''}`}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className={`text-foreground hover:text-primary transition-colors font-medium ${pathname === '/pricing' ? 'text-primary' : ''}`}
                >
                  Pricing
                </Link>
                <Link
                  href="/analytics"
                  className={`text-foreground hover:text-primary transition-colors font-medium ${pathname === '/analytics' ? 'text-primary' : ''}`}
                >
                  Analytics Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={`text-foreground hover:text-primary transition-colors font-medium ${pathname === '/' ? 'text-primary' : ''}`}
                >
                  Home
                </Link>
                <Link
                  href="/features"
                  className={`text-foreground hover:text-primary transition-colors font-medium ${pathname === '/features' ? 'text-primary' : ''}`}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className={`text-foreground hover:text-primary transition-colors font-medium ${pathname === '/pricing' ? 'text-primary' : ''}`}
                >
                  Pricing
                </Link>
              </>
            )}
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 bg-transparent border border-slate-700/50 text-white hover:bg-slate-800/30 backdrop-blur-sm">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 glass border border-card-border backdrop-blur-glass">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing" className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="hero"
                className="w-full font-semibold"
                onClick={handleSubmit}
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? "auto" : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-4">
            {session?.user && (
              <>
                <Link
                  href="/train"
                  className={`block w-full text-left text-foreground hover:text-primary transition-colors font-medium ${pathname === '/train' ? 'text-primary' : ''}`}
                >
                  Train Now
                </Link>
                <Link
                  href="/interview-guide"
                  className={`block w-full text-left text-foreground hover:text-primary transition-colors font-medium ${pathname === '/interview-guide' || pathname.startsWith('/interview-guide') ? 'text-primary' : ''}`}
                >
                  Interview Guide
                </Link>
                <Link
                  href="/history"
                  className={`block w-full text-left text-foreground hover:text-primary transition-colors font-medium ${pathname === '/history' ? 'text-primary' : ''}`}
                >
                  History
                </Link>
                <Link
                  href="/features"
                  className={`block w-full text-left text-foreground hover:text-primary transition-colors font-medium ${pathname === '/features' ? 'text-primary' : ''}`}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className={`block w-full text-left text-foreground hover:text-primary transition-colors font-medium ${pathname === '/pricing' ? 'text-primary' : ''}`}
                >
                  Pricing
                </Link>
                <Link
                  href="/analytics"
                  className={`block w-full text-left text-foreground hover:text-primary transition-colors font-medium ${pathname === '/analytics' ? 'text-primary' : ''}`}
                >
                  Analytics Dashboard
                </Link>
              </>
            )}
            {!session?.user && (
              <>
                <button
                  onClick={() => scrollToSection("features")}
                  className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium"
                >
                  Pricing
                </button>
              </>
            )}
            {session?.user ? (
              <div className="space-y-2">
                <Button variant="ghost" className="w-full bg-transparent border border-slate-700/50 text-white hover:bg-slate-800/30 backdrop-blur-sm" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
                <Button variant="ghost" className="w-full bg-transparent border border-slate-700/50 text-white hover:bg-slate-800/30 backdrop-blur-sm" asChild>
                  <Link href="/billing">Billing</Link>
                </Button>
                <Button variant="ghost" className="w-full bg-transparent border border-slate-700/50 text-white hover:bg-slate-800/30 backdrop-blur-sm" onClick={() => signOut()}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="hero" className="w-full" onClick={handleSubmit}>
                Sign In
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
