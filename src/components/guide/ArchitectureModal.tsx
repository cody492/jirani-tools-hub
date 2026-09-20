import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Layers, ArrowRight } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="rounded-xl border border-[#232c40] bg-[#10131c] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1c2232] bg-[#121623] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#181e2e] border border-[#27324b] text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                WEB FORENSICS V0.1 — FOUNDATION GUIDE
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Architecture principles, operational scope & defensive charter
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1c2333] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs font-mono text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              1. Purpose of Version 0.1
            </h4>
            <p className="text-slate-300 font-sans">
              WEB FORENSICS is a modular web investigation platform designed to inspect publicly accessible domain telemetry for defensive research, debugging, and educational purposes. V0.1 establishes the visual identity, shell, target validation, scan state machine, and modular workspaces without performing actual network reconnaissance.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h4 className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              2. Defensive Security Charter
            </h4>
            <div className="p-3 rounded bg-[#0d1017] border border-[#1d2433] space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Strictly Passive Public Web Telemetry</span>
              </div>
              <p className="text-[11px] font-sans text-slate-400">
                This platform will never implement brute force tools, exploit payloads, credential harvesters, or unauthorized penetration utilities. All future modules adhere to ethical OSINT and RFC internet standards.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h4 className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              3. Modular Expansion Pipeline
            </h4>
            <p className="text-slate-300 font-sans">
              Modules in the results workspace are cleanly isolated. Real intelligence providers (HTTP headers in V0.2, ASN/DNS in V0.3, Wappalyzer signatures in V0.4, TLS in V0.5, relationship graph in V0.6, and AI analyst in V0.7) can plug directly into their respective container without rewriting the UX foundation.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1c2232] bg-[#0e111a] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
