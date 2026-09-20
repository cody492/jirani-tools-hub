import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Filter,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { SecurityObservation, SecurityObservationSeverity } from '../../../types';

interface ObservationAuditListProps {
  observations: SecurityObservation[];
}

export const ObservationAuditList: React.FC<ObservationAuditListProps> = ({ observations }) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SecurityObservationSeverity>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories: string[] = Array.from(new Set(observations.map((o) => o.category as string)));

  const filteredObservations = observations.filter((o) => {
    if (severityFilter !== 'ALL' && o.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && o.category !== categoryFilter) return false;
    return true;
  });

  const getSeverityBadge = (severity: SecurityObservationSeverity, status: SecurityObservation['status']) => {
    if (status === 'PRESENT') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 uppercase">
          INFO / PRESENT
        </span>
      );
    }
    if (severity === 'ATTENTION') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 uppercase flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5" />
          <span>ATTENTION</span>
        </span>
      );
    }
    if (severity === 'REVIEW') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 uppercase flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>REVIEW</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
        {severity}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#18202e] pb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Comprehensive Forensic Observation Ledger ({filteredObservations.length})
          </h3>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filters */}
          <div className="flex items-center rounded-lg bg-[#111520] border border-[#1d2638] p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-2 py-0.5 rounded ${
                severityFilter === 'ALL'
                  ? 'bg-cyan-950/80 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ALL ({observations.length})
            </button>
            <button
              onClick={() => setSeverityFilter('INFO')}
              className={`px-2 py-0.5 rounded ${
                severityFilter === 'INFO'
                  ? 'bg-emerald-950/80 text-emerald-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              POSITIVE
            </button>
            <button
              onClick={() => setSeverityFilter('REVIEW')}
              className={`px-2 py-0.5 rounded ${
                severityFilter === 'REVIEW'
                  ? 'bg-amber-950/80 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              REVIEW
            </button>
            <button
              onClick={() => setSeverityFilter('ATTENTION')}
              className={`px-2 py-0.5 rounded ${
                severityFilter === 'ATTENTION'
                  ? 'bg-rose-950/80 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ATTENTION
            </button>
          </div>

          {/* Category Dropdown/Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-[11px] font-mono bg-[#111520] border border-[#1d2638] text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observation Items */}
      <div className="space-y-2.5">
        {filteredObservations.map((obs) => {
          const isExpanded = expandedId === obs.id;

          return (
            <div
              key={obs.id}
              className="rounded-lg bg-[#111520] border border-[#1d2638] hover:border-[#26334a] transition-colors overflow-hidden"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : obs.id)}
                className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {obs.status === 'PRESENT' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : obs.severity === 'ATTENTION' ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200 truncate">
                        {obs.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#18202e] text-slate-400 uppercase">
                        {obs.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      {obs.fact}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getSeverityBadge(obs.severity, obs.status)}
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Full Fact / Context / Assessment / Recommendation breakdown */}
              {isExpanded && (
                <div className="p-3.5 border-t border-[#18202d] bg-[#0b0e15] space-y-3 text-xs font-mono">
                  {/* Evidence Box */}
                  <div className="p-2.5 rounded bg-[#111520] border border-[#1a2333] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-400">
                      <strong className="text-[10px] uppercase text-slate-400">Evidence Source:</strong>
                      <span className="text-slate-300">{obs.evidence.source}</span>
                    </div>
                    {obs.evidence.observedKey && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span className="text-[10px] uppercase">Key:</span>
                        <code className="text-cyan-300 px-1 py-0.2 rounded bg-[#18202e]">
                          {obs.evidence.observedKey}
                        </code>
                      </div>
                    )}
                  </div>

                  {obs.observedValue && (
                    <div className="p-2 rounded bg-[#111520] border border-[#192130]">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        Observed Raw Telemetry:
                      </span>
                      <code className="text-[11px] text-cyan-300/90 break-all">
                        {obs.observedValue}
                      </code>
                    </div>
                  )}

                  {/* Fact / Context / Assessment 3-column analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                    <div className="space-y-1 p-2.5 rounded bg-[#111520] border border-[#192130]">
                      <strong className="text-[10px] uppercase text-cyan-400 block font-bold">
                        1. Observable Fact
                      </strong>
                      <p className="text-slate-300 leading-relaxed">{obs.fact}</p>
                    </div>

                    <div className="space-y-1 p-2.5 rounded bg-[#111520] border border-[#192130]">
                      <strong className="text-[10px] uppercase text-slate-400 block font-bold">
                        2. Technical Context
                      </strong>
                      <p className="text-slate-300 leading-relaxed">{obs.context}</p>
                    </div>

                    <div className="space-y-1 p-2.5 rounded bg-[#111520] border border-[#192130]">
                      <strong className="text-[10px] uppercase text-slate-400 block font-bold">
                        3. Objective Assessment
                      </strong>
                      <p className="text-slate-300 leading-relaxed">{obs.assessment}</p>
                    </div>
                  </div>

                  {/* Neutral Recommendation */}
                  {obs.recommendation && (
                    <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-300 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[10px] uppercase block font-semibold text-cyan-200">
                          Neutral Review Consideration:
                        </strong>
                        <p className="mt-0.5">{obs.recommendation}</p>
                      </div>
                    </div>
                  )}

                  {obs.technologyContext && (
                    <div className="text-[11px] text-slate-400">
                      <strong className="text-[10px] uppercase text-slate-400 block">Correlated Stack Observation:</strong>
                      <span>{obs.technologyContext}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
