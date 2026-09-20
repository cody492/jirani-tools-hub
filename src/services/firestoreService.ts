import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, FirebaseUser } from './firebase';
import { InvestigationRecord } from '../types';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  birthAge?: string;
  photoURL?: string | null;
  signInMethod?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminInvestigationSummary {
  id: string;
  userId: string;
  userEmail: string;
  targetDomain: string;
  targetHostname: string;
  targetUrl: string;
  status: string;
  startedAt: string;
  createdAt?: string;
}

/**
 * Deeply sanitizes an object for Firestore by converting undefined to null or omitting undefined keys,
 * ensuring no 'Function DocumentReference.set() called with invalid data' errors.
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
}

/**
 * Syncs user profile in Firestore `users/{userId}` collection.
 * Creates profile if it doesn't exist, or updates lastLoginAt if it does.
 */
export async function syncUserProfile(
  user: FirebaseUser,
  extraData?: { birthAge?: string; displayName?: string; signInMethod?: string }
): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  // Detect sign in method from providerData or email domain
  const providerId = user.providerData?.[0]?.providerId;
  const detectedSignInMethod =
    extraData?.signInMethod ||
    (providerId === 'google.com'
      ? 'Google (Gmail)'
      : providerId === 'password'
      ? 'Email / Password'
      : user.email?.toLowerCase().endsWith('@gmail.com')
      ? 'Google (Gmail)'
      : 'Email / Password');

  try {
    const existingSnap = await getDoc(userRef);
    let profileData: UserProfileData;

    if (existingSnap.exists()) {
      const current = existingSnap.data() as UserProfileData;
      profileData = {
        ...current,
        email: user.email || current.email || '',
        displayName: extraData?.displayName || user.displayName || current.displayName || 'Forensic Investigator',
        photoURL: user.photoURL || current.photoURL || null,
        birthAge: extraData?.birthAge || current.birthAge || '',
        signInMethod: current.signInMethod || detectedSignInMethod,
        lastLoginAt: now,
      };
      await setDoc(userRef, sanitizeForFirestore(profileData), { merge: true });
    } else {
      profileData = {
        uid: user.uid,
        email: user.email || '',
        displayName: extraData?.displayName || user.displayName || user.email?.split('@')[0] || 'Forensic Investigator',
        birthAge: extraData?.birthAge || '',
        photoURL: user.photoURL || null,
        signInMethod: detectedSignInMethod,
        createdAt: now,
        lastLoginAt: now,
      };
      await setDoc(userRef, sanitizeForFirestore(profileData));
    }

    return profileData;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

/**
 * Loads a user profile from Firestore.
 */
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const userRef = doc(db, 'users', userId);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfileData;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
  }
}

/**
 * Persists full forensic investigation finding to Firestore `investigations/{recordId}` collection.
 * User-isolated: only the owner UID can read/write this document according to security rules.
 */
export async function saveInvestigationToFirestore(
  userId: string,
  userEmail: string,
  record: InvestigationRecord
): Promise<void> {
  const recordRef = doc(db, 'investigations', record.id);
  const now = new Date().toISOString();

  const payload = {
    id: record.id,
    userId,
    userEmail,
    targetDomain: record.target?.domain || '',
    targetHostname: record.target?.hostname || '',
    targetUrl: record.target?.normalizedUrl || '',
    target: record.target,
    status: record.status,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    durationMs: record.durationMs,
    engineVersion: record.engineVersion,
    // Core Forensics Modules (excluding relationship graph as instructed)
    httpIntelligence: record.httpIntelligence || null,
    infrastructureIntelligence: record.infrastructureIntelligence || null,
    technologyIntelligence: record.technologyIntelligence || null,
    securityIntelligence: record.securityIntelligence || null,
    error: record.error || null,
    createdAt: now,
  };

  try {
    await setDoc(recordRef, sanitizeForFirestore(payload));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `investigations/${record.id}`);
  }
}

/**
 * Deletes a single investigation record from Firestore.
 */
