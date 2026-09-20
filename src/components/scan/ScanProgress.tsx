import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Clock,
  FastForward,
  XCircle,
  Shield,
  Activity,
  Layers,
  ArrowRight,
  Database,
  Network,
  Cpu,
  Lock,
  GitFork,
  FileCheck,
  Radio,
  Mail,
  FileText,
} from 'lucide-react';
import { ScanStage, TargetMetadata } from '../../types';

interface ScanProgressProps {
  target: TargetMetadata;
  stages: ScanStage[];
  currentStageIndex: number;
  onCompleteNow: () => void;
  onAbort: () => void;
}

export const INITIAL_STAGES: Omit<ScanStage, 'status'>[] = [
  {
    id: 'init',
    name: 'Initializing investigation',
    sublabel: 'Allocating forensic session & telemetry observers',
    futureModule: 'CORE FRAMEWORK',
    durationMs: 300,
    detailMessage: 'Generated ephemeral session ID, allocated request telemetry observers',
  },
  {
    id: 'normalize',
    name: 'Normalizing target',
    sublabel: 'Validating RFC syntax, canonical domain & URI schema',
    futureModule: 'RFC RESOLVER',
    durationMs: 300,
    detailMessage: 'Normalized domain hierarchy and validated public protocol boundary',
  },
  {
    id: 'http_inspect',
    name: 'Inspecting HTTP endpoint',
    sublabel: 'Evaluating HTTP response line, redirects, status code & headers',
    futureModule: 'HTTP INTELLIGENCE (V0.2)',
    durationMs: 450,
    detailMessage: 'Dispatched outbound GET probe via HTTP inspection daemon',
  },
  {
    id: 'dns_zone',
    name: 'Resolving DNS zone authority',
    sublabel: 'Querying authoritative nameservers (NS records)',
    futureModule: 'ZONE AUTHORITY (V0.3)',
    durationMs: 400,
    detailMessage: 'Queried authoritative nameservers and zone delegation handlers',
  },
  {
    id: 'ip_topology',
    name: 'Resolving IP address records',
    sublabel: 'Resolving IPv4 (A) and dual-stack IPv6 (AAAA) records',
    futureModule: 'IP TOPOLOGY (V0.3)',
    durationMs: 400,
    detailMessage: 'Identified network layer host endpoints and address routing records',
  },
  {
    id: 'routing_relations',
    name: 'Inspecting mail & CNAME routing',
    sublabel: 'Resolving MX priority ranks and canonical alias delegations',
    futureModule: 'ROUTING TOPOLOGY (V0.3)',
    durationMs: 350,
    detailMessage: 'Parsed mail exchange hosts and canonical CNAME relationship chains',
  },
  {
    id: 'txt_telemetry',
    name: 'Inspecting TXT telemetry',
    sublabel: 'Extracting SPF configuration, DMARC policy & verification tokens',
    futureModule: 'DOMAIN TELEMETRY (V0.3)',
    durationMs: 350,
    detailMessage: 'Categorized SPF security records and third-party domain verification strings',
  },
  {
    id: 'infra_indicators',
    name: 'Correlating infrastructure clues',
    sublabel: 'Evaluating evidence-backed CDN, DNS provider & cloud indicators',
    futureModule: 'INDICATOR ENGINE (V0.3)',
    durationMs: 350,
    detailMessage: 'Assessed observable infrastructure clues with strict confidence ratings',
  },
  {
    id: 'tech_fingerprint',
    name: 'Fingerprinting technologies',
    sublabel: 'Correlating framework markers, CMS signatures, script bundles & headers',
    futureModule: 'TECHNOLOGY INTELLIGENCE (V0.4)',
    durationMs: 400,
    detailMessage: 'Analyzed public web resource telemetry, libraries, and confidence evidence',
  },
  {
    id: 'security_observations',
    name: 'Auditing security configuration',
    sublabel: 'Inspecting HTTPS enforcement, security headers, cookie hygiene & TLS',
    futureModule: 'SECURITY OBSERVATIONS (V0.5)',
    durationMs: 400,
    detailMessage: 'Evaluated public transport encryption, CSP directives, HSTS and cookie security attributes',
  },
  {
    id: 'relationship_graph',
    name: 'Synthesizing relationship topology',
    sublabel: 'Correlating cross-domain entities, DNS records & tech dependencies into visual graph',
    futureModule: 'RELATIONSHIP GRAPH (V0.6)',
    durationMs: 350,
    detailMessage: 'Constructed deterministic entity nodes and verified directional relationships',
  },
  {
    id: 'structure',
    name: 'Structuring findings',
    sublabel: 'Distinguishing facts from interpretations & correlating evidence',
    futureModule: 'ANALYSIS MODEL (V0.6)',
    durationMs: 250,
    detailMessage: 'Synthesized telemetry entities and verified observable boundaries',
  },
  {
    id: 'prepare',
    name: 'Preparing forensic workspace',
    sublabel: 'Compiling HTTP, Infrastructure, Tech, Security & Relationship Graph into interactive console',
    futureModule: 'WORKSPACE ENGINE (V0.6)',
    durationMs: 200,
    detailMessage: 'Compiled multi-module forensic report for analyst review',
  },
];

