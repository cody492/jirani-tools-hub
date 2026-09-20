import React from 'react';
import { Cpu, ShieldCheck, AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react';
import { InfrastructureIndicator, IndicatorConfidence } from '../../types';

interface InfrastructureIndicatorsProps {
  indicators: InfrastructureIndicator[];
}

const getConfidenceBadge = (confidence: IndicatorConfidence) => {
  switch (confidence) {
    case 'HIGH':
      return {
        label: 'HIGH CONFIDENCE',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-800/40',
        text: 'text-emerald-400',
        icon: CheckCircle2,
      };
    case 'MEDIUM':
      return {
        label: 'MEDIUM CONFIDENCE',
        bg: 'bg-amber-950/40',
        border: 'border-amber-800/40',
        text: 'text-amber-400',
        icon: AlertCircle,
      };
    case 'LOW':
      return {
        label: 'LOW CONFIDENCE',
        bg: 'bg-slate-900',
        border: 'border-slate-800',
        text: 'text-slate-400',
        icon: HelpCircle,
      };
    case 'UNKNOWN':
    default:
      return {
        label: 'NOT DETERMINED',
        bg: 'bg-[#121620]',
        border: 'border-[#1e2638]',
        text: 'text-slate-400',
        icon: HelpCircle,
      };
  }
};

export const InfrastructureIndicators: React.FC<InfrastructureIndicatorsProps> = ({
  indicators,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-[#1b2230] pb-2">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Infrastructure & Ecosystem Indicators</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Technical signatures inferred strictly from observable DNS records and transport headers. Speculative guessing is prohibited.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {indicators.map((ind) => {
          const badge = getConfidenceBadge(ind.confidence);
          const BadgeIcon = badge.icon;

          return (
            <div
              key={ind.id}
              className="p-3.5 rounded-lg border border-[#1b2230] bg-[#0d1017] space-y-2.5 flex flex-col justify-between hover:border-[#263248] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {ind.categoryLabel}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badge.bg} ${badge.border} ${badge.text}`}
                  >
                    <BadgeIcon className="w-2.5 h-2.5" />
                    <span>{badge.label}</span>
                  </span>
                </div>

                <div className="text-sm font-mono font-bold text-slate-100">{ind.name}</div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#161c28] text-[11px] font-mono">
                <div>
                  <span className="text-slate-400">EVIDENCE: </span>
                  <span className="text-slate-300 font-medium">{ind.evidence}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  <span className="text-slate-400">NOTE: </span>
                  {ind.technicalDetail}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2.5 rounded-lg bg-[#0e111a] border border-[#182030] flex items-start gap-2 text-[11px] font-mono text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-semibold">METHODOLOGICAL RIGOR: </span>
          Indicators require observable technical corroboration (such as DNS CNAME delegation or authoritative nameserver host patterns). When signatures are ambiguous or absent, status is deliberately marked as NOT DETERMINED.
        </div>
      </div>
    </div>
  );
};