export async function deleteInvestigationFromFirestore(
  userId: string,
  recordId: string
): Promise<void> {
  const recordRef = doc(db, 'investigations', recordId);
  try {
    await deleteDoc(recordRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `investigations/${recordId}`);
  }
}

/**
 * Batch deletes all investigation records belonging to a user.
 */
export async function clearUserInvestigationsFromFirestore(userId: string): Promise<void> {
  const colRef = collection(db, 'investigations');
  const q = query(colRef, where('userId', '==', userId));

  try {
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `investigations (user=${userId})`);
  }
}

/**
 * Loads all investigations belonging to the logged-in user from Firestore.
 */
export async function loadUserInvestigationsFromFirestore(
  userId: string
): Promise<InvestigationRecord[]> {
  const colRef = collection(db, 'investigations');
  const q = query(colRef, where('userId', '==', userId));

  try {
    const snap = await getDocs(q);
    const records: InvestigationRecord[] = [];

    snap.forEach((d) => {
      const data = d.data();
      records.push({
        id: data.id,
        target: data.target,
        startedAt: data.startedAt,
        completedAt: data.completedAt || null,
        status: data.status,
        durationMs: data.durationMs || 0,
        engineVersion: data.engineVersion || '0.6.0',
        httpIntelligence: data.httpIntelligence || null,
        infrastructureIntelligence: data.infrastructureIntelligence || null,
        technologyIntelligence: data.technologyIntelligence || null,
        securityIntelligence: data.securityIntelligence || null,
        error: data.error || null,
      });
    });

    // Sort descending by startedAt
    records.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return records;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'investigations');
  }
}

/**
 * Loads all registered users from the Firestore `users` collection.
 * Restricted to authoritative Admin clearance.
 */
export async function loadAllUsersForAdmin(): Promise<UserProfileData[]> {
  const colRef = collection(db, 'users');
  try {
    const snap = await getDocs(colRef);
    const users: UserProfileData[] = [];
    snap.forEach((d) => {
      const data = d.data() as UserProfileData;
      users.push({
        uid: data.uid || d.id,
        email: data.email || '',
        displayName: data.displayName || 'Forensic Investigator',
        birthAge: data.birthAge || '',
        photoURL: data.photoURL || null,
        signInMethod: data.signInMethod || (data.email?.toLowerCase().endsWith('@gmail.com') ? 'Google (Gmail)' : 'Email / Password'),
        createdAt: data.createdAt || new Date().toISOString(),
        lastLoginAt: data.lastLoginAt || data.createdAt || new Date().toISOString(),
      });
    });

    // Sort newest registered users first
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return users;
  } catch (err) {
    console.error('Failed to load users for Admin Panel:', err);
    handleFirestoreError(err, OperationType.LIST, 'users');
    return [];
  }
}

/**
 * Loads all public web investigations from the Firestore `investigations` collection.
 * Restricted to authoritative Admin clearance.
 */
export async function loadAllInvestigationsForAdmin(): Promise<AdminInvestigationSummary[]> {
  const colRef = collection(db, 'investigations');
  try {
    const snap = await getDocs(colRef);
    const items: AdminInvestigationSummary[] = [];
    snap.forEach((d) => {
      const data = d.data();
      const domain = data.targetDomain || data.target?.domain || '';
      const hostname = data.targetHostname || data.target?.hostname || '';
      const url = data.targetUrl || data.target?.normalizedUrl || '';

      items.push({
        id: data.id || d.id,
        userId: data.userId || '',
        userEmail: data.userEmail || '',
        targetDomain: domain,
        targetHostname: hostname,
        targetUrl: url,
        status: data.status || 'unknown',
        startedAt: data.startedAt || data.createdAt || new Date().toISOString(),
        createdAt: data.createdAt || data.startedAt,
      });
    });

    // Sort descending by startedAt
    items.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    return items;
  } catch (err) {
    console.error('Failed to load investigations for Admin Panel:', err);
    handleFirestoreError(err, OperationType.LIST, 'investigations');
    return [];
  }
}