export const ScanProgress: React.FC<ScanProgressProps> = ({
  target,
  stages,
  currentStageIndex,
  onCompleteNow,
  onAbort,
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const totalStages = stages.length;
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const currentStage = stages[currentStageIndex] || stages[stages.length - 1];

  // Calculate percentage smoothly based on current stage and elapsed sub-progress
  const progressPercent = Math.min(
    100,
    Math.round(((completedCount + (currentStage?.status === 'active' ? 0.6 : 0)) / totalStages) * 100)
  );

  const getStageIcon = (id: string) => {
    switch (id) {
      case 'init':
        return Shield;
      case 'normalize':
        return Activity;
      case 'http_inspect':
        return Activity;
      case 'dns_zone':
        return Radio;
      case 'ip_topology':
        return Network;
      case 'routing_relations':
        return Mail;
      case 'txt_telemetry':
        return FileText;
      case 'infra_indicators':
        return Activity;
      case 'tech_fingerprint':
        return Cpu;
      case 'security_observations':
        return Lock;
      case 'relationship_graph':
        return GitFork;
      case 'structure':
        return Database;
      case 'prepare':
        return FileCheck;
      default:
        return Layers;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Progress Panel */}
      <div className="rounded-xl border border-[#1e2536] bg-[#10131b] p-5 sm:p-6 shadow-2xl">
        {/* Scan Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1b212e]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-800/40">
                ACTIVE INVESTIGATION
              </span>
              <span className="text-xs font-mono text-slate-400">
                V0.6 RELATIONSHIP GRAPH & FORENSIC ENGINE
              </span>
            </div>
            <h2 className="text-lg font-mono font-bold text-slate-100 mt-1.5 flex items-center gap-2 truncate">
              <span className="text-cyan-400">{target.hostname}</span>
              <span className="text-xs text-slate-400 font-normal">({target.protocol}//)</span>
            </h2>
          </div>

          {/* Timers and Actions */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded bg-[#151a25] border border-[#212838] font-mono text-xs flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{(elapsedMs / 1000).toFixed(1)}s elapsed</span>
            </div>

            <button
              type="button"
              id="btn-fast-forward-scan"
              onClick={onCompleteNow}
              className="px-3 py-1.5 rounded bg-[#162030] hover:bg-[#1f2d44] border border-[#273a56] text-cyan-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
              title="Skip remaining simulation delay"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Complete Now</span>
            </button>

            <button
              type="button"
              id="btn-abort-scan"
              onClick={onAbort}
              className="p-1.5 rounded bg-[#1b1517] hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 hover:text-rose-300 transition-colors"
              title="Abort scan"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="py-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Stage {Math.min(currentStageIndex + 1, totalStages)} of {totalStages}: {currentStage?.name}
            </span>
            <span className="text-cyan-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-[#171b26] rounded-full overflow-hidden border border-[#22283a]">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stages Checklist */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 pb-1">
            FORENSIC MODULE PIPELINE (SIMULATED SEQUENCE)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stages.map((stage, index) => {
              const StageIcon = getStageIcon(stage.id);
              const isActive = stage.status === 'active';
              const isCompleted = stage.status === 'completed';

              return (
                <div
                  key={stage.id}
                  className={`p-3 rounded-lg border transition-all duration-200 flex items-start gap-3 ${
                    isActive
                      ? 'bg-[#151a26] border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.08)]'
                      : isCompleted
                      ? 'bg-[#0f121a] border-[#1d2331] text-slate-300'
                      : 'bg-[#0d1017] border-[#181d28] text-slate-600 opacity-60'
                  }`}
                >
                  {/* Status indicator icon */}
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full bg-cyan-950/60 border border-cyan-600/60 flex items-center justify-center text-cyan-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#161a24] border border-[#242c3d] flex items-center justify-center text-slate-600 text-[10px] font-mono">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Stage text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-semibold font-mono tracking-wide truncate">
                        <span className={isActive ? 'text-cyan-300' : isCompleted ? 'text-slate-200' : 'text-slate-400'}>
                          {stage.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {stage.futureModule.split(' ')[0]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {stage.sublabel}
                    </div>
                    {isActive && stage.detailMessage && (
                      <div className="text-[10px] font-mono text-cyan-400/90 mt-1 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                        <span className="truncate">{stage.detailMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Architecture Disclaimer */}
        <div className="mt-5 p-3 rounded bg-[#0d1017] border border-[#1b2230] flex items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-slate-300">V0.4 Live Pipeline:</strong> Executing HTTP inspection, DNS infrastructure resolution, and passive technology fingerprinting.
            </span>
          </div>
          <span className="text-[10px] uppercase text-slate-400 hidden sm:inline">
            Passive Web Inspection
          </span>
        </div>
      </div>
    </div>
  );
};
