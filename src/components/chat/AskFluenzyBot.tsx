"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  ChevronRight,
  Bot,
  User,
  Copy,
  Check,
  Lightbulb,
  X,
  ArrowLeft,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface AskFluenzyBotProps {
  userName?: string;
  context?: string;
  onBack?: () => void;
  isMobile?: boolean;
}

// ─── Quick Prompt Chips ────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: "🎯 Interview Tips", prompt: "How do I crack Google's technical interview in 2025?" },
  { label: "🗣️ GD Strategy", prompt: "Best strategies to excel in Group Discussion for campus placements?" },
  { label: "📄 Resume Help", prompt: "How do I optimize my resume for ATS systems?" },
  { label: "💬 English Fluency", prompt: "Give me practical tips to improve my spoken English confidence fast." },
  { label: "🧠 Mock Question", prompt: "Give me a challenging system design interview question with hints." },
  { label: "📊 Career Path", prompt: "How should I plan my career if I want to become a product manager?" },
];

// ─── Copy Button Component ─────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors flex-shrink-0"
      title="Copy response"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isLast }: { msg: ChatMessage; isLast: boolean }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="flex items-end gap-2 max-w-[82%]">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
            }}
          >
            {msg.content}
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mb-0.5">
            <User size={13} className="text-slate-300" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%]">
        {/* Bot Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
            boxShadow: "0 0 12px rgba(124,58,237,0.5)",
          }}
        >
          <Sparkles size={13} className="text-white" />
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          {msg.isTyping ? (
            <div className="px-4 py-3 bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-sm">
                <div className="text-sm text-slate-200 leading-relaxed prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-semibold prose-headings:my-2
                  prose-p:my-1.5 prose-p:text-slate-200
                  prose-strong:text-purple-300 prose-strong:font-semibold
                  prose-ul:my-1.5 prose-ol:my-1.5
                  prose-li:my-0.5 prose-li:text-slate-200
                  prose-code:text-purple-300 prose-code:bg-purple-900/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
                  prose-blockquote:border-l-purple-500 prose-blockquote:text-slate-400
                ">
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
              {isLast && (
                <div className="flex items-center gap-1 px-1">
                  <CopyButton text={msg.content} />
                  <span className="text-[10px] text-slate-600">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AskFluenzyBot({ userName, context, onBack, isMobile }: AskFluenzyBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setError(null);
    setShowWelcome(false);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    const typingMsg: ChatMessage = {
      id: `typing-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      // Build history from current messages (exclude typing indicator)
      const history = messages
        .filter((m) => !m.isTyping)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/ask-fluenzy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText.trim(),
          history,
          context,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      // Replace typing indicator with real message
      setMessages((prev) => [...prev.filter((m) => !m.isTyping), botMsg]);
      setSuggestions(data.suggestions || []);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setError(errMsg);
      setMessages((prev) => prev.filter((m) => !m.isTyping));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, context]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setSuggestions([]);
    setShowWelcome(true);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/5"
        style={{ background: "rgba(15,14,30,0.95)" }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
            boxShadow: "0 0 16px rgba(124,58,237,0.5)",
          }}
        >
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-sm leading-tight">Fluenzy AI</h2>
          <p className="text-[11px] text-purple-400 leading-tight">Enterprise Career Assistant</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-slate-500 hidden sm:block">Online</span>
        </div>
        <button
          onClick={handleClearChat}
          title="Clear chat"
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4 scroll-smooth" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(124,58,237,0.2) transparent" }}>
        {/* Welcome Screen */}
        <AnimatePresence>
          {showWelcome && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center pt-4 sm:pt-8 pb-2 gap-4"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.2))",
                  border: "1px solid rgba(124,58,237,0.3)",
                  boxShadow: "0 0 32px rgba(124,58,237,0.2)",
                }}
              >
                <Sparkles size={28} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Namaste{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
                </h3>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  I'm your personal Fluenzy AI Career Assistant. Ask me anything about interviews, GD, resume, English fluency, or your career!
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="w-full max-w-sm grid grid-cols-2 gap-2 mt-2">
                {QUICK_PROMPTS.slice(0, 4).map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qp.prompt)}
                    className="text-left p-3 rounded-xl text-xs text-slate-300 border border-white/8 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-200 leading-snug"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Capabilities hint */}
              <div
                className="flex items-start gap-2 text-left p-3 rounded-xl w-full max-w-sm"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}
              >
                <Lightbulb size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  I can help with <strong className="text-purple-300">Interview Prep</strong>, <strong className="text-purple-300">GD Strategy</strong>, <strong className="text-purple-300">Resume ATS</strong>, <strong className="text-purple-300">English Fluency</strong>, and <strong className="text-purple-300">Career Planning</strong>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isLast={idx === messages.length - 1}
          />
        ))}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-400 border border-red-500/20"
              style={{ background: "rgba(239,68,68,0.05)" }}
            >
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Follow-up Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1.5"
            >
              <p className="text-[10px] text-slate-600 px-1">Continue with:</p>
              {suggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSuggestions([]);
                    sendMessage(s);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <ChevronRight size={12} className="text-purple-500 flex-shrink-0" />
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 sm:px-4 py-3 border-t border-white/5" style={{ background: "rgba(15,14,30,0.95)" }}>
        <div
          className="flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all duration-200 focus-within:border-purple-500/50"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Bot size={16} className="text-purple-500 flex-shrink-0 mb-1.5" />
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your career..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 resize-none outline-none leading-relaxed py-0.5"
            style={{ maxHeight: "120px", minHeight: "24px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !isLoading
                ? "linear-gradient(135deg, #7C3AED, #6D28D9)"
                : "rgba(124,58,237,0.15)",
            }}
          >
            {isLoading ? (
              <Loader2 size={14} className="text-purple-300 animate-spin" />
            ) : (
              <Send size={14} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-700 mt-1.5">
          Powered by Gemini AI • Press Enter to send
        </p>
      </div>
    </div>
  );
}
