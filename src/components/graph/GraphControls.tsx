import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Map,
  Crosshair,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

interface GraphControlsProps {
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onResetLayout: () => void;
  targetNodeId?: string;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  showMinimap,
  onToggleMinimap,
  onResetLayout,
  targetNodeId,
}) => {
  const { zoomIn, zoomOut, fitView, setCenter, getNode } = useReactFlow();

  const handleCenterTarget = () => {
    if (targetNodeId) {
      const node = getNode(targetNodeId);
      if (node) {
        setCenter(node.position.x + 100, node.position.y + 40, {
          zoom: 1.1,
          duration: 600,
        });
        return;
      }
    }
    fitView({ padding: 0.2, duration: 600 });
  };

  return (
    <div className="flex items-center gap-1 bg-[#0d121c]/90 backdrop-blur-md border border-[#1e273b] p-1 rounded-lg shadow-xl">
      <button
        type="button"
        id="btn-graph-zoom-in"
        onClick={() => zoomIn({ duration: 300 })}
        className="p-1.5 rounded hover:bg-[#192233] text-slate-400 hover:text-slate-100 transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        id="btn-graph-zoom-out"
        onClick={() => zoomOut({ duration: 300 })}
        className="p-1.5 rounded hover:bg-[#192233] text-slate-400 hover:text-slate-100 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        id="btn-graph-fit-view"
        onClick={() => fitView({ padding: 0.2, duration: 450 })}
        className="p-1.5 rounded hover:bg-[#192233] text-slate-400 hover:text-slate-100 transition-colors"
        title="Fit All Nodes into View"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        id="btn-graph-center-target"
        onClick={handleCenterTarget}
        className="p-1.5 rounded hover:bg-[#192233] text-slate-400 hover:text-cyan-300 transition-colors"
        title="Center on Target Node"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-[#1f293d] mx-0.5" />

      <button
        type="button"
        id="btn-graph-toggle-minimap"
        onClick={onToggleMinimap}
        className={`p-1.5 rounded transition-colors ${
          showMinimap
            ? 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-300'
            : 'hover:bg-[#192233] text-slate-400 hover:text-slate-100'
        }`}
        title="Toggle Minimap Radar"
      >
        <Map className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        id="btn-graph-reset-layout"
        onClick={onResetLayout}
        className="p-1.5 rounded hover:bg-[#192233] text-slate-400 hover:text-amber-300 transition-colors"
        title="Reset Node Positions to Default Architecture"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
