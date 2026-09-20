import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Globe,
  Server,
  Cpu,
  Mail,
  GitFork,
  Lock,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { GraphNodeData, GraphNodeCategory, GraphConfidence } from '../../types';

export interface ForensicNodePropsData extends GraphNodeData {
  isSelected?: boolean;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  hasConnectedSelection?: boolean;
}

const categoryStyles: Record<
  GraphNodeCategory,
  {
    icon: React.ElementType;
    border: string;
    borderSelected: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    glow: string;
  }
> = {
  TARGET: {
    icon: Globe,
    border: 'border-cyan-500/80',
    borderSelected: 'border-cyan-300 ring-2 ring-cyan-400/80 shadow-[0_0_24px_rgba(6,182,212,0.4)]',
    bg: 'bg-[#0b1422]',
    badgeBg: 'bg-cyan-950/90 border border-cyan-700/60',
    badgeText: 'text-cyan-300',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]',
  },
  IP_ADDRESS: {
    icon: Server,
    border: 'border-indigo-500/60',
    borderSelected: 'border-indigo-300 ring-2 ring-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.35)]',
    bg: 'bg-[#0d1222]',
    badgeBg: 'bg-indigo-950/80 border border-indigo-700/50',
    badgeText: 'text-indigo-300',
    glow: 'shadow-[0_0_12px_rgba(99,102,241,0.15)]',
  },
  NAMESERVER: {
    icon: Shield,
    border: 'border-purple-500/60',
    borderSelected: 'border-purple-300 ring-2 ring-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.35)]',
    bg: 'bg-[#120d1e]',
    badgeBg: 'bg-purple-950/80 border border-purple-700/50',
    badgeText: 'text-purple-300',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.15)]',
  },
  MAIL_SERVER: {
    icon: Mail,
    border: 'border-amber-500/60',
    borderSelected: 'border-amber-300 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    bg: 'bg-[#171109]',
    badgeBg: 'bg-amber-950/80 border border-amber-700/50',
    badgeText: 'text-amber-300',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
  },
  CNAME: {
    icon: GitFork,
    border: 'border-sky-500/60',
    borderSelected: 'border-sky-300 ring-2 ring-sky-400/80 shadow-[0_0_20px_rgba(14,165,233,0.35)]',
    bg: 'bg-[#09151e]',
    badgeBg: 'bg-sky-950/80 border border-sky-700/50',
    badgeText: 'text-sky-300',
    glow: 'shadow-[0_0_12px_rgba(14,165,233,0.15)]',
  },
  TECHNOLOGY: {
    icon: Cpu,
    border: 'border-emerald-500/60',
    borderSelected: 'border-emerald-300 ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    bg: 'bg-[#091712]',
    badgeBg: 'bg-emerald-950/80 border border-emerald-700/50',
    badgeText: 'text-emerald-300',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
  },
  SECURITY_OBSERVATION: {
    icon: Lock,
    border: 'border-rose-500/60',
    borderSelected: 'border-rose-300 ring-2 ring-rose-400/80 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
    bg: 'bg-[#180b12]',
    badgeBg: 'bg-rose-950/80 border border-rose-700/50',
    badgeText: 'text-rose-300',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.15)]',
  },
};

const confidenceStyles: Record<GraphConfidence, { badge: string; dot: string }> = {
  VERIFIED: {
    badge: 'text-emerald-400 bg-emerald-950/70 border border-emerald-800/40',
    dot: 'bg-emerald-400',
  },
  HIGH: {
    badge: 'text-cyan-400 bg-cyan-950/70 border border-cyan-800/40',
    dot: 'bg-cyan-400',
  },
  MEDIUM: {
    badge: 'text-amber-400 bg-amber-950/70 border border-amber-800/40',
    dot: 'bg-amber-400',
  },
  LOW: {
    badge: 'text-slate-400 bg-slate-900 border border-slate-700/50',
    dot: 'bg-slate-400',
  },
};

export const ForensicNode = memo(({ data }: NodeProps<any>) => {
  const nodeData = data as ForensicNodePropsData;
  const {
    label,
    sublabel,
    category,
    categoryLabel,
    confidence,
    isSelected,
    isDimmed,
    isHighlighted,
    isTarget,
  } = nodeData;

  const style = categoryStyles[category] || categoryStyles.TECHNOLOGY;
  const Icon = style.icon;
  const confStyle = confidence ? confidenceStyles[confidence] : null;

  return (
    <div
      className={`relative group rounded-xl border transition-all duration-200 select-none ${
        style.bg
      } ${
        isSelected || isHighlighted
          ? style.borderSelected
          : `${style.border} ${style.glow}`
      } ${
        isDimmed
          ? 'opacity-35 scale-[0.98]'
          : 'opacity-100 hover:scale-[1.02] hover:border-slate-300'
      } ${isTarget ? 'min-w-[210px] sm:min-w-[240px]' : 'min-w-[175px] sm:min-w-[195px] max-w-[240px]'}`}
      style={{
        boxShadow: isSelected
          ? '0 0 25px rgba(6, 182, 212, 0.35)'
          : undefined,
      }}
    >
      {/* Invisible ReactFlow connection handles for smooth Bezier edges */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-cyan-500 !w-2 !h-2 !border-0 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-cyan-500 !w-2 !h-2 !border-0 !opacity-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-cyan-500 !w-2 !h-2 !border-0 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-cyan-500 !w-2 !h-2 !border-0 !opacity-0"
      />

      <div className="p-3">
        {/* Header row with category pill and confidence indicator */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}
          >
            <Icon className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate max-w-[110px]">{categoryLabel}</span>
          </div>

          {confStyle && (
            <div
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-mono tracking-wider ${confStyle.badge}`}
              title={`Confidence: ${confidence}`}
            >
              <span className={`w-1 h-1 rounded-full ${confStyle.dot}`} />
              <span>{confidence}</span>
            </div>
          )}
        </div>

        {/* Main Entity Label */}
        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono font-bold tracking-tight text-slate-100 truncate ${
              isTarget ? 'text-xs sm:text-sm text-cyan-200' : 'text-xs'
            }`}
            title={label}
          >
            {label}
          </span>
        </div>

        {/* Secondary Details Sublabel */}
        {sublabel && (
          <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={sublabel}>
            {sublabel}
          </div>
        )}

        {/* Target indicator ring marker */}
        {isTarget && (
          <div className="mt-2 pt-1.5 border-t border-cyan-900/40 flex items-center justify-between text-[9px] font-mono text-cyan-400">
            <span>PIVOT ROOT</span>
            <span className="animate-pulse">● LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
});

ForensicNode.displayName = 'ForensicNode';
