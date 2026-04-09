"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  FileText,
  Video,
  Smile,
  X,
  StopCircle,
  Loader2
} from "lucide-react";
import { useEncryption } from "@/hooks/useEncryption";

interface ChatInputProps {
  onSend: (content: string, type?: string, mediaMeta?: any, encrypted?: { encryptedContent: string; nonce: string; keyVersion: number }) => void;
  conversationId: string;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  replyingTo?: { id: string; content: string; senderName: string } | null;
  onCancelReply?: () => void;
}

export function ChatInput({ 
  onSend, 
  conversationId,
  onTyping,
  disabled = false,
  replyingTo,
  onCancelReply
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isReady, isEnabled, encryptText } = useEncryption();

  // Handle typing indicator
  useEffect(() => {
    if (message.length > 0) {
      onTyping?.(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
      }, 3000);
    } else {
      onTyping?.(false);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, onTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!message.trim() || disabled) return;

    const text = message.trim();
    let encrypted = undefined;

    // Always encrypt messages
    if (isEnabled && isReady) {
      try {
        const result = await encryptText(text, conversationId);
        if (result) {
          encrypted = result;
        }
      } catch (error) {
        console.error("Encryption failed, sending unencrypted:", error);
      }
    }

    onSend(text, 'TEXT', undefined, encrypted);
    setMessage("");
    onTyping?.(false);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [message, disabled, onSend, onTyping, isEnabled, isReady, encryptText, conversationId]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileType = getFileType(file.type);
    
    setIsUploading(true);
    setUploadProgress(0);
    setShowAttachMenu(false);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        
        const mediaMeta: any = {
          fileName: file.name,
          size: formatFileSize(file.size),
          mimeType: file.type
        };

        // Get dimensions for images/videos
        if (fileType === 'IMAGE') {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          await new Promise((resolve) => {
            img.onload = () => {
              mediaMeta.width = img.width;
              mediaMeta.height = img.height;
              resolve(null);
            };
          });
        }

        onSend(data.url, fileType, mediaMeta);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Upload voice message
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, 'voice-message.webm');
          formData.append('type', 'VOICE');

          const res = await fetch('/api/chat/upload', {
            method: 'POST',
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            onSend(data.url, 'VOICE', {
              duration: recordingTime,
              mimeType: 'audio/webm'
            });
          }
        } catch (error) {
          console.error("Voice upload failed:", error);
        } finally {
          setIsUploading(false);
          setRecordingTime(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Update recording time
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorder.addEventListener('stop', () => {
        clearInterval(interval);
      });

    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Emoji picker
  const commonEmojis = ['😀', '😂', '❤️', '👍', '🙏', '🎉', '🔥', '✨', '💯', '👋'];

  return (
    <div className="border-t border-white/5 bg-slate-900/50 flex-shrink-0">
      {/* Reply preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-3 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg border-l-2 border-purple-500">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-400">Replying to {replyingTo.senderName}</p>
                <p className="text-sm text-slate-300 truncate">{replyingTo.content}</p>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-3 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              <div className="flex-1">
                <p className="text-sm text-slate-300">Uploading...</p>
                <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 pt-3 flex items-end gap-2">
        {/* Recording UI */}
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-2xl">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono">
              {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
            </span>
            <div className="flex-1 flex items-center gap-0.5 h-6">
              {Array(30).fill(0).map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-purple-500 rounded-full animate-pulse"
                  style={{ 
                    height: `${Math.random() * 20 + 4}px`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>
            <button
              onClick={cancelRecording}
              className="p-2 rounded-full hover:bg-white/10 text-red-400"
            >
              <X size={20} />
            </button>
            <button
              onClick={stopRecording}
              className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white"
            >
              <StopCircle size={20} />
            </button>
          </div>
        ) : (
          <>
            {/* Attachment button */}
            <div className="relative">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                disabled={disabled}
                className="p-3 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <Paperclip size={20} />
              </button>

              {/* Attachment menu */}
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-2 p-2 bg-slate-800 rounded-xl border border-white/10 shadow-xl"
                  >
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          fileInputRef.current?.setAttribute('accept', 'image/*');
                          fileInputRef.current?.click();
                        }}
                        className="p-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 transition-colors"
                      >
                        <ImageIcon size={20} />
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current?.setAttribute('accept', 'video/*');
                          fileInputRef.current?.click();
                        }}
                        className="p-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                      >
                        <Video size={20} />
                      </button>
                      <button
                        onClick={() => {
                          fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx,.txt,.xls,.xlsx');
                          fileInputRef.current?.click();
                        }}
                        className="p-3 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors"
                      >
                        <FileText size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Message input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={disabled}
                rows={1}
                className="w-full px-4 py-3 bg-slate-800 border border-white/5 rounded-2xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
              />
            </div>

            {/* Emoji button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className="p-3 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <Smile size={20} />
              </button>

              {/* Emoji picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-2 p-2 bg-slate-800 rounded-xl border border-white/10 shadow-xl"
                  >
                    <div className="grid grid-cols-5 gap-1">
                      {commonEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Send / Record button */}
            {message.trim() ? (
              <button
                onClick={handleSend}
                disabled={disabled}
                className="p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="p-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50"
              >
                <Mic size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'VOICE';
  return 'DOCUMENT';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
