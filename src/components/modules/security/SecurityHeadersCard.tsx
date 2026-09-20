import React, { useState } from 'react';
import { Shield, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Info } from 'lucide-react';
import { SecurityObservation } from '../../../types';

interface SecurityHeadersCardProps {
  observations: SecurityObservation[];
}

export const SecurityHeadersCard: React.FC<SecurityHeadersCardProps> = ({ observations }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter observations related to headers (security_headers, content_security_policy, hsts, clickjacking, content_type, permissions_policy)
  const headerObservations = observations.filter((o) =>
    ['security_headers', 'content_security_policy', 'hsts', 'clickjacking', 'content_type', 'permissions_policy'].includes(o.category)
  );

  const getSeverityBadge = (severity: SecurityObservation['severity'], status: SecurityObservation['status']) => {
    if (status === 'PRESENT') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 uppercase">
          PRESENT
        </span>
      );
    }
    if (severity === 'ATTENTION') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 uppercase">
          ATTENTION
        </span>
      );
    }
    if (severity === 'REVIEW') {
      return (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 uppercase">
          REVIEW
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#18202e] pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            HTTP Security Headers Inspection
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {headerObservations.filter((o) => o.status === 'PRESENT').length} of {headerObservations.length} Observed
        </span>
      </div>

      {/* Header Observation List */}
      <div className="space-y-2.5">
        {headerObservations.map((obs) => {
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
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-200 block truncate">
                      {obs.title}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 truncate block">
                      {obs.fact}
                    </span>
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

              {/* Collapsible Forensic Detail */}
              {isExpanded && (
                <div className="p-3 border-t border-[#18202d] bg-[#0b0e15] space-y-3 text-xs font-mono">
                  {obs.observedValue && (
                    <div className="p-2 rounded bg-[#111520] border border-[#192130] space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Observed Raw Value:</span>
                      <code className="text-[11px] text-cyan-300 break-all font-mono">
                        {obs.observedValue}
                      </code>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="space-y-0.5">
                      <strong className="text-[10px] uppercase text-slate-400 block font-semibold">1. Observable Fact:</strong>
                      <p className="text-slate-300">{obs.fact}</p>
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-[10px] uppercase text-slate-400 block font-semibold">2. Technical Context:</strong>
                      <p className="text-slate-300">{obs.context}</p>
                    </div>
                    <div className="space-y-0.5">
                      <strong className="text-[10px] uppercase text-slate-400 block font-semibold">3. Objective Assessment:</strong>
                      <p className="text-slate-300">{obs.assessment}</p>
                    </div>
                  </div>

                  {obs.recommendation && (
                    <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-900/40 text-[11px] text-cyan-300 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[10px] uppercase block font-semibold text-cyan-200">
                          Neutral Review Consideration:
                        </strong>
                        <p>{obs.recommendation}</p>
                      </div>
                    </div>
                  )}

                  {obs.technologyContext && (
                    <div className="text-[11px] text-slate-400 italic">
                      Platform Observation: {obs.technologyContext}
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
