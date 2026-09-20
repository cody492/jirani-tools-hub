import React, { useState } from 'react';
import { TechnologyEvidence, TechnologyEvidenceType } from '../../../types';
import {
  FileCode,
  Link2,
  Tag,
  Server,
  Terminal,
  Cookie,
  Network,
  Copy,
  Check,
} from 'lucide-react';

interface EvidenceListProps {
  evidence: TechnologyEvidence[];
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidence }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getEvidenceTypeBadge = (type: TechnologyEvidenceType) => {
    switch (type) {
      case 'HEADER':
        return {
          icon: Server,
          label: 'HEADER',
          style: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
        };
      case 'SCRIPT':
        return {
          icon: FileCode,
          label: 'SCRIPT',
          style: 'bg-violet-950/60 text-violet-300 border-violet-800/50',
        };
      case 'HTML':
        return {
          icon: Terminal,
          label: 'DOM / HTML',
          style: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
        };
      case 'LINK':
        return {
          icon: Link2,
          label: 'STYLESHEET',
          style: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
        };
      case 'META':
        return {
          icon: Tag,
          label: 'META TAG',
          style: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
        };
      case 'COOKIE':
        return {
          icon: Cookie,
          label: 'COOKIE',
          style: 'bg-pink-950/60 text-pink-300 border-pink-800/50',
        };
      case 'INFRASTRUCTURE':
        return {
          icon: Network,
          label: 'INFRASTRUCTURE',
          style: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
        };
      default:
        return {
          icon: FileCode,
          label: type,
          style: 'bg-slate-900 text-slate-400 border-slate-700',
        };
    }
  };

  return (
    <div className="space-y-2 mt-2 pt-2 border-t border-[#1a202d]">
      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <span>Chain of Evidence ({evidence.length} {evidence.length === 1 ? 'item' : 'items'})</span>
        <span className="text-[10px] text-slate-500">Observable Public Telemetry</span>
      </div>

      <div className="space-y-2">
        {evidence.map((item, idx) => {
          const typeMeta = getEvidenceTypeBadge(item.type);
          const Icon = typeMeta.icon;
          const isCopied = copiedId === item.id;

          return (
            <div
              key={`${item.id}-${idx}`}
              className="p-2.5 rounded bg-[#0b0e14] border border-[#1b2230] text-xs font-mono space-y-1.5 hover:border-[#253046] transition-colors"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${typeMeta.style}`}
                  >
                    <Icon className="w-3 h-3" />
                    {typeMeta.label}
                  </span>
                  <span className="text-slate-300 font-medium text-[11px] truncate">
                    {item.source}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    weight +{item.weight}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.observed, item.id)}
                    className="p-1 rounded bg-[#131822] hover:bg-[#1a2232] text-slate-400 hover:text-slate-200 border border-[#20293a] transition-colors"
                    title="Copy observed evidence value"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Observed Value Snippet */}
              <div className="bg-[#07090e] p-2 rounded border border-[#141924] text-[11px] text-cyan-300 break-all select-all font-mono leading-relaxed">
                {item.observed}
              </div>

              {/* Forensic Interpretation */}
              <div className="text-[11px] text-slate-400 italic">
                {item.interpretation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
