import React from 'react';
import {
  Network,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  Info,
} from 'lucide-react';
import { HttpFinding, HttpInspectionError } from '../../types';
import { ModuleCard } from '../ui/ModuleCard';
import { HttpSummary } from './HttpSummary';
import { HttpStatusExplainer } from './HttpStatusExplainer';
import { RedirectChain } from './RedirectChain';
import { PageMetadata } from './PageMetadata';
import { ResponseHeaders } from './ResponseHeaders';

interface HttpIntelligenceModuleProps {
  finding?: HttpFinding | null;
  error?: HttpInspectionError | null;
  targetUrl: string;
}

export const HttpIntelligenceModule: React.FC<HttpIntelligenceModuleProps> = ({
  finding,
  error,
  targetUrl,
}) => {
  // If an inspection error occurred
  if (error || finding?.error) {
    const activeError = error || finding?.error!;

    return (
      <ModuleCard
        id="module-http-intelligence"
        title="HTTP Intelligence"
        subtitle="Live HTTP inspection, redirect audit & document telemetry"
        icon={Network}
        versionBadge="ACTIVE: V0.2"
        statusBadge={{
          label: 'INSPECTION FAILED',
          variant: 'error',
        }}
      >
        <div className="space-y-4 font-mono">
          {/* Error Banner */}
          <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/60 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{activeError.title.toUpperCase()}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-700/50">
                {activeError.code}
              </span>
            </div>

            <p className="text-xs text-rose-200/90 font-sans leading-relaxed">
              {activeError.message}
            </p>

            {/* Fact vs Observation vs Interpretation for Failures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-rose-900/40 text-xs">
              <div className="p-2.5 rounded bg-[#100a0d] border border-rose-900/50 space-y-1">
                <div className="text-[10px] font-bold text-rose-400">FACT</div>
                <div className="text-[11px] text-slate-300 font-sans">
                  The client probe was unable to establish an HTTP session with target {activeError.targetUrl || targetUrl}.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#100a0d] border border-rose-900/50 space-y-1">
                <div className="text-[10px] font-bold text-amber-400">OBSERVATION</div>
                <div className="text-[11px] text-slate-300 font-sans">
                  Diagnostic code reported: {activeError.code}.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#100a0d] border border-rose-900/50 space-y-1">
                <div className="text-[10px] font-bold text-slate-400">INTERPRETATION</div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Host configuration, network firewall, or authoritative DNS records prevented normal connection.
                </div>
              </div>
            </div>

            {/* Technical Detail Collapsible / Box */}
            {activeError.technicalDetail && (
              <div className="p-2.5 rounded bg-[#090608] border border-rose-950 text-[11px] text-slate-400 space-y-1">
                <div className="text-[10px] uppercase text-slate-500 font-bold">
                  Technical Socket Diagnostic:
                </div>
                <div className="text-rose-300 font-mono break-all selection:bg-rose-500/30">
                  {activeError.technicalDetail}
                </div>
              </div>
            )}
          </div>
        </div>
      </ModuleCard>
    );
  }

  // If no finding is available
  if (!finding) {
    return (
      <ModuleCard
        id="module-http-intelligence"
        title="HTTP Intelligence"
        subtitle="Live HTTP inspection, redirect audit & document telemetry"
        icon={Network}
        versionBadge="ACTIVE: V0.2"
        statusBadge={{
          label: 'NOT AVAILABLE',
          variant: 'standby',
        }}
      >
        <div className="p-8 text-center text-xs font-mono text-slate-500 space-y-2">
          <Info className="w-6 h-6 mx-auto text-slate-600" />
          <p>No HTTP telemetry currently loaded for this target.</p>
        </div>
      </ModuleCard>
    );
  }

  // Full Live Forensic Report
  const is2xx = finding.statusCode >= 200 && finding.statusCode < 300;
  const is3xx = finding.statusCode >= 300 && finding.statusCode < 400;
  const is4xx = finding.statusCode >= 400 && finding.statusCode < 500;
  const is5xx = finding.statusCode >= 500 && finding.statusCode < 600;

  const statusVariant = is2xx
    ? 'emerald'
    : is3xx
    ? 'cyan'
    : is4xx
    ? 'amber'
    : is5xx
    ? 'error'
    : 'standby';

  return (
    <ModuleCard
      id="module-http-intelligence"
      title="HTTP Intelligence"
      subtitle="Live HTTP inspection, redirect audit & document telemetry"
      icon={Network}
      versionBadge="ACTIVE: V0.2"
      statusBadge={{
        label: `HTTP ${finding.statusCode} ${finding.statusText}`,
        variant: statusVariant as any,
      }}
    >
      <div className="space-y-4">
        {/* Top Summary Matrix */}
        <HttpSummary finding={finding} />

        {/* Status Explanation (Fact vs Observation vs Interpretation) */}
        <HttpStatusExplainer explanation={finding.statusExplanation} />

        {/* Redirect Chain Inspection */}
        <RedirectChain
          requestedUrl={finding.requestedUrl}
          finalUrl={finding.finalUrl}
          redirects={finding.redirects}
        />

        {/* Page Metadata & Document Identification */}
        <PageMetadata
          metadata={finding.pageMetadata}
          documentType={finding.documentType}
          contentType={finding.contentType}
        />

        {/* Response Headers */}
        <ResponseHeaders
          headers={finding.headers}
          rawCount={finding.rawHeadersCount}
        />
      </div>
    </ModuleCard>
  );
};
