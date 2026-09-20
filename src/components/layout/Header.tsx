import React from 'react';
import { ShieldCheck, Activity, Terminal, RotateCcw, HelpCircle, LogOut, User as UserIcon, Lock, KeyRound } from 'lucide-react';
import { AppState } from '../../types';
import { FirebaseUser } from '../../services/firebase';
import { AdminPanelIcon } from '../icons/AdminPanelIcon';

interface HeaderProps {
  appState: AppState;
  currentUser?: FirebaseUser | null;
  isOwnerUser?: boolean;
  isAdminVerified?: boolean;
  onOpenAdminVerify?: () => void;
  onReset: () => void;
  onToggleGuide: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appState,
  currentUser,
  isOwnerUser = false,
  isAdminVerified = false,
  onOpenAdminVerify,
  onReset,
  onToggleGuide,
  onSignOut,
}) => {
  const getSystemStateDisplay = () => {
    switch (appState) {
      case 'idle':
        return {
          text: 'SYSTEM READY',
          subtext: 'STANDBY',
          dotClass: 'bg-emerald-400',
          ping: false,
          color: 'text-emerald-400',
        };
      case 'validating':
        return {
          text: 'VALIDATING TARGET',
          subtext: 'SYNTAX CHECK',
          dotClass: 'bg-cyan-400',
          ping: true,
          color: 'text-cyan-400',
        };
      case 'scanning':
        return {
          text: 'ANALYSIS IN PROGRESS',
          subtext: 'PIPELINE ACTIVE',
          dotClass: 'bg-amber-400',
          ping: true,
          color: 'text-amber-400',
        };
      case 'complete':
        return {
          text: 'ANALYSIS COMPLETE',
          subtext: 'RESULTS RENDERED',
          dotClass: 'bg-emerald-400',
          ping: false,
          color: 'text-emerald-400',
        };
      case 'error':
        return {
          text: 'VALIDATION HALTED',
          subtext: 'INPUT ERROR',
          dotClass: 'bg-rose-400',
          ping: false,
          color: 'text-rose-400',
        };
    }
  };

  const state = getSystemStateDisplay();

  return (
    <header className="border-b border-[#1b212f] bg-[#0d1017] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded border border-[#222a3d] bg-[#131826] flex items-center justify-center text-cyan-400 shadow-inner">
            <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-widest text-slate-100 uppercase font-mono">
                WEB FORENSICS
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Public Web Analysis Platform
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-[10px] font-mono text-slate-400">DEFENSIVE OSINT ARCHITECTURE</span>
            </div>
          </div>
        </div>

        {/* System State & Quick Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded border border-[#1d2435] bg-[#111520]">
            <span className="relative flex h-2 w-2">
              {state.ping && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${state.dotClass}`}
                />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${state.dotClass}`} />
            </span>
            <div className="text-left font-mono leading-none">
              <div className={`text-[11px] font-semibold tracking-wider ${state.color}`}>
                {state.text}
              </div>
              <div className="text-[9px] text-slate-400 tracking-wider uppercase mt-0.5">
                {state.subtext}
              </div>
            </div>
          </div>

          {/* User Account / Sign Out Pill */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isOwnerUser && (
                <button
                  type="button"
                  id="btn-admin-clearance-header"
                  onClick={onOpenAdminVerify}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-bold tracking-wider transition-colors border ${
                    isAdminVerified
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60 hover:bg-cyan-900/60'
                      : 'bg-amber-950/70 text-amber-300 border-amber-700/60 hover:bg-amber-900/60 animate-pulse'
                  }`}
                  title={
                    isAdminVerified
                      ? 'Admin 2-Step Clearance Active (Click to review)'
                      : 'Secondary Admin UID verification required'
                  }
                >
                  <AdminPanelIcon size={14} className={isAdminVerified ? 'text-cyan-400' : 'text-amber-400'} />
                  <span className="hidden sm:inline text-[11px]">
                    {isAdminVerified ? 'ADMIN ROOT' : 'VERIFY UID'}
                  </span>
                </button>
              )}

              <div className="flex items-center gap-2 px-2.5 py-1 rounded border border-[#1e263a] bg-[#111624]">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover border border-cyan-800/50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#182133] text-cyan-400 flex items-center justify-center text-[10px] font-mono">
                    <UserIcon className="w-3 h-3" />
                  </div>
                )}
                <span className="hidden md:inline text-xs font-mono text-slate-300 max-w-[140px] truncate" title={currentUser.email || ''}>
                  {currentUser.displayName || currentUser.email}
                </span>
                {onSignOut && (
                  <button
                    type="button"
                    id="btn-header-signout"
                    onClick={onSignOut}
                    title="Sign Out of Firebase Session"
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Guide Trigger */}
          <button
            id="btn-platform-guide"
            onClick={onToggleGuide}
            type="button"
            className="p-2 rounded border border-[#1e2536] bg-[#121622] text-slate-400 hover:text-slate-200 hover:border-[#2e374f] transition-colors"
            title="Forensic Methodology & Architecture Roadmap"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset Workspace */}
          {appState !== 'idle' && (
            <button
              id="btn-header-reset"
              onClick={onReset}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#222a3c] bg-[#131826] text-xs font-mono text-slate-300 hover:text-white hover:border-[#323d57] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">RESET TARGET</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
