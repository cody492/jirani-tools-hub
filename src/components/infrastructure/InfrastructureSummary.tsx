import React from 'react';
import { Network, Server, Radio, Mail, Layers, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { InfrastructureSummaryData } from '../../types';

interface InfrastructureSummaryProps {
  summary: InfrastructureSummaryData;
  queryStatuses?: {
    A: { status: string; count: number };
    AAAA: { status: string; count: number };
    CNAME: { status: string; count: number };
    MX: { status: string; count: number };
    NS: { status: string; count: number };
    TXT: { status: string; count: number };
  };
}

export const InfrastructureSummary: React.FC<InfrastructureSummaryProps> = ({
  summary,
  queryStatuses,
}) => {
  const isAUnavailable = queryStatuses?.A.status === 'lookup_unavailable';
  const isAFailed = queryStatuses?.A.status === 'lookup_failed';
  const isAaaaUnavailable = queryStatuses?.AAAA.status === 'lookup_unavailable';
  const isNsUnavailable = queryStatuses?.NS.status === 'lookup_unavailable';
  const isMxUnavailable = queryStatuses?.MX.status === 'lookup_unavailable';

  const metrics = [
    {
      id: 'metric-ipv4',
      label: 'IPv4 ADDRESSES',
      count: isAUnavailable ? 'N/A' : isAFailed ? 'ERR' : summary.ipv4Count,
      subtext: isAUnavailable
        ? 'Lookup unavailable'
        : isAFailed
        ? 'Query failed'
        : summary.ipv4Count === 0
        ? '0 records found'
        : `${summary.ipv4Count} A record${summary.ipv4Count > 1 ? 's' : ''}`,
      icon: Network,
      color: summary.ipv4Count > 0 ? 'text-cyan-400' : 'text-slate-400',
      border: summary.ipv4Count > 0 ? 'border-cyan-800/30' : 'border-[#1b2230]',
      bg: summary.ipv4Count > 0 ? 'bg-cyan-950/10' : 'bg-[#0f121a]',
    },
    {
      id: 'metric-ipv6',
      label: 'IPv6 ADDRESSES',
      count: isAaaaUnavailable ? 'N/A' : summary.ipv6Count,
      subtext: isAaaaUnavailable
        ? 'Lookup unavailable'
        : summary.ipv6Count === 0
        ? 'No AAAA records'
        : `${summary.ipv6Count} AAAA record${summary.ipv6Count > 1 ? 's' : ''}`,
      icon: Network,
      color: summary.ipv6Count > 0 ? 'text-indigo-400' : 'text-slate-400',
      border: summary.ipv6Count > 0 ? 'border-indigo-800/30' : 'border-[#1b2230]',
      bg: summary.ipv6Count > 0 ? 'bg-indigo-950/10' : 'bg-[#0f121a]',
    },
    {
      id: 'metric-ns',
      label: 'NAMESERVERS',
      count: isNsUnavailable ? 'N/A' : summary.nameserverCount,
      subtext: isNsUnavailable
        ? 'Lookup unavailable'
        : summary.nameserverCount === 0
        ? 'No NS records'
        : `${summary.nameserverCount} authoritative NS`,
      icon: Radio,
      color: summary.nameserverCount > 0 ? 'text-emerald-400' : 'text-slate-400',
      border: summary.nameserverCount > 0 ? 'border-emerald-800/30' : 'border-[#1b2230]',
      bg: summary.nameserverCount > 0 ? 'bg-emerald-950/10' : 'bg-[#0f121a]',
    },
    {
      id: 'metric-mx',
      label: 'MAIL SERVERS',
      count: isMxUnavailable ? 'N/A' : summary.mailServerCount,
      subtext: isMxUnavailable
        ? 'Lookup unavailable'
        : summary.mailServerCount === 0
        ? 'No MX configured'
        : `${summary.mailServerCount} MX host${summary.mailServerCount > 1 ? 's' : ''}`,
      icon: Mail,
      color: summary.mailServerCount > 0 ? 'text-amber-400' : 'text-slate-400',
      border: summary.mailServerCount > 0 ? 'border-amber-800/30' : 'border-[#1b2230]',
      bg: summary.mailServerCount > 0 ? 'bg-amber-950/10' : 'bg-[#0f121a]',
    },
    {
      id: 'metric-types',
      label: 'DNS RECORD TYPES',
      count: summary.recordTypesDiscoveredCount,
      subtext: `${summary.totalRecordsCount} total records across ${summary.recordTypesDiscoveredCount}/6 types`,
      icon: Layers,
      color: 'text-slate-200',
      border: 'border-[#1b2230]',
      bg: 'bg-[#0f121a]',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              id={m.id}
              className={`p-3 rounded-lg border ${m.border} ${m.bg} flex flex-col justify-between transition-all`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-slate-400">
                <span className="truncate">{m.label}</span>
                <Icon className={`w-3.5 h-3.5 ${m.color} shrink-0`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-mono font-bold ${m.color}`}>{m.count}</span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-slate-400 truncate" title={m.subtext}>
                {m.subtext}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
