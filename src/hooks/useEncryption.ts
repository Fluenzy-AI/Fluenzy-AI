"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  initializeEncryption,
  isEncryptionEnabled,
  getCurrentDeviceId,
  encryptMessage,
  decryptMessage,
  decryptMessages,
  initializeConversationEncryption,
  clearAllKeys
} from "@/lib/encryption-client";

interface UseEncryptionReturn {
  isReady: boolean;
  isEnabled: boolean;
  deviceId: string | null;
  encryptText: (text: string, conversationId: string) => Promise<EncryptedData | null>;
  decryptText: (encrypted: string, nonce: string, conversationId: string) => Promise<string | null>;
  decryptBatch: (messages: EncryptedMessage[]) => Promise<Map<string, string>>;
  initConversation: (conversationId: string) => Promise<boolean>;
  clearKeys: () => Promise<void>;
}

interface EncryptedData {
  encryptedContent: string;
  nonce: string;
  keyVersion: number;
}

interface EncryptedMessage {
  id: string;
  encryptedContent: string | null;
  nonce: string | null;
  conversationId: string;
  keyVersion?: number | null;
  content: string | null;
  isEncrypted: boolean;
}

/**
 * Hook for managing E2E encryption in chat
 */
export function useEncryption(): UseEncryptionReturn {
  const { data: session } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Initialize encryption on mount
  useEffect(() => {
    async function init() {
      if (!session?.user?.id) return;

      try {
        // Check if encryption is already enabled
        const enabled = await isEncryptionEnabled();
        
        if (!enabled) {
          // Initialize encryption for first time
          const newDeviceId = await initializeEncryption(session.user.id);
          setDeviceId(newDeviceId);
          setIsEnabled(true);
        } else {
          const currentDeviceId = getCurrentDeviceId();
          setDeviceId(currentDeviceId);
          setIsEnabled(true);
        }
      } catch (error) {
        console.error("Failed to initialize encryption:", error);
        setIsEnabled(false);
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, [session?.user?.id]);

  // Encrypt text message
  const encryptText = useCallback(async (
    text: string,
    conversationId: string
  ): Promise<EncryptedData | null> => {
    if (!isEnabled || !deviceId) return null;
    
    try {
      return await encryptMessage(text, conversationId, deviceId);
    } catch (error) {
      console.error("Encryption failed:", error);
      return null;
    }
  }, [isEnabled, deviceId]);

  // Decrypt text message
  const decryptText = useCallback(async (
    encrypted: string,
    nonce: string,
    conversationId: string
  ): Promise<string | null> => {
    if (!isEnabled) return null;
    
    try {
      return await decryptMessage(encrypted, nonce, conversationId);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  }, [isEnabled]);

  // Decrypt batch of messages
  const decryptBatch = useCallback(async (
    messages: EncryptedMessage[]
  ): Promise<Map<string, string>> => {
    if (!isEnabled) return new Map();
    
    try {
      return await decryptMessages(messages);
    } catch (error) {
      console.error("Batch decryption failed:", error);
      return new Map();
    }
  }, [isEnabled]);

  // Initialize conversation encryption
  const initConversation = useCallback(async (
    conversationId: string
  ): Promise<boolean> => {
    if (!isEnabled || !deviceId) return false;
    
    try {
      return await initializeConversationEncryption(conversationId, deviceId);
    } catch (error) {
      console.error("Failed to init conversation encryption:", error);
      return false;
    }
  }, [isEnabled, deviceId]);

  // Clear all encryption keys (on logout)
  const clearKeys = useCallback(async () => {
    try {
      await clearAllKeys();
      setIsEnabled(false);
      setDeviceId(null);
    } catch (error) {
      console.error("Failed to clear keys:", error);
    }
  }, []);

  return {
    isReady,
    isEnabled,
    deviceId,
    encryptText,
    decryptText,
    decryptBatch,
    initConversation,
    clearKeys
  };
}

/**
 * Hook to auto-decrypt messages as they arrive
 */
export function useMessageDecryption(messages: any[]) {
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const { isEnabled, decryptBatch } = useEncryption();

  useEffect(() => {
    async function decrypt() {
      if (!isEnabled || messages.length === 0) return;

      const encrypted = messages.filter(m => m.isEncrypted && m.encryptedContent);
      if (encrypted.length === 0) return;

      const decrypted = await decryptBatch(encrypted);
      setDecryptedMessages(decrypted);
    }

    decrypt();
  }, [messages, isEnabled, decryptBatch]);

  // Merge decrypted content with messages
  return messages.map(msg => {
    if (msg.isEncrypted && msg.encryptedContent) {
      const decrypted = decryptedMessages.get(msg.id);
      return {
        ...msg,
        content: decrypted || "[Encrypted - Failed to decrypt]"
      };
    }
    return msg;
  });
}
