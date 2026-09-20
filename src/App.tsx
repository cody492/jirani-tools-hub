/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AppState,
  NavTab,
  ScanStage,
  TargetMetadata,
  InvestigationRecord,
  HttpFinding,
  HttpInspectionError,
  InfrastructureFinding,
  InfrastructureInspectionError,
  TechnologyReport,
  TechnologyInspectionError,
  SecurityReport,
  SecurityInspectionError,
} from './types';
import { validateAndParseTarget } from './utils/targetValidator';
import { HttpAnalysisService } from './services/httpAnalysisService';
import { InfrastructureAnalysisService } from './services/infrastructureAnalysisService';
import { TechnologyAnalysisService } from './services/technologyAnalysisService';
import { detectTechnologies } from './services/technologyDetectionEngine';
import { SecurityAnalysisService } from './services/securityAnalysisService';
import { analyzeSecurityConfiguration } from './services/securityAnalysisEngine';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { TargetInput } from './components/target/TargetInput';
import { ScanProgress, INITIAL_STAGES } from './components/scan/ScanProgress';
import { ResultsWorkspace } from './components/results/ResultsWorkspace';
import { HistoryView } from './components/history/HistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { ArchitectureModal } from './components/guide/ArchitectureModal';
import { AuthPage } from './components/auth/AuthPage';
import { QuotaInfo, QuotaService } from './services/quotaService';
import {
  auth,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
} from './services/firebase';
import {
  saveInvestigationToFirestore,
  loadUserInvestigationsFromFirestore,
} from './services/firestoreService';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminVerificationModal } from './components/admin/AdminVerificationModal';
import { LegalModal } from './components/legal/LegalModal';
import {
  isOwnerEmail,
  hasSessionClearance,
  revokeSessionClearance,
} from './config/adminConfig';
import { ShieldCheck, Activity, Layers, Terminal, Network, Shield, Server, Radio, Mail, Cpu, Lock, GitFork, Loader2 } from 'lucide-react';

const HISTORY_STORAGE_KEY = 'web_forensics_session_history_v1';
const DISMISSED_STORAGE_KEY = 'web_forensics_dismissed_records_v1';

function getDismissedRecordIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

function addDismissedRecordIds(ids: string[]) {
  try {
    const existing = getDismissedRecordIds();
    ids.forEach((id) => existing.add(id));
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(existing)));
  } catch {}
}

