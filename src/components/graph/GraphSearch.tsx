import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Globe, Server, Cpu, Mail, GitFork, Lock, Shield } from 'lucide-react';
import { GraphNodeData, GraphNodeCategory } from '../../types';

interface GraphSearchProps {
  nodes: GraphNodeData[];
  onSelectNode: (nodeId: string) => void;
}

const categoryIcons: Record<GraphNodeCategory, React.ElementType> = {
  TARGET: Globe,
  IP_ADDRESS: Server,
  NAMESERVER: Shield,
  MAIL_SERVER: Mail,
  CNAME: GitFork,
  TECHNOLOGY: Cpu,
  SECURITY_OBSERVATION: Lock,
};

export const GraphSearch: React.FC<GraphSearchProps> = ({ nodes, onSelectNode }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredNodes = query.trim()
    ? nodes.filter((n) => {
        const q = query.toLowerCase();
        return (
          n.label.toLowerCase().includes(q) ||
          (n.sublabel && n.sublabel.toLowerCase().includes(q)) ||
          n.categoryLabel.toLowerCase().includes(q) ||
          (n.metadata && JSON.stringify(n.metadata).toLowerCase().includes(q))
        );
      })
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-48 sm:w-64">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search graph entities..."
          className="w-full bg-[#0d121c]/90 border border-[#1e273b] focus:border-cyan-500 rounded-lg pl-8 pr-7 py-1 text-xs font-mono text-slate-200 placeholder:text-slate-400 focus:outline-none transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Matching Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-[#0e1422] border border-[#232f48] rounded-lg shadow-2xl z-50 p-1 divide-y divide-[#172033]">
          {filteredNodes.length > 0 ? (
            filteredNodes.slice(0, 10).map((n) => {
              const Icon = categoryIcons[n.category] || Cpu;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleSelect(n.id)}
                  className="w-full p-2 rounded text-left hover:bg-[#162035] flex items-center gap-2 transition-colors group"
                >
                  <div className="p-1 rounded bg-[#090d16] text-cyan-400 border border-[#1b263b] shrink-0">
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                      {n.label}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {n.categoryLabel} {n.sublabel ? `· ${n.sublabel}` : ''}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs font-mono text-slate-400">
              No matching entity in graph
            </div>
          )}
        </div>
      )}
    </div>
  );
};
