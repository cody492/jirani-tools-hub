import React, { useState, useMemo } from 'react';
import {
  Table,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  Shield,
  Filter,
  Layers,
  FileCode,
} from 'lucide-react';
import { HttpHeaderItem } from '../../types';

interface ResponseHeadersProps {
  headers: HttpHeaderItem[];
  rawCount: number;
}

export const ResponseHeaders: React.FC<ResponseHeadersProps> = ({ headers, rawCount }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedHeaderKey, setCopiedHeaderKey] = useState<string | null>(null);

  const filteredHeaders = useMemo(() => {
    return headers.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.value.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'security' && h.isSecurityHeader) ||
        h.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [headers, searchQuery, selectedCategory]);

  const handleCopyAll = () => {
    const rawText = headers.map((h) => `${h.name}: ${h.value}`).join('\n');
    navigator.clipboard.writeText(rawText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (header: HttpHeaderItem, key: string) => {
    navigator.clipboard.writeText(`${header.name}: ${header.value}`);
    setCopiedHeaderKey(key);
    setTimeout(() => setCopiedHeaderKey(null), 2000);
  };

  const securityHeaderCount = headers.filter((h) => h.isSecurityHeader).length;

  return (
    <div className="rounded-lg border border-[#1b2333] bg-[#0c0f17] overflow-hidden font-mono">
      {/* Header Bar with Toggle */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f131d] border-b border-[#182030]">
        <div className="flex items-center gap-2.5">
          <Table className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
            RESPONSE HEADERS
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#18202f] border border-[#253249] text-cyan-300 font-bold">
            {rawCount} CAPTURED
          </span>
          {securityHeaderCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>{securityHeaderCount} Security</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isExpanded && headers.length > 0 && (
            <button
              type="button"
              id="btn-copy-all-headers"
              onClick={handleCopyAll}
              className="px-2.5 py-1 rounded bg-[#151c2a] hover:bg-[#1f2a3e] border border-[#243147] text-slate-300 text-[11px] flex items-center gap-1.5 transition-colors"
              title="Copy all headers to clipboard"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied All</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy Headers</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            id="btn-toggle-headers-view"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded bg-[#151c2a] hover:bg-[#1f2a3e] border border-[#243147] text-slate-300 text-[11px] flex items-center gap-1.5 transition-colors"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Filter & Search Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pb-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter header by name or value (e.g. server, cache)..."
                className="w-full pl-8 pr-3 py-1.5 rounded bg-[#0a0d14] border border-[#1b2333] text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Category Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'security', label: 'Security' },
                { id: 'caching', label: 'Caching' },
                { id: 'server', label: 'Server' },
                { id: 'content', label: 'Content' },
                { id: 'transport', label: 'Transport' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-950/60 border-cyan-600/60 text-cyan-300 font-bold'
                      : 'bg-[#0f131e] border-[#1a2233] text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Headers Technical Table */}
          {filteredHeaders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 rounded bg-[#090c12] border border-[#161d2b]">
              No headers match the current filter query "{searchQuery}".
            </div>
          ) : (
            <div className="border border-[#182130] rounded-lg overflow-hidden bg-[#090c12]">
              {/* Header row */}
              <div className="grid grid-cols-12 bg-[#0e121b] border-b border-[#192232] px-3 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <div className="col-span-12 sm:col-span-4 lg:col-span-3">HEADER</div>
                <div className="col-span-12 sm:col-span-8 lg:col-span-9">VALUE</div>
              </div>

              {/* Header list items */}
              <div className="divide-y divide-[#131926] max-h-[460px] overflow-y-auto">
                {filteredHeaders.map((header, idx) => {
                  const uniqueKey = `${header.name.toLowerCase()}-${idx}`;
                  const isCopied = copiedHeaderKey === uniqueKey;
                  return (
                    <div
                      key={uniqueKey}
                      className="grid grid-cols-12 px-3 py-2 text-xs hover:bg-[#0d1119] transition-colors group"
                    >
                      {/* Name column */}
                      <div className="col-span-12 sm:col-span-4 lg:col-span-3 font-semibold text-cyan-300/90 flex items-start gap-1.5 break-all pr-2">
                        {header.isSecurityHeader && (
                          <span title="Security Header">
                            <Shield className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          </span>
                        )}
                        <span>{header.name}</span>
                      </div>

                      {/* Value column with copy */}
                      <div className="col-span-12 sm:col-span-8 lg:col-span-9 text-slate-300 break-words flex items-start justify-between gap-2 mt-1 sm:mt-0">
                        <span className="font-mono selection:bg-cyan-500/20">{header.value}</span>
                        <button
                          type="button"
                          onClick={() => handleCopySingle(header, uniqueKey)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#18202e] text-slate-400 hover:text-cyan-300 transition-all shrink-0 ml-2"
                          title="Copy value"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
            <span>
              Showing {filteredHeaders.length} of {rawCount} headers received from remote server
            </span>
            <span className="text-slate-400">RFC 9110 RAW FIELD SET</span>
          </div>
        </div>
      )}
    </div>
  );
};
