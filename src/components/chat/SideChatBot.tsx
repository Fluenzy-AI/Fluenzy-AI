"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Minus,
  Send,
  RotateCcw,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const DEFAULT_SUGGESTIONS = [
  "Practice Technical & HR Interview",
  "Group Discussion (GD) Strategies",
  "Resume ATS Optimization",
  "English Communication & Fluency"
];

// Returns theme-specific style tokens with 100% crisp visibility for all 6 Fluenzy AI themes
const getChatThemeStyles = (themeName: string) => {
  switch (themeName) {
    case "light":
      return {
        windowBg: "bg-white border-purple-200 text-slate-900 shadow-[0_20px_60px_rgba(124,58,237,0.18)]",
        headerBg: "bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 text-white",
        headerText: "text-white font-bold",
        headerSubText: "text-purple-100/90 font-medium",
        headerIcon: "text-white/90 hover:text-white hover:bg-white/15",
        bodyBg: "bg-slate-50 text-slate-900",
        userBubble: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-medium",
        aiBubble: "bg-white text-slate-900 border border-slate-200 shadow-sm",
        boldText: "font-bold text-purple-900 bg-purple-100/90 px-1.5 py-0.5 rounded border border-purple-200/80",
        italicText: "italic text-purple-700 font-medium",
        bullet: "text-purple-600 font-bold",
        inputContainer: "bg-white border-slate-300 focus-within:border-purple-600 text-slate-900 shadow-inner",
        inputText: "text-slate-900 placeholder-slate-400 font-medium",
        inputFooter: "bg-slate-100 border-t border-slate-200",
        pillBtn: "border-slate-300 bg-white hover:bg-purple-50 hover:border-purple-400 text-slate-900 font-bold shadow-xs",
        pillArrow: "text-purple-600 group-hover:text-purple-800",
        subText: "text-slate-600 font-medium",
        sendBtn: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm"
      };
    case "parchment":
      return {
        windowBg: "bg-[#F4F1EA] border-[#D5CEBF] text-[#291B14] shadow-2xl",
        headerBg: "bg-gradient-to-r from-[#3A2218] via-[#523223] to-[#3A2218] text-white",
        headerText: "text-white font-bold",
        headerSubText: "text-amber-200/90 font-medium",
        headerIcon: "text-amber-100 hover:text-white hover:bg-white/15",
        bodyBg: "bg-[#F4F1EA] text-[#291B14]",
        userBubble: "bg-[#7A2E1E] text-white shadow-md font-medium",
        aiBubble: "bg-[#FCFBF8] text-[#291B14] border border-[#E2DAD0] shadow-sm",
        boldText: "font-bold text-[#7A2E1E] bg-[#F0E8D9] px-1.5 py-0.5 rounded border border-[#DCD3C3]",
        italicText: "italic text-[#8C4328] font-medium",
        bullet: "text-[#9A3412] font-bold",
        inputContainer: "bg-[#FCFBF8] border-[#D8D0C0] focus-within:border-[#7A2E1E] text-[#291B14] shadow-inner",
        inputText: "text-[#291B14] placeholder-[#8C8275] font-medium",
        inputFooter: "bg-[#EAE5D9] border-t border-[#D5CEBF]",
        pillBtn: "border-[#D5CEBF] bg-[#FCFBF8] hover:bg-[#EAE5D9] hover:border-[#7A2E1E]/60 text-[#3A2218] font-bold shadow-xs",
        pillArrow: "text-[#7A2E1E] group-hover:text-[#523223]",
        subText: "text-[#6E6458] font-medium",
        sendBtn: "bg-[#7A2E1E] hover:bg-[#632316] text-white shadow-sm"
      };
    case "forest":
      return {
        windowBg: "bg-[#0b140e] border-emerald-800/40 text-[#e8e4d9] shadow-2xl",
        headerBg: "bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-emerald-100",
        headerText: "text-emerald-100 font-bold",
        headerSubText: "text-emerald-200/80 font-medium",
        headerIcon: "text-emerald-200 hover:text-white hover:bg-white/15",
        bodyBg: "bg-[#0b140e] text-[#e8e4d9]",
        userBubble: "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md font-medium",
        aiBubble: "bg-[#111c14] text-[#e8e4d9] border border-emerald-900/50 shadow-sm",
        boldText: "font-bold text-amber-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-800/60",
        italicText: "italic text-emerald-300 font-medium",
        bullet: "text-amber-400 font-bold",
        inputContainer: "bg-[#111c14] border-emerald-900/60 focus-within:border-emerald-500 text-white",
        inputText: "text-emerald-100 placeholder-emerald-600/70 font-medium",
        inputFooter: "bg-[#070e09] border-t border-emerald-950",
        pillBtn: "border-emerald-900/60 bg-[#111c14] hover:bg-emerald-900/40 text-emerald-100 font-bold shadow-xs",
        pillArrow: "text-emerald-500 group-hover:text-amber-300",
        subText: "text-emerald-400/80 font-medium",
        sendBtn: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm"
      };
    case "codeterm":
      return {
        windowBg: "bg-[#0D0D0D] border-[#CC4125]/30 text-[#F0EDE8] shadow-2xl",
        headerBg: "bg-gradient-to-r from-zinc-950 via-red-950 to-zinc-900 text-orange-200 border-b border-red-900/40",
        headerText: "text-orange-200 font-bold",
        headerSubText: "text-orange-300/80 font-medium",
        headerIcon: "text-orange-200 hover:text-white hover:bg-white/15",
        bodyBg: "bg-[#0D0D0D] text-[#F0EDE8]",
        userBubble: "bg-[#CC4125] text-white shadow-md font-medium",
        aiBubble: "bg-[#141414] text-[#F0EDE8] border border-[#CC4125]/25 shadow-sm",
        boldText: "font-bold text-orange-300 bg-red-950/90 px-1.5 py-0.5 rounded border border-red-900/60",
        italicText: "italic text-orange-300 font-medium",
        bullet: "text-[#CC4125] font-bold",
        inputContainer: "bg-[#141414] border-[#CC4125]/40 focus-within:border-[#CC4125] text-white",
        inputText: "text-[#F0EDE8] placeholder-zinc-600 font-medium",
        inputFooter: "bg-[#050505] border-t border-zinc-900",
        pillBtn: "border-zinc-800 bg-[#141414] hover:bg-[#CC4125]/15 text-zinc-100 font-bold shadow-xs",
        pillArrow: "text-zinc-400 group-hover:text-orange-400",
        subText: "text-zinc-400 font-medium",
        sendBtn: "bg-[#CC4125] hover:bg-[#b5371e] text-white shadow-sm"
      };
    case "midnight":
      return {
        windowBg: "bg-[#0a1929] border-blue-900/50 text-white shadow-2xl",
        headerBg: "bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-blue-100",
        headerText: "text-blue-100 font-bold",
        headerSubText: "text-blue-200/80 font-medium",
        headerIcon: "text-blue-200 hover:text-white hover:bg-white/15",
        bodyBg: "bg-[#0a1929] text-white",
        userBubble: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-medium",
        aiBubble: "bg-[#0f2744] text-blue-50 border border-blue-800/40 shadow-sm",
        boldText: "font-bold text-sky-300 bg-blue-950/90 px-1.5 py-0.5 rounded border border-blue-800/60",
        italicText: "italic text-sky-300 font-medium",
        bullet: "text-sky-400 font-bold",
        inputContainer: "bg-[#0f2744] border-blue-800/60 focus-within:border-blue-500 text-white",
        inputText: "text-white placeholder-blue-300/50 font-medium",
        inputFooter: "bg-[#06101c] border-t border-blue-950",
        pillBtn: "border-blue-900/60 bg-[#0f2744] hover:bg-blue-900/40 text-blue-100 font-bold shadow-xs",
        pillArrow: "text-blue-400 group-hover:text-sky-300",
        subText: "text-blue-300/80 font-medium",
        sendBtn: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm"
      };
    case "dark":
    default:
      return {
        windowBg: "bg-[#18181b] border-white/10 text-white shadow-2xl",
        headerBg: "bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 text-white",
        headerText: "text-white font-bold",
        headerSubText: "text-purple-200/90 font-medium",
        headerIcon: "text-white/90 hover:text-white hover:bg-white/15",
        bodyBg: "bg-[#18181b] text-white",
        userBubble: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-medium",
        aiBubble: "bg-zinc-800/95 text-zinc-100 border border-white/5 shadow-md",
        boldText: "font-bold text-purple-200 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40",
        italicText: "italic text-purple-300 font-medium",
        bullet: "text-purple-400 font-bold",
        inputContainer: "bg-zinc-900 border-zinc-700/70 focus-within:border-purple-500/80 text-white",
        inputText: "text-white placeholder-zinc-500 font-medium",
        inputFooter: "bg-zinc-950 border-t border-zinc-800",
        pillBtn: "border-zinc-700 bg-zinc-900/80 hover:bg-purple-950/40 hover:border-purple-500/60 text-zinc-200 font-bold shadow-xs",
        pillArrow: "text-zinc-400 group-hover:text-purple-400",
        subText: "text-zinc-400 font-medium",
        sendBtn: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm"
      };
  }
};

