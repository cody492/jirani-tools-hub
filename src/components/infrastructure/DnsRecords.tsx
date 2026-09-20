import React, { useState } from 'react';
import { Search, Copy, Check, Info, Layers, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { DnsRecordItem, DnsRecordType, DnsLookupStatus } from '../../types';

interface DnsRecordsProps {
  records: DnsRecordItem[];
  queryStatuses: {
    A: { status: DnsLookupStatus; count: number };
    AAAA: { status: DnsLookupStatus; count: number };
    CNAME: { status: DnsLookupStatus; count: number };
    MX: { status: DnsLookupStatus; count: number };
    NS: { status: DnsLookupStatus; count: number };
    TXT: { status: DnsLookupStatus; count: number };
  };
  domain: string;
}

const typeColors: Record<DnsRecordType, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/40' },
  AAAA: { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/40' },
  CNAME: { bg: 'bg-teal-950/40', text: 'text-teal-300', border: 'border-teal-800/40' },
  MX: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/40' },
  NS: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/40' },
  TXT: { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/40' },
};

export const DnsRecords: React.FC<DnsRecordsProps> = ({
  records,
  queryStatuses,
  domain,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = records.filter((r) => {
    if (selectedType !== 'ALL' && r.type !== selectedType) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      r.type.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.value.toLowerCase().includes(q) ||
      (r.secondaryValue && r.secondaryValue.toLowerCase().includes(q))
    );
  });

  const types: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b2230] pb-2">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Complete DNS Resource Record Table</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Full inventory of authoritative records resolved for {domain}.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[#0d1017] border border-[#1e2638] rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Query Status Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {types.map((t) => {
          const qs = queryStatuses[t];
          const isSuccess = qs.status === 'success';
          const isNone = qs.status === 'no_records_found';
          const isFail = qs.status === 'lookup_failed';
          const isUnavail = qs.status === 'lookup_unavailable';

          return (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(selectedType === t ? 'ALL' : t)}
              className={`p-2 rounded-lg border text-left transition-all ${
                selectedType === t
                  ? 'border-cyan-500/60 bg-cyan-950/20'
                  : 'border-[#1b2230] bg-[#0d1017] hover:border-[#273248]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${typeColors[t].bg} ${typeColors[t].border} ${typeColors[t].text}`}
                >
                  {t}
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {isUnavail ? '—' : isFail ? 'ERR' : qs.count}
                </span>
              </div>
              <div className="mt-1 text-[9px] font-mono truncate text-slate-400">
                {isSuccess
                  ? `${qs.count} discovered`
                  : isNone
                  ? 'No records'
                  : isFail
                  ? 'Query failed'
                  : 'Unavailable'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Table */}
      {filtered.length === 0 ? (
        <div className="p-6 rounded-lg bg-[#0d1017] border border-[#1b2230] text-center space-y-1">
          <Info className="w-5 h-5 text-slate-500 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">No DNS Records Found</div>
          <div className="text-[11px] text-slate-400">
            {searchQuery
              ? `No records match the query "${searchQuery}".`
              : `No ${selectedType} records exist in the current result set.`}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#1b2230] bg-[#0d1017]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1b2230] bg-[#111622] text-[10px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 px-3 w-16">Type</th>
                <th className="py-2.5 px-3 w-40">Host / Name</th>
                <th className="py-2.5 px-3">Resolved Value / Target</th>
                <th className="py-2.5 px-3 w-28">Metadata</th>
                <th className="py-2.5 px-3 w-16">TTL</th>
                <th className="py-2.5 px-3 text-right w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171d2c] text-xs font-mono">
              {filtered.map((rec) => {
                const colors = typeColors[rec.type] || typeColors.TXT;
                const isCopied = copiedId === rec.id;

                return (
                  <tr key={rec.id} className="hover:bg-[#121622] transition-colors group">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${colors.bg} ${colors.border} ${colors.text}`}
                      >
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[160px]" title={rec.name}>
                      {rec.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 break-all font-mono">
                      <div className="max-w-xl">{rec.value}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400">
                      {rec.secondaryValue || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400">
                      {rec.ttl !== undefined ? `${rec.ttl}s` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleCopy(rec.id, rec.value)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#141924] hover:bg-[#1c2436] border border-[#242e42] text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                        title="Copy record value"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
