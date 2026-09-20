import React from 'react';
import {
  GitFork,
  Layers,
  Server,
  Cpu,
  Shield,
  Lock,
  Activity,
} from 'lucide-react';
import { GraphSummaryData } from '../../types';

interface GraphSummaryHeaderProps {
  summary: GraphSummaryData;
  isBuilding?: boolean;
}

export const GraphSummaryHeader: React.FC<GraphSummaryHeaderProps> = ({
  summary,
  isBuilding,
}) => {
  return (
    <div className="p-3 bg-[#0d121c]/80 border-b border-[#1b2333] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* Metrics group */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-400">Entities:</span>
          <strong className="text-slate-100 font-bold">{summary.totalNodes}</strong>
        </div>

        <div className="flex items-center gap-1.5">
          <GitFork className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-slate-400">Relationships:</span>
          <strong className="text-indigo-300 font-bold">{summary.totalEdges}</strong>
        </div>

        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400">Categories:</span>
          <strong className="text-emerald-300 font-bold">{summary.categoriesCount}</strong>
        </div>
      </div>

      {/* Category breakdown badges */}
      <div className="hidden lg:flex items-center gap-1.5 text-[10px]">
        {summary.ipCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/40">
            {summary.ipCount} IP{summary.ipCount > 1 ? 's' : ''}
          </span>
        )}
        {summary.nameserverCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/40">
            {summary.nameserverCount} NS
          </span>
        )}
        {summary.mailServerCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/40">
            {summary.mailServerCount} MX
          </span>
        )}
        {summary.cnameCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-800/40">
            {summary.cnameCount} CNAME
          </span>
        )}
        {summary.technologyCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/40">
            {summary.technologyCount} Tech
          </span>
        )}
        {summary.securityCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/40">
            {summary.securityCount} Security
          </span>
        )}
      </div>
    </div>
  );
};
