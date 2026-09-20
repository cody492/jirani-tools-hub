import React, { useState, useEffect } from 'react';
import {
  Globe,
  ArrowRight,
  AlertCircle,
  X,
  ShieldAlert,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AppState } from '../../types';
import { validateAndParseTarget } from '../../utils/targetValidator';
import { QuotaInfo, QuotaService } from '../../services/quotaService';

interface TargetInputProps {
  currentTarget: string;
  appState: AppState;
  quota?: QuotaInfo | null;
  rateLimitError?: string | null;
  onAnalyze: (target: string) => void;
  onCancelScan?: () => void;
  onResetQuota?: () => void;
}

const PRESET_TARGETS = [
  { label: 'example.com', desc: 'RFC 2606 Reserved Domain' },
  { label: 'ietf.org', desc: 'Internet Standards Body' },
  { label: 'kernel.org', desc: 'Linux Foundation Mirror' },
  { label: 'w3.org', desc: 'World Wide Web Consortium' },
];

export const TargetInput: React.FC<TargetInputProps> = ({
  currentTarget,
  appState,
  quota,
  rateLimitError,
  onAnalyze,
  onCancelScan,
  onResetQuota,
}) => {
  const [inputValue, setInputValue] = useState(currentTarget);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [countdown, setCountdown] = useState<number>(quota?.resetInSeconds || 0);

  useEffect(() => {
    setInputValue(currentTarget);
  }, [currentTarget]);

  useEffect(() => {
    if (quota) {
      setCountdown(quota.resetInSeconds);
    }
  }, [quota]);

  // Tick down seconds when blocked
  useEffect(() => {
    if (!quota?.isBlocked || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [quota?.isBlocked, countdown]);

  const isBlocked = quota?.isBlocked || (quota && quota.remaining <= 0);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (appState === 'scanning' || isBlocked) return;

    setValidationError(null);

    const validation = validateAndParseTarget(inputValue);
    if (!validation.isValid) {
      setValidationError(validation.errorMessage || 'Invalid target format.');
      return;
    }

    onAnalyze(inputValue);
  };

  const handleSelectPreset = (preset: string) => {
    setInputValue(preset);
    setValidationError(null);
  };

  const isScanning = appState === 'scanning';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Rate Limit / Quota Banner if Blocked */}
      {isBlocked && (
        <div
          id="rate-limit-banner"
          className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 sm:p-5 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-900/40 border border-amber-700/50 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-300">
                Target Analysis Quota Reached ({quota?.limit || 10}/{quota?.limit || 10})
              </h4>
              <p className="text-xs font-mono text-amber-200/80 mt-1 max-w-xl leading-relaxed">
                {rateLimitError ||
                  `Defensive rate limiting is active to protect network telemetry pipelines. Target inspections are paused until the sliding 1-hour window resets.`}
              </p>
              <div className="flex items-center gap-2 font-mono text-xs text-amber-400 mt-2">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Cooldown remaining: <strong>{QuotaService.formatResetTime(countdown)}</strong>
                </span>
              </div>
            </div>
          </div>

          {onResetQuota && (
            <button
              type="button"
              onClick={onResetQuota}
              className="shrink-0 px-3 py-1.5 rounded bg-amber-900/60 hover:bg-amber-800/80 text-amber-100 border border-amber-600/60 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center"
              title="Reset quota for testing"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Limit (Testing)</span>
            </button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-[#1e2536] bg-[#11141d] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle top indicator line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

        {/* Section Label & Quota Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <label
            htmlFor="target-domain-input"
            className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            TARGET SPECIFICATION
          </label>

          <div className="flex items-center gap-2">
            {quota && (
              <div
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  isBlocked
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                    : quota.remaining <= 3
                    ? 'bg-amber-950/30 text-amber-400 border-amber-800/40'
                    : 'bg-[#141b27] text-cyan-300 border-cyan-800/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBlocked ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                />
                <span>
                  Quota: <strong>{quota.remaining}</strong>/{quota.limit} remaining
                </span>
                <span className="text-slate-500">• 1h window</span>
              </div>
            )}
          </div>
        </div>

        {/* Form Input Group */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-1.5 rounded-lg border transition-all duration-200 bg-[#0c0f16] ${
              validationError
                ? 'border-rose-500/70 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                : isFocused
                ? 'border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                : 'border-[#22293b] hover:border-[#2f3950]'
            }`}
          >
            <div className="flex items-center gap-2.5 px-3 flex-1 min-w-0">
              <Globe className="w-4 h-4 text-cyan-400/80 shrink-0" />
              <input
                id="target-domain-input"
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isScanning || isBlocked}
                placeholder={
                  isBlocked
                    ? 'Target analysis paused due to rate limit quota'
                    : 'https://example.com or example.com'
                }
                autoComplete="off"
                spellCheck="false"
                className="w-full bg-transparent text-sm sm:text-base font-mono text-slate-100 placeholder-slate-600 focus:outline-none disabled:opacity-50 tracking-wide py-2"
              />
              {inputValue && !isScanning && (
                <button
                  type="button"
                  id="btn-clear-target-input"
                  onClick={() => {
                    setInputValue('');
                    setValidationError(null);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-[#191f2c] transition-colors"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action Button */}
            <div className="shrink-0 flex items-center gap-2">
              {isScanning ? (
                <button
                  type="button"
                  id="btn-cancel-scan"
                  onClick={onCancelScan}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/40 text-xs font-mono font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  ABORT SCAN
                </button>
              ) : (
                <button
                  type="submit"
                  id="btn-analyze-target"
                  disabled={!inputValue.trim() || isBlocked}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:bg-[#1a2130] disabled:text-slate-600 disabled:border-transparent text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:cursor-not-allowed"
                >
                  <span>{isBlocked ? 'RATE LIMITED' : 'ANALYZE TARGET'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* Validation Feedback */}
          {validationError && (
            <div
              id="target-validation-error"
              className="p-2.5 rounded-md bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-start gap-2 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold uppercase tracking-wider">Validation Error:</span>{' '}
                {validationError}
              </div>
            </div>
          )}

          {/* Presets & Help bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 border-t border-[#191f2c]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold mr-1">
                SAMPLE TARGETS:
              </span>
              {PRESET_TARGETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  id={`preset-${preset.label.replace(/\./g, '-')}`}
                  onClick={() => handleSelectPreset(preset.label)}
                  disabled={isScanning || isBlocked}
                  title={preset.desc}
                  className="px-2 py-0.5 rounded text-[11px] bg-[#141823] text-slate-300 border border-[#212839] hover:border-cyan-700/50 hover:text-cyan-300 transition-colors disabled:opacity-40"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span>DEFENSIVE RATE LIMIT ENFORCED</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
