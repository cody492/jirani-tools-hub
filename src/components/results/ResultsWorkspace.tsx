import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  RotateCcw,
  Shield,
  FileJson,
  Layers,
  Sparkles,
  Printer,
  ExternalLink,
} from 'lucide-react';
import {
  TargetMetadata,
  InvestigationRecord,
  HttpFinding,
  HttpInspectionError,
  InfrastructureFinding,
  InfrastructureInspectionError,
  TechnologyReport,
  TechnologyInspectionError,
  SecurityReport,
  SecurityInspectionError,
} from '../../types';
import { TargetIdentityModule } from '../modules/TargetIdentityModule';
import { ForensicScoreModule } from '../modules/ForensicScoreModule';
import { InfrastructureModule } from '../modules/InfrastructureModule';
import { TechnologyModule } from '../modules/TechnologyModule';
import { SecurityModule } from '../modules/SecurityModule';
import { RelationshipGraphModule } from '../modules/RelationshipGraphModule';
import { AIAnalystModule } from '../modules/AIAnalystModule';
import { HttpIntelligenceModule } from '../http/HttpIntelligenceModule';

interface ResultsWorkspaceProps {
  target: TargetMetadata;
  scanId: string;
  scanDurationMs: number;
  onNewScan: () => void;
  httpFinding?: HttpFinding | null;
  httpError?: HttpInspectionError | null;
  infrastructureFinding?: InfrastructureFinding | null;
  infrastructureError?: InfrastructureInspectionError | null;
  technologyFinding?: TechnologyReport | null;
  technologyReport?: TechnologyReport | null;
  technologyError?: TechnologyInspectionError | null;
  securityFinding?: SecurityReport | null;
  securityReport?: SecurityReport | null;
  securityError?: SecurityInspectionError | null;
}

