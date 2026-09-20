import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  User,
  Mail,
  KeyRound,
  Calendar,
  Clock,
  Globe,
  Search,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Layers,
  ArrowUpDown,
  Lock,
  Sparkles,
  Info,
  X,
  Radio,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { AdminPanelIcon } from '../icons/AdminPanelIcon';
import { FirebaseUser } from '../../services/firebase';
import {
  loadAllUsersForAdmin,
  loadAllInvestigationsForAdmin,
  UserProfileData,
  AdminInvestigationSummary,
} from '../../services/firestoreService';
import { ADMIN_CONFIG } from '../../config/adminConfig';

/**
 * STRICTLY HARDCODED OWNER CREDENTIALS
 * As specified by the system owner:
 * - Gmail: codydracula035@gmail.com
 * - Firebase UID: HxHGshHYdWY36dyBG3aSa6Sarik2
 */
const AUTHORIZED_ADMIN_GMAIL = 'codydracula035@gmail.com';
const AUTHORIZED_ADMIN_UID = 'HxHGshHYdWY36dyBG3aSa6Sarik2';

interface AdminPanelProps {
  currentUser: FirebaseUser | null;
  onReverify?: () => void;
}

interface UserWithTargets {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  signInMethod: string;
  createdAt: string;
  lastLoginAt: string;
  targets: Array<{
    domain: string;
    hostname: string;
    url: string;
    scansCount: number;
    lastSearched: string;
    latestInvestigationId: string;
  }>;
  totalScans: number;
  isOwner: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onReverify }) => {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [investigations, setInvestigations] = useState<AdminInvestigationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search, filter & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'google' | 'password'>('all');
  const [targetFilter, setTargetFilter] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<UserWithTargets | null>(null);

  // Strict Hardcoded Owner Authorization Guard
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    const emailMatch =
      currentUser.email?.trim().toLowerCase() === AUTHORIZED_ADMIN_GMAIL.toLowerCase();
    const uidMatch = currentUser.uid?.trim() === AUTHORIZED_ADMIN_UID;
    return emailMatch && uidMatch;
  }, [currentUser]);

  const fetchData = async () => {
    if (!isAuthorized) return;
    setRefreshing(true);
    setError(null);
    try {
      const [fetchedUsers, fetchedInvestigations] = await Promise.all([
        loadAllUsersForAdmin(),
        loadAllInvestigationsForAdmin(),
      ]);
      setUsers(fetchedUsers);
      setInvestigations(fetchedInvestigations);
    } catch (err: any) {
      console.error('Error loading Admin Panel telemetry:', err);
      setError(err?.message || 'Failed to load user and investigation data from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

  // Aggregate user records with their searched targets
  const aggregatedUsers: UserWithTargets[] = useMemo(() => {
    const userMap = new Map<string, UserWithTargets>();

    // 1. Initialize registered users from Firestore `users` collection
    users.forEach((u) => {
      userMap.set(u.uid, {
        uid: u.uid,
        email: u.email || 'No email declared',
        displayName: u.displayName || u.email?.split('@')[0] || 'Investigator',
        photoURL: u.photoURL || null,
        signInMethod:
          u.signInMethod ||
          (u.email?.toLowerCase().endsWith('@gmail.com') ? 'Google (Gmail)' : 'Email / Password'),
        createdAt: u.createdAt || new Date().toISOString(),
        lastLoginAt: u.lastLoginAt || u.createdAt || new Date().toISOString(),
        targets: [],
        totalScans: 0,
        isOwner:
          u.email?.toLowerCase() === AUTHORIZED_ADMIN_GMAIL.toLowerCase() &&
          u.uid === AUTHORIZED_ADMIN_UID,
      });
    });

    // 2. Map investigation searches into respective user records
    investigations.forEach((inv) => {
      const uid = inv.userId;
      if (!uid) return;

      let userObj = userMap.get(uid);

      // If an investigation exists for a user not yet in users collection (e.g. legacy/guest)
      if (!userObj) {
        const email = inv.userEmail || `User ${uid.slice(0, 6)}...`;
        userObj = {
          uid,
          email,
          displayName: email.split('@')[0],
          photoURL: null,
          signInMethod: email.toLowerCase().endsWith('@gmail.com')
            ? 'Google (Gmail)'
            : 'Email / Password',
          createdAt: inv.createdAt || inv.startedAt || new Date().toISOString(),
          lastLoginAt: inv.startedAt || new Date().toISOString(),
          targets: [],
          totalScans: 0,
          isOwner:
            email.toLowerCase() === AUTHORIZED_ADMIN_GMAIL.toLowerCase() &&
            uid === AUTHORIZED_ADMIN_UID,
        };
        userMap.set(uid, userObj);
      }

      userObj.totalScans += 1;

      // Extract target identifier (domain or hostname or normalized url)
      const domain = (inv.targetDomain || inv.targetHostname || inv.targetUrl || 'Unknown Target')
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .split('/')[0];

      const existingTarget = userObj.targets.find((t) => t.domain.toLowerCase() === domain);
      if (existingTarget) {
        existingTarget.scansCount += 1;
        if (new Date(inv.startedAt).getTime() > new Date(existingTarget.lastSearched).getTime()) {
          existingTarget.lastSearched = inv.startedAt;
          existingTarget.latestInvestigationId = inv.id;
        }
      } else {
        userObj.targets.push({
          domain,
          hostname: inv.targetHostname || domain,
          url: inv.targetUrl || `https://${domain}`,
          scansCount: 1,
          lastSearched: inv.startedAt,
          latestInvestigationId: inv.id,
        });
      }
    });

    // Sort targets per user by most recent search
    userMap.forEach((u) => {
      u.targets.sort(
        (a, b) => new Date(b.lastSearched).getTime() - new Date(a.lastSearched).getTime()
      );
    });

    return Array.from(userMap.values()).sort((a, b) => {
      // Owner always on top
      if (a.isOwner) return -1;
      if (b.isOwner) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [users, investigations]);

  // Telemetry metrics
  const telemetry = useMemo(() => {
    const totalUsers = aggregatedUsers.length;
    const totalScans = investigations.length;
    const googleUsers = aggregatedUsers.filter((u) =>
      u.signInMethod.toLowerCase().includes('google')
    ).length;
    const emailPasswordUsers = totalUsers - googleUsers;

    // Top global targets across all users (e.g. shopify, spotify, amazon)
    const targetMap = new Map<string, number>();
    investigations.forEach((inv) => {
      const d = (inv.targetDomain || inv.targetHostname || 'unknown')
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .split('/')[0];
      if (d && d !== 'unknown') {
        targetMap.set(d, (targetMap.get(d) || 0) + 1);
      }
    });

    const topTargets = Array.from(targetMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalUsers,
      totalScans,
      googleUsers,
      emailPasswordUsers,
      topTargets,
    };
  }, [aggregatedUsers, investigations]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return aggregatedUsers.filter((u) => {
      // Search query across email, UID, display name, or targets
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesEmail = u.email.toLowerCase().includes(query);
        const matchesUid = u.uid.toLowerCase().includes(query);
        const matchesName = u.displayName.toLowerCase().includes(query);
        const matchesTarget = u.targets.some((t) => t.domain.toLowerCase().includes(query));
        if (!matchesEmail && !matchesUid && !matchesName && !matchesTarget) {
          return false;
        }
      }

      // Method filter
      if (methodFilter === 'google' && !u.signInMethod.toLowerCase().includes('google')) {
        return false;
      }
      if (methodFilter === 'password' && u.signInMethod.toLowerCase().includes('google')) {
        return false;
      }

      // Specific Target pill filter
      if (targetFilter) {
        const hasTarget = u.targets.some(
          (t) => t.domain.toLowerCase() === targetFilter.toLowerCase()
        );
        if (!hasTarget) return false;
      }

      return true;
    });
  }, [aggregatedUsers, searchQuery, methodFilter, targetFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const formatDate = (
    isoString?: string
  ): { date: string; time: string; relative: string } => {
    if (!isoString) return { date: 'N/A', time: '', relative: 'Never' };
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) {
        return { date: 'N/A', time: '', relative: 'Never' };
      }
      return {
        date: d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        relative: getRelativeTime(d),
      };
    } catch {
      return { date: isoString || 'N/A', time: '', relative: '' };
    }
  };

  const getRelativeTime = (d: Date) => {
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // If unauthorized, show strict lockdown screen
  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 font-mono text-slate-100">
        <div className="rounded-xl border border-rose-900/60 bg-[#0e1017] p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-rose-300 tracking-wider">RESTRICTED ACCESS AREA</h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            The Admin Panel is strictly isolated for the authoritative system owner ({AUTHORIZED_ADMIN_GMAIL}). Secondary credentials challenge required.
          </p>
          {onReverify && (
            <button
              onClick={onReverify}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow"
            >
              TRIGGER 2-STEP ADMIN AUTHENTICATION
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-mono text-slate-100 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="rounded-xl border border-cyan-900/60 bg-gradient-to-r from-[#0d121c] via-[#0f1524] to-[#0a0e17] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-950 to-[#121927] border border-cyan-600/50 flex items-center justify-center text-cyan-300 shadow-md">
              <AdminPanelIcon size={28} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/50 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  SYSTEM OWNER CLEARANCE
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  LIVE FIREBASE TELEMETRY
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-wider text-slate-100 mt-1 flex items-center gap-2">
                ADMINISTRATOR COMMAND PANEL
              </h1>
              <p className="text-xs text-slate-400">
                Auditing registered users, sign-in methods, timestamps, and searched target domains.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={fetchData}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#212b3e] bg-[#111724] hover:bg-[#161e2f] text-xs text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh database records"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>{refreshing ? 'FETCHING...' : 'REFRESH TELEMETRY'}</span>
            </button>

            {onReverify && (
              <button
                type="button"
                onClick={onReverify}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-cyan-900/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 text-xs transition-colors"
                title="Re-verify UID clearance"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">RE-VERIFY</span>
              </button>
            )}
          </div>
        </div>

        {/* Hardcoded Authenticated Owner Identity Box */}
        <div className="mt-4 pt-4 border-t border-[#1a2334] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400">AUTHENTICATED ROOT GMAIL:</span>
            <span className="text-cyan-300 font-bold bg-[#07090e] px-2 py-0.5 rounded border border-[#1b2333]">
              {AUTHORIZED_ADMIN_GMAIL}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400">FIREBASE UID:</span>
            <code className="text-slate-300 bg-[#07090e] px-2 py-0.5 rounded border border-[#1b2333] text-[11px]">
              {AUTHORIZED_ADMIN_UID}
            </code>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            2-Step Auth Status: Authorized & Active
          </div>
        </div>
      </div>

      {/* Telemetry Snapshot Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="rounded-xl border border-[#1b2436] bg-[#0c1018] p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>REGISTERED USERS</span>
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">
            {loading ? '...' : telemetry.totalUsers}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>In Firestore users collection</span>
          </div>
        </div>

        {/* Total Searches / Investigations */}
        <div className="rounded-xl border border-[#1b2436] bg-[#0c1018] p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>TOTAL SEARCHES</span>
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">
            {loading ? '...' : telemetry.totalScans}
          </div>
          <div className="text-[10px] text-slate-400">Web forensic analyses logged</div>
        </div>

        {/* Sign In Method Breakdown */}
        <div className="rounded-xl border border-[#1b2436] bg-[#0c1018] p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>AUTH PROVIDERS</span>
            </span>
          </div>
          <div className="text-sm font-bold text-slate-200 pt-1 flex items-center gap-2">
            <span className="text-cyan-300">{telemetry.googleUsers} Google</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{telemetry.emailPasswordUsers} Email</span>
          </div>
          <div className="text-[10px] text-slate-400">OAuth vs Password accounts</div>
        </div>

        {/* Top Analyzed Targets */}
        <div className="rounded-xl border border-[#1b2436] bg-[#0c1018] p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>POPULAR TARGETS</span>
            </span>
          </div>
          <div className="text-xs font-mono text-slate-300 truncate pt-0.5">
            {telemetry.topTargets.length > 0 ? (
              <span className="text-cyan-300">
                {telemetry.topTargets.map((t) => t[0]).join(', ')}
              </span>
            ) : (
              <span className="text-slate-400">None yet</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">Searched across all users</div>
        </div>
      </div>

      {/* Quick Search and Filter Bar */}
      <div className="rounded-xl border border-[#1b2333] bg-[#0d111a] p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Gmail, UID, or Target (e.g. shopify, spotify, amazon)..."
            className="w-full pl-9 pr-8 py-2 bg-[#06080e] border border-[#20283a] focus:border-cyan-500 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px] hidden sm:inline flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            FILTER:
          </span>

          <div className="flex items-center bg-[#07090e] p-0.5 rounded-lg border border-[#1e2739]">
            <button
              type="button"
              onClick={() => setMethodFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                methodFilter === 'all'
                  ? 'bg-[#1b2335] text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL
            </button>
            <button
              type="button"
              onClick={() => setMethodFilter('google')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                methodFilter === 'google'
                  ? 'bg-[#1b2335] text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GOOGLE
            </button>
            <button
              type="button"
              onClick={() => setMethodFilter('password')}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                methodFilter === 'password'
                  ? 'bg-[#1b2335] text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PASSWORD
            </button>
          </div>

          {targetFilter && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs">
              <span>Target: {targetFilter}</span>
              <button
                onClick={() => setTargetFilter(null)}
                className="hover:text-white"
                title="Clear target filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="text-[11px] text-slate-400 ml-auto">
            Showing <strong className="text-slate-200">{filteredUsers.length}</strong> of {aggregatedUsers.length} users
          </div>
        </div>
      </div>

      {/* Main Users & Targets Table */}
      <div className="rounded-xl border border-[#1c2436] bg-[#0c1018] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1b2436] bg-[#0f1420] text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
                {/* 1. Users */}
                <th className="py-3 px-4 w-[24%]">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>USERS</span>
                  </div>
                </th>

                {/* 2. Sign in Methods */}
                <th className="py-3 px-4 w-[16%]">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>SIGN IN METHODS</span>
                  </div>
                </th>

                {/* 3. Created At */}
                <th className="py-3 px-4 w-[16%]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CREATED AT</span>
                  </div>
                </th>

                {/* 4. Targets */}
                <th className="py-3 px-4 w-[26%]">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>TARGETS ANALYZED</span>
                  </div>
                </th>

                {/* 5. User ID */}
                <th className="py-3 px-4 w-[18%]">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-3.5 h-3.5 text-rose-400" />
                    <span>USER ID (UID)</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#171e2e] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <RotateCcw className="w-6 h-6 mx-auto animate-spin text-cyan-400" />
                    <p className="text-xs">Loading users and targets from Firestore database...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <Users className="w-6 h-6 mx-auto text-slate-400" />
                    <p className="text-xs">No users found matching current filter query.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const created = formatDate(u.createdAt);
                  const isOwnerRow = u.isOwner;

                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-[#111724] transition-colors ${
                        isOwnerRow ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      {/* 1. USERS: Email, Name, Avatar */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              className="w-7 h-7 rounded-full object-cover border border-cyan-800/40 shrink-0 mt-0.5"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#131a28] border border-[#232f46] flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 text-xs font-bold">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-100 truncate block max-w-[200px]" title={u.email}>
                                {u.email}
                              </span>
                              {isOwnerRow && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 text-[9px] font-bold">
                                  SYSTEM OWNER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[190px]">
                              {u.displayName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. SIGN IN METHODS */}
                      <td className="py-3.5 px-4 align-top">
                        {u.signInMethod.toLowerCase().includes('google') ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/40 border border-blue-800/50 text-blue-300 text-[11px] font-medium">
                            <span className="font-bold text-[10px] text-blue-400">G</span>
                            <span>Google (Gmail)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161c2b] border border-[#263148] text-slate-300 text-[11px] font-medium">
                            <Mail className="w-3 h-3 text-amber-400" />
                            <span>Email / Password</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Last active: {formatDate(u.lastLoginAt).relative}
                        </div>
                      </td>

                      {/* 3. CREATED AT */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-200 font-medium">
                          {created.date}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{created.time}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{created.relative}</span>
                        </div>
                      </td>

                      {/* 4. TARGETS ANALYZED (e.g. Shopify, Spotify, Amazon) */}
                      <td className="py-3.5 px-4 align-top">
                        {u.targets.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">
                            No investigations yet
                          </span>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {u.targets.slice(0, 3).map((target) => (
                                <button
                                  key={target.domain}
                                  type="button"
                                  onClick={() => setTargetFilter(target.domain)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#131a28] hover:bg-[#1a2336] text-cyan-300 border border-[#232f46] text-[11px] transition-colors cursor-pointer"
                                  title={`Filter by ${target.domain} (${target.scansCount} scans)`}
                                >
                                  <Globe className="w-2.5 h-2.5 text-cyan-400" />
                                  <span className="font-semibold">{target.domain}</span>
                                  {target.scansCount > 1 && (
                                    <span className="text-[9px] px-1 bg-cyan-950 text-cyan-400 rounded-full font-bold">
                                      {target.scansCount}
                                    </span>
                                  )}
                                </button>
                              ))}

                              {u.targets.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserForAudit(u)}
                                  className="px-1.5 py-0.5 rounded bg-[#182133] text-slate-300 text-[10px] hover:text-white border border-[#273550]"
                                  title="View all targets"
                                >
                                  +{u.targets.length - 3} more
                                </button>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>
                                {u.targets.length} {u.targets.length === 1 ? 'target' : 'targets'} ({u.totalScans} {u.totalScans === 1 ? 'scan' : 'scans'})
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedUserForAudit(u)}
                                className="text-cyan-400 hover:text-cyan-300 underline text-[10px] cursor-pointer"
                              >
                                View Target Details
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 5. USER ID (UID) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <code
                            className="bg-[#07090f] border border-[#1d2638] px-2 py-1 rounded text-cyan-200 text-[11px] font-mono select-all truncate max-w-[140px]"
                            title={u.uid}
                          >
                            {u.uid}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.uid, u.uid)}
                            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#182030] transition-colors"
                            title="Copy Firebase Auth UID"
                          >
                            {copiedId === u.uid ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {isOwnerRow && (
                          <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                            Primary Authoritative UID
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-[#0a0d14] border-t border-[#1b2334] text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            System Owner Portal • Direct Firestore Query Engine • Isolated Execution
          </div>
          <div className="text-slate-400">
            Total records: <strong className="text-slate-200">{aggregatedUsers.length}</strong> accounts registered
          </div>
        </div>
      </div>

      {/* Drilldown Modal: User Target Intelligence Audit */}
      {selectedUserForAudit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl rounded-xl border border-cyan-900/60 bg-[#0c1018] shadow-2xl p-6 text-slate-100 font-mono space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1b2437] pb-3">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    TARGET AUDIT: {selectedUserForAudit.email}
                  </h3>
                  <div className="text-[10px] text-slate-400">
                    UID: {selectedUserForAudit.uid}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForAudit(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="text-xs text-slate-300 font-semibold mb-2">
                All Search Targets Analyzed by this User ({selectedUserForAudit.targets.length} unique domains):
              </div>
              {selectedUserForAudit.targets.map((t) => (
                <div
                  key={t.domain}
                  className="p-3 rounded-lg bg-[#07090e] border border-[#1b2436] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.domain}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Canonical target: <code className="text-slate-300">{t.url}</code>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                      {t.scansCount} {t.scansCount === 1 ? 'scan' : 'scans'}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      Last: {formatDate(t.lastSearched).relative}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#1b2437] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserForAudit(null)}
                className="px-4 py-2 rounded-lg bg-[#151c2a] hover:bg-[#1d273a] text-xs font-bold text-slate-200"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
