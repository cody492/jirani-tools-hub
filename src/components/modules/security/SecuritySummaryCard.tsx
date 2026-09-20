import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, AlertCircle, Info, Lock, KeyRound, Cookie, ShieldCheck } from 'lucide-react';
import { SecuritySummaryData } from '../../../types';

interface SecuritySummaryCardProps {
  summary: SecuritySummaryData;
}

export const SecuritySummaryCard: React.FC<SecuritySummaryCardProps> = ({ summary }) => {
  const getHttpsBadge = () => {
    switch (summary.httpsStatus) {
      case 'ENABLED':
        return { label: 'HTTPS ENABLED', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' };
      case 'REDIRECTED':
        return { label: 'HTTPS ENFORCED (REDIRECT)', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40' };
      case 'NOT_OBSERVED':
      case 'HTTP_ONLY':
        return { label: 'HTTP UNENCRYPTED', color: 'bg-amber-950/60 text-amber-300 border-amber-800/40' };
      default:
        return { label: 'UNKNOWN', color: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  const getTlsBadge = () => {
    switch (summary.tlsDetailsStatus) {
      case 'AVAILABLE':
        return { label: 'TLS VERIFIED', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' };
      case 'EXPIRING_SOON':
        return { label: 'RENEWAL WINDOW', color: 'bg-amber-950/60 text-amber-300 border-amber-800/40' };
      case 'EXPIRED':
        return { label: 'CERT EXPIRED', color: 'bg-rose-950/60 text-rose-300 border-rose-800/40' };
      case 'UNENCRYPTED':
        return { label: 'UNENCRYPTED', color: 'bg-slate-800 text-slate-400 border-slate-700' };
      case 'NOT_AVAILABLE':
      default:
        return { label: 'ENVIRONMENT LIMITED', color: 'bg-slate-800/80 text-slate-400 border-slate-700' };
    }
  };

  const getCookieBadge = () => {
    switch (summary.cookieControlsStatus) {
      case 'ALL_OBSERVED':
        return { label: 'FULL HYGIENE', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' };
      case 'MOSTLY_OBSERVED':
        return { label: 'MOSTLY OBSERVED', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40' };
      case 'PARTIALLY_OBSERVED':
        return { label: 'PARTIALLY OBSERVED', color: 'bg-amber-950/60 text-amber-300 border-amber-800/40' };
      case 'NOT_OBSERVED':
        return { label: 'FLAGS OMITTED', color: 'bg-rose-950/60 text-rose-300 border-rose-800/40' };
      case 'NO_COOKIES':
      default:
        return { label: 'NO COOKIES OBSERVED', color: 'bg-slate-800/80 text-slate-400 border-slate-700' };
    }
  };

  const httpsBadge = getHttpsBadge();
  const tlsBadge = getTlsBadge();
  const cookieBadge = getCookieBadge();

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#18202e] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Security Configuration Audit</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/40 font-semibold">
                V0.5 OBSERVATIONS
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Factual, non-intrusive assessment of public transport, response headers & cookie parameters.
            </p>
          </div>
        </div>

        {/* Factual check count tags */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-[#131824] border border-[#222a3d] text-slate-300">
            <strong className="text-cyan-400 font-semibold">{summary.totalChecksPerformed}</strong> checks performed
          </span>
          <span className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{summary.positiveObservationsCount} Positive</span>
          </span>
          {summary.reviewItemsCount > 0 && (
            <span className="px-2 py-1 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{summary.reviewItemsCount} Review</span>
            </span>
          )}
          {summary.attentionItemsCount > 0 && (
            <span className="px-2 py-1 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{summary.attentionItemsCount} Attention</span>
            </span>
          )}
        </div>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pillar 1: HTTPS */}
        <div className="p-3.5 rounded-lg bg-[#111520] border border-[#1d2638] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>HTTPS Transport</span>
            </span>
          </div>
          <div className="space-y-1">
            <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${httpsBadge.color}`}>
              {httpsBadge.label}
            </span>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              {summary.httpsStatus === 'REDIRECTED' ? 'HTTP upgraded to HTTPS' : 'Direct secure endpoint'}
            </p>
          </div>
        </div>

        {/* Pillar 2: Security Headers */}
        <div className="p-3.5 rounded-lg bg-[#111520] border border-[#1d2638] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Security Headers</span>
            </span>
          </div>
          <div className="space-y-1">
            <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 uppercase tracking-wider">
              {summary.securityHeadersObservedCount} / {summary.securityHeadersTotalChecked} OBSERVED
            </span>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              CSP, HSTS, X-Frame, MIME, Referrer, Permissions
            </p>
          </div>
        </div>

        {/* Pillar 3: Cookies */}
        <div className="p-3.5 rounded-lg bg-[#111520] border border-[#1d2638] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cookie className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cookie Controls</span>
            </span>
          </div>
          <div className="space-y-1">
            <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cookieBadge.color}`}>
              {cookieBadge.label}
            </span>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              Secure, HttpOnly & SameSite flags
            </p>
          </div>
        </div>

        {/* Pillar 4: TLS / Crypto */}
        <div className="p-3.5 rounded-lg bg-[#111520] border border-[#1d2638] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>TLS Cryptography</span>
            </span>
          </div>
          <div className="space-y-1">
            <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${tlsBadge.color}`}>
              {tlsBadge.label}
            </span>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              X.509 certificate & handshake parameters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
