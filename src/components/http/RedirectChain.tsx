import React from 'react';
import { CornerDownRight, ArrowDown, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { RedirectHop } from '../../types';

interface RedirectChainProps {
  requestedUrl: string;
  finalUrl: string;
  redirects: RedirectHop[];
}

export const RedirectChain: React.FC<RedirectChainProps> = ({
  requestedUrl,
  finalUrl,
  redirects,
}) => {
  const hasRedirects = redirects.length > 0;

  return (
    <div className="rounded-lg border border-[#1b2333] bg-[#0c0f17] p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#182030]">
        <div className="flex items-center gap-2">
          <CornerDownRight className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            REDIRECT SEQUENCE
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#161c28] border border-[#222c3e] text-slate-300">
            {hasRedirects ? `${redirects.length} HOP${redirects.length > 1 ? 'S' : ''}` : 'DIRECT TARGET'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 uppercase">
          HTTP 3xx AUDIT
        </span>
      </div>

      {!hasRedirects ? (
        <div className="p-3 rounded bg-[#0f121a] border border-[#182130] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <div className="font-semibold text-emerald-400 tracking-wide text-xs">
                NO REDIRECT DETECTED
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Target responded directly at initial requested URL without 3xx location redirection.
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 uppercase shrink-0 hidden sm:inline">
            Direct 1:1 Response
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Initial Target Step */}
          <div className="p-2.5 rounded bg-[#10141f] border border-[#1c2436] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-[#161c2b] text-[10px] text-cyan-300 border border-cyan-900/50 font-bold shrink-0">
                START
              </span>
              <span className="text-slate-300 truncate selection:bg-cyan-500/30">
                {requestedUrl}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 uppercase">Initial Request</span>
          </div>

          {/* Intermediate Redirect Hops */}
          {redirects.map((hop, idx) => (
            <React.Fragment key={hop.hopNumber}>
              {/* Downward indicator arrow */}
              <div className="flex items-center gap-2 px-4 text-cyan-400/80">
                <ArrowDown className="w-3.5 h-3.5" />
                <span className="text-[10px] text-slate-400">
                  HTTP {hop.statusCode} {hop.statusText} ({hop.responseTimeMs}ms)
                </span>
              </div>

              {/* Hop Card */}
              <div className="p-2.5 rounded bg-[#0e121b] border border-[#1d273a] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-[10px] text-amber-400 border border-amber-800/40 font-bold shrink-0">
                    HOP {hop.hopNumber}
                  </span>
                  <span className="text-amber-300 font-bold shrink-0">
                    {hop.statusCode}
                  </span>
                  <span className="text-slate-300 truncate">
                    {hop.locationHeader || hop.url}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {hop.statusText || 'Redirect'}
                </span>
              </div>
            </React.Fragment>
          ))}

          {/* Final destination */}
          <div className="flex items-center gap-2 px-4 text-emerald-400/80">
            <ArrowDown className="w-3.5 h-3.5" />
            <span className="text-[10px] text-emerald-400 font-semibold uppercase">
              Final Endpoint Reached
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#0b1419] border border-emerald-900/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-[10px] text-emerald-400 border border-emerald-800/60 font-bold shrink-0">
                FINAL
              </span>
              <span className="text-emerald-300 font-semibold truncate selection:bg-emerald-500/30">
                {finalUrl}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 shrink-0 uppercase">Resolved URI</span>
          </div>
        </div>
      )}
    </div>
  );
};
