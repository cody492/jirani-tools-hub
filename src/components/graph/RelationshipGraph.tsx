import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Node,
  Edge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  TargetMetadata,
  HttpFinding,
  InfrastructureFinding,
  TechnologyReport,
  SecurityReport,
  GraphNodeData,
  GraphEdgeData,
} from '../../types';
import {
  buildRelationshipGraph,
  TransformedGraphResult,
} from '../../services/graphTransformer';
import { ForensicNode } from './ForensicNode';
import { ForensicEdge } from './ForensicEdge';
import { GraphControls } from './GraphControls';
import { GraphFilters, CategoryFilterState } from './GraphFilters';
import { GraphSearch } from './GraphSearch';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { EdgeDetailsPanel } from './EdgeDetailsPanel';
import { GraphSummaryHeader } from './GraphSummaryHeader';
import {
  GitFork,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface RelationshipGraphProps {
  target: TargetMetadata;
  httpFinding?: HttpFinding | null;
  infrastructureFinding?: InfrastructureFinding | null;
  technologyFinding?: TechnologyReport | null;
  securityFinding?: SecurityReport | null;
  onNavigateToModule?: (targetModuleId: string) => void;
}

const nodeTypes = {
  forensicNode: ForensicNode,
};

const edgeTypes = {
  forensicEdge: ForensicEdge,
};

const RelationshipGraphInner: React.FC<RelationshipGraphProps> = ({
  target,
  httpFinding,
  infrastructureFinding,
  technologyFinding,
  securityFinding,
  onNavigateToModule,
}) => {
  const { fitView, setCenter, getNode } = useReactFlow();

  const [filters, setFilters] = useState<CategoryFilterState>({
    infrastructure: true,
    dns: true,
    technologies: true,
    security: true,
  });

  const [showMinimap, setShowMinimap] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [renderEpoch, setRenderEpoch] = useState(0);

  // Transform forensic inputs into relationship graph model
  const graphData = useMemo<TransformedGraphResult | null>(() => {
    try {
      setGraphError(null);
      return buildRelationshipGraph({
        target,
        httpFinding,
        infrastructureFinding,
        technologyFinding,
        securityFinding,
      });
    } catch (err: any) {
      setGraphError(err?.message || 'Failed to construct relationship graph');
      return null;
    }
  }, [
    target,
    httpFinding,
    infrastructureFinding,
    technologyFinding,
    securityFinding,
    renderEpoch,
  ]);

  // Compute category counts for filter badges
  const categoryCounts = useMemo(() => {
    if (!graphData) return { infrastructure: 0, dns: 0, technologies: 0, security: 0 };
    return {
      infrastructure: graphData.nodes.filter((n) => n.category === 'IP_ADDRESS').length,
      dns: graphData.nodes.filter((n) =>
        ['NAMESERVER', 'MAIL_SERVER', 'CNAME'].includes(n.category)
      ).length,
      technologies: graphData.nodes.filter((n) => n.category === 'TECHNOLOGY').length,
      security: graphData.nodes.filter((n) => n.category === 'SECURITY_OBSERVATION').length,
    };
  }, [graphData]);

  // Determine connected neighbors and edges when a node is selected (Section 20)
  const selectionContext = useMemo(() => {
    if (!graphData || !selectedNodeId) {
      return {
        selectedNodeId: null,
        connectedNodeIds: new Set<string>(),
        connectedEdgeIds: new Set<string>(),
      };
    }

    const connectedNodeIds = new Set<string>([selectedNodeId]);
    const connectedEdgeIds = new Set<string>();

    for (const edge of graphData.edges) {
      if (edge.source === selectedNodeId) {
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      } else if (edge.target === selectedNodeId) {
        connectedNodeIds.add(edge.source);
        connectedEdgeIds.add(edge.id);
      }
    }

    return {
      selectedNodeId,
      connectedNodeIds,
      connectedEdgeIds,
    };
  }, [graphData, selectedNodeId]);

  // Convert pure GraphLayoutNode objects to ReactFlow Node array with filtering & highlighting
  const flowNodes = useMemo<Node[]>(() => {
    if (!graphData) return [];

    return graphData.nodes
      .filter((n) => {
        if (n.isTarget) return true;
        if (n.category === 'IP_ADDRESS') return filters.infrastructure;
        if (['NAMESERVER', 'MAIL_SERVER', 'CNAME'].includes(n.category)) return filters.dns;
        if (n.category === 'TECHNOLOGY') return filters.technologies;
        if (n.category === 'SECURITY_OBSERVATION') return filters.security;
        return true;
      })
      .map((n) => {
        const isSelected = selectedNodeId === n.id;
        const isConnectedNeighbor = selectionContext.connectedNodeIds.has(n.id);
        const hasSelection = Boolean(selectedNodeId);

        return {
          id: n.id,
          type: 'forensicNode',
          position: { x: n.x, y: n.y },
          data: {
            ...n,
            isSelected,
            isHighlighted: isConnectedNeighbor && !isSelected,
            isDimmed: hasSelection && !isConnectedNeighbor,
          },
        };
      });
  }, [graphData, filters, selectedNodeId, selectionContext]);

  // Convert GraphEdgeData objects to ReactFlow Edge array with filtering & highlighting
  const flowEdges = useMemo<Edge[]>(() => {
    if (!graphData) return [];

    const visibleNodeIds = new Set(flowNodes.map((n) => n.id));

    return graphData.edges
      .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map((e) => {
        const isSelected = selectedEdgeId === e.id;
        const isConnectedToSelectedNode = selectionContext.connectedEdgeIds.has(e.id);
        const hasSelection = Boolean(selectedNodeId);

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'forensicEdge',
          data: {
            ...e,
            isSelected,
            isHighlighted: isConnectedToSelectedNode,
            isDimmed: hasSelection && !isConnectedToSelectedNode,
          },
        };
      });
  }, [graphData, flowNodes, selectedEdgeId, selectedNodeId, selectionContext]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync internal ReactFlow state with derived nodes and edges
  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  // Initial fit view on graph render
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.25, duration: 600 });
    }, 150);
    return () => clearTimeout(timer);
  }, [fitView, graphData]);

  // Node selection handler
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
    setSelectedEdgeId(null);
  }, []);

  // Edge selection handler
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id));
    setSelectedNodeId(null);
  }, []);

  // Pane background click clears selection
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // Search focus handler
  const handleSelectFromSearch = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);

      const targetNode = getNode(nodeId);
      if (targetNode) {
        setCenter(targetNode.position.x + 100, targetNode.position.y + 40, {
          zoom: 1.25,
          duration: 600,
        });
      }
    },
    [getNode, setCenter]
  );

  // Reset layout to computed arc positions
  const handleResetLayout = useCallback(() => {
    if (!graphData) return;
    setNodes(
      graphData.nodes.map((n) => ({
        id: n.id,
        type: 'forensicNode',
        position: { x: n.x, y: n.y },
        data: {
          ...n,
          isSelected: selectedNodeId === n.id,
          isDimmed: false,
          isHighlighted: false,
        },
      }))
    );
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 500 });
    }, 50);
  }, [graphData, selectedNodeId, setNodes, fitView]);

  // Filter toggle handler
  const handleToggleFilter = useCallback((catKey: keyof CategoryFilterState) => {
    setFilters((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  }, []);

  // Selected Node Data
  const activeSelectedNode = useMemo(() => {
    if (!selectedNodeId || !graphData) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData]);

  // Connected Edges for the active selected node
  const activeConnectedEdges = useMemo(() => {
    if (!selectedNodeId || !graphData) return [];
    return graphData.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [selectedNodeId, graphData]);

  // Selected Edge Data
  const activeSelectedEdge = useMemo(() => {
    if (!selectedEdgeId || !graphData) return null;
    return graphData.edges.find((e) => e.id === selectedEdgeId) || null;
  }, [selectedEdgeId, graphData]);

  // Target Node ID
  const targetNodeId = useMemo(() => {
    return graphData?.nodes.find((n) => n.isTarget)?.id;
  }, [graphData]);

  // Check for empty state
  if (!graphData || graphData.nodes.length <= 1) {
    return (
      <div className="rounded-xl border border-[#1b2333] bg-[#0c1018] p-8 text-center space-y-3">
        <div className="inline-flex p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
          <GitFork className="w-6 h-6" />
        </div>
        <div className="font-mono text-sm font-bold uppercase tracking-wider text-slate-200">
          RELATIONSHIP GRAPH — NO RELATIONSHIPS AVAILABLE
        </div>
        <p className="text-xs font-mono text-slate-400 max-w-md mx-auto leading-relaxed">
          Complete an investigation with infrastructure, DNS, or technology findings to populate the forensic relationship graph.
        </p>
      </div>
    );
  }

  // Check for error state
  if (graphError) {
    return (
      <div className="rounded-xl border border-rose-900/50 bg-[#160b10] p-6 text-center space-y-3 font-mono">
        <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
        <div className="text-sm font-bold text-rose-300">GRAPH GENERATION FAILED</div>
        <p className="text-xs text-slate-300 max-w-md mx-auto">{graphError}</p>
        <button
          type="button"
          onClick={() => setRenderEpoch((e) => e + 1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-700 text-rose-200 text-xs hover:bg-rose-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Graph Generation</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-[#1e2638] bg-[#080b12] shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[800px]' : 'h-[620px]'
      }`}
    >
      {/* Top Toolbar */}
      <div className="p-3 bg-[#0d121c] border-b border-[#1b2333] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-tight text-slate-100">
                  RELATIONSHIP GRAPH
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-bold">
                  ACTIVE V0.6
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 hidden sm:block">
                Interactive entity correlation & cross-domain dependency topology
              </div>
            </div>
          </div>

          <div className="hidden md:block h-5 w-[1px] bg-[#1e273b]" />

          {/* Search bar */}
          <GraphSearch
            nodes={graphData.nodes}
            onSelectNode={handleSelectFromSearch}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filters */}
          <GraphFilters
            filters={filters}
            onToggleFilter={handleToggleFilter}
            counts={categoryCounts}
          />

          {/* Fullscreen / Height Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-[#121826] hover:bg-[#182133] border border-[#202c42] text-slate-400 hover:text-slate-200 transition-colors"
            title={isExpanded ? 'Collapse Graph Height' : 'Expand Graph Height'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <GraphSummaryHeader summary={graphData.summary} isBuilding={isBuilding} />

      {/* ReactFlow Interactive Canvas Area */}
      <div className="flex-1 relative w-full h-full bg-[#080b12]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.25}
          maxZoom={2.5}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          className="web-forensics-flow"
        >
          {/* Subtle tactical dark grid background */}
          <Background color="#161e2e" gap={24} size={1.2} />

          {/* Floating Navigation & View Controls in bottom-left */}
          <div className="absolute bottom-4 left-4 z-20">
            <GraphControls
              showMinimap={showMinimap}
              onToggleMinimap={() => setShowMinimap(!showMinimap)}
              onResetLayout={handleResetLayout}
              targetNodeId={targetNodeId}
            />
          </div>

          {/* Optional Minimap Radar in bottom-right */}
          {showMinimap && (
            <div className="absolute bottom-4 right-4 z-20 hidden sm:block">
              <div className="rounded-lg border border-[#1e273b] bg-[#0c111a]/90 backdrop-blur-md overflow-hidden shadow-2xl p-1">
                <div className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 uppercase tracking-wider border-b border-[#1b2333] mb-1">
                  RADAR TOPOLOGY
                </div>
                <MiniMap
                  nodeColor={(n) => {
                    const data = n.data as unknown as GraphNodeData | undefined;
                    if (data?.isTarget) return '#06b6d4';
                    if (data?.category === 'IP_ADDRESS') return '#6366f1';
                    if (data?.category === 'NAMESERVER') return '#a855f7';
                    if (data?.category === 'MAIL_SERVER') return '#f59e0b';
                    if (data?.category === 'CNAME') return '#0ea5e9';
                    if (data?.category === 'TECHNOLOGY') return '#10b981';
                    if (data?.category === 'SECURITY_OBSERVATION') return '#f43f5e';
                    return '#64748b';
                  }}
                  nodeStrokeColor="transparent"
                  maskColor="rgba(8, 11, 18, 0.75)"
                  style={{
                    backgroundColor: '#090d15',
                    width: 150,
                    height: 95,
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>
          )}
        </ReactFlow>

        {/* Selected Node Details Inspector Panel */}
        {activeSelectedNode && (
          <NodeDetailsPanel
            node={activeSelectedNode}
            connectedEdges={activeConnectedEdges}
            allNodes={graphData.nodes}
            onClose={() => setSelectedNodeId(null)}
            onSelectNode={(nodeId) => {
              setSelectedNodeId(nodeId);
              setSelectedEdgeId(null);
            }}
            onSelectEdge={(edgeId) => {
              setSelectedEdgeId(edgeId);
              setSelectedNodeId(null);
            }}
            onNavigateToModule={onNavigateToModule}
          />
        )}

        {/* Selected Edge Details Inspector Panel */}
        {activeSelectedEdge && (
          <EdgeDetailsPanel
            edge={activeSelectedEdge}
            allNodes={graphData.nodes}
            onClose={() => setSelectedEdgeId(null)}
            onSelectNode={(nodeId) => {
              setSelectedNodeId(nodeId);
              setSelectedEdgeId(null);
            }}
          />
        )}

        {/* Tactical Legend Hint in bottom center */}
        {!activeSelectedNode && !activeSelectedEdge && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#0d121c]/80 backdrop-blur-md border border-[#1a2333] text-[10px] font-mono text-slate-400 pointer-events-none">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Target
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> IP
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> DNS
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Technology
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Security
            </span>
            <span className="text-slate-400">· Click any node or relationship to inspect</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const RelationshipGraph: React.FC<RelationshipGraphProps> = (props) => {
  return (
    <ReactFlowProvider>
      <RelationshipGraphInner {...props} />
    </ReactFlowProvider>
  );
};
