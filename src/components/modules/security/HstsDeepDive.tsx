import React from 'react';
import { Lock, CheckCircle2, XCircle, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { HstsObservationDetail } from '../../../types';

interface HstsDeepDiveProps {
  hsts: HstsObservationDetail;
  isHttps: boolean;
}

export const HstsDeepDive: React.FC<HstsDeepDiveProps> = ({ hsts, isHttps }) => {
  if (!hsts.present) {
    return (
      <div className="p-4 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Strict-Transport-Security (HSTS)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase">
            HEADER NOT OBSERVED
          </span>
        </div>
        <p className="text-xs font-mono text-slate-400">
          The response did not include a Strict-Transport-Security header.
        </p>
        <div className="p-3 rounded bg-[#111520] border border-[#1a2130] text-[11px] font-mono text-slate-400 space-y-1">
          <strong className="text-slate-300 block text-[10px] uppercase">Technical Context:</strong>
          HSTS informs web browsers that the site should only be accessed using HTTPS. When missing, users visiting the domain for the first time via HTTP could be subject to man-in-the-middle downgrade attacks before being redirected.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#18202e] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Strict-Transport-Security (HSTS) Configuration
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-bold uppercase">
          HSTS ACTIVE
        </span>
      </div>

      {/* Grid of parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Policy Duration (max-age)</span>
          <div className="text-sm font-bold text-slate-100">
            {hsts.maxAgeFormatted || `${hsts.maxAge}s`}
          </div>
          <p className="text-[11px] text-slate-400">
            {hsts.maxAge && hsts.maxAge >= 31536000
              ? 'Meets standard 1-year persistence threshold'
              : 'Short duration policy declared'}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Subdomain Coverage</span>
          <div className="text-sm font-bold flex items-center gap-1.5">
            {hsts.includeSubDomains ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">includeSubDomains</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Apex Only</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {hsts.includeSubDomains
              ? 'Extends HTTPS enforcement across all subdomains'
              : 'Subdomains not covered by apex header'}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Browser Preload Directive</span>
          <div className="text-sm font-bold flex items-center gap-1.5">
            {hsts.preload ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">preload Flag Present</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">preload Omitted</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {hsts.isPreloadEligible
              ? 'Configuration satisfies Chromium HSTS preload requirements'
              : 'Standard dynamic browser cache policy'}
          </p>
        </div>
      </div>

      {/* Raw header display */}
      <div className="p-2.5 rounded-lg bg-[#111520] border border-[#1b2332] font-mono text-xs flex items-center justify-between">
        <span className="text-slate-400 text-[11px]">Strict-Transport-Security:</span>
        <code className="text-cyan-300 text-[11px] font-semibold">{hsts.rawHeader}</code>
      </div>
    </div>
  );
};
