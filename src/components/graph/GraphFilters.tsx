import React from 'react';
import { Server, Shield, Cpu, Lock, Check } from 'lucide-react';
import { GraphNodeCategory } from '../../types';

export interface CategoryFilterState {
  infrastructure: boolean; // IP_ADDRESS
  dns: boolean; // NAMESERVER, MAIL_SERVER, CNAME
  technologies: boolean; // TECHNOLOGY
  security: boolean; // SECURITY_OBSERVATION
}

interface GraphFiltersProps {
  filters: CategoryFilterState;
  onToggleFilter: (category: keyof CategoryFilterState) => void;
  counts: {
    infrastructure: number;
    dns: number;
    technologies: number;
    security: number;
  };
}

export const GraphFilters: React.FC<GraphFiltersProps> = ({
  filters,
  onToggleFilter,
  counts,
}) => {
  const filterConfig: Array<{
    key: keyof CategoryFilterState;
    label: string;
    icon: React.ElementType;
    colorActive: string;
    colorBorder: string;
    count: number;
  }> = [
    {
      key: 'infrastructure',
      label: 'Infrastructure',
      icon: Server,
      colorActive: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
      colorBorder: 'hover:border-indigo-500/40',
      count: counts.infrastructure,
    },
    {
      key: 'dns',
      label: 'DNS & Mail',
      icon: Shield,
      colorActive: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
      colorBorder: 'hover:border-purple-500/40',
      count: counts.dns,
    },
    {
      key: 'technologies',
      label: 'Technologies',
      icon: Cpu,
      colorActive: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
      colorBorder: 'hover:border-emerald-500/40',
      count: counts.technologies,
    },
    {
      key: 'security',
      label: 'Security',
      icon: Lock,
      colorActive: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
      colorBorder: 'hover:border-rose-500/40',
      count: counts.security,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
        Layers:
      </span>
      {filterConfig.map((item) => {
        const Icon = item.icon;
        const isActive = filters[item.key];

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggleFilter(item.key)}
            className={`px-2 py-1 rounded-md text-[10px] font-mono flex items-center gap-1.5 border transition-all duration-150 ${
              isActive
                ? `${item.colorActive} shadow-sm`
                : 'bg-[#0f1420]/80 text-slate-400/60 border-[#1c2436] hover:text-slate-300 ' +
                  item.colorBorder
            }`}
            title={`Toggle ${item.label} nodes in the graph`}
          >
            <div
              className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] ${
                isActive
                  ? 'border-current bg-white/10'
                  : 'border-slate-400/40 bg-transparent'
              }`}
            >
              {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <Icon className="w-3 h-3 shrink-0" />
            <span>{item.label}</span>
            <span
              className={`text-[9px] px-1 rounded-full ${
                isActive
                  ? 'bg-black/40 text-current'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
