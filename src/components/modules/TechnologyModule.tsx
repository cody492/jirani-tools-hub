import React, { useState, useMemo } from 'react';
import {
  TechnologyCategory,
  TechnologyConfidence,
  TechnologyInspectionError,
  TechnologyReport,
} from '../../types';
import { ModuleCard } from '../ui/ModuleCard';
import { TechnologyCard } from './technology/TechnologyCard';
import { ConflictBanner } from './technology/ConflictBanner';
import {
  Cpu,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  ShieldCheck,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TechnologyModuleProps {
  report?: TechnologyReport | null;
  error?: TechnologyInspectionError | null;
}

const CATEGORY_NAMES: Record<TechnologyCategory, string> = {
  frontend_framework: 'JavaScript Frameworks',
  cms: 'CMS & Publishing',
  javascript_library: 'JS Libraries',
  css_ui: 'CSS Frameworks & UI',
  analytics: 'Analytics',
  advertising: 'Advertising',
  payment: 'Payment Acceptance',
  cdn_edge: 'CDN / Edge',
  hosting_cloud: 'Hosting / Cloud',
  web_server: 'Web Server',
};

export const TechnologyModule: React.FC<TechnologyModuleProps> = ({
  report,
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('ALL');
  const [showRawTelemetry, setShowRawTelemetry] = useState<boolean>(false);
  const [showRelationships, setShowRelationships] = useState<boolean>(false);

  // If no report or scan was not run yet
  if (!report && !error) {
    return (
      <div id="module-technologies" className="scroll-mt-6">
        <ModuleCard
          id="module-technology"
          title="Technology Intelligence"
          subtitle="Passive software fingerprinting, CMS signatures, framework markers & edge telemetry"
          icon={Cpu}
          versionBadge="V0.4 ACTIVE"
          statusBadge={{
            label: 'AWAITING SCAN',
            variant: 'standby',
          }}
        >
          <div className="p-6 text-center font-mono text-slate-500 text-xs border border-dashed border-[#1e2536] rounded-lg">
            Technology fingerprinting will execute automatically following target investigation initiation.
          </div>
        </ModuleCard>
      </div>
    );
  }

  // If error occurred during detection
  if (error || (report && report.error)) {
    const activeErr = error || report?.error;
    return (
      <div id="module-technologies" className="scroll-mt-6">
        <ModuleCard
          id="module-technology"
          title="Technology Intelligence"
          subtitle="Passive software fingerprinting, CMS signatures, framework markers & edge telemetry"
          icon={Cpu}
          versionBadge="V0.4 ACTIVE"
          statusBadge={{
            label: 'ERROR',
            variant: 'error',
          }}
        >
          <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{activeErr?.title || 'Technology Detection Error'}</span>
            </div>
            <div className="text-slate-300">{activeErr?.message}</div>
            {activeErr?.technicalDetail && (
              <div className="p-2 rounded bg-[#0b0e14] text-rose-300/80 text-[11px] font-mono select-all">
                {activeErr.technicalDetail}
              </div>
            )}
          </div>
        </ModuleCard>
      </div>
    );
  }

  const technologies = report?.technologies || [];
  const summary = report?.summary;

  // Filter technologies based on search, category, and confidence
  const filteredTechnologies = useMemo(() => {
    return technologies.filter((tech) => {
      // Category filter
      if (selectedCategory !== 'ALL' && tech.category !== selectedCategory) {
        return false;
      }

      // Confidence filter
      if (selectedConfidence !== 'ALL' && tech.confidence !== selectedConfidence) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = tech.name.toLowerCase().includes(query);
        const matchesCategory = tech.categoryLabel.toLowerCase().includes(query);
        const matchesDescription = tech.description.toLowerCase().includes(query);
        const matchesVersion = tech.version?.toLowerCase().includes(query) || false;
        const matchesEvidence = tech.evidence.some(
          (e) =>
            e.observed.toLowerCase().includes(query) ||
            e.source.toLowerCase().includes(query) ||
            e.interpretation.toLowerCase().includes(query)
        );

        return (
          matchesName ||
          matchesCategory ||
          matchesDescription ||
          matchesVersion ||
          matchesEvidence
        );
      }

      return true;
    });
  }, [technologies, selectedCategory, selectedConfidence, searchQuery]);

  // Available categories with detections count
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: technologies.length };
    for (const tech of technologies) {
      counts[tech.category] = (counts[tech.category] || 0) + 1;
    }
    return counts;
  }, [technologies]);

  const activeCategories = useMemo(() => {
    return Object.keys(categoryCounts).filter(
      (cat) => cat === 'ALL' || categoryCounts[cat] > 0
    );
  }, [categoryCounts]);

  const getStatusBadgeConfig = () => {
    if (!summary || summary.totalDetected === 0) {
      return { label: 'NO DETECTIONS', variant: 'standby' as const };
    }
    if (summary.conflictingSignalsCount > 0) {
      return { label: 'CONFLICTS DETECTED', variant: 'warning' as const };
    }
    return { label: `${summary.totalDetected} DETECTED`, variant: 'success' as const };
  };

  return (
    <div id="module-technologies" className="scroll-mt-6">
      <ModuleCard
        id="module-technology"
        title="Technology Intelligence"
        subtitle="Passive software fingerprinting, CMS signatures, framework markers & edge telemetry"
        icon={Cpu}
        versionBadge="V0.4 ACTIVE"
        statusBadge={getStatusBadgeConfig()}
      >
        <div className="space-y-4">
        {/* Metric Summary Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
            {/* Total Detected */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-[#1b2230] space-y-1">
              <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                Detected
              </span>
              <div className="text-lg font-bold text-slate-100">
                {summary.totalDetected}
              </div>
            </div>

            {/* High Confidence */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-[#1b2230] space-y-1">
              <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                High Conf.
              </span>
              <div className="text-lg font-bold text-emerald-400">
                {summary.highConfidenceCount}
              </div>
            </div>

            {/* Medium Confidence */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-[#1b2230] space-y-1">
              <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-amber-400" />
                Med / Low
              </span>
              <div className="text-lg font-bold text-amber-400">
                {summary.mediumConfidenceCount + summary.lowConfidenceCount}
              </div>
            </div>

            {/* Categories */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-[#1b2230] space-y-1">
              <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                <Code2 className="w-3 h-3 text-indigo-400" />
                Categories
              </span>
              <div className="text-lg font-bold text-slate-100">
                {summary.categoriesCount}
              </div>
            </div>

            {/* Versions Identified */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-[#1b2230] space-y-1">
              <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                <FileCheck2 className="w-3 h-3 text-cyan-400" />
                Versions
              </span>
              <div className="text-lg font-bold text-cyan-300">
                {summary.versionDetectedCount}
              </div>
            </div>

            {/* Conflicts */}
            <div className="p-2.5 rounded bg-[#0d1017] border border-[#1b2230] space-y-1">
              <span className="text-[10px] uppercase text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Conflicts
              </span>
              <div
                className={`text-lg font-bold ${
                  summary.conflictingSignalsCount > 0 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {summary.conflictingSignalsCount}
              </div>
            </div>
          </div>
        )}

        {/* Conflicting Signals Banner */}
        {report?.conflicts && report.conflicts.length > 0 && (
          <ConflictBanner conflicts={report.conflicts} />
        )}

        {/* Filter and Search Controls */}
        <div className="space-y-2.5 bg-[#0b0e14] p-3 rounded-lg border border-[#1a212f]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search technologies, versions, evidence..."
                className="w-full pl-8 pr-3 py-1.5 rounded bg-[#10141d] border border-[#212838] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Confidence Selector */}
            <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
              <span className="text-slate-500 text-[11px]">Confidence:</span>
              <select
                value={selectedConfidence}
                onChange={(e) => setSelectedConfidence(e.target.value)}
                aria-label="Filter technologies by confidence level"
                className="px-2 py-1.5 rounded bg-[#10141d] border border-[#212838] text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Levels</option>
                <option value="HIGH">High Only</option>
                <option value="MEDIUM">Medium Only</option>
                <option value="LOW">Low Only</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-thin">
            {activeCategories.map((catKey) => {
              const label = catKey === 'ALL' ? 'All' : CATEGORY_NAMES[catKey as TechnologyCategory] || catKey;
              const count = categoryCounts[catKey] || 0;
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                      : 'bg-[#121620] text-slate-400 hover:text-slate-200 border border-[#1e2534]'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] px-1 rounded ${
                      isSelected ? 'bg-cyan-800/60 text-cyan-200' : 'bg-[#181d28] text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Technologies List */}
        {filteredTechnologies.length > 0 ? (
          <div className="space-y-2.5">
            {filteredTechnologies.map((tech) => (
              <TechnologyCard key={tech.id} technology={tech} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-lg border border-dashed border-[#1e2536] bg-[#0c0f16] text-center space-y-2">
            <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs font-mono font-semibold text-slate-400">
              {technologies.length === 0
                ? 'No Recognizable Technology Signatures Detected'
                : 'No Technologies Matched Current Filter'}
            </div>
            <div className="text-[11px] font-mono text-slate-500 max-w-lg mx-auto leading-relaxed">
              {technologies.length === 0
                ? 'Public HTTP headers, HTML markup, and resource paths did not disclose identifiable framework, CMS, or library signatures. The target may employ a minimal static architecture, hardened proxy, or stripped server headers.'
                : 'Try adjusting your search query, confidence tier, or category filter.'}
            </div>
          </div>
        )}

        {/* Collapsible Section: Raw Telemetry & Observed Inputs */}
        <div className="pt-2 border-t border-[#171d28]">
          <button
            type="button"
            onClick={() => setShowRawTelemetry(!showRawTelemetry)}
            className="w-full flex items-center justify-between p-2.5 rounded bg-[#0b0e14] hover:bg-[#10141d] border border-[#1b2230] text-xs font-mono text-slate-400 hover:text-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspection Telemetry & Analysis Safeguards</span>
            </div>
            {showRawTelemetry ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showRawTelemetry && report && (
            <div className="mt-2 p-3.5 rounded bg-[#080a0f] border border-[#161c27] text-xs font-mono space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2 rounded bg-[#0e121a] border border-[#1c2331]">
                  <div className="text-[10px] text-slate-500">Headers Examined</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {report.rawAnalyzedInputs.headersCount}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0e121a] border border-[#1c2331]">
                  <div className="text-[10px] text-slate-500">Script Tags Scanned</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {report.rawAnalyzedInputs.scriptsAnalyzed}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0e121a] border border-[#1c2331]">
                  <div className="text-[10px] text-slate-500">Meta Tags Evaluated</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {report.rawAnalyzedInputs.metaTagsAnalyzed}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0e121a] border border-[#1c2331]">
                  <div className="text-[10px] text-slate-500">Stylesheets Checked</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {report.rawAnalyzedInputs.linksAnalyzed}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0e121a] border border-[#1c2331]">
                  <div className="text-[10px] text-slate-500">Cookies Analyzed</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {report.rawAnalyzedInputs.cookiesCount}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#0e121a] border border-[#1c2331]">
                  <div className="text-[10px] text-slate-500">Infra Clues Correlated</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {report.rawAnalyzedInputs.infrastructureCluesCount}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#10141d] border border-[#1d2535] text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Passive Non-Intrusive Observation Policy:</span>
                </div>
                <p className="leading-relaxed">
                  Web Forensics V0.4 operates strictly as a passive, non-intrusive analyzer. No active fuzzing, directory brute-forcing, injection attacks, or credential attempts were dispatched. All inferences are strictly derived from publicly observable HTTP headers, HTML DOM structures, and referenced resources.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Section: Relationship Model (V0.6 Graph Preparation) */}
        {report?.relationships && report.relationships.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowRelationships(!showRelationships)}
              className="w-full flex items-center justify-between p-2.5 rounded bg-[#0b0e14] hover:bg-[#10141d] border border-[#1b2230] text-xs font-mono text-slate-400 hover:text-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Relationship Graph Entities (V0.6 Correlation Preview - {report.relationships.length} links)</span>
              </div>
              {showRelationships ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showRelationships && (
              <div className="mt-2 p-3 rounded bg-[#080a0f] border border-[#161c27] text-xs font-mono space-y-2">
                <div className="text-[11px] text-slate-500 mb-1">
                  Observed Domain-to-Technology Entity Triples:
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                  {report.relationships.map((rel, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded bg-[#0d1017] border border-[#181f2b] flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-cyan-400 font-semibold">{rel.domain}</span>
                        <span className="text-slate-500">──[USES]──▶</span>
                        <span className="text-slate-200 font-bold">{rel.technologyName}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#131824] text-slate-400 shrink-0">
                        {rel.confidence} CONFIDENCE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ModuleCard>
  </div>
  );
};
