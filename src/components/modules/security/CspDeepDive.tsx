import React, { useState } from 'react';
import { Shield, Check, Copy, AlertTriangle, Terminal, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { CspObservationDetail } from '../../../types';

interface CspDeepDiveProps {
  csp: CspObservationDetail;
}

export const CspDeepDive: React.FC<CspDeepDiveProps> = ({ csp }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    if (!csp.rawPolicy) return;
    navigator.clipboard.writeText(csp.rawPolicy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const keyDirectives = [
    { name: 'default-src', present: csp.hasDefaultSrc, role: 'Fallback default for resource loading' },
    { name: 'script-src', present: csp.hasScriptSrc, role: 'Executable JavaScript sources' },
    { name: 'style-src', present: csp.hasStyleSrc, role: 'CSS stylesheet locations' },
    { name: 'img-src', present: csp.hasImgSrc, role: 'Image resource origins' },
    { name: 'connect-src', present: csp.hasConnectSrc, role: 'XHR, Fetch, and WebSocket endpoints' },
    { name: 'frame-ancestors', present: csp.hasFrameAncestors, role: 'Clickjacking framing restrictions' },
    { name: 'object-src', present: csp.hasObjectSrc, role: 'Legacy plugin objects (Flash/Java)' },
    { name: 'upgrade-insecure-requests', present: csp.hasUpgradeInsecureRequests, role: 'Automatic HTTP to HTTPS asset upgrade' },
  ];

  if (!csp.present) {
    return (
      <div className="p-4 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Content-Security-Policy (CSP)
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase">
            HEADER NOT OBSERVED
          </span>
        </div>
        <p className="text-xs font-mono text-slate-400">
          No Content-Security-Policy or Content-Security-Policy-Report-Only headers were detected in the primary HTTP response.
        </p>
        <div className="p-3 rounded bg-[#111520] border border-[#1a2130] text-[11px] font-mono text-slate-400 space-y-1">
          <strong className="text-slate-300 block text-[10px] uppercase">Technical Context:</strong>
          CSP is an HTTP response header that enables site operators to restrict the resources (such as JavaScript, CSS, Images) that the browser is allowed to load for a given page, offering defense-in-depth against cross-site scripting (XSS).
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#18202e] pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Content-Security-Policy Deep Inspection
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-bold uppercase">
            POLICY ENFORCED ({csp.directives.length} DIRECTIVES)
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded bg-[#131824] hover:bg-[#1c2436] text-slate-400 hover:text-slate-200 border border-[#222a3d] transition-colors"
            title="Copy raw CSP header"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Relaxed directive indicators */}
      {(csp.allowsUnsafeInline || csp.allowsUnsafeEval) && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 flex items-start gap-2.5 text-xs font-mono text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase text-[11px] block">Permissive Keyword Observations:</span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {csp.allowsUnsafeInline && (
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-200 font-semibold">
                  'unsafe-inline' present
                </span>
              )}
              {csp.allowsUnsafeEval && (
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-200 font-semibold">
                  'unsafe-eval' present
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-400/90 mt-1">
              Factual Note: Allowing inline scripts or eval() relaxes XSS execution restrictions. Consider reviewing whether nonces, hashes, or refactored scripts could replace these keywords.
            </p>
          </div>
        </div>
      )}

      {/* Key Directive Coverage Grid */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
          Observed Directive Surface
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {keyDirectives.map((d) => (
            <div
              key={d.name}
              className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                d.present
                  ? 'bg-[#111622] border-cyan-800/40 text-slate-200'
                  : 'bg-[#0b0e15] border-[#18202d] text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${d.present ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {d.name}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    d.present ? 'bg-emerald-950/70 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {d.present ? 'SET' : 'OMITTED'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{d.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Directives breakdown */}
      <div className="space-y-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-[#111520] hover:bg-[#161c2b] border border-[#1b2332] text-xs font-mono text-slate-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Parsed Directives & Values ({csp.directives.length})</span>
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isExpanded && (
          <div className="p-3 rounded-lg bg-[#0b0e15] border border-[#18202d] space-y-2 font-mono text-xs">
            {csp.directives.map((dir, idx) => (
              <div key={idx} className="p-2 rounded bg-[#111520] border border-[#192130] space-y-1">
                <span className="text-cyan-400 font-bold text-xs">{dir.directive}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {dir.values.length > 0 ? (
                    dir.values.map((v, vIdx) => (
                      <span
                        key={vIdx}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          v.startsWith("'unsafe")
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                            : v.startsWith("'self'")
                            ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                            : 'bg-[#18202e] text-slate-300 border border-[#232c3f]'
                        }`}
                      >
                        {v}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No parameter tokens</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
