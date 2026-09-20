import React, { useState } from 'react';
import { GitFork, ArrowDown, Copy, Check, CheckCircle2, Info } from 'lucide-react';
import { CnameRelationship } from '../../types';

interface CnameRelationshipsProps {
  relationships: CnameRelationship[];
  domain: string;
  hostname: string;
}

export const CnameRelationships: React.FC<CnameRelationshipsProps> = ({
  relationships,
  domain,
  hostname,
}) => {
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedTarget(val);
    setTimeout(() => setCopiedTarget(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-[#1b2230] pb-2">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <GitFork className="w-3.5 h-3.5 text-cyan-400" />
            <span>Canonical Name (CNAME) Relationships</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Architectural aliasing mapping the target hostname to external or canonical endpoints.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141926] border border-[#222d42] text-slate-300">
          {relationships.length === 0 ? 'Direct Resolution' : `${relationships.length} CNAME`}
        </span>
      </div>

      {relationships.length === 0 ? (
        <div className="p-4 rounded-lg bg-[#0d1017] border border-[#1b2230] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>DIRECT DOMAIN RESOLUTION (NO CNAME ALIAS)</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
            The target hostname <code className="text-cyan-300">{hostname}</code> does not employ an intermediate CNAME alias. DNS resolution proceeds directly to root address records (A/AAAA) or zone authority (NS).
          </p>
          <div className="mt-2 pt-2 border-t border-[#171d2b] flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-[#141824] border border-[#1e2739] text-slate-400">
              TARGET [{hostname}]
            </span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-[#141824] border border-[#1e2739] text-emerald-400">
              DIRECT ADDRESS (A/AAAA)
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {relationships.map((rel, idx) => {
            const isCopied = copiedTarget === rel.target;
            return (
              <div
                key={`${rel.source}-${rel.target}-${idx}`}
                className="p-4 rounded-lg bg-[#0d1017] border border-cyan-900/40 space-y-3"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-400 font-bold uppercase">CANONICAL ALIAS DELEGATION</span>
                  {rel.ttl && <span className="text-slate-400">TTL {rel.ttl}s</span>}
                </div>

                {/* Visual Relationship Chain */}
                <div className="p-3 rounded-lg bg-[#090b10] border border-[#161d2b] space-y-2 font-mono">
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-[#111622] border border-[#1c2438]">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">REQUESTED TARGET</div>
                      <div className="text-xs font-bold text-slate-200">{rel.source}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1b2336] text-slate-300">ALIAS SOURCE</span>
                  </div>

                  <div className="flex justify-center my-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 bg-[#0d1524] px-2.5 py-0.5 rounded-full border border-cyan-800/30">
                      <ArrowDown className="w-3 h-3 animate-bounce" />
                      <span>DELEGATES TO CANONICAL ENTITY</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-[#111a26] border border-cyan-800/40">
                    <div className="min-w-0">
                      <div className="text-[10px] text-cyan-400 uppercase tracking-wider">CANONICAL TARGET (CNAME)</div>
                      <div className="text-xs font-bold text-cyan-300 break-all">{rel.target}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(rel.target)}
                      className="p-1.5 rounded bg-[#162338] hover:bg-[#1f314f] border border-cyan-700/40 text-cyan-300 hover:text-white transition-colors shrink-0"
                      title="Copy target"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  <span className="text-slate-300 font-semibold">OBSERVATION: </span>
                  {rel.observation}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
