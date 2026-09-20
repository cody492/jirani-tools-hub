import React from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Server,
  Globe,
  Mail,
  GitFork,
  Lock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { GraphNodeData, GraphEdgeData, GraphNodeCategory } from '../../types';

interface NodeDetailsPanelProps {
  node: GraphNodeData;
  connectedEdges: GraphEdgeData[];
  allNodes: GraphNodeData[];
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onNavigateToModule?: (targetModuleId: string) => void;
}

const categoryIcons: Record<GraphNodeCategory, React.ElementType> = {
  TARGET: Globe,
  IP_ADDRESS: Server,
  NAMESERVER: ShieldCheck,
  MAIL_SERVER: Mail,
  CNAME: GitFork,
  TECHNOLOGY: Cpu,
  SECURITY_OBSERVATION: Lock,
};

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  connectedEdges,
  allNodes,
  onClose,
  onSelectNode,
  onSelectEdge,
  onNavigateToModule,
}) => {
  const Icon = categoryIcons[node.category] || Cpu;

  const nodeMap = new Map<string, GraphNodeData>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));

  const handleJumpToFinding = () => {
    if (node.targetNavModule && onNavigateToModule) {
      onNavigateToModule(node.targetNavModule);
    } else if (node.targetNavModule) {
      const targetId = node.targetNavModule;
      let el = document.getElementById(targetId);
      if (!el && (targetId === 'module-technologies' || targetId === 'module-technology')) {
        el = document.getElementById('module-technology') || document.getElementById('module-technologies');
      }
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('ring-2', 'ring-cyan-400');
        setTimeout(() => el?.classList.remove('ring-2', 'ring-cyan-400'), 1800);
      }
    }
  };

  return (
    <div className="absolute top-3 right-3 z-30 w-80 sm:w-96 max-h-[calc(100%-24px)] overflow-y-auto bg-[#0b0f19]/95 backdrop-blur-md border border-[#202b40] rounded-xl shadow-2xl p-4 text-xs font-mono space-y-4">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#1b2436]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/50 text-cyan-300">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              {node.categoryLabel}
            </div>
            <div className="font-bold text-sm text-slate-100 truncate max-w-[210px]" title={node.label}>
              {node.label}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-[#161f30] text-slate-400 hover:text-slate-100 transition-colors"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meta chips row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-2 py-0.5 rounded bg-[#111726] border border-[#1e2942] text-[10px] text-slate-300">
          Source: <strong className="text-cyan-300">{node.sourceModule}</strong>
        </div>

        {node.confidence && (
          <div className="px-2 py-0.5 rounded bg-[#111726] border border-[#1e2942] text-[10px] text-slate-300">
            Confidence: <strong className="text-emerald-300">{node.confidence}</strong>
          </div>
        )}

        {typeof node.evidenceCount === 'number' && (
          <div className="px-2 py-0.5 rounded bg-[#111726] border border-[#1e2942] text-[10px] text-slate-300">
            Evidence: <strong className="text-amber-300">{node.evidenceCount} observation(s)</strong>
          </div>
        )}
      </div>

      {/* Sublabel / description if present */}
      {node.sublabel && (
        <div className="p-2.5 rounded-lg bg-[#0e1422] border border-[#1a2336] text-[11px] text-slate-300 leading-relaxed">
          {node.sublabel}
        </div>
      )}

      {/* Connected Relationships in Graph */}
      <div className="space-y-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>CONNECTED RELATIONSHIPS ({connectedEdges.length})</span>
          <span className="text-cyan-400 text-[9px]">CLICK TO INSPECT</span>
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {connectedEdges.map((edge) => {
            const isOutgoing = edge.source === node.id;
            const otherNodeId = isOutgoing ? edge.target : edge.source;
            const otherNode = nodeMap.get(otherNodeId);

            return (
              <div
                key={edge.id}
                className="p-2 rounded bg-[#0f1422] hover:bg-[#161e30] border border-[#1b2438] hover:border-cyan-700/50 transition-all flex items-center justify-between gap-2 group"
              >
                <button
                  type="button"
                  onClick={() => onSelectEdge(edge.id)}
                  className="text-left flex-1 min-w-0"
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    {isOutgoing ? (
                      <ArrowRight className="w-3 h-3 shrink-0 text-cyan-400" />
                    ) : (
                      <ArrowLeft className="w-3 h-3 shrink-0 text-indigo-400" />
                    )}
                    <span>{edge.relationshipLabel}</span>
                  </div>
                  <div className="text-xs text-slate-200 truncate mt-0.5">
                    {otherNode ? otherNode.label : otherNodeId}
                  </div>
                </button>

                {otherNode && (
                  <button
                    type="button"
                    onClick={() => onSelectNode(otherNode.id)}
                    className="p-1 rounded bg-[#090d16] hover:bg-cyan-950/80 text-slate-400 hover:text-cyan-300 border border-[#1f2a40] shrink-0"
                    title={`Jump focus to ${otherNode.label}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Forensic Evidence Snippets */}
      {node.evidenceSnippets && node.evidenceSnippets.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            EVIDENCE & OBSERVATIONS
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {node.evidenceSnippets.map((snippet, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-[#0e1320] border border-[#182133] text-[10px] text-slate-300 font-mono break-all"
              >
                {snippet}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metadata Table */}
      {node.metadata && Object.keys(node.metadata).length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            RAW ENTITY METADATA
          </div>
          <div className="rounded-lg bg-[#0e1320] border border-[#1a2336] p-2 space-y-1 text-[10px]">
            {Object.entries(node.metadata).map(([k, v]) => {
              if (v === undefined || v === null || typeof v === 'object') return null;
              return (
                <div key={k} className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="text-slate-200 font-mono truncate max-w-[170px]" title={String(v)}>
                    {String(v)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Source Finding Button */}
      <div className="pt-2 border-t border-[#1b2436]">
        <button
          type="button"
          onClick={handleJumpToFinding}
          className="w-full py-2 px-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 hover:border-cyan-500 text-cyan-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Source Finding in {node.sourceModule}</span>
        </button>
      </div>
    </div>
  );
};
