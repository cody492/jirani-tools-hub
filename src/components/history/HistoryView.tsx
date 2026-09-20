import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  ExternalLink,
  ArrowRight,
  Trash2,
  Globe,
  Search,
  Filter,
  Layers,
  ChevronDown,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  X,
} from 'lucide-react';
import { InvestigationRecord } from '../../types';

interface HistoryViewProps {
  records: InvestigationRecord[];
  onSelectRecord: (record: InvestigationRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  onNewScan: () => void;
}

const INITIAL_BATCH_SIZE = 5;
const INCREMENT_BATCH_SIZE = 5;

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearHistory,
  onNewScan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'REDIRECT' | 'ERROR'>('ALL');
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals state
  const [recordToDelete, setRecordToDelete] = useState<InvestigationRecord | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Sentinel element ref for Intersection Observer
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRecordToDelete(null);
        setIsClearModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter records based on search query and status filter
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        !searchTerm.trim() ||
        record.target.hostname.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        record.target.domain.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        record.id.toLowerCase().includes(searchTerm.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;

      const statusCode = record.httpIntelligence?.statusCode;
      if (statusFilter === 'SUCCESS') {
        return statusCode && statusCode >= 200 && statusCode < 300;
      }
      if (statusFilter === 'REDIRECT') {
        return statusCode && statusCode >= 300 && statusCode < 400;
      }
      if (statusFilter === 'ERROR') {
        return !statusCode || statusCode >= 400 || !!record.error;
      }

      return true;
    });
  }, [records, searchTerm, statusFilter]);

  // Sliced records currently mounted in the DOM
  const visibleRecords = useMemo(() => {
    return filteredRecords.slice(0, visibleCount);
  }, [filteredRecords, visibleCount]);

  const hasMore = visibleCount < filteredRecords.length;

  // Reset visible count when search term or filter changes
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [searchTerm, statusFilter]);

  // Scalable Infinite Scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          // Small microtask debounce for smooth frame budget
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + INCREMENT_BATCH_SIZE, filteredRecords.length));
            setIsLoadingMore(false);
          }, 120);
        }
      },
      {
        root: null,
        rootMargin: '160px', // Pre-fetch before user hits the absolute bottom
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, filteredRecords.length]);

  const handleManualLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + INCREMENT_BATCH_SIZE, filteredRecords.length));
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1c2232]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Session Investigation History
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b29] text-cyan-400 border border-cyan-800/40">
              Scalable Windowed Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Progressive infinite scrolling with 5-record lazy rendering to protect DOM memory
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              type="button"
              id="btn-clear-history"
              onClick={() => setIsClearModalOpen(true)}
              className="px-3 py-1.5 rounded bg-[#161a24] hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-[#232a3d] hover:border-rose-900/40 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log ({records.length})</span>
            </button>
          )}

          <button
            type="button"
            id="btn-history-new-investigation"
            onClick={onNewScan}
            className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Launch Target</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Record list or empty state */}
      {records.length === 0 ? (
        <div className="rounded-xl border border-[#1b2233] bg-[#10131c] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#161b27] border border-[#242e42] flex items-center justify-center text-slate-500 mx-auto">
            <Clock className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-mono font-semibold uppercase text-slate-200">
              No Investigations Recorded
            </h3>
            <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
              Simulated target scans performed during this browser session will be indexed here for quick comparison.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNewScan}
              className="px-4 py-2 rounded bg-[#171e2c] hover:bg-[#20293d] border border-[#29354d] text-cyan-400 text-xs font-mono font-medium transition-colors"
            >
              Analyze Your First Target →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls Bar: Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-[#1b2333] bg-[#0e121a]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter history by hostname or ID..."
                className="w-full pl-8 pr-3 py-1.5 rounded bg-[#121622] border border-[#222a3d] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
              <span className="text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" />
              </span>
              {(['ALL', 'SUCCESS', 'REDIRECT', 'ERROR'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2 py-1 rounded transition-colors ${
                    statusFilter === filter
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold'
                      : 'bg-[#141926] text-slate-400 hover:text-slate-300 border border-[#202738]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Scalability Telemetry Badge */}
          <div className="flex items-center justify-between px-1 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Rendering <strong className="text-slate-200">{visibleRecords.length}</strong> of{' '}
                <strong className="text-slate-200">{filteredRecords.length}</strong> investigations
              </span>
              {filteredRecords.length !== records.length && (
                <span className="text-slate-500">({records.length} total in session)</span>
              )}
            </div>

            <div className="text-cyan-400/90 flex items-center gap-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Limit: 5 rendered per scroll</span>
            </div>
          </div>

          {/* Windowed List */}
          {visibleRecords.length === 0 ? (
            <div className="p-8 rounded-lg border border-[#1b2233] bg-[#11141d] text-center text-xs font-mono text-slate-400">
              No investigations match the active filter or search term.
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-[#1d2435] bg-[#11141d] hover:border-[#2b354d] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="p-2 rounded bg-[#161c29] border border-[#232c40] text-cyan-400 shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-bold text-slate-100 truncate">
                          {record.target.hostname}
                        </span>
                        {record.httpIntelligence ? (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                              record.httpIntelligence.statusCode >= 200 &&
                              record.httpIntelligence.statusCode < 300
                                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'
                                : record.httpIntelligence.statusCode >= 300 &&
                                  record.httpIntelligence.statusCode < 400
                                ? 'bg-amber-950/50 text-amber-300 border-amber-800/50'
                                : 'bg-rose-950/50 text-rose-300 border-rose-800/50'
                            }`}
                          >
                            HTTP {record.httpIntelligence.statusCode} {record.httpIntelligence.statusText}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                            {record.status}
                          </span>
                        )}

                        {record.infrastructureIntelligence && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                            {record.infrastructureIntelligence.summary.totalRecordsCount} DNS Records
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                        <span>ID: {record.id}</span>
                        <span>•</span>
                        <span>{new Date(record.startedAt).toLocaleTimeString()} UTC</span>
                        <span>•</span>
                        <span>
                          {record.httpIntelligence
                            ? `${record.httpIntelligence.responseTimeMs}ms probe`
                            : `Duration: ${(record.durationMs / 1000).toFixed(1)}s`}
                        </span>
                        {record.httpIntelligence && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400">{record.httpIntelligence.protocol}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column: Inspect Results + Delete Button */}
                  <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-center gap-1.5">
                    <button
                      type="button"
                      id={`btn-inspect-${record.id}`}
                      onClick={() => onSelectRecord(record)}
                      className="w-full sm:w-auto px-3 py-1.5 rounded bg-[#162030] hover:bg-[#1f2d44] border border-[#253650] text-cyan-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Inspect Results</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-${record.id}`}
                      onClick={() => setRecordToDelete(record)}
                      className="px-2.5 py-1 rounded bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 border border-rose-900/30 hover:border-rose-800/60 text-[11px] font-mono flex items-center gap-1 transition-all"
                      title={`Delete ${record.target.hostname} from history`}
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Infinite Scroll Sentinel & Load More Trigger */}
          {hasMore && (
            <div
              ref={sentinelRef}
              className="py-4 text-center border-t border-[#171e2c] flex flex-col items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={handleManualLoadMore}
                disabled={isLoadingMore}
                className="px-4 py-2 rounded-md bg-[#141926] hover:bg-[#1a2233] text-cyan-400 border border-[#222a3d] text-xs font-mono flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Loading next batch...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>
                      Load More (+5 records, {filteredRecords.length - visibleRecords.length} remaining)
                    </span>
                  </>
                )}
              </button>
              <p className="text-[10px] font-mono text-slate-500">
                Or scroll down to automatically load the next batch of 5 records
              </p>
            </div>
          )}

          {!hasMore && filteredRecords.length > INITIAL_BATCH_SIZE && (
            <div className="py-3 text-center text-[11px] font-mono text-slate-500 border-t border-[#171e2c]">
              ✓ All {filteredRecords.length} investigations in current view loaded
            </div>
          )}
        </div>
      )}

      {/* Warning Modal: Delete Single Record */}
      {recordToDelete && (
        <div
          id="delete-record-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setRecordToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#232c42] bg-[#0c101a] p-6 shadow-2xl space-y-4 font-mono text-slate-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setRecordToDelete(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  Delete Investigation Record?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to delete the investigation for{' '}
                  <strong className="text-rose-300 font-bold">{recordToDelete.target.hostname}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-[#1e263a] bg-[#111624] text-[11px] space-y-1 text-slate-400">
              <div className="flex items-center justify-between">
                <span>Record ID:</span>
                <span className="text-slate-200 font-bold">{recordToDelete.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Domain:</span>
                <span className="text-slate-200">{recordToDelete.target.domain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Analyzed At:</span>
                <span className="text-slate-200">
                  {new Date(recordToDelete.startedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-400/90 leading-relaxed bg-amber-950/20 border border-amber-800/30 rounded p-2.5">
              ⚠️ This search result will be permanently deleted from your browser session history and local storage. Once deleted, it cannot be restored.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-3.5 py-1.5 rounded bg-[#141926] hover:bg-[#1e2638] text-slate-300 border border-[#242e42] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-single"
                onClick={() => {
                  onDeleteRecord(recordToDelete.id);
                  setRecordToDelete(null);
                }}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal: Clear Entire History */}
      {isClearModalOpen && (
        <div
          id="clear-all-history-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsClearModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#232c42] bg-[#0c101a] p-6 shadow-2xl space-y-4 font-mono text-slate-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  Clear Entire Investigation Log?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You are about to wipe all <strong className="text-rose-300 font-bold">{records.length}</strong> recorded investigations from your session history.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-amber-400/90 leading-relaxed bg-amber-950/20 border border-amber-800/30 rounded p-2.5">
              ⚠️ This will permanently remove all cached target investigations, DNS topologies, tech stacks, and security observations from your session storage. This operation cannot be reversed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-3.5 py-1.5 rounded bg-[#141926] hover:bg-[#1e2638] text-slate-300 border border-[#242e42] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all"
                onClick={() => {
                  onClearHistory();
                  setIsClearModalOpen(false);
                }}
                className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Entire Log ({records.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
