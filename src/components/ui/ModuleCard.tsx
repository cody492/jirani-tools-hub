import React from 'react';
import { LucideIcon, Info } from 'lucide-react';
import { StatusBadge, BadgeVariant } from './StatusBadge';

interface ModuleCardProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  versionBadge?: string;
  statusBadge?: {
    label: string;
    variant: BadgeVariant;
  };
  children: React.ReactNode;
  className?: string;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  id,
  title,
  subtitle,
  icon: Icon,
  versionBadge,
  statusBadge,
  children,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`rounded-lg border border-[#1e2433] bg-[#10131a] overflow-hidden flex flex-col transition-colors duration-150 hover:border-[#2b3347] ${className}`}
    >
      {/* Module Header */}
      <div className="px-4 py-3 border-b border-[#1b212e] bg-[#121622] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded bg-[#181d2c] border border-[#252c3e] text-cyan-400 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-200 truncate">
                {title}
              </h3>
              {versionBadge && (
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#181e2b] text-slate-400 border border-[#252e42]">
                  {versionBadge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {statusBadge && (
          <div className="shrink-0">
            <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
          </div>
        )}
      </div>

      {/* Module Body */}
      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </div>
  );
};

export const ModulePlaceholderNotice: React.FC<{
  moduleTarget: string;
  description: string;
}> = ({ moduleTarget, description }) => {
  return (
    <div className="mt-3 p-2.5 rounded bg-[#0d1017] border border-[#1b202c] flex items-start gap-2 text-[11px] text-slate-400 font-mono">
      <Info className="w-3.5 h-3.5 text-cyan-500/80 shrink-0 mt-0.5" />
      <div>
        <span className="text-cyan-400 font-semibold">{moduleTarget}</span> — {description}
      </div>
    </div>
  );
};
