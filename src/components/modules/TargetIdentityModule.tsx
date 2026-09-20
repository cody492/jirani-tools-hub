import React from 'react';
import {
  Globe,
  Calendar,
  CheckCircle,
  Hash,
  ExternalLink,
  ShieldCheck,
  Clock,
  Code,
  ArrowRightCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { TargetMetadata, HttpFinding } from '../../types';
import { ModuleCard, ModulePlaceholderNotice } from '../ui/ModuleCard';

interface TargetIdentityModuleProps {
  target: TargetMetadata;
  scanId: string;
  scanDurationMs: number;
  httpFinding?: HttpFinding | null;
}

export const TargetIdentityModule: React.FC<TargetIdentityModuleProps> = ({
  target,
  scanId,
  scanDurationMs,
  httpFinding,
}) => {
  const isLive = Boolean(httpFinding);

  const getStatusIndicator = () => {
    if (!httpFinding) return null;
    const code = httpFinding.statusCode;
    if (code >= 200 && code < 300) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-800/40',
        label: `${code} ${httpFinding.statusText}`,
        icon: CheckCircle,
      };
    }
    if (code >= 300 && code < 400) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-950/40',
        border: 'border-amber-800/40',
        label: `${code} ${httpFinding.statusText}`,
        icon: ArrowRightCircle,
      };
    }
    if (code >= 400 && code < 500) {
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-950/40',
        border: 'border-rose-800/40',
        label: `${code} ${httpFinding.statusText}`,
        icon: AlertTriangle,
      };
    }
    return {
      text: 'text-red-400',
      bg: 'bg-red-950/40',
      border: 'border-red-800/40',
      label: `${code} ${httpFinding.statusText}`,
      icon: XCircle,
    };
  };

  const statusIndicator = getStatusIndicator();

  return (
    <ModuleCard
      id="module-target-identity"
      title="Target Identity & Resolution"
      subtitle="Canonical domain verification & HTTP endpoint coordinates"
      icon={Globe}
      versionBadge={isLive ? 'V0.2 VERIFIED' : 'CORE SPEC'}
      statusBadge={{
        label: isLive ? 'LIVE INSPECTION' : 'RESOLVED (SYNTAX)',
        variant: isLive ? 'emerald' : 'cyan',
      }}
    >
      <div className="space-y-4">
        {/* Key Identity Attribute Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Target Host */}
          <div className="p-2.5 rounded bg-[#0e1119] border border-[#1b212f]">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Canonical Domain
            </div>
            <div className="text-sm font-mono font-semibold text-cyan-300 mt-1 truncate">
              {target.domain}
            </div>
          </div>

          {/* Final URL or Hostname */}
          <div className="p-2.5 rounded bg-[#0e1119] border border-[#1b212f]">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {httpFinding ? 'Final Destination URL' : 'Target Hostname'}
            </div>
            <div className="text-sm font-mono font-medium text-slate-200 mt-1 truncate" title={httpFinding?.finalUrl || target.hostname}>
              {httpFinding ? httpFinding.finalUrl : target.hostname}
            </div>
          </div>

          {/* Status or Protocol */}
          <div className="p-2.5 rounded bg-[#0e1119] border border-[#1b212f]">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {httpFinding ? 'HTTP Status' : 'Protocol & Port'}
            </div>
            {statusIndicator ? (
              <div className={`text-sm font-mono font-bold ${statusIndicator.text} mt-1 flex items-center gap-1.5 truncate`}>
                <statusIndicator.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{statusIndicator.label}</span>
              </div>
            ) : (
              <div className="text-sm font-mono font-medium text-emerald-400 mt-1">
                {target.protocol.toUpperCase()} / {target.port}
              </div>
            )}
          </div>

          {/* Protocol / Method (or ID) */}
          <div className="p-2.5 rounded bg-[#0e1119] border border-[#1b212f]">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {httpFinding ? 'Protocol & Method' : 'Investigation ID'}
            </div>
            {httpFinding ? (
              <div className="text-xs font-mono text-emerald-400 mt-1 font-semibold truncate">
                {httpFinding.protocol} ({httpFinding.method})
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-300 mt-1 truncate flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-500" />
                <span>{scanId}</span>
              </div>
            )}
          </div>

          {/* Content Type or Timestamp */}
          <div className="p-2.5 rounded bg-[#0e1119] border border-[#1b212f]">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {httpFinding ? 'MIME Content-Type' : 'Analysis Timestamp'}
            </div>
            {httpFinding ? (
              <div className="text-xs font-mono text-slate-300 mt-1 truncate" title={httpFinding.contentType}>
                {httpFinding.contentType.split(';')[0]}
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-300 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{new Date(target.parsedAt).toLocaleTimeString()} UTC</span>
              </div>
            )}
          </div>

          {/* Response Time or Pipeline State */}
          <div className="p-2.5 rounded bg-[#0e1119] border border-[#1b212f]">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {httpFinding ? 'Live Response Latency' : 'Pipeline State'}
            </div>
            {httpFinding ? (
              <div className="text-xs font-mono text-cyan-300 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="font-bold">{httpFinding.responseTimeMs} ms</span>
                <span className="text-[10px] text-slate-400">({httpFinding.executionMode})</span>
              </div>
            ) : (
              <div className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span>SYNTAX RESOLVED ({(scanDurationMs / 1000).toFixed(1)}s)</span>
              </div>
            )}
          </div>
        </div>

        {/* Normalized Target URI Bar */}
        <div className="p-2.5 rounded bg-[#0b0e14] border border-[#191f2c] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase text-slate-400 font-semibold shrink-0">
              ORIGINAL TARGET:
            </span>
            <span className="text-slate-300 truncate selection:bg-cyan-500/30">
              {target.normalizedUrl}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">
            Path: <code className="text-slate-300">{target.path}</code>
          </span>
        </div>
      </div>
    </ModuleCard>
  );
};
