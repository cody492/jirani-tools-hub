import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Building2,
  Lock,
  Globe,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Server,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { WhoisRecord } from '../../types';
import { InfrastructureAnalysisService } from '../../services/infrastructureAnalysisService';

interface WhoisDossierProps {
  whois?: WhoisRecord | null;
  domain: string;
  onWhoisUpdated?: (updated: WhoisRecord) => void;
}

export const WhoisDossier: React.FC<WhoisDossierProps> = ({
  whois: initialWhois,
  domain,
  onWhoisUpdated,
}) => {
  const [whois, setWhois] = useState<WhoisRecord | null | undefined>(initialWhois);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Sync state if prop updates
  React.useEffect(() => {
    setWhois(initialWhois);
  }, [initialWhois]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await InfrastructureAnalysisService.fetchWhois(domain);
      if (res.success && res.whois) {
        setWhois(res.whois);
        if (onWhoisUpdated) {
          onWhoisUpdated(res.whois);
        }
      } else {
        setRefreshError(res.error?.message || 'Unable to refresh WHOIS registration.');
      }
    } catch (err: any) {
      setRefreshError(err?.message || 'WHOIS lookup failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyRaw = () => {
    if (!whois?.rawText) return;
    navigator.clipboard.writeText(whois.rawText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not Available';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatAge = (days?: number) => {
    if (days === undefined || days === null) return null;
    const years = Math.floor(days / 365.25);
    const remDays = Math.floor(days % 365.25);
    if (years > 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}, ${remDays}d`;
    }
    return `${days} days`;
  };

  const formatRemaining = (days?: number) => {
    if (days === undefined || days === null) return null;
    if (days < 0) return `${Math.abs(days)} days expired`;
    const years = Math.floor(days / 365.25);
    const remDays = Math.floor(days % 365.25);
    if (years > 0) {
      return `${years}y ${remDays}d left`;
    }
    return `${days} days left`;
  };

  const getExpirationBadgeColor = (days?: number) => {
    if (days === undefined || days === null) return 'bg-slate-800 text-slate-300 border-slate-700';
    if (days <= 30) return 'bg-rose-950/60 text-rose-300 border-rose-800/80 animate-pulse';
    if (days <= 90) return 'bg-amber-950/60 text-amber-300 border-amber-800/80';
    return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70';
  };

  if (!whois || whois.lookupStatus === 'UNAVAILABLE' || whois.lookupStatus === 'NOT_FOUND') {
    return (
      <div className="p-6 rounded-lg bg-[#0d1017] border border-[#1b2230] space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>WHOIS / RDAP REGISTRATION TELEMETRY</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#161c28] hover:bg-[#1f2838] text-cyan-300 border border-cyan-800/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'QUERYING...' : 'FETCH WHOIS'}</span>
          </button>
        </div>

        <div className="p-4 rounded border border-dashed border-[#242c3d] bg-[#090b10] text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-amber-400/80 mx-auto" />
          <div className="text-slate-300 font-semibold">
            {whois?.error || 'Registration records not resolved for this domain target.'}
          </div>
          <p className="text-slate-400 text-[11px] max-w-md mx-auto">
            Some top-level domains restrict automated port-43 queries or enforce rate limits. Click &quot;Fetch WHOIS&quot; to perform an on-demand RDAP / WHOIS resolution attempt.
          </p>
          {refreshError && (
            <div className="text-rose-400 text-[11px] pt-2">{refreshError}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Banner Ribbon */}
      <div className="p-4 rounded-lg bg-[#0d1017] border border-[#1b2230] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/50 border border-cyan-800/60 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Registrar & Authority</div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{whois.registrar || 'Protected / Redacted by Privacy Proxy'}</span>
              {whois.registrarIanaId && (
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-[#161d2b] text-cyan-300 border border-cyan-800/40">
                  IANA ID: {whois.registrarIanaId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-[10px] bg-[#141b27] text-slate-300 border border-[#232d3f] flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>{whois.lookupSource === 'RDAP' ? 'RDAP (HTTPS RFC 7482)' : 'PORT 43 WHOIS'}</span>
          </span>
          <span className="px-2 py-1 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>VERIFIED REGISTRATION</span>
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh WHOIS data"
            className="p-1.5 rounded bg-[#141924] hover:bg-[#1c2433] text-slate-400 hover:text-cyan-300 border border-[#202737] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Telemetry & Lifecycle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Creation Date */}
        <div className="p-3.5 rounded-lg bg-[#0d1017] border border-[#1b2230] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>CREATION DATE</span>
            </span>
            {whois.ageDays !== undefined && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                {formatAge(whois.ageDays)}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-slate-100">
            {formatDate(whois.creationDate)}
          </div>
          {whois.creationDate && (
            <div className="text-[10px] text-slate-400 truncate">
              {whois.creationDate}
            </div>
          )}
        </div>

        {/* Expiration Date */}
        <div className="p-3.5 rounded-lg bg-[#0d1017] border border-[#1b2230] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>EXPIRATION DATE</span>
            </span>
            {whois.daysUntilExpiration !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getExpirationBadgeColor(whois.daysUntilExpiration)}`}>
                {formatRemaining(whois.daysUntilExpiration)}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-slate-100">
            {formatDate(whois.expirationDate)}
          </div>
          {whois.expirationDate && (
            <div className="text-[10px] text-slate-400 truncate">
              {whois.expirationDate}
            </div>
          )}
        </div>

        {/* Last Updated Date */}
        <div className="p-3.5 rounded-lg bg-[#0d1017] border border-[#1b2230] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>REGISTRY UPDATED</span>
            </span>
            <span className="text-[10px] text-slate-400">REGISTRY TIMESTAMP</span>
          </div>
          <div className="text-sm font-bold text-slate-100">
            {whois.updatedDate ? formatDate(whois.updatedDate) : 'Not Disclosed'}
          </div>
          {whois.updatedDate && (
            <div className="text-[10px] text-slate-400 truncate">
              {whois.updatedDate}
            </div>
          )}
        </div>
      </div>

      {/* Extended Registry Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Domain Statuses */}
        <div className="p-3.5 rounded-lg bg-[#0d1017] border border-[#1b2230] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>REGISTRY LOCKS & STATUS</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {whois.status?.length || 0} flags active
            </span>
          </div>
          {whois.status && whois.status.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {whois.status.map((st, idx) => (
                <span
                  key={`${st}-${idx}`}
                  className="px-2 py-0.5 rounded bg-[#141925] border border-[#222a3b] text-[11px] text-slate-300 hover:text-cyan-300 hover:border-cyan-800/60 transition-colors"
                >
                  {st}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 italic text-[11px]">
              No active lock or status flags recorded
            </div>
          )}
        </div>

        {/* Technical Registry Metadata */}
        <div className="p-3.5 rounded-lg bg-[#0d1017] border border-[#1b2230] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>REGISTRY PARAMETERS</span>
            </span>
            <span className="text-[10px] text-slate-400">AUTHORITATIVE SOURCE</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between py-0.5 border-b border-[#18202e]">
              <span className="text-slate-400">Registry / RDAP Server</span>
              <span className="text-slate-200 truncate max-w-[240px]">{whois.whoisServer || 'Standard TLD Registry'}</span>
            </div>
            <div className="flex items-center justify-between py-0.5 border-b border-[#18202e]">
              <span className="text-slate-400">DNSSEC Security</span>
              <span className={`font-semibold ${whois.dnssec && whois.dnssec.toLowerCase().includes('signed') ? 'text-emerald-400' : 'text-slate-400'}`}>
                {whois.dnssec || 'Unsigned'}
              </span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400">Nameservers Reported</span>
              <span className="text-slate-200">
                {whois.nameservers && whois.nameservers.length > 0
                  ? `${whois.nameservers.length} delegated hosts`
                  : 'Derived from DNS (NS)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Registration Record Accordion */}
      {whois.rawText && (
        <div className="rounded-lg bg-[#0d1017] border border-[#1b2230] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-slate-300 hover:text-slate-100 hover:bg-[#121620] transition-colors"
          >
            <span className="flex items-center gap-2 font-bold text-[11px]">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>RAW WHOIS / RDAP RECORD TELEMETRY</span>
            </span>
            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <span>{showRaw ? 'HIDE DETAILS' : 'VIEW RAW OUTPUT'}</span>
              {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showRaw && (
            <div className="p-3 border-t border-[#1b2230] bg-[#07090e] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Target: {domain} | Source: {whois.whoisServer || whois.lookupSource}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#141924] hover:bg-[#1e2536] text-cyan-300 border border-cyan-800/40 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'COPIED' : 'COPY RAW'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-[#0b0e14] border border-[#1a2130] text-[10px] text-slate-300 font-mono overflow-x-auto max-h-72 leading-relaxed whitespace-pre-wrap select-all">
                {whois.rawText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