function generateInvestigationId(): string {
  const year = new Date().getFullYear();
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `WF-${year}-${num}-${hex}`;
}

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Admin Clearance State (Strictly for owner codydracula035@gmail.com and UID HxHGshHYdWY36dyBG3aSa6Sarik2)
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  const [showAdminVerifyModal, setShowAdminVerifyModal] = useState<boolean>(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  const [appState, setAppState] = useState<AppState>('idle');
  const [activeTab, setActiveTab] = useState<NavTab>('investigation');
  const [currentTarget, setCurrentTarget] = useState<string>('');
  const [targetMetadata, setTargetMetadata] = useState<TargetMetadata | null>(null);
  const [scanId, setScanId] = useState<string>('');
  const [scanStages, setScanStages] = useState<ScanStage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [scanDurationMs, setScanDurationMs] = useState<number>(0);
  const [historyRecords, setHistoryRecords] = useState<InvestigationRecord[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback silently if localStorage blocked
    }
    return [];
  });
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Rate Limiting & Quota State
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // V0.2 HTTP findings & errors
  const [httpFinding, setHttpFinding] = useState<HttpFinding | null>(null);
  const [httpError, setHttpError] = useState<HttpInspectionError | null>(null);

  // V0.3 Infrastructure findings & errors
  const [infraFinding, setInfraFinding] = useState<InfrastructureFinding | null>(null);
  const [infraError, setInfraError] = useState<InfrastructureInspectionError | null>(null);

  // V0.4 Technology findings & errors
  const [techFinding, setTechFinding] = useState<TechnologyReport | null>(null);
  const [techError, setTechError] = useState<TechnologyInspectionError | null>(null);

  // V0.5 Security observations & errors
  const [securityFinding, setSecurityFinding] = useState<SecurityReport | null>(null);
  const [securityError, setSecurityError] = useState<SecurityInspectionError | null>(null);

  const timerRef = useRef<number | null>(null);
  const scanStartTimeRef = useRef<number>(0);
  const httpResultRef = useRef<{ finding?: HttpFinding; error?: HttpInspectionError } | null>(null);
  const infraResultRef = useRef<{ finding?: InfrastructureFinding; error?: InfrastructureInspectionError } | null>(null);
  const techResultRef = useRef<{ report?: TechnologyReport; error?: TechnologyInspectionError } | null>(null);
  const securityResultRef = useRef<{ report?: SecurityReport; error?: SecurityInspectionError } | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Evaluate owner status and session clearance for Admin Panel
        const isOwner = isOwnerEmail(user.email);
        const verifiedInSession = hasSessionClearance(user.uid);
        setIsAdminVerified(verifiedInSession);

        // Prompt owner for 2-step UID authentication if not yet verified
        if (isOwner && !verifiedInSession) {
          setShowAdminVerifyModal(true);
        }

        // Sync investigations from Firestore for this user, respecting records dismissed locally by user
        try {
          const remoteRecords = await loadUserInvestigationsFromFirestore(user.uid);
          if (remoteRecords && remoteRecords.length > 0) {
            const dismissed = getDismissedRecordIds();
            const activeRemote = remoteRecords.filter((r) => !dismissed.has(r.id));
            setHistoryRecords((prev) => {
              // Merge remote and local records, deduplicating by ID
              const map = new Map<string, InvestigationRecord>();
              activeRemote.forEach((r) => map.set(r.id, r));
              prev.forEach((r) => {
                if (!dismissed.has(r.id) && !map.has(r.id)) map.set(r.id, r);
              });
              const merged = Array.from(map.values()).sort(
                (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
              );
              try {
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        } catch (err) {
          console.warn('Could not load remote history from Firestore:', err);
        }
      } else {
        setIsAdminVerified(false);
        setShowAdminVerifyModal(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch initial quota on mount
  const refreshQuota = async () => {
    const q = await QuotaService.getQuota();
    if (q) {
      setQuota(q);
      if (!q.isBlocked) {
        setRateLimitError(null);
      }
    }
  };

  useEffect(() => {
    refreshQuota();
  }, []);

  const handleResetQuota = async () => {
    const q = await QuotaService.resetQuota();
    if (q) {
      setQuota(q);
      setRateLimitError(null);
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      revokeSessionClearance();
      setIsAdminVerified(false);
      setShowAdminVerifyModal(false);
      await signOut(auth);
      setCurrentUser(null);
      handleReset();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleStartAnalysis = async (rawInput: string) => {
    // Check client-side quota before running
    if (quota && quota.isBlocked) {
      setRateLimitError(
        `Target analysis limit reached (${quota.limit}/${quota.limit} Used). Cooldown active for ${QuotaService.formatResetTime(
          quota.resetInSeconds
        )}.`
      );
      return;
    }
    setRateLimitError(null);
    setAppState('validating');
    setCurrentTarget(rawInput);
    setHttpFinding(null);
    setHttpError(null);
    setInfraFinding(null);
    setInfraError(null);
    setTechFinding(null);
    setTechError(null);
    setSecurityFinding(null);
    setSecurityError(null);
    httpResultRef.current = null;
    infraResultRef.current = null;
    techResultRef.current = null;
    securityResultRef.current = null;

    const validation = validateAndParseTarget(rawInput);
    if (!validation.isValid || !validation.metadata) {
      setAppState('error');
      return;
    }

    const metadata = validation.metadata;
    setTargetMetadata(metadata);

    const newScanId = generateInvestigationId();
    setScanId(newScanId);

    // Prepare fresh stages for V0.5
    const stages: ScanStage[] = INITIAL_STAGES.map((s, idx) => ({
      ...s,
      status: idx === 0 ? 'active' : 'pending',
    }));

    setScanStages(stages);
    setCurrentStageIndex(0);
    setAppState('scanning');
    scanStartTimeRef.current = Date.now();

    // Trigger HTTP inspection probe asynchronously in parallel with UI pipeline
    HttpAnalysisService.analyze(metadata.normalizedUrl).then(async (response) => {
      let currentHttpFinding: HttpFinding | null = null;
      if (response.success && response.finding) {
        httpResultRef.current = { finding: response.finding };
        currentHttpFinding = response.finding;
        setHttpFinding(response.finding);
        setHttpError(null);
      } else {
        httpResultRef.current = {
          error: response.error || {
            code: 'SERVICE_ERROR',
            title: 'HTTP Inspection Failed',
            message: 'Unable to complete HTTP inspection probe.',
            targetUrl: metadata.normalizedUrl,
          },
        };
        setHttpError(httpResultRef.current.error || null);
      }

      // Fingerprint technologies using real HTTP resource telemetry & indicators
      let techReport: TechnologyReport | null = null;
      try {
        const techResponse = await TechnologyAnalysisService.analyze(
          metadata.domain,
          metadata.hostname,
          currentHttpFinding,
          infraResultRef.current?.finding
        );
        if (techResponse.success && techResponse.report) {
          techReport = techResponse.report;
          techResultRef.current = { report: techResponse.report };
          setTechFinding(techResponse.report);
          setTechError(null);
        } else {
          techResultRef.current = { error: techResponse.error };
          setTechError(techResponse.error || null);
        }
      } catch (e: any) {
        techResultRef.current = {
          error: {
            code: 'ANALYSIS_FAILED',
            title: 'Technology Fingerprinting Failed',
            message: 'Failed to inspect server and client-side technology signatures.',
            targetUrl: metadata.normalizedUrl,
          },
        };
      }

      // Trigger Security Analysis once HTTP finding and Tech findings are ready
      SecurityAnalysisService.analyze({
        targetUrl: metadata.normalizedUrl,
        domain: metadata.domain,
        hostname: metadata.hostname,
        httpFinding: currentHttpFinding,
        infrastructureFinding: infraResultRef.current?.finding || null,
        technologyReport: techReport,
      }).then((secRes) => {
        if (secRes.success && secRes.report) {
          securityResultRef.current = { report: secRes.report };
          setSecurityFinding(secRes.report);
          setSecurityError(null);
        } else {
          securityResultRef.current = { error: secRes.error };
          setSecurityError(secRes.error || null);
        }
      });
    });

    // Trigger Infrastructure analysis probe asynchronously in parallel
    InfrastructureAnalysisService.analyze(metadata.domain, metadata.hostname).then((response) => {
      if (response.success && response.finding) {
        infraResultRef.current = { finding: response.finding };
        setInfraFinding(response.finding);
        setInfraError(null);
      } else {
        infraResultRef.current = {
          error: response.error || {
            code: 'SERVICE_ERROR',
            title: 'Infrastructure Resolution Failed',
            message: 'Unable to resolve domain infrastructure and authoritative DNS records.',
            targetDomain: metadata.domain,
          },
        };
        setInfraError(infraResultRef.current.error || null);
      }
    });

    // Start advancing through stages
    scheduleStage(0, stages, metadata, newScanId);
  };

  const scheduleStage = (
    index: number,
    stages: ScanStage[],
    metadata: TargetMetadata,
    investigationId: string
  ) => {
    if (index >= stages.length) {
      // Completed all pipeline stages!
      finalizeScan(stages, metadata, investigationId);
      return;
    }

    const stageDuration = stages[index].durationMs;

    timerRef.current = window.setTimeout(() => {
      setScanStages((prevStages) => {
        const nextStages = [...prevStages];
        nextStages[index] = { ...nextStages[index], status: 'completed' };
        if (index + 1 < nextStages.length) {
          nextStages[index + 1] = { ...nextStages[index + 1], status: 'active' };
        }
        return nextStages;
      });

      setCurrentStageIndex(index + 1);
      scheduleStage(index + 1, stages, metadata, investigationId);
    }, stageDuration);
  };

  const finalizeScan = (
    stages: ScanStage[],
    metadata: TargetMetadata,
    investigationId: string
  ) => {
    const totalDuration = Date.now() - scanStartTimeRef.current;
    setScanDurationMs(totalDuration);

    const completedStages = stages.map((s) => ({ ...s, status: 'completed' as const }));
    setScanStages(completedStages);

    const httpRes = httpResultRef.current;
    const finalHttpFinding = httpRes?.finding || null;
    const finalHttpError = httpRes?.error || null;

    const infraRes = infraResultRef.current;
    const finalInfraFinding = infraRes?.finding || null;
    const finalInfraError = infraRes?.error || null;

    let finalTechFinding = techResultRef.current?.report || null;
    let finalTechError = techResultRef.current?.error || null;

    // If tech report is not yet ready, compute synchronously from available telemetry
    if (!finalTechFinding) {
      try {
        finalTechFinding = detectTechnologies({
          domain: metadata.domain,
          hostname: metadata.hostname,
          httpFinding: finalHttpFinding,
          infrastructureFinding: finalInfraFinding,
        });
        if (finalTechFinding) {
          techResultRef.current = { report: finalTechFinding };
        }
      } catch (e: any) {
        console.warn('Fallback technology detection error:', e);
      }
    }

    // Resolve V0.5 Security Observations report
    let finalSecurityFinding = securityResultRef.current?.report || null;
    let finalSecurityError = securityResultRef.current?.error || null;

    if (!finalSecurityFinding) {
      try {
        finalSecurityFinding = analyzeSecurityConfiguration({
          targetUrl: metadata.normalizedUrl,
          domain: metadata.domain,
          hostname: metadata.hostname,
          httpFinding: finalHttpFinding,
          infrastructureFinding: finalInfraFinding,
          technologyReport: finalTechFinding,
        });
        if (finalSecurityFinding) {
          securityResultRef.current = { report: finalSecurityFinding };
        }
      } catch (e: any) {
        console.warn('Fallback security analysis error:', e);
      }
    }

    setHttpFinding(finalHttpFinding);
    setHttpError(finalHttpError);
    setInfraFinding(finalInfraFinding);
    setInfraError(finalInfraError);
    setTechFinding(finalTechFinding);
    setTechError(finalTechError);
    setSecurityFinding(finalSecurityFinding);
    setSecurityError(finalSecurityError);
    setAppState('complete');

    // Save to in-memory history log
    const newRecord: InvestigationRecord = {
      id: investigationId,
      target: metadata,
      startedAt: new Date(scanStartTimeRef.current).toISOString(),
      completedAt: new Date().toISOString(),
      status: finalHttpError && finalInfraError ? 'FAILED' : 'COMPLETED (REAL V0.6)',
      durationMs: totalDuration,
      engineVersion: 'V0.6-RELATIONSHIP-GRAPH',
      httpIntelligence: finalHttpFinding,
      infrastructureIntelligence: finalInfraFinding,
      technologyIntelligence: finalTechFinding,
      securityIntelligence: finalSecurityFinding,
      error: finalHttpError || finalInfraError || finalTechError || finalSecurityError,
    };

    // Save to scalable history log (stores up to 100 records in state and localStorage)
    setHistoryRecords((prev) => {
      const updated = [newRecord, ...prev.filter((r) => r.id !== newRecord.id).slice(0, 99)];
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Fallback gracefully if storage quota exceeded
      }
      return updated;
    });

    // Asynchronously synchronize investigation document into Firestore database!
    if (currentUser) {
      saveInvestigationToFirestore(currentUser.uid, currentUser.email || '', newRecord).catch(
        (err) => {
          console.warn('Could not persist investigation record to Firestore:', err);
        }
      );
    }

    // Refresh quota status after scan completes
    refreshQuota();
  };

  const handleCompleteNow = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!targetMetadata) return;
    finalizeScan(scanStages, targetMetadata, scanId);
  };

  const handleAbortScan = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAppState('idle');
  };

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAppState('idle');
    setTargetMetadata(null);
    setCurrentTarget('');
    setCurrentStageIndex(0);
    setHttpFinding(null);
    setHttpError(null);
    setInfraFinding(null);
    setInfraError(null);
    setTechFinding(null);
    setTechError(null);
    setSecurityFinding(null);
    setSecurityError(null);
    techResultRef.current = null;
    securityResultRef.current = null;
  };

  const handleSelectHistoryRecord = (record: InvestigationRecord) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentTarget(record.target.rawInput);
    setTargetMetadata(record.target);
    setScanId(record.id);
    setScanDurationMs(record.durationMs);
    setHttpFinding(record.httpIntelligence || null);
    setInfraFinding(record.infrastructureIntelligence || null);
    setTechFinding(record.technologyIntelligence || null);
    setSecurityFinding(record.securityIntelligence || null);
    setHttpError((record.error as HttpInspectionError) || null);
    setTechError(null);
    setSecurityError(null);
    setAppState('complete');
    setActiveTab('investigation');
  };

  const handleDeleteRecord = (id: string) => {
    // Record remains permanently preserved on Firestore database; dismissed only on user's app
    addDismissedRecordIds([id]);
    setHistoryRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Fallback
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    // Records remain permanently preserved on Firestore database; cleared only on user's app
    const currentIds = historyRecords.map((r) => r.id);
    addDismissedRecordIds(currentIds);
    setHistoryRecords([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Fallback
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center text-slate-300 font-mono gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs uppercase tracking-widest text-slate-400">
          Initializing Web Forensics Intelligence Engine...
        </p>
      </div>
    );
  }

  // If user is not authenticated, display AuthPage
  if (!currentUser) {
    return <AuthPage onAuthenticated={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-200 flex flex-col font-sans">
      {/* Header */}
      <Header
        appState={appState}
        currentUser={currentUser}
        isOwnerUser={isOwnerEmail(currentUser?.email)}
        isAdminVerified={isAdminVerified}
        onOpenAdminVerify={() => setShowAdminVerifyModal(true)}
        onReset={handleReset}
        onToggleGuide={() => setIsGuideOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Navigation */}
      <Navigation
        currentTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'admin' && (!isOwnerEmail(currentUser?.email) || !isAdminVerified)) {
            setShowAdminVerifyModal(true);
            return;
          }
          setActiveTab(tab);
        }}
        historyCount={historyRecords.length}
        showAdminTab={isOwnerEmail(currentUser?.email) && isAdminVerified}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {/* Tab 1: Primary Investigation Workspace */}
        {activeTab === 'investigation' && (
          <div className="space-y-8">
            {/* Target input area when idle or validating */}
            {appState !== 'scanning' && appState !== 'complete' && (
              <div className="space-y-6">
                <div className="text-center max-w-2xl mx-auto space-y-2 pt-2 pb-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141926] border border-[#232d42] text-cyan-300 text-xs font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>DEFENSIVE DIGITAL INVESTIGATION CONSOLE</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-slate-100">
                    PUBLIC WEB FORENSIC ANALYSIS
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-xl mx-auto">
                    Inspect live HTTP behavior, redirect traversal, document metadata, response headers, and canonical identity across public web targets.
                  </p>
                </div>

                <TargetInput
                  currentTarget={currentTarget}
                  appState={appState}
                  quota={quota}
                  rateLimitError={rateLimitError}
                  onAnalyze={handleStartAnalysis}
                  onCancelScan={handleAbortScan}
                  onResetQuota={handleResetQuota}
                />

                {/* Architectural Capabilities Cards */}
                <div className="max-w-6xl mx-auto pt-6 border-t border-[#191f2c]">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>ACTIVE CAPABILITIES (V0.6 FULL STACK FORENSICS & GRAPH)</span>
                    <span className="text-cyan-400">RFC 1034/1035, 9110, HSTS/CSP, PASSIVE TLS & RELATIONSHIP GRAPH</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-2.5">
                    <div className="p-3 rounded-lg border border-[#1b2233] bg-[#0f121a] space-y-1">
                      <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-cyan-400" />
                        <span>HTTP & Redirects</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Measures real HTTP response line, status semantics, redirect hops, headers, and document metadata.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-[#1b2233] bg-[#0f121a] space-y-1">
                      <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-cyan-400" />
                        <span>DNS & IP Routing</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Resolves authoritative IPv4/IPv6 addresses, canonical aliases, nameservers, and mail records.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-[#1b2233] bg-[#0f121a] space-y-1">
                      <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        <span>TXT / SPF Records</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Parses public text declarations for domain verification, SPF authorization, and policy tags.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-[#1b2233] bg-[#0f121a] space-y-1">
                      <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Technology Stack</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Passive fingerprinting for web servers, CMS platforms, CDNs, JavaScript libraries, and security headers.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-[#1b2233] bg-[#0f121a] space-y-1">
                      <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Security Audit</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Evaluates HTTPS enforcement, HSTS preload compliance, CSP frame-ancestors, and cookie security flags.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-[#1b2233] bg-[#0f121a] space-y-1">
                      <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>TLS / SSL Probing</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Extracts certificate authority, expiration countdown, SANs, cipher suites, and encryption validity.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-[#1b2233] bg-[#0f121a] space-y-1">
                      <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                        <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Relationship Graph</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Interactive node-link graph visualizing DNS topology, mail routing, IP addresses, technologies, and security posture.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* In-Flight Scanning Progress */}
            {appState === 'scanning' && targetMetadata && (
              <ScanProgress
                target={targetMetadata}
                stages={scanStages}
                currentStageIndex={currentStageIndex}
                onAbort={handleAbortScan}
                onCompleteNow={handleCompleteNow}
              />
            )}

            {/* Results Workspace: Render live results */}
            {appState === 'complete' && targetMetadata && (
              <ResultsWorkspace
                target={targetMetadata}
                scanId={scanId}
                durationMs={scanDurationMs}
                httpFinding={httpFinding}
                httpError={httpError}
                infrastructureFinding={infraFinding}
                infrastructureError={infraError}
                technologyFinding={techFinding}
                technologyReport={techFinding}
                technologyError={techError}
                securityFinding={securityFinding}
                securityReport={securityFinding}
                securityError={securityError}
                onNewScan={handleReset}
              />
            )}
          </div>
        )}

        {/* Tab 2: Session History */}
        {activeTab === 'history' && (
          <HistoryView
            records={historyRecords}
            onSelectRecord={handleSelectHistoryRecord}
            onDeleteRecord={handleDeleteRecord}
            onClearHistory={handleClearHistory}
            onNewScan={() => {
              setActiveTab('investigation');
              handleReset();
            }}
          />
        )}

        {/* Tab 3: Settings & Roadmap */}
        {activeTab === 'settings' && <SettingsView />}

        {/* Tab 4: Restricted Admin Panel (Strictly Owner Only) */}
        {activeTab === 'admin' && isOwnerEmail(currentUser?.email) && isAdminVerified && (
          <AdminPanel
            currentUser={currentUser}
            onReverify={() => setShowAdminVerifyModal(true)}
          />
        )}
      </main>

      {/* Admin 2-Step Authentication Modal */}
      <AdminVerificationModal
        isOpen={showAdminVerifyModal}
        currentUserEmail={currentUser?.email}
        currentUserUid={currentUser?.uid}
        onVerified={() => {
          setIsAdminVerified(true);
          setShowAdminVerifyModal(false);
          setActiveTab('admin');
        }}
        onClose={() => setShowAdminVerifyModal(false)}
      />

      {/* Platform Architecture & Charter Modal */}
      <ArchitectureModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Legal Policy & Terms Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Global Status Bar Footer */}
      <footer className="border-t border-[#171c28] bg-[#0b0d13] py-3 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-semibold">WEB FORENSICS</span>
          <span>•</span>
          <span>DEFENSIVE & PASSIVE TELEMETRY</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span>STATUS: OPERATIONAL</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
          >
            Charter
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setLegalModalType('privacy')}
            className="text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setLegalModalType('terms')}
            className="text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
          >
            Terms
          </button>
        </div>
      </footer>
    </div>
  );
}
