import React from 'react';
import { Sliders, Layers, ShieldCheck, CheckCircle2, ArrowRight, GitBranch, Terminal } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const roadmapSteps = [
    {
      version: 'V0.1',
      title: 'FOUNDATION',
      desc: 'Project architecture, visual identity, target input & RFC validation, scan lifecycle state machine, results workspace scaffolding, placeholder modules.',
      status: 'ACTIVE_DEPLOYED',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10',
    },
    {
      version: 'V0.2',
      title: 'HTTP INTELLIGENCE',
      desc: 'Live HTTP/1.1 & HTTP/2 protocol negotiation, response headers inspection, redirect chains, status code matrix & latency benchmarks.',
      status: 'ACTIVE_DEPLOYED',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10',
    },
    {
      version: 'V0.3',
      title: 'INFRASTRUCTURE INTELLIGENCE',
      desc: 'Authoritative DNS resolver, IPv4/IPv6 address routing, nameservers, mail exchanges (MX), CNAME delegation chains, TXT telemetry, and indicators.',
      status: 'ACTIVE_DEPLOYED',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10',
    },
    {
      version: 'V0.4',
      title: 'TECHNOLOGY FINGERPRINTING',
      desc: 'Passive signature matching, CMS signatures, frontend frameworks, JS libraries, server software detection, confidence scoring & conflict evaluation.',
      status: 'ACTIVE_DEPLOYED',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10',
    },
    {
      version: 'V0.5',
      title: 'SECURITY OBSERVATIONS',
      desc: 'TLS 1.3 / X.509 certificate chain validation, HSTS, Content-Security-Policy (CSP), cookie security flags & automated defensive posture scoring.',
      status: 'ACTIVE_DEPLOYED',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/10',
    },
    {
      version: 'V0.6',
      title: 'RELATIONSHIP GRAPH (CURRENT)',
      desc: 'Interactive entity topology graph: Target → Infrastructure → Technologies → Services → Public Entities with cross-domain pivoting.',
      status: 'ACTIVE_DEPLOYED',
      color: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/20',
    },
    {
      version: 'V0.7',
      title: 'AI FORENSIC ANALYST',
      desc: 'Automated synthesis agent, threat narrative generation, anomaly detection & executive forensic briefings.',
      status: 'QUEUED',
      color: 'border-[#22293b] text-slate-400 bg-[#0e1119]',
    },
    {
      version: 'V1.0',
      title: 'FULL WEB FORENSICS PLATFORM',
      desc: 'Unified multi-target investigations, case export, scheduled monitoring, team collaboration & TRACE platform integration.',
      status: 'HORIZON',
      color: 'border-[#22293b] text-slate-500 bg-[#0c0e16]',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#1c2232]">
        <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Engine Architecture & Platform Roadmap
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          System blueprint for incremental forensic module expansion
        </p>
      </div>

      {/* Engine Status Card */}
      <div className="rounded-xl border border-[#1e2536] bg-[#10131c] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1b2230] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              V0.6 Full Stack Forensic & Relationship Graph Engine Runtime
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            ENGINE STATUS: NOMINAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-[#0d1017] border border-[#1b212f]">
            <div className="text-[10px] text-slate-400 uppercase">Architecture</div>
            <div className="font-semibold text-slate-200 mt-1">Modular Micro-Panels</div>
          </div>
          <div className="p-3 rounded bg-[#0d1017] border border-[#1b212f]">
            <div className="text-[10px] text-slate-400 uppercase">Analysis Engine</div>
            <div className="font-semibold text-cyan-400 mt-1">Real DNS & HTTP Probing</div>
          </div>
          <div className="p-3 rounded bg-[#0d1017] border border-[#1b212f]">
            <div className="text-[10px] text-slate-400 uppercase">DNS Resolver</div>
            <div className="font-semibold text-emerald-400 mt-1">Dual Node / DoH Stack</div>
          </div>
          <div className="p-3 rounded bg-[#0d1017] border border-[#1b212f]">
            <div className="text-[10px] text-slate-400 uppercase">Research Scope</div>
            <div className="font-semibold text-emerald-400 mt-1">Defensive & Passive</div>
          </div>
        </div>
      </div>

      {/* Incremental Roadmap Timeline */}
      <div className="rounded-xl border border-[#1e2536] bg-[#10131c] p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1b2230] pb-3">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Incremental Version Evolution Plan
          </h3>
        </div>

        <div className="space-y-2.5">
          {roadmapSteps.map((step, idx) => (
            <div
              key={step.version}
              className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${step.color}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                    {step.version}
                  </span>
                  <span className="font-mono text-xs font-bold tracking-wide text-slate-200">
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] font-sans text-slate-400 leading-relaxed max-w-3xl">
                  {step.desc}
                </p>
              </div>

              <div className="shrink-0 pt-0.5">
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-black/30 border border-white/10 text-slate-400">
                  {step.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
