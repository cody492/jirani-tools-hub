import React from 'react';
import { Lock, Unlock, ArrowRight, ShieldCheck, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { HttpsObservationDetail } from '../../../types';

interface HttpsAnalysisCardProps {
  https: HttpsObservationDetail;
  targetUrl: string;
}

export const HttpsAnalysisCard: React.FC<HttpsAnalysisCardProps> = ({ https, targetUrl }) => {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0e1119] border border-[#1b2232] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#18202e] pb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            HTTPS Transport & Protocol Behavior
          </h3>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
            https.httpsEnabled
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
              : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
          }`}
        >
          {https.httpsEnabled ? 'HTTPS ACTIVE' : 'HTTP PLAINTEXT'}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Final Transport Scheme</div>
          <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            {https.httpsEnabled ? (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-mono">HTTPS (Encrypted)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-mono">HTTP (Unencrypted)</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Protocol: <strong className="text-slate-200">{https.finalProtocol}</strong>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">HTTP-to-HTTPS Redirection</div>
          <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            {https.redirectedFromHttpToHttps ? (
              <span className="text-cyan-300">Observed in Chain</span>
            ) : https.httpsEnabled ? (
              <span className="text-slate-300">Direct HTTPS Request</span>
            ) : (
              <span className="text-amber-400">No Upgrade Observed</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {https.redirectedFromHttpToHttps
              ? 'Plaintext connection automatically upgraded'
              : 'Initial connection directly negotiated'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#111520] border border-[#1d2638] space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">HSTS Policy Alignment</div>
          <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            {https.hstsObserved ? (
              <span className="text-emerald-400">Policy Declared</span>
            ) : (
              <span className="text-slate-400">Not Observable</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {https.hstsObserved
              ? 'Strict-Transport-Security header present'
              : 'Header missing from observed responses'}
          </div>
        </div>
      </div>

      {/* Forensic interpretation box */}
      <div className="p-3 rounded-lg bg-[#111520] border border-[#192231] space-y-2 text-xs font-mono">
        <div className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Factual Transport Observation</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
          <div>
            <strong className="text-slate-400 block text-[10px] uppercase">Fact:</strong>
            {https.summary}.
          </div>
          <div>
            <strong className="text-slate-400 block text-[10px] uppercase">Context:</strong>
            HTTPS prevents on-path eavesdropping and tampering by authenticating server identity via TLS certificates.
          </div>
          <div>
            <strong className="text-slate-400 block text-[10px] uppercase">Assessment:</strong>
            {https.httpsEnabled
              ? 'Transport layer encryption is active for public web interactions.'
              : 'Plaintext traffic transmission detected; transport is not protected against local network interception.'}
          </div>
        </div>
      </div>
    </div>
  );
};