export const ResultsWorkspace: React.FC<ResultsWorkspaceProps> = ({
  target,
  scanId,
  scanDurationMs,
  onNewScan,
  httpFinding,
  httpError,
  infrastructureFinding,
  infrastructureError,
  technologyFinding,
  technologyReport,
  technologyError,
  securityFinding,
  securityReport,
  securityError,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Unify props so neither naming convention can fail
  const activeTechFinding = technologyFinding ?? technologyReport ?? null;
  const activeSecurityFinding = securityFinding ?? securityReport ?? null;

  const handleNavigateToModule = (targetModuleId: string) => {
    let el = document.getElementById(targetModuleId);
    if (!el && (targetModuleId === 'module-technologies' || targetModuleId === 'module-technology')) {
      el = document.getElementById('module-technology') || document.getElementById('module-technologies');
    }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-2', 'ring-cyan-400');
      setTimeout(() => el?.classList.remove('ring-2', 'ring-cyan-400'), 1800);
    }
  };

  const manifestData = {
    forensicPlatform: 'WEB FORENSICS',
    version: 'V0.6-RELATIONSHIP-GRAPH',
    investigationId: scanId,
    timestamp: target.parsedAt,
    scanDurationMs,
    target: {
      rawInput: target.rawInput,
      domain: target.domain,
      hostname: target.hostname,
      protocol: target.protocol,
      port: target.port,
      normalizedUrl: target.normalizedUrl,
    },
    httpIntelligence: httpFinding
      ? {
          status: 'VERIFIED_OBSERVATION',
          statusCode: httpFinding.statusCode,
          statusText: httpFinding.statusText,
          protocol: httpFinding.protocol,
          method: httpFinding.method,
          finalUrl: httpFinding.finalUrl,
          responseTimeMs: httpFinding.responseTimeMs,
          contentType: httpFinding.contentType,
          contentLength: httpFinding.contentLength,
          redirectCount: httpFinding.redirectCount,
          redirects: httpFinding.redirects,
          pageMetadata: httpFinding.pageMetadata,
          rawHeadersCount: httpFinding.rawHeadersCount,
          headers: httpFinding.headers,
        }
      : {
          status: httpError ? 'INSPECTION_FAILED' : 'NO_TELEMETRY',
          error: httpError,
        },
    infrastructureIntelligence: infrastructureFinding
      ? {
          status: 'VERIFIED_OBSERVATION',
          queriedAt: infrastructureFinding.queriedAt,
          summary: infrastructureFinding.summary,
          whois: infrastructureFinding.whois,
          ipAddresses: infrastructureFinding.ipObservations,
          nameservers: infrastructureFinding.nameserverObservations,
          mailServers: infrastructureFinding.mailServerObservations,
          cnameRelationships: infrastructureFinding.cnameRelationships,
          indicators: infrastructureFinding.indicators,
          allRecordsCount: infrastructureFinding.allRecords.length,
          allRecords: infrastructureFinding.allRecords,
          relationships: infrastructureFinding.relationships,
        }
      : {
          status: infrastructureError ? 'RESOLUTION_FAILED' : 'NO_TELEMETRY',
          error: infrastructureError,
        },
    technologyIntelligence: activeTechFinding
      ? {
          status: 'VERIFIED_OBSERVATION',
          queriedAt: activeTechFinding.analyzedAt,
          summary: activeTechFinding.summary,
          technologiesCount: activeTechFinding.technologies.length,
          technologies: activeTechFinding.technologies,
          conflicts: activeTechFinding.conflicts,
          rawAnalyzedInputs: activeTechFinding.rawAnalyzedInputs,
          relationships: activeTechFinding.relationships,
        }
      : {
          status: technologyError ? 'DETECTION_FAILED' : 'NO_TELEMETRY',
          error: technologyError,
        },
    securityIntelligence: activeSecurityFinding
      ? {
          status: 'VERIFIED_OBSERVATION',
          analyzedAt: activeSecurityFinding.analyzedAt,
          summary: activeSecurityFinding.summary,
          https: activeSecurityFinding.https,
          csp: activeSecurityFinding.csp,
          hsts: activeSecurityFinding.hsts,
          framing: activeSecurityFinding.framing,
          cookiesCount: activeSecurityFinding.cookies.items.length,
          tls: activeSecurityFinding.tls,
          observationsCount: activeSecurityFinding.observations.length,
          observations: activeSecurityFinding.observations,
        }
      : {
          status: securityError ? 'SECURITY_AUDIT_FAILED' : 'NO_TELEMETRY',
          error: securityError,
        },
    modules: {
      targetIdentity: {
        status: 'VERIFIED_HTTP_RESOLUTION',
        note: 'Domain canonical structure and HTTP endpoint verified',
      },
      infrastructure: {
        status: infrastructureFinding ? 'ACTIVE_VERIFIED_V0.3' : 'FAILED',
        summary: infrastructureFinding?.summary || null,
      },
      technologies: {
        status: technologyFinding ? 'ACTIVE_VERIFIED_V0.4' : 'FAILED',
        summary: technologyFinding?.summary || null,
      },
      security: {
        status: securityFinding ? 'ACTIVE_VERIFIED_V0.5' : 'FAILED',
        summary: securityFinding?.summary || null,
      },
      relationshipGraph: {
        status: 'ACTIVE_VERIFIED_V0.6',
        entitiesCount:
          (infrastructureFinding?.relationships.entities.length || 0) +
          (technologyFinding?.relationships.length || 0) +
          (securityFinding ? 2 : 0) + 1,
        linksCount:
          (infrastructureFinding?.relationships.links.length || 0) +
          (technologyFinding?.relationships.length || 0) +
          (securityFinding ? 2 : 0),
        topology: 'TARGET -> INFRASTRUCTURE -> DNS -> TECHNOLOGIES -> SECURITY',
      },
      aiAnalyst: {
        status: 'AWAITING_TELEMETRY_V0.7',
      },
    },
    complianceNotice: 'Publicly observable web metadata research only. Defensive posture assessment.',
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(scanId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(manifestData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `web-forensics-${target.domain}-${scanId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Investigation Top Meta Header */}
      <div className="rounded-xl border border-[#1d2434] bg-[#0e1119] p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-bold tracking-wider">
              {securityFinding && technologyFinding && infrastructureFinding && httpFinding
                ? 'FULL FORENSIC AUDIT & RELATIONSHIP GRAPH COMPLETE (V0.6)'
                : technologyFinding && infrastructureFinding && httpFinding
                ? 'FORENSIC AUDIT COMPLETE (V0.4)'
                : httpFinding && infrastructureFinding
                ? 'HTTP & INFRASTRUCTURE COMPLETE (V0.3)'
                : httpFinding
                ? 'HTTP INSPECTION COMPLETE (V0.2)'
                : infrastructureFinding
                ? 'INFRASTRUCTURE RESOLUTION COMPLETE (V0.3)'
                : 'INVESTIGATION CONCLUDED'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Session ID: <code className="text-cyan-400 font-semibold">{scanId}</code>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold text-slate-100 mt-2 truncate flex items-center gap-2">
            <span>Target:</span>
            <span className="text-cyan-400 selection:bg-cyan-500/30">{target.hostname}</span>
          </h1>
          <div className="text-xs font-mono text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Normalized: <code className="text-slate-300">{target.normalizedUrl}</code></span>
            <span>Duration: <strong className="text-slate-300">{scanDurationMs}ms</strong></span>
            <span>Timestamp: {new Date(target.parsedAt).toUTCString()}</span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="btn-copy-scan-id"
            onClick={handleCopyId}
            className="px-3 py-2 rounded-lg bg-[#141923] hover:bg-[#1a2130] border border-[#232c3e] text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Copy Investigation ID"
          >
            {copiedId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied ID</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy ID</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-export-manifest"
            onClick={handleExportJson}
            className="px-3 py-2 rounded-lg bg-[#141923] hover:bg-[#1a2130] border border-[#232c3e] text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Export full JSON manifest"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Exported</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export JSON</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-new-investigation"
            onClick={onNewScan}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* Grid of Forensic Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active V0.2 Module: HTTP Intelligence */}
          <HttpIntelligenceModule
            finding={httpFinding}
            error={httpError}
            targetUrl={target.normalizedUrl}
          />

          {/* Target Identity Module with live telemetry updates */}
          <TargetIdentityModule
            target={target}
            scanId={scanId}
            scanDurationMs={scanDurationMs}
            httpFinding={httpFinding}
          />

          {/* Infrastructure Module (V0.3 Active) */}
          <InfrastructureModule
            finding={infrastructureFinding}
            error={infrastructureError}
            domain={target.domain}
            hostname={target.hostname}
          />

          {/* Technology Module (V0.4 Active) */}
          <TechnologyModule
            report={activeTechFinding}
            error={technologyError}
          />

          {/* Security & Configuration Observations Module (V0.5 Active) */}
          <SecurityModule
            report={activeSecurityFinding}
            target={target}
          />
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="space-y-6">
          {/* Forensic Score Module (V0.6 / V0.7 placeholder) */}
          <ForensicScoreModule />

          {/* AI Forensic Analyst Panel (V0.7 placeholder) */}
          <AIAnalystModule />
        </div>
      </div>

      {/* Full Width Visual Relationship Graph (V0.6 Active) */}
      <div className="w-full">
        <RelationshipGraphModule
          target={target}
          httpFinding={httpFinding}
          infrastructureFinding={infrastructureFinding}
          technologyFinding={activeTechFinding}
          securityFinding={activeSecurityFinding}
          onNavigateToModule={handleNavigateToModule}
        />
      </div>

      {/* Legal and Defensive Notice Footer */}
      <div className="p-4 rounded-lg bg-[#0e1119] border border-[#19202f] text-xs font-mono text-slate-400 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-300">Defensive Research Charter:</strong> WEB FORENSICS V0.4 operates strictly on passive, public HTTP observations, DOM markup parsing, and standard DNS resource queries. No unauthorized network exploitation, port flooding, or vulnerability probes.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest hidden md:inline shrink-0">
          RFC 1034 / 1035, RFC 9110 & PASSIVE TELEMETRY AUDIT
        </span>
      </div>
    </div>
  );
};
