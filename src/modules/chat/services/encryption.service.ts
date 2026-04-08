// E2E Encryption Service
// Implements X25519 key exchange and XChaCha20-Poly1305 encryption
// ═══════════════════════════════════════════════════════════════════════════════

import prisma from "@/lib/prisma";
import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

// ─── KEY TYPES ──────────────────────────────────────────────────────────────────

export interface KeyPair {
  publicKey: string;     // Base64 encoded
  secretKey: string;     // Base64 encoded (never send to server!)
}

export interface IdentityKeyPair {
  identityKey: KeyPair;
  signedPreKey: KeyPair;
  preKeySignature: string;
  oneTimePreKeys: KeyPair[];
}

export interface PublicKeyBundle {
  identityKey: string;
  signedPreKey: string;
  preKeySignature: string;
  oneTimePreKey?: string;
}

export interface EncryptedMessage {
  ciphertext: string;  // Base64 encoded
  nonce: string;       // Base64 encoded
  keyVersion?: number;
}

export interface EncryptedMediaKey {
  encryptedKey: string;  // Base64 encoded
  nonce: string;
}

// ─── KEY GENERATION ────────────────────────────────────────────────────────────

/**
 * Generate a new X25519 key pair
 */
export function generateKeyPair(): KeyPair {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey)
  };
}

/**
 * Generate Ed25519 signing key pair for identity verification
 */
export function generateSigningKeyPair(): KeyPair {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey)
  };
}

/**
 * Generate complete identity key bundle for a device
 */
export function generateIdentityKeyBundle(numOneTimeKeys: number = 20): IdentityKeyPair {
  // Identity key (long-term)
  const identityKey = generateSigningKeyPair();
  
  // Signed pre-key (medium-term, signed by identity key)
  const signedPreKey = generateKeyPair();
  const signedPreKeyBytes = decodeBase64(signedPreKey.publicKey);
  const identitySecretKey = decodeBase64(identityKey.secretKey);
  const preKeySignature = encodeBase64(nacl.sign.detached(signedPreKeyBytes, identitySecretKey));
  
  // One-time pre-keys (single use)
  const oneTimePreKeys: KeyPair[] = [];
  for (let i = 0; i < numOneTimeKeys; i++) {
    oneTimePreKeys.push(generateKeyPair());
  }
  
  return {
    identityKey,
    signedPreKey,
    preKeySignature,
    oneTimePreKeys
  };
}

/**
 * Generate a symmetric key for message encryption
 */
export function generateSymmetricKey(): string {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  return encodeBase64(key);
}

/**
 * Generate a random nonce for encryption
 */
export function generateNonce(): string {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  return encodeBase64(nonce);
}

// ─── ENCRYPTION / DECRYPTION ──────────────────────────────────────────────────

/**
 * Encrypt a message using symmetric encryption (XSalsa20-Poly1305)
 */
export function encryptWithSymmetricKey(
  plaintext: string, 
  keyBase64: string
): EncryptedMessage {
  const key = decodeBase64(keyBase64);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = new TextEncoder().encode(plaintext);
  
  const ciphertext = nacl.secretbox(messageBytes, nonce, key);
  
  return {
    ciphertext: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce)
  };
}

/**
 * Decrypt a message using symmetric encryption
 */
