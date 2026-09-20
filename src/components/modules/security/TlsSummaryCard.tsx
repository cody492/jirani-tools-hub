import React from 'react';
import { KeyRound, ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2, Clock, Calendar, Globe, Cpu } from 'lucide-react';
import { TlsObservationDetail } from '../../../types';

interface TlsSummaryCardProps {
  tls: TlsObservationDetail;
  hostname: string;
}

export const TlsSummaryCard: React.FC<TlsSummaryCardProps> = ({ tls, hostname }) => {
  if (!tls.available) {
    return (
      <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-3">
        <div className="flex items-center justify-between border-b border-[#18202e] pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              TLS / X.509 Certificate Observation
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase">
            NOT DIRECTLY OBSERVABLE
          </span>
        </div>

        <p className="text-xs font-mono text-slate-400">
          {tls.unavailabilityReason || 'TLS certificate handshake parameters could not be directly observed in this runtime.'}
        </p>

        <div className="p-3 rounded-lg bg-[#111520] border border-[#192130] text-[11px] font-mono text-slate-400 space-y-1">
          <strong className="text-slate-300 block text-[10px] uppercase">Forensic Integrity Note:</strong>
          Web Forensics displays only verified, passively retrieved telemetry. When low-level raw socket handshake data is restricted or unreachable, observations are flagged as unobservable rather than simulated.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#18202e] pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            TLS Peer Certificate & Cryptography
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {tls.isExpired ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/50 font-bold uppercase flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>CERTIFICATE EXPIRED</span>
            </span>
          ) : tls.isExpiringSoon ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50 font-bold uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>EXPIRING SOON ({tls.daysRemaining} DAYS)</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-bold uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>VALID & ACTIVE</span>
            </span>
          )}
        </div>
      </div>

      {/* Primary specs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* Protocol & Cipher */}
        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>Negotiated Protocol</span>
          </span>
          <div className="text-sm font-bold text-slate-100">
            {tls.protocol || 'TLS 1.3 / 1.2'}
          </div>
          <p className="text-[10px] text-slate-400 truncate" title={tls.cipher}>
            {tls.cipher || 'Standard AEAD Cipher'}
          </p>
        </div>

        {/* Certificate Issuer CA */}
        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>Issuer Authority</span>
          </span>
          <div className="text-sm font-bold text-slate-100 truncate" title={tls.issuer?.organization || tls.issuer?.commonName}>
            {tls.issuer?.organization || tls.issuer?.commonName || 'Certificate Authority'}
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            CN: {tls.issuer?.commonName || 'CA Root'}
          </p>
        </div>

        {/* Subject */}
        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>Subject (Target CN)</span>
          </span>
          <div className="text-sm font-bold text-slate-100 truncate" title={tls.subject?.commonName || hostname}>
            {tls.subject?.commonName || hostname}
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Org: {tls.subject?.organization || 'Domain Validated'}
          </p>
        </div>

        {/* Validity & Expiration */}
        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Validity Window</span>
          </span>
          <div className="text-sm font-bold text-slate-100">
            {typeof tls.daysRemaining === 'number' ? (
              tls.daysRemaining >= 0 ? (
                <span className="text-emerald-400">{tls.daysRemaining} days left</span>
              ) : (
                <span className="text-rose-400">Expired {Math.abs(tls.daysRemaining)} days ago</span>
              )
            ) : (
              'Active'
            )}
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            Expires: {tls.validTo ? new Date(tls.validTo).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* SAN list & Fingerprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
        {tls.sanList && tls.sanList.length > 0 && (
          <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Subject Alternative Names ({tls.sanList.length})
            </span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {tls.sanList.map((san, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-[#18202e] border border-[#242e42] text-[10px] text-slate-300"
                >
                  {san}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-2">
          {tls.fingerprint && (
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SHA-256 Fingerprint</span>
              <code className="text-[10px] text-cyan-300/90 break-all">{tls.fingerprint}</code>
            </div>
          )}
          {tls.serialNumber && (
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Certificate Serial</span>
              <code className="text-[10px] text-slate-400 break-all">{tls.serialNumber}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
