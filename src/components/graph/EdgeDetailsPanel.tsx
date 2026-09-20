import React from 'react';
import { X, ArrowRight, ShieldCheck, Link2, ExternalLink, Info } from 'lucide-react';
import { GraphEdgeData, GraphNodeData } from '../../types';

interface EdgeDetailsPanelProps {
  edge: GraphEdgeData;
  allNodes: GraphNodeData[];
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const EdgeDetailsPanel: React.FC<EdgeDetailsPanelProps> = ({
  edge,
  allNodes,
  onClose,
  onSelectNode,
}) => {
  const nodeMap = new Map<string, GraphNodeData>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));

  const sourceNode = nodeMap.get(edge.source);
  const targetNode = nodeMap.get(edge.target);

  return (
    <div className="absolute top-3 right-3 z-30 w-80 sm:w-96 max-h-[calc(100%-24px)] overflow-y-auto bg-[#0b0f19]/95 backdrop-blur-md border border-[#202b40] rounded-xl shadow-2xl p-4 text-xs font-mono space-y-4">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#1b2436]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-800/50 text-cyan-300">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              INVESTIGATION RELATIONSHIP
            </div>
            <div className="font-bold text-sm text-cyan-300">
              {edge.relationshipLabel}
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

      {/* Relational Pathway Diagram */}
      <div className="p-3 rounded-lg bg-[#0e1422] border border-[#1a2336] space-y-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">
          CONNECTED ENTITY PATHWAY
        </div>

        <div className="space-y-2">
          {/* Source Node */}
          <button
            type="button"
            onClick={() => sourceNode && onSelectNode(sourceNode.id)}
            className="w-full p-2 rounded bg-[#121826] hover:bg-[#182133] border border-[#1f2a40] text-left transition-colors group"
          >
            <div className="text-[9px] text-slate-400 uppercase">
              Origin: {sourceNode?.categoryLabel || 'Source'}
            </div>
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate mt-0.5">
              {sourceNode?.label || edge.source}
            </div>
          </button>

          {/* Arrow */}
          <div className="flex items-center justify-center gap-2 text-cyan-400">
            <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
            <span className="text-[10px] font-bold tracking-wider uppercase bg-[#141d2e] px-2 py-0.5 rounded border border-[#23314d]">
              {edge.relationshipLabel}
            </span>
            <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
          </div>

          {/* Target Node */}
          <button
            type="button"
            onClick={() => targetNode && onSelectNode(targetNode.id)}
            className="w-full p-2 rounded bg-[#121826] hover:bg-[#182133] border border-[#1f2a40] text-left transition-colors group"
          >
            <div className="text-[9px] text-slate-400 uppercase">
              Destination: {targetNode?.categoryLabel || 'Target'}
            </div>
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate mt-0.5">
              {targetNode?.label || edge.target}
            </div>
          </button>
        </div>
      </div>

      {/* Evidence Section */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>FORENSIC EVIDENCE & CORROBORATION</span>
        </div>
        <div className="p-3 rounded-lg bg-[#0e1320] border border-[#182133] text-[11px] text-slate-300 leading-relaxed font-mono">
          {edge.evidence}
        </div>
      </div>

      {/* Attribution & Confidence */}
      <div className="space-y-2 pt-2 border-t border-[#1b2436]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Authoritative Source:</span>
          <span className="font-bold text-cyan-300">{edge.sourceModule}</span>
        </div>

        {edge.confidence && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Signal Confidence:</span>
            <span className="font-bold text-emerald-400">{edge.confidence}</span>
          </div>
        )}
      </div>
    </div>
  );
};
