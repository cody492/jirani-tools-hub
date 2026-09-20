import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'standby'
  | 'cyan'
  | 'purple'
  | 'emerald'
  | 'error'
  | 'danger'
  | 'red';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  pulse = false,
  size = 'sm',
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
    neutral: {
      bg: 'bg-[#161a22]',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
      border: 'border-slate-800',
    },
    success: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      border: 'border-emerald-800/50',
    },
    emerald: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      border: 'border-emerald-800/50',
    },
    warning: {
      bg: 'bg-amber-950/40',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      border: 'border-amber-800/50',
    },
    standby: {
      bg: 'bg-[#141824]',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
      border: 'border-[#232938]',
    },
    cyan: {
      bg: 'bg-cyan-950/30',
      text: 'text-cyan-400',
      dot: 'bg-cyan-400',
      border: 'border-cyan-800/50',
    },
    purple: {
      bg: 'bg-slate-900',
      text: 'text-indigo-300',
      dot: 'bg-indigo-400',
      border: 'border-indigo-900/50',
    },
    error: {
      bg: 'bg-rose-950/40',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      border: 'border-rose-800/50',
    },
    danger: {
      bg: 'bg-rose-950/40',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      border: 'border-rose-800/50',
    },
    red: {
      bg: 'bg-red-950/50',
      text: 'text-red-400',
      dot: 'bg-red-400',
      border: 'border-red-800/50',
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;
  const sizeClasses = size === 'sm' ? 'text-[11px] py-0.5 px-2' : 'text-xs py-1 px-2.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded border ${style.bg} ${style.text} ${style.border} ${sizeClasses} whitespace-nowrap font-medium select-none`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`} />
      </span>
      {label}
    </span>
  );
};
