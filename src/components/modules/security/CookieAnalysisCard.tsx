import React from 'react';
import { Cookie, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { CookieSecuritySummary, CookieSecurityItem } from '../../../types';

interface CookieAnalysisCardProps {
  summary: CookieSecuritySummary;
  items: CookieSecurityItem[];
}

export const CookieAnalysisCard: React.FC<CookieAnalysisCardProps> = ({ summary, items }) => {
  if (summary.status === 'NO_COOKIES_OBSERVED' || items.length === 0) {
    return (
      <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-3">
        <div className="flex items-center justify-between border-b border-[#18202e] pb-3">
          <div className="flex items-center gap-2">
            <Cookie className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Cookie Security & Hygiene Audit
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase">
            NO COOKIES OBSERVED
          </span>
        </div>

        <p className="text-xs font-mono text-slate-400">
          No <code className="text-slate-300">Set-Cookie</code> response headers were present in the initial HTTP response from the target.
        </p>

        <div className="p-3 rounded-lg bg-[#111520] border border-[#192130] text-[11px] font-mono text-slate-400 space-y-1">
          <strong className="text-slate-300 block text-[10px] uppercase">Forensic Context:</strong>
          Stateless or purely static pages often do not emit cookies on their root landing URL. Session cookies may instead be provisioned during authentication or interaction workflows.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#18202e] pb-3">
        <div className="flex items-center gap-2">
          <Cookie className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Cookie Security Attributes ({items.length})
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-bold uppercase">
            {summary.secureCount} / {items.length} SECURE
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-bold uppercase">
            {summary.httpOnlyCount} / {items.length} HTTPONLY
          </span>
        </div>
      </div>

      {/* Sensitive Value Warning Notice */}
      <div className="text-[11px] font-mono text-slate-400 bg-[#111520] p-2.5 rounded border border-[#1b2332] flex items-center justify-between">
        <span>Forensic Safety: Cookie identifiers audited for transport security; raw sensitive values are suppressed.</span>
        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold shrink-0">
          VALUES REDACTED
        </span>
      </div>

      {/* Cookie Table / List */}
      <div className="space-y-2 font-mono text-xs">
        {items.map((cookie, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] hover:border-[#26334a] transition-colors space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 text-xs truncate">
                  {cookie.name}
                </span>
                {cookie.isSessionCookie && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/40 uppercase font-semibold">
                    SESSION IDENTIFIER
                  </span>
                )}
              </div>

              {/* Attribute flags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Secure */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold border ${
                    cookie.secure
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40'
                      : 'bg-rose-950/70 text-rose-300 border-rose-800/40'
                  }`}
                >
                  {cookie.secure ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  <span>Secure: {cookie.secure ? 'Yes' : 'No'}</span>
                </span>

                {/* HttpOnly */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold border ${
                    cookie.httpOnly
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40'
                      : 'bg-amber-950/70 text-amber-300 border-amber-800/40'
                  }`}
                >
                  <span>HttpOnly: {cookie.httpOnly ? 'Yes' : 'No'}</span>
                </span>

                {/* SameSite */}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                    cookie.sameSite !== 'Not Set'
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  SameSite: {cookie.sameSite}
                </span>
              </div>
            </div>

            {/* Scope details */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1 border-t border-[#18202d]">
              {cookie.domain && (
                <span>
                  Domain: <strong className="text-slate-300">{cookie.domain}</strong>
                </span>
              )}
              {cookie.path && (
                <span>
                  Path: <strong className="text-slate-300">{cookie.path}</strong>
                </span>
              )}
              {cookie.maxAge && (
                <span>
                  Max-Age: <strong className="text-slate-300">{cookie.maxAge}s</strong>
                </span>
              )}
              {cookie.expires && (
                <span>
                  Expires: <strong className="text-slate-300">{cookie.expires}</strong>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
