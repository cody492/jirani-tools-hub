import React, { useState } from 'react';
import { Mail, Copy, Check, Info, AlertCircle, ShieldAlert } from 'lucide-react';
import { MailServerObservation } from '../../types';

interface MailServersProps {
  observations: MailServerObservation[];
  domain: string;
  isUnavailable?: boolean;
}

export const MailServers: React.FC<MailServersProps> = ({
  observations,
  domain,
  isUnavailable = false,
}) => {
  const [copiedHost, setCopiedHost] = useState<string | null>(null);

  const handleCopy = (host: string) => {
    navigator.clipboard.writeText(host);
    setCopiedHost(host);
    setTimeout(() => setCopiedHost(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-[#1b2230] pb-2">
        <div>
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Mail Exchange Servers (MX Records)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Public mail routing endpoints designated to accept inbound SMTP traffic for @{domain}.
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141926] border border-[#222d42] text-slate-300">
          {observations.length} {observations.length === 1 ? 'MX Host' : 'MX Hosts'}
        </span>
      </div>

      {isUnavailable ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center space-y-1">
          <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">MX Lookup Unavailable</div>
          <div className="text-[11px] text-slate-400">
            Mail exchange resolution query could not be completed for {domain}.
          </div>
        </div>
      ) : observations.length === 0 ? (
        <div className="p-4 rounded-lg bg-[#0f121a] border border-[#1d2536] text-center space-y-1">
          <Info className="w-5 h-5 text-slate-500 mx-auto" />
          <div className="text-xs font-mono text-slate-300 font-semibold">No MX Records Configured</div>
          <div className="text-[11px] text-slate-400 max-w-md mx-auto">
            The domain does not advertise explicit MX records. Under RFC 5321, MTAs may fall back to root address (A) records, or inbound email is not accepted for @{domain}.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#1b2230] bg-[#0d1017]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1b2230] bg-[#111622] text-[10px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 px-3 w-20">Preference</th>
                <th className="py-2.5 px-3">Mail Exchange Host</th>
                <th className="py-2.5 px-3 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171d2c] text-xs font-mono">
              {observations.map((mx, idx) => {
                const isCopied = copiedHost === mx.host;
                return (
                  <tr key={`${mx.host}-${idx}`} className="hover:bg-[#121622] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#182133] border border-[#26324c] text-amber-300">
                        {mx.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-200 break-all">{mx.host}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {idx === 0 ? 'Primary inbound mail gateway' : 'Secondary / backup mail exchanger'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleCopy(mx.host)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#141924] hover:bg-[#1d2639] border border-[#242f44] text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                        title="Copy host"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
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

      {/* Forensic Principle Reminder */}
      <div className="p-2.5 rounded-lg bg-[#0e111a] border border-[#182030] flex items-start gap-2 text-[11px] font-mono text-slate-400">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-semibold">STRICT PASSIVE OBSERVATION: </span>
          Listed mail exchanges reflect public DNS MX records only. No SMTP connections, handshake checks, or recipient verification probes were initiated against these hosts.
        </div>
      </div>
    </div>
  );
};
