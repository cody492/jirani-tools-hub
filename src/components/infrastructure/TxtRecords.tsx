import React, { useState } from 'react';
import { FileText, Copy, Check, Filter, Info, Shield } from 'lucide-react';
import { DnsTxtRecord, TxtCategory } from '../../types';

interface TxtRecordsProps {
  records: DnsTxtRecord[];
  domain: string;
  isUnavailable?: boolean;
}

export const TxtRecords: React.FC<TxtRecordsProps> = ({
  records,
  domain,
  isUnavailable = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const filtered = records.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.category === selectedFilter;
  });

  const getCategoryBadge = (category: TxtCategory) => {
    switch (category) {
      case 'spf':
        return {
          label: 'SPF POLICY',
          bg: 'bg-cyan-950/40',
          border: 'border-cyan-800/40',
          text: 'text-cyan-300',
        };
      case 'dmarc':
        return {
          label: 'DMARC POLICY',
          bg: 'bg-indigo-950/40',
          border: 'border-indigo-800/40',
          text: 'text-indigo-300',
        };
      case 'verification':
        return {
          label: 'DOMAIN VERIFICATION',
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-800/40',
          text: 'text-emerald-300',
        };
      default:
        return {
          label: 'GENERAL TXT',
          bg: 'bg-slate-900',
          border: 'border-slate-800',
          text: 'text-slate-400',
        };
    }
  };

  const counts = {
    all: records.length,
    spf: records.filter((r) => r.category === 'spf').length,
    verification: records.filter((r) => r.category === 'verification').length,
    dmarc: records.filter((r) => r.category === 'dmarc').length,
    other: records.filter((r) => r.category === 'other').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1b2230] pb-2">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>TXT Telemetry & Domain Tokens</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Public TXT strings indicating email authentication (SPF/DMARC) and third-party SaaS verification tokens for {domain}.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
          {(['all', 'spf', 'verification', 'dmarc', 'other'] as const).map((key) => {
            const isActive = selectedFilter === key;
            const count = counts[key];
            if (key !== 'all' && count === 0) return null;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedFilter(key)}
                className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/50 font-bold'
                    : 'bg-[#111622] text-slate-400 hover:text-slate-200 border border-[#1b2336]'
                }`}
              >
                {key.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {isUnavailable ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center space-y-1">
          <Info className="w-5 h-5 text-amber-400 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">TXT Resolution Unavailable</div>
          <div className="text-[11px] text-slate-400">TXT lookup query could not be completed for {domain}.</div>
        </div>
      ) : records.length === 0 ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center space-y-1">
          <Info className="w-5 h-5 text-slate-500 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">No TXT Records Discovered</div>
          <div className="text-[11px] text-slate-400">The domain does not advertise public TXT resource records.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center text-xs font-mono text-slate-400">
          No records match the selected filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((record, idx) => {
            const badge = getCategoryBadge(record.category);
            const isCopied = copiedIdx === idx;

            return (
              <div
                key={`txt-${idx}`}
                className="p-3 rounded-lg border border-[#1b2230] bg-[#0d1017] space-y-2 hover:border-[#28354c] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.bg} ${badge.border} ${badge.text} font-bold`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{record.categoryLabel}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(record.fullText, idx)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#141924] hover:bg-[#1d2639] border border-[#242f44] text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy full TXT string"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded bg-[#080a0f] border border-[#161d2b] font-mono text-xs text-slate-300 break-all leading-relaxed select-all">
                  {record.fullText}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Forensic Privacy & Token Note */}
      <div className="p-2.5 rounded-lg bg-[#0e111a] border border-[#182030] flex items-start gap-2 text-[11px] font-mono text-slate-400">
        <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-semibold">PUBLIC TELEMETRY DISCLOSURE: </span>
          TXT records are intentionally broadcast over the public global DNS network. They provide evidence of integrated SaaS services (Google, Atlassian, Microsoft, Stripe, etc.) without revealing private keys or confidential data.
        </div>
      </div>
    </div>
  );
};
