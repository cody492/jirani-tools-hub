import React from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, ArrowRightCircle } from 'lucide-react';
import { HttpStatusExplanation } from '../../types';

interface HttpStatusExplainerProps {
  explanation: HttpStatusExplanation;
}

export const HttpStatusExplainer: React.FC<HttpStatusExplainerProps> = ({ explanation }) => {
  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'success':
        return {
          bg: 'bg-emerald-950/50',
          text: 'text-emerald-400',
          border: 'border-emerald-800/50',
          icon: CheckCircle,
        };
      case 'redirection':
        return {
          bg: 'bg-amber-950/40',
          text: 'text-amber-400',
          border: 'border-amber-800/40',
          icon: ArrowRightCircle,
        };
      case 'client_error':
        return {
          bg: 'bg-rose-950/40',
          text: 'text-rose-400',
          border: 'border-rose-800/40',
          icon: AlertTriangle,
        };
      case 'server_error':
        return {
          bg: 'bg-red-950/50',
          text: 'text-red-400',
          border: 'border-red-800/50',
          icon: XCircle,
        };
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-slate-300',
          border: 'border-slate-800',
          icon: Info,
        };
    }
  };

  const style = getBadgeStyle(explanation.category);
  const StatusIcon = style.icon;

  return (
    <div className="rounded-lg border border-[#1b2333] bg-[#0c0f17] p-4 space-y-3 font-mono">
      {/* Header status badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#182030]">
        <div className="flex items-center gap-2.5">
          <div className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1.5 ${style.bg} ${style.text} ${style.border}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>HTTP {explanation.code}</span>
          </div>
          <span className="text-sm font-semibold text-slate-100">{explanation.phrase}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">
          RFC 9110 HTTP SEMANTICS
        </span>
      </div>

      {/* Forensic Fact vs Observation vs Interpretation Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
        {/* FACT */}
        <div className="p-3 rounded bg-[#0f131d] border border-[#192233] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>FACT</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{explanation.fact}</p>
        </div>

        {/* OBSERVATION */}
        <div className="p-3 rounded bg-[#0f131d] border border-[#192233] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>OBSERVATION</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{explanation.observation}</p>
        </div>

        {/* INTERPRETATION */}
        <div className="p-3 rounded bg-[#0f131d] border border-[#192233] space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>INTERPRETATION</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed font-sans">{explanation.interpretation}</p>
        </div>
      </div>
    </div>
  );
};