// Helper to format **bold** text, *italics*, bullets and paragraphs cleanly with theme colors
function renderFormattedMessage(content: string, styles: ReturnType<typeof getChatThemeStyles>) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1 text-xs leading-relaxed font-sans">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={lIdx} className="h-1.5" />;
        }

        // Detect list items starting with * or - or •
        const isBullet = /^[*\-•]\s+/.test(trimmed);
        const lineText = isBullet ? trimmed.replace(/^[*\-•]\s+/, "") : line;

        // Split line by bold (**text**) and italic (*text*) markdown patterns
        const parts = lineText.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return (
              <strong key={pIdx} className={styles.boldText}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
              <em key={pIdx} className={styles.italicText}>
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 my-1 pl-1">
              <span className={`${styles.bullet} select-none text-[11px] shrink-0 mt-0.5`}>•</span>
              <div className="flex-1">{renderedLine}</div>
            </div>
          );
        }

        return <div key={lIdx}>{renderedLine}</div>;
      })}
    </div>
  );
}

export default function SideChatBot() {
  const { data: session } = useSession();
  const { resolvedTheme = "dark" } = useTheme();
  const styles = getChatThemeStyles(resolvedTheme);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to custom open event from anywhere in the app
  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      setIsOpen(true);
      setIsMinimized(false);
      if (e.detail?.initialMessage) {
        handleSend(e.detail.initialMessage);
      }
    };
    window.addEventListener("open-side-chatbot" as any, handleOpen);
    return () => window.removeEventListener("open-side-chatbot" as any, handleOpen);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/ai/ask-fluenzy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          context: "interview"
        })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.error || "Sorry, I ran into an issue getting a response. Please try again!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Network error. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Trigger Button (FAB) on desktop when chat is closed */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={`fixed bottom-6 right-6 z-[9990] hidden sm:flex items-center gap-2.5 px-4 py-3 rounded-full ${styles.sendBtn} shadow-lg border border-white/20 transition-all group`}
          aria-label="Open Fluenzy AI Assistant"
        >
          <div className="relative shrink-0">
            <img
              src="/white-removebg-preview1.png"
              alt="Fluenzy AI Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <span className="font-bold text-xs tracking-wide pr-1">Ask AI</span>
        </motion.button>
      )}

      {/* Floating Side Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`fixed right-3 sm:right-6 z-[9999] w-[350px] sm:w-[380px] max-w-[calc(100vw-24px)] ${styles.windowBg} rounded-2xl overflow-hidden flex flex-col ${isMinimized ? "bottom-20 sm:bottom-6 h-[60px]" : "bottom-20 sm:bottom-6 h-[520px] sm:h-[560px] max-h-[calc(100vh-100px)]"
              }`}
          >
            {/* Header Bar */}
            <div className={`${styles.headerBg} px-4 py-3 flex items-center justify-between shadow-md shrink-0 select-none`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src="/white-removebg-preview1.png"
                    alt="Fluenzy AI Logo"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-bold text-sm leading-tight truncate ${styles.headerText}`}>
                    Fluenzy AI Assistant
                  </h3>
                  <p className={`text-[10px] ${styles.headerSubText} leading-none mt-0.5`}>
                    Career Coach • Always Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {messages.length > 0 && !isMinimized && (
                  <button
                    onClick={resetChat}
                    title="Reset chat"
                    className={`p-1.5 rounded-lg ${styles.headerIcon} transition-colors`}
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Expand" : "Minimize"}
                  className={`p-1.5 rounded-lg ${styles.headerIcon} transition-colors`}
                >
                  {isMinimized ? <ChevronDown size={17} /> : <Minus size={17} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close assistant"
                  className={`p-1.5 rounded-lg ${styles.headerIcon} transition-colors`}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Content Body (Visible when not minimized) */}
            {!isMinimized && (
              <div className={`flex-1 flex flex-col overflow-hidden ${styles.bodyBg}`}>
                {/* Message Container / Initial Welcome Screen */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-6 px-2 space-y-5 animate-in fade-in duration-300">
                      {/* Fluenzy AI Official Bot Logo */}
                      <div className="relative">
                        <img
                          src="/white-removebg-preview1.png"
                          alt="Fluenzy AI Logo"
                          className="w-16 h-16 object-contain"
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                      </div>

                      {/* Welcome Greeting */}
                      <div className="space-y-1.5 max-w-[270px]">
                        <h4 className="font-bold text-base leading-snug">
                          Hi! I'm Fluenzy AI Assistant. How can I help you today?
                        </h4>
                        <p className={`text-[11px] ${styles.subText}`}>
                          Ask me anything about interviews, GD topics, ATS resume optimization or English fluency.
                        </p>
                      </div>

                      {/* Quick Action Pill Buttons */}
                      <div className="w-full flex flex-col items-center gap-2 pt-1">
                        {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSend(suggestion)}
                            className={`w-full py-2.5 px-4 rounded-full ${styles.pillBtn} text-xs transition-all text-center flex items-center justify-between group`}
                          >
                            <span className="truncate">{suggestion}</span>
                            <ArrowRight className={`w-3.5 h-3.5 ${styles.pillArrow} transition-colors shrink-0 ml-2`} />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Conversation Messages Feed */
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"
                          }`}
                      >
                        {msg.role === "assistant" && (
                          <img
                            src="/white-removebg-preview1.png"
                            alt="Fluenzy AI"
                            className="w-7 h-7 object-contain shrink-0 mt-1"
                          />
                        )}
                        <div
                          className={`group relative max-w-[84%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${msg.role === "user"
                              ? `${styles.userBubble} rounded-tr-xs`
                              : `${styles.aiBubble} rounded-tl-xs`
                            }`}
                        >
                          {msg.role === "assistant"
                            ? renderFormattedMessage(msg.content, styles)
                            : <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                          }
                          <span
                            className={`block text-[9px] mt-1.5 text-right ${msg.role === "user" ? "opacity-80" : styles.subText
                              }`}
                          >
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Loading indicator */}
                  {loading && (
                    <div className="flex gap-2.5 justify-start items-center animate-pulse">
                      <img
                        src="/white-removebg-preview1.png"
                        alt="Fluenzy AI"
                        className="w-7 h-7 object-contain shrink-0"
                      />
                      <div className={`${styles.aiBubble} rounded-2xl rounded-tl-xs px-4 py-3 text-xs flex items-center gap-1.5`}>
                        <span>Fluenzy AI thinking</span>
                        <span className="flex gap-1 items-center ml-1">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-0" />
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150" />
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-300" />
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Footer */}
                <div className={`${styles.inputFooter} border-t px-3 py-3 shrink-0`}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className={`flex items-center gap-3 w-full h-[60px] ${styles.inputContainer} rounded-2xl px-4 py-2.5 transition-all border shadow-sm`}
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message..."
                      className={`flex-1 text-sm sm:text-base ${styles.inputText} outline-none focus:outline-none border-0 focus:ring-0 w-full h-full font-medium`}
                      style={{
                        background: 'transparent',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        height: '100%',
                        width: '100%',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || loading}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${styles.sendBtn} disabled:opacity-40 transition-all shrink-0 active:scale-95 shadow-md`}
                    >
                      <Send size={19} />
                    </button>
                  </form>
                  <p className={`text-[10px] ${styles.subText} text-center pt-2 font-semibold tracking-wide opacity-80`}>
                    Powered by Fluenzy AI
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
