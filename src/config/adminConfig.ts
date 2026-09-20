/**
 * Authoritative Administrator Identity and Clearance Configuration
 * 
 * System Owner Credentials (strictly hardcoded per administrative specification):
 * - Primary Email: codydracula035@gmail.com
 * - Authoritative Firebase Auth UID: HxHGshHYdWY36dyBG3aSa6Sarik2
 */

export const ADMIN_CONFIG = {
  REQUIRED_EMAIL: 'codydracula035@gmail.com',
  REQUIRED_UID: 'HxHGshHYdWY36dyBG3aSa6Sarik2',
  SESSION_STORAGE_KEY: 'wf_admin_clearance_uid_verified',
} as const;

/**
 * Validates whether an email belongs to the authoritative system owner.
 */
export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_CONFIG.REQUIRED_EMAIL.toLowerCase();
}

/**
 * Validates whether the authenticated Firebase credentials match both the owner email AND the exact Firebase UID.
 */
export function isAuthoritativeAdmin(email?: string | null, uid?: string | null): boolean {
  if (!email || !uid) return false;
  return (
    email.trim().toLowerCase() === ADMIN_CONFIG.REQUIRED_EMAIL.toLowerCase() &&
    uid.trim() === ADMIN_CONFIG.REQUIRED_UID
  );
}

/**
 * Checks whether the current browser session has completed the 2-step UID challenge.
 */
export function hasSessionClearance(uid?: string | null): boolean {
  if (!uid || uid.trim() !== ADMIN_CONFIG.REQUIRED_UID) return false;
  try {
    const verifiedUid = sessionStorage.getItem(ADMIN_CONFIG.SESSION_STORAGE_KEY);
    return verifiedUid === ADMIN_CONFIG.REQUIRED_UID;
  } catch {
    return false;
  }
}

/**
 * Marks the active session as verified after successful 2-step UID authentication.
 */
export function storeSessionClearance(uid: string): void {
  try {
    sessionStorage.setItem(ADMIN_CONFIG.SESSION_STORAGE_KEY, uid.trim());
  } catch {
    // Session storage fallback
  }
}

/**
 * Clears administrative session clearance upon sign out or revocation.
 */
export function revokeSessionClearance(): void {
  try {
    sessionStorage.removeItem(ADMIN_CONFIG.SESSION_STORAGE_KEY);
  } catch {}
}
