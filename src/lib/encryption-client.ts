// Client-Side E2E Encryption Service
// Handles encryption/decryption in the browser
// ═══════════════════════════════════════════════════════════════════════════════

import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

// ─── KEY STORAGE (IndexedDB) ───────────────────────────────────────────────────

const DB_NAME = "fluenzy_e2e_keys";
const DB_VERSION = 1;
const KEY_STORE = "encryption_keys";

interface StoredKeyPair {
  deviceId: string;
  publicKey: string;
  secretKey: string; // NEVER send to server!
  identityKey: string;
  identitySecretKey: string;
  signedPreKey: string;
  signedPreKeySecret: string;
  createdAt: number;
}

interface ConversationKeyCache {
  conversationId: string;
  symmetricKey: string;
  version: number;
  updatedAt: number;
}

/**
 * Open IndexedDB for key storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: "deviceId" });
      }
      if (!db.objectStoreNames.contains("conversation_keys")) {
        db.createObjectStore("conversation_keys", { keyPath: "conversationId" });
      }
    };
  });
}

/**
 * Save key pair to IndexedDB
 */
export async function saveKeyPairLocal(keyPair: StoredKeyPair): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(KEY_STORE, "readwrite");
  const store = tx.objectStore(KEY_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.put(keyPair);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get key pair from IndexedDB
 */
export async function getKeyPairLocal(deviceId: string): Promise<StoredKeyPair | null> {
  const db = await openDB();
  const tx = db.transaction(KEY_STORE, "readonly");
  const store = tx.objectStore(KEY_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.get(deviceId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save conversation key to cache
 */
export async function saveConversationKeyLocal(cache: ConversationKeyCache): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("conversation_keys", "readwrite");
  const store = tx.objectStore("conversation_keys");
  
  return new Promise((resolve, reject) => {
    const request = store.put(cache);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get conversation key from cache
 */
export async function getConversationKeyLocal(conversationId: string): Promise<ConversationKeyCache | null> {
  const db = await openDB();
  const tx = db.transaction("conversation_keys", "readonly");
  const store = tx.objectStore("conversation_keys");
  
  return new Promise((resolve, reject) => {
    const request = store.get(conversationId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all encryption keys (logout)
 */
export async function clearAllKeys(): Promise<void> {
  const db = await openDB();
  
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KEY_STORE, "readwrite");
      const request = tx.objectStore(KEY_STORE).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }),
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction("conversation_keys", "readwrite");
      const request = tx.objectStore("conversation_keys").clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    })
  ]);
}

// ─── KEY GENERATION ────────────────────────────────────────────────────────────

/**
 * Generate device ID from browser fingerprint
 */
export function generateDeviceId(): string {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
    screen.colorDepth
  ].join("|");
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `device_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

/**
 * Initialize encryption for current device
 */
export async function initializeEncryption(userId: string): Promise<string> {
  const deviceId = generateDeviceId();
  
  // Check if keys already exist
  const existing = await getKeyPairLocal(deviceId);
  if (existing) return deviceId;
  
  // Generate new key pairs
  const keyPair = nacl.box.keyPair();
  const identityKeyPair = nacl.sign.keyPair();
  const signedPreKeyPair = nacl.box.keyPair();
  
  // Sign the pre-key with identity key
  const preKeySignature = nacl.sign.detached(signedPreKeyPair.publicKey, identityKeyPair.secretKey);
  
  // Generate one-time pre-keys
  const oneTimePreKeys: string[] = [];
  for (let i = 0; i < 20; i++) {
    const otpk = nacl.box.keyPair();
    oneTimePreKeys.push(encodeBase64(otpk.publicKey));
  }
  
  // Store locally
  const storedKeys: StoredKeyPair = {
    deviceId,
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
    identityKey: encodeBase64(identityKeyPair.publicKey),
    identitySecretKey: encodeBase64(identityKeyPair.secretKey),
    signedPreKey: encodeBase64(signedPreKeyPair.publicKey),
    signedPreKeySecret: encodeBase64(signedPreKeyPair.secretKey),
    createdAt: Date.now()
  };
  
  await saveKeyPairLocal(storedKeys);
  
  // Register with server (only public keys)
  await fetch("/api/chat/encryption/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId,
      publicKey: storedKeys.publicKey,
      identityKey: storedKeys.identityKey,
      signedPreKey: storedKeys.signedPreKey,
      preKeySignature: encodeBase64(preKeySignature),
      oneTimePreKeys
    })
  });
  
  return deviceId;
}

// ─── MESSAGE ENCRYPTION ────────────────────────────────────────────────────────

/**
 * Encrypt a text message
 */
export async function encryptMessage(
  plaintext: string,
  conversationId: string,
  deviceId: string
): Promise<{ encryptedContent: string; nonce: string; keyVersion: number } | null> {
  try {
    // Get or fetch conversation key
    let convKey = await getConversationKeyLocal(conversationId);
    
    if (!convKey) {
      // Fetch from server
      const res = await fetch(`/api/chat/encryption/conversation-key/${conversationId}`);
      if (!res.ok) return null;
      
      const data = await res.json();
      convKey = {
        conversationId,
        symmetricKey: data.key,
        version: data.version,
        updatedAt: Date.now()
      };
      
      await saveConversationKeyLocal(convKey);
    }
    
    // Encrypt with symmetric key
    const key = decodeBase64(convKey.symmetricKey);
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const messageBytes = new TextEncoder().encode(plaintext);
    
    const ciphertext = nacl.secretbox(messageBytes, nonce, key);
    
    return {
      encryptedContent: encodeBase64(ciphertext),
      nonce: encodeBase64(nonce),
      keyVersion: convKey.version
    };
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

/**
 * Decrypt a received message
 */
export async function decryptMessage(
  encryptedContent: string,
  nonce: string,
  conversationId: string,
  keyVersion?: number
): Promise<string | null> {
  try {
    // Get conversation key
    let convKey = await getConversationKeyLocal(conversationId);
    
    if (!convKey || (keyVersion && convKey.version !== keyVersion)) {
      // Fetch from server
      const res = await fetch(`/api/chat/encryption/conversation-key/${conversationId}`);
      if (!res.ok) return null;
      
      const data = await res.json();
      convKey = {
        conversationId,
        symmetricKey: data.key,
        version: data.version,
        updatedAt: Date.now()
      };
      
      await saveConversationKeyLocal(convKey);
    }
    
    // Decrypt
    const ciphertext = decodeBase64(encryptedContent);
    const nonceBytes = decodeBase64(nonce);
    const key = decodeBase64(convKey.symmetricKey);
    
    const plaintext = nacl.secretbox.open(ciphertext, nonceBytes, key);
    if (!plaintext) return null;
    
    return new TextDecoder().decode(plaintext);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

/**
 * Check if encryption is enabled for current device
 */
export async function isEncryptionEnabled(): Promise<boolean> {
  try {
    const deviceId = generateDeviceId();
    const keys = await getKeyPairLocal(deviceId);
    return !!keys;
  } catch {
    return false;
  }
}

/**
 * Get current device ID
 */
export function getCurrentDeviceId(): string {
  return generateDeviceId();
}

/**
 * Re-encrypt message for editing
 */
export async function reEncryptMessage(
  newPlaintext: string,
  conversationId: string,
  deviceId: string
): Promise<{ encryptedContent: string; nonce: string } | null> {
  const encrypted = await encryptMessage(newPlaintext, conversationId, deviceId);
  if (!encrypted) return null;
  
  return {
    encryptedContent: encrypted.encryptedContent,
    nonce: encrypted.nonce
  };
}

// ─── BULK OPERATIONS ───────────────────────────────────────────────────────────

/**
 * Decrypt multiple messages at once
 */
export async function decryptMessages(
  messages: Array<{
    id: string;
    encryptedContent: string | null;
    nonce: string | null;
    conversationId: string;
    keyVersion?: number | null;
    content: string | null;
    isEncrypted: boolean;
  }>
): Promise<Map<string, string>> {
  const decrypted = new Map<string, string>();
  
  // Group by conversation for efficiency
  const byConversation = new Map<string, typeof messages>();
  for (const msg of messages) {
    if (!msg.isEncrypted || !msg.encryptedContent || !msg.nonce) {
      // Plain text message
      if (msg.content) decrypted.set(msg.id, msg.content);
      continue;
    }
    
    const group = byConversation.get(msg.conversationId) || [];
    group.push(msg);
    byConversation.set(msg.conversationId, group);
  }
  
  // Decrypt by conversation
  for (const [conversationId, msgs] of byConversation) {
    // Pre-fetch conversation key once
    let convKey = await getConversationKeyLocal(conversationId);
    if (!convKey) {
      try {
        const res = await fetch(`/api/chat/encryption/conversation-key/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          convKey = {
            conversationId,
            symmetricKey: data.key,
            version: data.version,
            updatedAt: Date.now()
          };
          await saveConversationKeyLocal(convKey);
        }
      } catch {
        continue;
      }
    }
    
    if (!convKey) continue;
    
    // Decrypt all messages in this conversation
    for (const msg of msgs) {
      try {
        const plaintext = await decryptMessage(
          msg.encryptedContent!,
          msg.nonce!,
          conversationId,
          msg.keyVersion || undefined
        );
        
        if (plaintext) {
          decrypted.set(msg.id, plaintext);
        }
      } catch {
        // Skip failed decryptions
      }
    }
  }
  
  return decrypted;
}

// ─── CONVERSATION KEY MANAGEMENT ──────────────────────────────────────────────

/**
 * Initialize conversation encryption (called when starting a new conversation)
 */
export async function initializeConversationEncryption(
  conversationId: string,
  deviceId: string
): Promise<boolean> {
  try {
    const keys = await getKeyPairLocal(deviceId);
    if (!keys) return false;
    
    // Request server to create conversation key
    const res = await fetch("/api/chat/encryption/init-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        deviceId
      })
    });
    
    if (!res.ok) return false;
    
    const data = await res.json();
    
    // Cache the key locally
    await saveConversationKeyLocal({
      conversationId,
      symmetricKey: data.symmetricKey,
      version: data.version,
      updatedAt: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error("Failed to initialize conversation encryption:", error);
    return false;
  }
}

/**
 * Refresh conversation key (for key rotation or new members)
 */
export async function refreshConversationKey(conversationId: string): Promise<void> {
  try {
    const res = await fetch(`/api/chat/encryption/conversation-key/${conversationId}?refresh=true`);
    if (!res.ok) return;
    
    const data = await res.json();
    await saveConversationKeyLocal({
      conversationId,
      symmetricKey: data.key,
      version: data.version,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Failed to refresh conversation key:", error);
  }
}
