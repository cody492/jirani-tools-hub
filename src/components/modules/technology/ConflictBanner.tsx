import React from 'react';
import { ConflictingSignal } from '../../../types';
import { AlertTriangle, Info } from 'lucide-react';

interface ConflictBannerProps {
  conflicts: ConflictingSignal[];
}

export const ConflictBanner: React.FC<ConflictBannerProps> = ({ conflicts }) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs font-mono space-y-2"
        >
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="uppercase tracking-wider">Conflicting Signal Detected: {conflict.conflictType}</span>
          </div>

          <div className="text-slate-300 leading-relaxed">
            {conflict.reason}
          </div>

          <div className="p-2.5 rounded bg-[#0d1017] border border-amber-900/30 text-[11px] text-amber-200/90 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-amber-300">Forensic Hypothesis:</strong> {conflict.recommendation}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
