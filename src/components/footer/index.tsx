"use client";
import React from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, Mail } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-1 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 shadow-md shadow-red-500/20 border border-red-500/30 flex items-center justify-center">
                <img
                  src="/favicon/wthem.png"
                  alt="Fluenzy AI Logo"
                  className="h-8 w-auto rounded-lg object-contain"
                />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-red-600 to-rose-600 !bg-clip-text text-transparent tracking-tight">
                Fluenzy AI
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              Fluenzy AI is an AI-powered training platform helping learners master communication, interviews, and professional confidence.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Fluenzy AI. All rights reserved.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Train Now
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Training Modules
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/hirelens" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  HireLens Device
                </Link>
              </li>
              <li>
                <Link href="/company-portal" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  Company Portal
                </Link>
              </li>
              <li>
                <Link href="/college-portal" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  College Portal
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/return-and-refund-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Return & Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  FAQs
                </Link>
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-muted-foreground text-sm mb-2">Email Support:</p>
              <a
                href="mailto:support@fluenzyai.app"
                className="text-primary hover:text-primary/80 transition-colors text-sm flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                support@fluenzyai.app
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="pt-8 border-t border-slate-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <span>for learners</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Powered by AI Magic</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