export function decryptWithSymmetricKey(
  ciphertextBase64: string,
  nonceBase64: string,
  keyBase64: string
): string | null {
  try {
    const ciphertext = decodeBase64(ciphertextBase64);
    const nonce = decodeBase64(nonceBase64);
    const key = decodeBase64(keyBase64);
    
    const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
    if (!plaintext) return null;
    
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

/**
 * Encrypt data for a specific recipient using their public key (X25519)
 */
export function encryptForRecipient(
  plaintext: string,
  recipientPublicKeyBase64: string,
  senderSecretKeyBase64: string
): EncryptedMessage {
  const recipientPublicKey = decodeBase64(recipientPublicKeyBase64);
  const senderSecretKey = decodeBase64(senderSecretKeyBase64);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = new TextEncoder().encode(plaintext);
  
  const ciphertext = nacl.box(messageBytes, nonce, recipientPublicKey, senderSecretKey);
  
  return {
    ciphertext: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce)
  };
}

/**
 * Decrypt data received from a sender
 */
export function decryptFromSender(
  ciphertextBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string,
  recipientSecretKeyBase64: string
): string | null {
  try {
    const ciphertext = decodeBase64(ciphertextBase64);
    const nonce = decodeBase64(nonceBase64);
    const senderPublicKey = decodeBase64(senderPublicKeyBase64);
    const recipientSecretKey = decodeBase64(recipientSecretKeyBase64);
    
    const plaintext = nacl.box.open(ciphertext, nonce, senderPublicKey, recipientSecretKey);
    if (!plaintext) return null;
    
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

/**
 * Encrypt a symmetric key for multiple recipients
 */
export function encryptKeyForRecipients(
  symmetricKey: string,
  recipientPublicKeys: Record<string, string>, // userId -> publicKey
  senderSecretKey: string
): Record<string, EncryptedMediaKey> {
  const encryptedKeys: Record<string, EncryptedMediaKey> = {};
  
  for (const [userId, publicKey] of Object.entries(recipientPublicKeys)) {
    const encrypted = encryptForRecipient(symmetricKey, publicKey, senderSecretKey);
    encryptedKeys[userId] = {
      encryptedKey: encrypted.ciphertext,
      nonce: encrypted.nonce
    };
  }
  
  return encryptedKeys;
}

// ─── SIGNATURE VERIFICATION ───────────────────────────────────────────────────

/**
 * Verify a signature using Ed25519
 */
export function verifySignature(
  messageBase64: string,
  signatureBase64: string,
  publicKeyBase64: string
): boolean {
  try {
    const message = decodeBase64(messageBase64);
    const signature = decodeBase64(signatureBase64);
    const publicKey = decodeBase64(publicKeyBase64);
    
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

// ─── DATABASE OPERATIONS ──────────────────────────────────────────────────────

/**
 * Register encryption keys for a user's device
 */
export async function registerDeviceKeys(
  userId: string,
  deviceId: string,
  publicKey: string,
  identityKey: string,
  signedPreKey: string,
  preKeySignature: string,
  oneTimePreKeys: string[] = []
): Promise<void> {
  await prisma.userEncryptionKey.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    create: {
      userId,
      deviceId,
      publicKey,
      identityKey,
      signedPreKey,
      preKeySignature,
      oneTimePreKeys,
      isActive: true
    },
    update: {
      publicKey,
      identityKey,
      signedPreKey,
      preKeySignature,
      oneTimePreKeys,
      isActive: true,
      lastUsedAt: new Date()
    }
  });
}

/**
 * Get a user's public keys for encryption
 */
export async function getUserPublicKeys(userId: string): Promise<PublicKeyBundle | null> {
  const key = await prisma.userEncryptionKey.findFirst({
    where: { userId, isActive: true },
    orderBy: { lastUsedAt: 'desc' }
  });
  
  if (!key) return null;
  
  // Use and remove a one-time pre-key if available
  let oneTimePreKey: string | undefined;
  if (key.oneTimePreKeys.length > 0) {
    oneTimePreKey = key.oneTimePreKeys[0];
    // Remove used one-time key
    await prisma.userEncryptionKey.update({
      where: { id: key.id },
      data: {
        oneTimePreKeys: key.oneTimePreKeys.slice(1),
        lastUsedAt: new Date()
      }
    });
  }
  
  return {
    identityKey: key.identityKey,
    signedPreKey: key.signedPreKey,
    preKeySignature: key.preKeySignature,
    oneTimePreKey
  };
}

/**
 * Get public keys for multiple users
 */
export async function getMultipleUserPublicKeys(
  userIds: string[]
): Promise<Record<string, string>> {
  const keys = await prisma.userEncryptionKey.findMany({
    where: { 
      userId: { in: userIds },
      isActive: true 
    },
    select: {
      userId: true,
      publicKey: true
    }
  });
  
  return Object.fromEntries(keys.map(k => [k.userId, k.publicKey]));
}

/**
 * Create or rotate conversation encryption key
 */
export async function createConversationKey(
  conversationId: string,
  creatorId: string,
  creatorSecretKey: string
): Promise<{ symmetricKey: string; version: number }> {
  // Get all participants
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true }
  });
  
  // Get their public keys
  const publicKeys = await getMultipleUserPublicKeys(
    participants.map(p => p.userId)
  );
  
  // Generate new symmetric key
  const symmetricKey = generateSymmetricKey();
  
  // Encrypt for each participant
  const keyDistribution = encryptKeyForRecipients(
    symmetricKey,
    publicKeys,
    creatorSecretKey
  );
  
  // Get current version
  const currentVersion = await prisma.conversationKey.count({
    where: { conversationId }
  });
  const newVersion = currentVersion + 1;
  
  // Store encrypted keys
  await prisma.conversationKey.create({
    data: {
      conversationId,
      version: newVersion,
      encryptedKey: symmetricKey,
      keyDistribution: keyDistribution as any,
      createdBy: creatorId
    }
  });
  
  return { symmetricKey, version: newVersion };
}

/**
 * Get the latest conversation key for a user
 */
export async function getConversationKey(
  conversationId: string,
  userId: string,
  userSecretKey: string,
  senderPublicKey: string
): Promise<{ key: string; version: number } | null> {
  const convKey = await prisma.conversationKey.findFirst({
    where: { conversationId },
    orderBy: { version: 'desc' }
  });
  
  if (!convKey) return null;
  
  const distribution = convKey.keyDistribution as unknown as Record<string, EncryptedMediaKey>;
  const userEncryptedKey = distribution[userId];
  
  if (!userEncryptedKey) return null;
  
  // Decrypt the symmetric key
  const symmetricKey = decryptFromSender(
    userEncryptedKey.encryptedKey,
    userEncryptedKey.nonce,
    senderPublicKey,
    userSecretKey
  );
  
  if (!symmetricKey) return null;
  
  return { key: symmetricKey, version: convKey.version };
}

/**
 * Check if a user has encryption keys set up
 */
export async function hasEncryptionKeys(userId: string): Promise<boolean> {
  const count = await prisma.userEncryptionKey.count({
    where: { userId, isActive: true }
  });
  return count > 0;
}

/**
 * Deactivate keys for a device (logout)
 */
export async function deactivateDeviceKeys(
  userId: string,
  deviceId: string
): Promise<void> {
  await prisma.userEncryptionKey.updateMany({
    where: { userId, deviceId },
    data: { isActive: false }
  });
}
