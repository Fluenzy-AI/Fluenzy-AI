"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  category: string;
  type: "article" | "faq";
  url: string;
}

interface HelpSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  quickLinks?: { label: string; href: string }[];
  searchData?: SearchResult[];
}

export default function HelpSearchBar({
  placeholder = "Search articles, guides, topics...",
  onSearch,
  quickLinks,
  searchData = [],
}: HelpSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter results
  useEffect(() => {
    if (query.length > 2) {
      const filtered = searchData.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered.slice(0, 5));
    } else {
      setResults([]);
    }
    onSearch?.(query);
  }, [query, searchData, onSearch]);

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-purple-500/30 text-white px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div
          className={`relative flex items-center h-14 bg-[#0F172A] border rounded-xl transition-all duration-200 ${
            isFocused
              ? "border-purple-500 shadow-[0_0_0_3px_rgba(124,58,237,0.3)]"
              : "border-[#1E293B]"
          }`}
        >
          <Search className="w-5 h-5 text-slate-500 ml-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            aria-label="Search help articles"
            className="flex-1 h-full bg-transparent text-white px-4 outline-none placeholder:text-slate-500"
          />
          <div className="hidden sm:flex items-center gap-1 mr-4 px-2 py-1 rounded bg-[#1E293B] text-slate-500 text-xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {isFocused && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#0F172A] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.url}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-purple-500/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    {result.type === "faq" ? "❓" : "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">
                      {highlightMatch(result.title)}
                    </div>
                    <div className="text-xs text-slate-500">{result.category}</div>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}

          {isFocused && query.length > 2 && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 p-8 bg-[#0F172A] border border-[#1E293B] rounded-xl text-center"
            >
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-slate-400">No results found for "{query}"</div>
              <div className="text-sm text-slate-500 mt-1">
                Try different keywords or browse categories below
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Links */}
      {quickLinks && quickLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {quickLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className="px-4 py-2 text-sm text-slate-400 border border-[#1E293B] rounded-full 
                         hover:border-purple-500/50 hover:text-purple-400 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
