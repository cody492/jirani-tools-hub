import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  Copy,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { AdminPanelIcon } from '../icons/AdminPanelIcon';
import {
  ADMIN_CONFIG,
  storeSessionClearance,
  isAuthoritativeAdmin,
} from '../../config/adminConfig';

interface AdminVerificationModalProps {
  isOpen: boolean;
  currentUserEmail?: string | null;
  currentUserUid?: string | null;
  onVerified: () => void;
  onClose: () => void;
}

export const AdminVerificationModal: React.FC<AdminVerificationModalProps> = ({
  isOpen,
  currentUserEmail,
  currentUserUid,
  onVerified,
  onClose,
}) => {
  const [inputUid, setInputUid] = useState('');
  const [showUid, setShowUid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  // Strict hardcoded admin verification check
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    const trimmedInput = inputUid.trim();

    // Verify against strictly hardcoded UID
    if (!trimmedInput) {
      setError('Authoritative Firebase UID is required.');
      setIsVerifying(false);
      return;
    }

    if (trimmedInput !== ADMIN_CONFIG.REQUIRED_UID) {
      setError('Invalid Firebase UID. Administrative clearance denied.');
      setIsVerifying(false);
      return;
    }

    // Also verify that current authenticated email matches the hardcoded owner Gmail
    if (currentUserEmail?.toLowerCase() !== ADMIN_CONFIG.REQUIRED_EMAIL.toLowerCase()) {
      setError(`Access denied: Authenticated email (${currentUserEmail}) does not match authorized owner (${ADMIN_CONFIG.REQUIRED_EMAIL}).`);
      setIsVerifying(false);
      return;
    }

    // Success! Authorize session
    setTimeout(() => {
      storeSessionClearance(ADMIN_CONFIG.REQUIRED_UID);
      setSuccess(true);
      setIsVerifying(false);

      setTimeout(() => {
        onVerified();
      }, 1000);
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-verify-title"
    >
      <div className="relative w-full max-w-md rounded-xl border border-cyan-900/60 bg-[#0c1018] shadow-2xl shadow-cyan-950/40 p-6 overflow-hidden text-slate-100">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#151c2a] border border-transparent hover:border-[#253046] transition-colors"
          title="Dismiss Verification (Admin tab remains hidden)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Ribbon */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-950/80 to-[#121928] border border-cyan-700/60 flex items-center justify-center text-cyan-300 shadow-inner">
            <AdminPanelIcon size={24} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/40">
                2-Step Admin Authentication
              </span>
            </div>
            <h2 id="admin-verify-title" className="text-sm font-bold text-slate-100 mt-0.5 tracking-wide">
              ADMINISTRATIVE CLEARANCE
            </h2>
          </div>
        </div>

        {/* Authenticated Account Info */}
        <div className="p-3 rounded-lg bg-[#07090e] border border-[#1b2232] mb-4 space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>AUTHENTICATED OWNER ACCOUNT</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              GMAIL VERIFIED
            </span>
          </div>
          <div className="text-sm font-bold text-cyan-300 truncate">
            {currentUserEmail || ADMIN_CONFIG.REQUIRED_EMAIL}
          </div>
          <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
            To unlock the restricted <strong className="text-slate-200">Admin Panel</strong>, enter your authoritative Firebase User ID (UID) below as secondary proof of root ownership.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-uid-input"
              className="text-xs font-semibold text-slate-300 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                <span>ENTER FIREBASE UID</span>
              </span>
              <span className="text-[10px] text-slate-400">Exact string match required</span>
            </label>

            <div className="relative">
              <input
                id="admin-uid-input"
                type={showUid ? 'text' : 'password'}
                value={inputUid}
                onChange={(e) => {
                  setInputUid(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="HxHGshHYdWY36dyBG3aSa6Sarik2..."
                autoComplete="off"
                spellCheck="false"
                className="w-full px-3.5 py-2.5 bg-[#06080d] border border-[#212b3e] focus:border-cyan-500 rounded-lg text-xs font-mono text-cyan-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 pr-10 tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowUid(!showUid)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                title={showUid ? 'Mask UID' : 'Reveal UID'}
              >
                {showUid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">Authoritative UID confirmed. Admin Panel unlocked!</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-[#20293b] text-slate-400 hover:text-slate-200 hover:bg-[#121622] text-xs font-mono transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isVerifying || success || !inputUid.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <span>VERIFYING UID...</span>
              ) : success ? (
                <span>CLEARANCE GRANTED</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>AUTHENTICATE UID</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Note Footer */}
        <div className="mt-5 pt-3 border-t border-[#182030] text-[10px] text-slate-400 text-center leading-relaxed">
          System protection active • Only UID <code className="text-slate-400">HxHG...ik2</code> authorized for Gmail <code className="text-slate-400">{ADMIN_CONFIG.REQUIRED_EMAIL}</code>
        </div>
      </div>
    </div>
  );
};
