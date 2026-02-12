// Agora token generation for GD sessions
// Using agora-token package

const APP_ID = process.env.AGORA_APP_ID || '';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

// Token expiration time in seconds (1 hour max for Agora)
const TOKEN_EXPIRATION = 3600;

// Import dynamically to avoid build issues
let RtcTokenBuilder: any;
let RtcRole: any;

async function loadAgoraToken() {
  if (!RtcTokenBuilder) {
    const agora = await import('agora-token');
    RtcTokenBuilder = agora.RtcTokenBuilder;
    RtcRole = agora.RtcRole;
  }
  return { RtcTokenBuilder, RtcRole };
}

export interface TokenResult {
  token: string;
  expiresAt: number;
  appId: string;
}

/**
 * Generate an Agora RTC token for a user joining a channel
 * Uses Secure Mode with App Certificate
 */
export async function generateGDToken(
  channelName: string,
  uid: number,
  role: 'publisher' | 'subscriber' = 'publisher'
): Promise<TokenResult> {
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new Error('Agora App ID or Certificate not configured');
  }

  const { RtcTokenBuilder, RtcRole } = await loadAgoraToken();

  // Ensure uid is a non-negative integer
  const accountUid = Math.abs(uid) >>> 0;
  
  // Set expiration time
  const currentTime = Math.floor(Date.now() / 1000);
  const tokenExpiration = currentTime + TOKEN_EXPIRATION;

  // Define privileges based on role
  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  // Build the token
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    accountUid,
    rtcRole,
    tokenExpiration
  );

  return {
    token,
    expiresAt: tokenExpiration,
    appId: APP_ID
  };
}

/**
 * Generate a token for a specific user in a GD session
 */
export async function generateUserToken(
  channelName: string,
  userId: string,
  participantIndex: number
): Promise<TokenResult> {
  // Use a hash of userId to create a consistent uid
  const uid = hashStringToUid(userId);
  return generateGDToken(channelName, uid, 'publisher');
}

/**
 * Hash a string to a non-negative integer uid
 */
function hashStringToUid(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Validate a channel name for security
 * Channel names should only contain letters, numbers, and underscores
 */
export function isValidChannelName(channelName: string): boolean {
  // Allow letters, numbers, underscores only (max 64 chars)
  const channelRegex = /^[a-zA-Z0-9_]{1,64}$/;
  return channelRegex.test(channelName);
}

/**
 * Check if Agora credentials are properly configured
 */
export function isAgoraConfigured(): boolean {
  return Boolean(APP_ID && APP_CERTIFICATE);
}

/**
 * Get Agora App ID for client-side use
 */
export function getAgoraAppId(): string {
  return APP_ID;
}
