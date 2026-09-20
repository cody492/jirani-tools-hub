import React, { useState } from 'react';
import {
  Server,
  Network,
  Radio,
  Mail,
  FileText,
  Layers,
  GitFork,
  Cpu,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Shield,
  HelpCircle,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ModuleCard } from '../ui/ModuleCard';
import { StatusBadge, BadgeVariant } from '../ui/StatusBadge';
import { InfrastructureFinding, InfrastructureInspectionError, WhoisRecord } from '../../types';
import { InfrastructureSummary } from '../infrastructure/InfrastructureSummary';
import { IpAddresses } from '../infrastructure/IpAddresses';
import { NameServers } from '../infrastructure/NameServers';
import { MailServers } from '../infrastructure/MailServers';
import { CnameRelationships } from '../infrastructure/CnameRelationships';
import { InfrastructureIndicators } from '../infrastructure/InfrastructureIndicators';
import { DnsRecords } from '../infrastructure/DnsRecords';
import { TxtRecords } from '../infrastructure/TxtRecords';
import { WhoisDossier } from '../infrastructure/WhoisDossier';

interface InfrastructureModuleProps {
  finding?: InfrastructureFinding | null;
  error?: InfrastructureInspectionError | null;
  domain?: string;
  hostname?: string;
}

type InfraSubTab = 'overview' | 'whois' | 'ips_ns' | 'mail_cname' | 'all_dns' | 'txt';

