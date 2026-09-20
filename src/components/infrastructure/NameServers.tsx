import React, { useState } from 'react';
import { Radio, Copy, Check, Info, AlertCircle, Shield } from 'lucide-react';
import { NameserverObservation } from '../../types';

interface NameServersProps {
  observations: NameserverObservation[];
  domain: string;
  isUnavailable?: boolean;
}

export const NameServers: React.FC<NameServersProps> = ({
  observations,
  domain,
  isUnavailable = false,
}) => {
  const [copiedHost, setCopiedHost] = useState<string | null>(null);

  const handleCopy = (host: string) => {
    navigator.clipboard.writeText(host);
    setCopiedHost(host);
    setTimeout(() => setCopiedHost(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-[#1b2230] pb-2">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authoritative Nameservers (NS Records)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Systems designated to provide authoritative DNS answers and zone delegation for {domain}.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141926] border border-[#222d42] text-slate-300">
          {observations.length} {observations.length === 1 ? 'Nameserver' : 'Nameservers'}
        </span>
      </div>

      {isUnavailable ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center space-y-1">
          <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">Nameserver Resolution Unavailable</div>
          <div className="text-[11px] text-slate-400">
            Authoritative NS resolution query could not be completed for {domain}.
          </div>
        </div>
      ) : observations.length === 0 ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center space-y-1">
          <Info className="w-5 h-5 text-slate-500 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">No Nameserver Records Discovered</div>
          <div className="text-[11px] text-slate-400">
            No public NS records were returned for {domain}.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {observations.map((ns, idx) => {
            const isCopied = copiedHost === ns.host;
            return (
              <div
                key={`${ns.host}-${idx}`}
                className="p-3 rounded-lg border border-[#1b2230] bg-[#0d1017] flex items-center justify-between gap-3 group hover:border-[#28354c] transition-colors"
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-[#131924] border border-[#21293a] flex items-center justify-center text-[11px] font-mono font-bold text-emerald-400 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <code className="text-xs font-mono font-bold text-slate-200 truncate block">
                      {ns.host}
                    </code>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      Authoritative zone handler
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(ns.host)}
                  className="p-1.5 rounded bg-[#141924] hover:bg-[#1c2436] border border-[#242e42] text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                  title="Copy nameserver host"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Forensic Fact Note */}
      <div className="p-2.5 rounded-lg bg-[#0e111a] border border-[#182030] flex items-start gap-2 text-[11px] font-mono text-slate-400">
        <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-semibold">FACTUAL OBSERVATION: </span>
          Nameservers define zone authority. Infrastructure provider patterns (e.g. AWS, Cloudflare, Google) reflect who hosts the DNS records, not necessarily where the application software or backend database runs.
        </div>
      </div>
    </div>
  );
};
