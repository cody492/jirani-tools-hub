import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Shield,
  Cookie,
  KeyRound,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { ModuleCard, ModulePlaceholderNotice } from '../ui/ModuleCard';
import { StatusBadge } from '../ui/StatusBadge';
import { SecurityReport, TargetMetadata } from '../../types';
import { SecuritySummaryCard } from './security/SecuritySummaryCard';
import { HttpsAnalysisCard } from './security/HttpsAnalysisCard';
import { SecurityHeadersCard } from './security/SecurityHeadersCard';
import { CspDeepDive } from './security/CspDeepDive';
import { HstsDeepDive } from './security/HstsDeepDive';
import { CookieAnalysisCard } from './security/CookieAnalysisCard';
import { TlsSummaryCard } from './security/TlsSummaryCard';
import { ObservationAuditList } from './security/ObservationAuditList';

interface SecurityModuleProps {
  report?: SecurityReport | null;
  target?: TargetMetadata | null;
  isActive?: boolean;
}

type SecurityViewTab = 'overview' | 'headers' | 'cookies' | 'tls' | 'ledger';

export const SecurityModule: React.FC<SecurityModuleProps> = ({
  report,
  target,
  isActive = false,
}) => {
  const [activeTab, setActiveTab] = useState<SecurityViewTab>('overview');

  // If no report has been generated yet, render the standby/pre-scan view
  if (!report) {
    const securityChecks = [
      {
        label: 'HTTPS & Transport Security',
        icon: Lock,
        placeholder: 'Transport encryption, redirect enforcement & protocol version',
        status: 'READY FOR AUDIT',
      },
      {
        label: 'HTTP Security Headers',
        icon: ShieldCheck,
        placeholder: 'CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy',
        status: 'READY FOR AUDIT',
      },
      {
        label: 'Cookie Security Attributes',
        icon: Cookie,
        placeholder: 'Secure, HttpOnly, SameSite audit with token suppression',
        status: 'READY FOR AUDIT',
      },
      {
        label: 'TLS / X.509 Cryptography',
        icon: KeyRound,
        placeholder: 'Handshake verification, issuer CA, expiration & SAN inspection',
        status: 'READY FOR AUDIT',
      },
    ];

    return (
      <ModuleCard
        id="module-security"
        title="Security & Configuration Observations"
        subtitle="Passive transport cryptography, response security policies & cookie hygiene"
        icon={ShieldCheck}
        versionBadge="REAL: V0.5"
        statusBadge={{
          label: 'STANDBY',
          variant: 'standby',
        }}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {securityChecks.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="p-3 rounded bg-[#0d1017] border border-[#1a202d] flex flex-col justify-between space-y-2 hover:border-[#262f42] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 truncate">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      {item.label}
                    </span>
                    <StatusBadge label={item.status} variant="standby" size="sm" />
                  </div>

                  <div className="font-mono text-xs text-slate-400 tracking-wide bg-[#11141d] px-2.5 py-1.5 rounded border border-[#1b2230] flex items-center justify-between">
                    <span className="truncate italic text-[11px]">{item.placeholder}</span>
                    <span className="text-[9px] uppercase px-1 rounded bg-[#181d29] text-cyan-400 shrink-0 font-sans">
                      V0.5
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <ModulePlaceholderNotice
            moduleTarget="SECURITY OBSERVATIONS (V0.5)"
            description="Run an investigation to passively inspect HTTPS transport, HTTP security headers, cookie security flags, and TLS certificate metadata."
          />
        </div>
      </ModuleCard>
    );
  }

  const { summary } = report;

  return (
    <ModuleCard
      id="module-security"
      title="Security & Configuration Observations"
      subtitle={`Passive audit for ${report.hostname || target?.hostname || 'target'} — ${summary.totalChecksPerformed} checks`}
      icon={ShieldCheck}
      versionBadge="REAL: V0.5"
      statusBadge={{
        label: `${summary.positiveObservationsCount} POSITIVE / ${summary.reviewItemsCount + summary.attentionItemsCount} REVIEW`,
        variant: summary.attentionItemsCount > 0 ? 'error' : summary.reviewItemsCount > 0 ? 'warning' : 'success',
      }}
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[#18202e] pb-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111520]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'headers'
                ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111520]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Headers ({summary.securityHeadersObservedCount}/{summary.securityHeadersTotalChecked})</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'cookies'
                ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111520]'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookies ({report.cookies.items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tls')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'tls'
                ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111520]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>TLS / Crypto</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'ledger'
                ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111520]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Observations Ledger ({report.observations.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <SecuritySummaryCard summary={report.summary} />
            <HttpsAnalysisCard https={report.https} targetUrl={report.targetUrl} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <HstsDeepDive hsts={report.hsts} isHttps={report.https.httpsEnabled} />
              <CspDeepDive csp={report.csp} />
            </div>
          </div>
        )}

        {/* Tab 2: Security Headers & Policies */}
        {activeTab === 'headers' && (
          <div className="space-y-4">
            <SecurityHeadersCard observations={report.observations} />
            <CspDeepDive csp={report.csp} />
            <HstsDeepDive hsts={report.hsts} isHttps={report.https.httpsEnabled} />
          </div>
        )}

        {/* Tab 3: Cookies */}
        {activeTab === 'cookies' && (
          <div className="space-y-4">
            <CookieAnalysisCard
              summary={report.cookies.summary}
              items={report.cookies.items}
            />
          </div>
        )}

        {/* Tab 4: TLS / Cryptography */}
        {activeTab === 'tls' && (
          <div className="space-y-4">
            <TlsSummaryCard tls={report.tls} hostname={report.hostname} />
          </div>
        )}

        {/* Tab 5: Observations Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <ObservationAuditList observations={report.observations} />
          </div>
        )}
      </div>
    </ModuleCard>
  );
};
