import React from 'react';
import {
  Activity,
  Clock,
  Code,
  FileBox,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRightCircle,
  Network,
} from 'lucide-react';
import { HttpFinding } from '../../types';

interface HttpSummaryProps {
  finding: HttpFinding;
}

export const HttpSummary: React.FC<HttpSummaryProps> = ({ finding }) => {
  const getStatusBadge = (category: string) => {
    switch (category) {
      case 'success':
        return {
          bg: 'bg-emerald-950/60',
          text: 'text-emerald-400',
          border: 'border-emerald-700/50',
          indicator: 'bg-emerald-400',
          icon: CheckCircle2,
        };
      case 'redirection':
        return {
          bg: 'bg-amber-950/50',
          text: 'text-amber-400',
          border: 'border-amber-700/50',
          indicator: 'bg-amber-400',
          icon: ArrowRightCircle,
        };
      case 'client_error':
        return {
          bg: 'bg-rose-950/50',
          text: 'text-rose-400',
          border: 'border-rose-700/50',
          indicator: 'bg-rose-400',
          icon: AlertTriangle,
        };
      case 'server_error':
        return {
          bg: 'bg-red-950/60',
          text: 'text-red-400',
          border: 'border-red-700/60',
          indicator: 'bg-red-400',
          icon: XCircle,
        };
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-slate-300',
          border: 'border-slate-700',
          indicator: 'bg-slate-400',
          icon: Activity,
        };
    }
  };

  const statusStyle = getStatusBadge(finding.statusCategory);
  const StatusIcon = statusStyle.icon;

  return (
    <div className="rounded-lg border border-[#1b2333] bg-[#0c0f17] p-4 space-y-4 font-mono">
      {/* High impact Status & Protocol Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status Card */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${statusStyle.bg} ${statusStyle.border}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>HTTP STATUS</span>
            <span className={`w-2 h-2 rounded-full ${statusStyle.indicator} animate-pulse`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${statusStyle.text}`}>
              {finding.statusCode}
            </span>
            <span className="text-xs font-semibold text-slate-200 truncate">
              {finding.statusText}
            </span>
          </div>
        </div>

        {/* Response Time Card */}
        <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1a2333] flex flex-col justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>RESPONSE TIME</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-cyan-300">
              {finding.responseTimeMs}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
        </div>

        {/* Content Type Card */}
        <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1a2333] flex flex-col justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-indigo-400" />
            <span>CONTENT TYPE</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-slate-100 truncate" title={finding.contentType}>
              {finding.contentType.split(';')[0]}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {finding.contentLengthFormatted ? `${finding.contentLengthFormatted} transferred` : 'Transfer-Encoding: chunked'}
            </div>
          </div>
        </div>

        {/* Protocol & Method */}
        <div className="p-3 rounded-lg bg-[#0e121b] border border-[#1a2333] flex flex-col justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>PROTOCOL / METHOD</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-emerald-400 truncate">
              {finding.protocol}
            </div>
            <div className="text-[10px] text-slate-400">
              Method: <span className="text-slate-300 font-bold">{finding.method}</span> • {finding.executionMode}
            </div>
          </div>
        </div>
      </div>

      {/* Target and Final URL verification */}
      <div className="p-3 rounded bg-[#0a0d14] border border-[#182130] space-y-2 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">
              FINAL DESTINATION:
            </span>
            <a
              href={finding.finalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2 truncate flex items-center gap-1"
            >
              <span>{finding.finalUrl}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">
            {finding.hasRedirect ? `${finding.redirectCount} REDIRECT HOP(S)` : 'DIRECT UNMODIFIED DESTINATION'}
          </span>
        </div>
      </div>
    </div>
  );
};
