import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import { GraphEdgeData } from '../../types';

export interface ForensicEdgePropsData extends GraphEdgeData {
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

export const ForensicEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
  } = props;

  const edgeData = data as unknown as ForensicEdgePropsData | undefined;
  const isSelected = edgeData?.isSelected;
  const isHighlighted = edgeData?.isHighlighted;
  const isDimmed = edgeData?.isDimmed;
  const relationshipLabel = edgeData?.relationshipLabel || 'CONNECTED';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  // Calculate stroke color & width based on state
  let strokeColor = '#253046';
  let strokeWidth = 1.5;
  let opacity = 0.8;

  if (isSelected || isHighlighted) {
    strokeColor = '#06b6d4'; // Cyan glow
    strokeWidth = 2.5;
    opacity = 1;
  } else if (isDimmed) {
    strokeColor = '#171f2e';
    strokeWidth = 1;
    opacity = 0.25;
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          opacity,
          transition: 'all 0.2s ease',
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase border transition-all duration-150 cursor-pointer ${
              isSelected || isHighlighted
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.4)] scale-105'
                : isDimmed
                ? 'bg-[#0a0d14]/70 border-[#1c2436]/50 text-slate-400/40 opacity-40'
                : 'bg-[#0f1420]/90 border-[#1f293d] text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
            title={`Relationship: ${relationshipLabel} (Click to inspect evidence)`}
          >
            {relationshipLabel}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

ForensicEdge.displayName = 'ForensicEdge';
