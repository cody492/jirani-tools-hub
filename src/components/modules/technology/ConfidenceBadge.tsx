import React from 'react';
import { TechnologyConfidence } from '../../../types';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: TechnologyConfidence;
  score: number;
  showScore?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  score,
  showScore = true,
}) => {
  switch (confidence) {
    case 'HIGH':
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-semibold tracking-wide bg-emerald-950/60 text-emerald-300 border border-emerald-700/50"
          title={`High Confidence (${score}%): Corroborated by direct explicit markers or multiple distinct evidence types.`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>HIGH</span>
          {showScore && <span className="text-emerald-400/80 font-normal">({score}%)</span>}
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-semibold tracking-wide bg-amber-950/60 text-amber-300 border border-amber-700/50"
          title={`Medium Confidence (${score}%): Strongly indicative pattern observed from a single primary source.`}
        >
          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>MEDIUM</span>
          {showScore && <span className="text-amber-400/80 font-normal">({score}%)</span>}
        </span>
      );
    case 'LOW':
    default:
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-semibold tracking-wide bg-slate-900 text-slate-400 border border-slate-700"
          title={`Low Confidence (${score}%): Weak or indirect pattern match. Requires manual corroboration.`}
        >
          <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
          <span>LOW</span>
          {showScore && <span className="text-slate-400/80 font-normal">({score}%)</span>}
        </span>
      );
  }
};
