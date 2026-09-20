import React, { useState } from 'react';
import { Network, Copy, Check, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { IpAddressObservation } from '../../types';

interface IpAddressesProps {
  observations: IpAddressObservation[];
  domain: string;
  isUnavailable?: boolean;
}

export const IpAddresses: React.FC<IpAddressesProps> = ({
  observations,
  domain,
  isUnavailable = false,
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const ipv4List = observations.filter((o) => o.version === 'IPv4');
  const ipv6List = observations.filter((o) => o.version === 'IPv6');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-[#1b2230] pb-2">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Observed Network Addresses (IPv4 / IPv6)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Network layer endpoints resolved via authoritative A and AAAA DNS queries for {domain}.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141926] border border-[#222d42] text-slate-300">
          {observations.length} {observations.length === 1 ? 'Address' : 'Addresses'}
        </span>
      </div>

      {isUnavailable ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center space-y-1">
          <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">Address Resolution Unavailable</div>
          <div className="text-[11px] text-slate-400">
            System DNS or DoH resolver could not complete A/AAAA resolution queries.
          </div>
        </div>
      ) : observations.length === 0 ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center space-y-1">
          <Info className="w-5 h-5 text-slate-500 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">No Address Records Discovered</div>
          <div className="text-[11px] text-slate-400">
            Neither IPv4 (A) nor IPv6 (AAAA) records were returned for {domain}.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* IPv4 Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="font-semibold text-cyan-400">IPv4 (A RECORDS)</span>
              <span>{ipv4List.length} observed</span>
            </div>

            {ipv4List.length === 0 ? (
              <div className="p-3 rounded-lg border border-[#1b2230] bg-[#0d1017] text-xs font-mono text-slate-400 italic">
                No IPv4 address records found.
              </div>
            ) : (
              <div className="space-y-1.5">
                {ipv4List.map((item, idx) => {
                  const isCopied = copiedAddress === item.address;
                  return (
                    <div
                      key={`${item.address}-${idx}`}
                      className="p-2.5 rounded-lg border border-[#1b2230] bg-[#0d1017] flex items-center justify-between gap-3 group hover:border-[#2b364c] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-cyan-300 tracking-wide">
                            {item.address}
                          </code>
                          {item.ttl !== undefined && (
                            <span className="text-[10px] font-mono text-slate-400">
                              TTL {item.ttl}s
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          Routing destination for {domain}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.address)}
                        className="p-1.5 rounded bg-[#141924] hover:bg-[#1c2436] border border-[#242e42] text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                        title="Copy IPv4 address"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* IPv6 Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="font-semibold text-indigo-400">IPv6 (AAAA RECORDS)</span>
              <span>{ipv6List.length} observed</span>
            </div>

            {ipv6List.length === 0 ? (
              <div className="p-3 rounded-lg border border-[#1b2230] bg-[#0d1017] text-xs font-mono text-slate-400 italic">
                No IPv6 (AAAA) address records found for this domain.
              </div>
            ) : (
              <div className="space-y-1.5">
                {ipv6List.map((item, idx) => {
                  const isCopied = copiedAddress === item.address;
                  return (
                    <div
                      key={`${item.address}-${idx}`}
                      className="p-2.5 rounded-lg border border-[#1b2230] bg-[#0d1017] flex items-center justify-between gap-3 group hover:border-[#2b364c] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-indigo-300 tracking-wide truncate max-w-[200px] sm:max-w-[260px]">
                            {item.address}
                          </code>
                          {item.ttl !== undefined && (
                            <span className="text-[10px] font-mono text-slate-400">
                              TTL {item.ttl}s
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          Dual-stack IPv6 transport endpoint
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.address)}
                        className="p-1.5 rounded bg-[#141924] hover:bg-[#1c2436] border border-[#242e42] text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                        title="Copy IPv6 address"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fact vs Interpretation Forensic Principle Banner */}
      <div className="p-3 rounded-lg bg-[#0e111a] border border-[#1b2233] space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>FORENSIC PRINCIPLE: FACT VS. INTERPRETATION</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded bg-[#090b11] border border-[#171c2a] space-y-0.5">
            <span className="text-cyan-400 font-bold uppercase">FACT (OBSERVATION):</span>
            <p className="text-slate-300">
              The domain resolves to the listed IP address(es) via public authoritative DNS queries.
            </p>
          </div>
          <div className="p-2 rounded bg-[#090b11] border border-[#171c2a] space-y-0.5">
            <span className="text-amber-400 font-bold uppercase">INTERPRETATION BOUNDARY:</span>
            <p className="text-slate-400">
              An observed IP address does not imply an origin server, specific hosting machine, or application perimeter without correlating routing telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