export const InfrastructureModule: React.FC<InfrastructureModuleProps> = ({
  finding,
  error,
  domain = 'target-domain.com',
  hostname,
}) => {
  const [activeTab, setActiveTab] = useState<InfraSubTab>('overview');

  const targetDomain = finding?.domain || domain;
  const targetHost = finding?.hostname || hostname || targetDomain;

  // Derive status badge
  let statusBadge: { label: string; variant: BadgeVariant } = {
    label: 'AWAITING SCAN',
    variant: 'standby',
  };

  if (error) {
    statusBadge = {
      label: error.code || 'RESOLUTION_FAILED',
      variant: 'error',
    };
  } else if (finding) {
    if (finding.summary.status === 'COMPLETE') {
      statusBadge = {
        label: `${finding.summary.totalRecordsCount} RECORDS DISCOVERED`,
        variant: 'emerald',
      };
    } else if (finding.summary.status === 'PARTIAL') {
      statusBadge = {
        label: 'PARTIAL RESOLUTION',
        variant: 'warning',
      };
    } else if (finding.summary.status === 'NO_RECORDS') {
      statusBadge = {
        label: 'NO RECORDS FOUND',
        variant: 'neutral',
      };
    } else {
      statusBadge = {
        label: 'QUERY INCOMPLETE',
        variant: 'warning',
      };
    }
  }

  const tabs: Array<{ id: InfraSubTab; label: string; count?: number; icon: React.FC<{ className?: string }> }> = [
    {
      id: 'overview',
      label: 'Overview & Indicators',
      icon: Cpu,
    },
    {
      id: 'whois',
      label: 'WHOIS & Registration',
      count: finding?.whois?.registrar ? 1 : undefined,
      icon: Building2,
    },
    {
      id: 'ips_ns',
      label: 'IP & Nameservers',
      count: (finding?.ipObservations.length || 0) + (finding?.nameserverObservations.length || 0),
      icon: Network,
    },
    {
      id: 'mail_cname',
      label: 'Mail & CNAME',
      count: (finding?.mailServerObservations.length || 0) + (finding?.cnameRelationships.length || 0),
      icon: Mail,
    },
    {
      id: 'all_dns',
      label: 'DNS Records Table',
      count: finding?.allRecords.length || 0,
      icon: Layers,
    },
    {
      id: 'txt',
      label: 'TXT Telemetry',
      count: finding?.txtRecords.length || 0,
      icon: FileText,
    },
  ];

  return (
    <ModuleCard
      id="module-infrastructure"
      title="Infrastructure Intelligence"
      subtitle="Authoritative DNS topology, IP routing endpoints, nameservers, mail exchange & edge clues"
      icon={Server}
      versionBadge="ACTIVE: V0.3"
      statusBadge={statusBadge}
    >
      <div className="space-y-5">
        {/* Error Notification (Graceful degradation) */}
        {error && (
          <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/40 space-y-2">
            <div className="flex items-center gap-2 text-red-300 font-mono text-xs font-bold uppercase">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error.title || 'Infrastructure Resolution Failure'}</span>
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              {error.message}
            </p>
            {error.technicalDetail && (
              <div className="p-2.5 rounded bg-[#090b10] border border-red-900/30 text-[11px] font-mono text-red-300 break-all">
                <code>{error.technicalDetail}</code>
              </div>
            )}
            <div className="text-[10px] font-mono text-slate-400 pt-1">
              NOTE: Other investigation modules (e.g. HTTP Intelligence) remain unaffected.
            </div>
          </div>
        )}

        {/* Loading / Standby State if no finding and no error */}
        {!finding && !error && (
          <div className="p-8 rounded-lg bg-[#0d1017] border border-[#1a202d] text-center space-y-2">
            <Server className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
            <div className="text-xs font-mono text-slate-300 font-bold">Infrastructure Module Ready</div>
            <div className="text-[11px] font-mono text-slate-400 max-w-sm mx-auto">
              Initiate an investigation scan to resolve authoritative DNS records, network endpoints, and infrastructure indicators.
            </div>
          </div>
        )}

        {/* Active Finding View */}
        {finding && (
          <div className="space-y-5">
            {/* Top Metric Summary Ribbon */}
            <InfrastructureSummary
              summary={finding.summary}
              queryStatuses={finding.queryStatuses}
            />

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#1b2230] pb-2 text-xs font-mono">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#151c2a] text-cyan-300 border border-cyan-800/50 font-bold'
                        : 'bg-[#0d1017] text-slate-400 hover:text-slate-200 border border-[#1b2230]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded ${
                          isActive ? 'bg-cyan-950 text-cyan-200' : 'bg-[#141822] text-slate-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Overview & Indicators */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* WHOIS Domain Registration Snapshot */}
                {finding.whois && (
                  <div className="p-4 rounded-lg border border-cyan-900/40 bg-gradient-to-r from-[#0b1019] to-[#0d1422] space-y-3 font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2538] pb-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                        <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>WHOIS DOMAIN REGISTRATION SNAPSHOT</span>
                        {finding.whois.lookupSource && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                            {finding.whois.lookupSource}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('whois')}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold transition-colors"
                      >
                        <span>View Full WHOIS Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Domain Registrar */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase">Sponsoring Registrar</div>
                        <div className="font-bold text-slate-100 truncate" title={finding.whois.registrar || 'Protected / Redacted'}>
                          {finding.whois.registrar || 'Protected / Redacted'}
                        </div>
                        {finding.whois.registrarIanaId && (
                          <div className="text-[10px] text-slate-400">
                            IANA ID: {finding.whois.registrarIanaId}
                          </div>
                        )}
                      </div>

                      {/* Creation Date */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-cyan-400" />
                          <span>Creation Date</span>
                        </div>
                        <div className="font-bold text-slate-100">
                          {finding.whois.creationDate
                            ? new Date(finding.whois.creationDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Not Disclosed'}
                        </div>
                        {finding.whois.ageDays !== undefined && (
                          <div className="text-[10px] text-cyan-400">
                            {Math.floor(finding.whois.ageDays / 365.25)} yrs active ({finding.whois.ageDays.toLocaleString()}d)
                          </div>
                        )}
                      </div>

                      {/* Expiration Date */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Expiration Date</span>
                        </div>
                        <div className="font-bold text-slate-100">
                          {finding.whois.expirationDate
                            ? new Date(finding.whois.expirationDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Not Disclosed'}
                        </div>
                        {finding.whois.daysUntilExpiration !== undefined && (
                          <div className={`text-[10px] font-semibold ${
                            finding.whois.daysUntilExpiration <= 30
                              ? 'text-rose-400'
                              : finding.whois.daysUntilExpiration <= 90
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {finding.whois.daysUntilExpiration > 0
                              ? `${finding.whois.daysUntilExpiration} days remaining`
                              : `${Math.abs(finding.whois.daysUntilExpiration)} days expired`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <InfrastructureIndicators indicators={finding.indicators} />

                {/* Quick Pivot Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg border border-[#1b2230] bg-[#0d1017] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-cyan-400" />
                        <span>RESOLVED NETWORK ENDPOINTS</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {finding.aRecords.length + finding.aaaaRecords.length} observed
                      </span>
                    </div>
                    <div className="space-y-1">
                      {finding.aRecords.slice(0, 3).map((a, idx) => (
                        <div key={`${a.address}-${idx}`} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-cyan-300">{a.address}</span>
                          <span className="text-[10px] text-slate-400">IPv4 (A)</span>
                        </div>
                      ))}
                      {finding.aaaaRecords.slice(0, 2).map((aaaa, idx) => (
                        <div key={`${aaaa.address}-${idx}`} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-indigo-300 truncate max-w-[200px]">{aaaa.address}</span>
                          <span className="text-[10px] text-slate-400">IPv6 (AAAA)</span>
                        </div>
                      ))}
                      {finding.aRecords.length === 0 && finding.aaaaRecords.length === 0 && (
                        <div className="text-xs font-mono text-slate-400 italic">No IP records resolved</div>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg border border-[#1b2230] bg-[#0d1017] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ZONE AUTHORITIES</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {finding.nsRecords.length} nameservers
                      </span>
                    </div>
                    <div className="space-y-1">
                      {finding.nsRecords.slice(0, 3).map((ns, idx) => (
                        <div key={`${ns.host}-${idx}`} className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-300 truncate max-w-[220px]">{ns.host}</span>
                          <span className="text-[10px] text-emerald-400">NS</span>
                        </div>
                      ))}
                      {finding.nsRecords.length === 0 && (
                        <div className="text-xs font-mono text-slate-400 italic">No NS records resolved</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: WHOIS & Registration */}
            {activeTab === 'whois' && (
              <WhoisDossier
                whois={finding.whois}
                domain={targetDomain}
              />
            )}

            {/* Tab 2: IP & Nameservers */}
            {activeTab === 'ips_ns' && (
              <div className="space-y-6">
                <IpAddresses
                  observations={finding.ipObservations}
                  domain={targetDomain}
                  isUnavailable={finding.queryStatuses.A.status === 'lookup_unavailable'}
                />
                <NameServers
                  observations={finding.nameserverObservations}
                  domain={targetDomain}
                  isUnavailable={finding.queryStatuses.NS.status === 'lookup_unavailable'}
                />
              </div>
            )}

            {/* Tab 3: Mail & CNAME */}
            {activeTab === 'mail_cname' && (
              <div className="space-y-6">
                <CnameRelationships
                  relationships={finding.cnameRelationships}
                  domain={targetDomain}
                  hostname={targetHost}
                />
                <MailServers
                  observations={finding.mailServerObservations}
                  domain={targetDomain}
                  isUnavailable={finding.queryStatuses.MX.status === 'lookup_unavailable'}
                />
              </div>
            )}

            {/* Tab 4: All DNS Records Table */}
            {activeTab === 'all_dns' && (
              <DnsRecords
                records={finding.allRecords}
                queryStatuses={finding.queryStatuses}
                domain={targetDomain}
              />
            )}

            {/* Tab 5: TXT Telemetry */}
            {activeTab === 'txt' && (
              <TxtRecords
                records={finding.txtRecords}
                domain={targetDomain}
                isUnavailable={finding.queryStatuses.TXT.status === 'lookup_unavailable'}
              />
            )}

            {/* Bottom Methodology & Standards Banner */}
            <div className="pt-2 border-t border-[#171d2b] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>RFC 1034 / RFC 1035 Standard DNS Queries</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Queried at: {new Date(finding.queriedAt).toUTCString()}</span>
                <span>Dual-layer Node / DoH Resolver Engine</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleCard>
  );
};
