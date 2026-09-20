import React, { useState } from 'react';
import { TechnologyFinding } from '../../../types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { EvidenceList } from './EvidenceList';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';

interface TechnologyCardProps {
  technology: TechnologyFinding;
}

export const TechnologyCard: React.FC<TechnologyCardProps> = ({ technology }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div
      className={`rounded-lg border transition-all duration-200 bg-[#0e1119] ${
        technology.isConflicted
          ? 'border-amber-800/40 hover:border-amber-700/60'
          : 'border-[#1e2536] hover:border-[#2b354c]'
      }`}
    >
      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Top Header Row: Name, Category, Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
              <span>{technology.name}</span>
              {technology.website && (
                <a
                  href={technology.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-cyan-400 transition-colors"
                  title={`Visit ${technology.name} documentation`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </h3>

            {/* Category badge */}
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#151b27] text-cyan-300 border border-[#232c3f]">
              {technology.categoryLabel}
            </span>

            {/* Conflicted Warning Badge */}
            {technology.isConflicted && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/50">
                <AlertTriangle className="w-3 h-3" />
                Conflicted Signal
              </span>
            )}
          </div>

          {/* Right: Confidence Badge & Score */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ConfidenceBadge
              confidence={technology.confidence}
              score={technology.confidenceScore}
            />
          </div>
        </div>

        {/* Second Row: Version Information & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="text-slate-400 text-xs leading-relaxed max-w-2xl">
            {technology.description}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {technology.version ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#131a26] border border-cyan-800/40 text-cyan-300 text-xs font-mono">
                <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">v</span>
                <span className="font-bold text-slate-100">{technology.version}</span>
                {technology.versionReliability === 'EXACT' && (
                  <span className="text-[9px] uppercase px-1 py-0.2 bg-emerald-950 text-emerald-400 rounded border border-emerald-800/50">
                    EXACT
                  </span>
                )}
              </span>
            ) : (
              <span className="px-2 py-1 rounded bg-[#11141d] border border-[#1d2331] text-slate-500 text-[11px] font-mono">
                Version: Undisclosed
              </span>
            )}
          </div>
        </div>

        {/* Conflict detail note if applicable */}
        {technology.conflictDetails && (
          <div className="text-[11px] font-mono text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-900/40">
            {technology.conflictDetails}
          </div>
        )}

        {/* Expandable Evidence Bar */}
        <div className="pt-2 border-t border-[#171d2a] flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Corroborated by <strong className="text-slate-200">{technology.evidence.length}</strong> {technology.evidence.length === 1 ? 'indicator' : 'indicators'} across <strong className="text-slate-200">{technology.evidenceSourcesCount}</strong> distinct telemetry {technology.evidenceSourcesCount === 1 ? 'type' : 'types'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded text-xs font-mono text-cyan-300 hover:text-cyan-200 bg-[#141b27] hover:bg-[#1a2333] border border-[#212c3f] flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? 'Hide Evidence' : 'Inspect Evidence'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Evidence List when expanded */}
        {isExpanded && <EvidenceList evidence={technology.evidence} />}
      </div>
    </div>
  );
};
