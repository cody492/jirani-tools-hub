import React, { useState } from 'react';
import { GitFork, ArrowRight, Layers, Globe, Server, Cpu, CloudCog, ShieldAlert, Sparkles } from 'lucide-react';
import { ModuleCard, ModulePlaceholderNotice } from '../ui/ModuleCard';

export const RelationshipBlueprintModule: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<number | null>(0);

  const nodes = [
    {
      id: 0,
      label: 'TARGET DOMAIN',
      sub: 'Canonical Root',
      icon: Globe,
      color: 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300',
      description: 'The root investigative pivot. Maps subdomains, wildcards, CNAME records, and redirects.',
    },
    {
      id: 1,
      label: 'INFRASTRUCTURE',
      sub: 'ASN / IP / Edge',
      icon: Server,
      color: 'border-indigo-500/60 bg-indigo-950/30 text-indigo-300',
      description: 'Physical and virtual hosting nodes, BGP autonomous systems, shared server neighbors, and CDN edges.',
    },
    {
      id: 2,
      label: 'TECHNOLOGIES',
      sub: 'Frameworks / CMS',
      icon: Cpu,
      color: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300',
      description: 'Software stack dependencies, CMS instances, server daemons, and client JavaScript libraries.',
    },
    {
      id: 3,
      label: 'SERVICES',
      sub: 'APIs / CDNs / Mail',
      icon: CloudCog,
      color: 'border-amber-500/60 bg-amber-950/30 text-amber-300',
      description: 'Third-party API integrations, external mail relays (MX), analytics beacons, and cloud SaaS hooks.',
    },
    {
      id: 4,
      label: 'PUBLIC ENTITIES',
      sub: 'Certificates / WHOIS',
      icon: Layers,
      color: 'border-purple-500/60 bg-purple-950/30 text-purple-300',
      description: 'Shared SSL certificate SANs, organization registrar records, public DNS SOA contact records.',
    },
  ];

  return (
    <ModuleCard
      id="module-relationships"
      title="Relationship Graph Blueprint"
      subtitle="Entity correlation, cross-domain pivoting & asset graph"
      icon={GitFork}
      versionBadge="PLANNED: V0.6"
      statusBadge={{
        label: 'TOPOLOGY BLUEPRINT',
        variant: 'cyan',
      }}
    >
      <div className="space-y-4">
        {/* Schematic Flow Banner */}
        <div className="p-4 rounded-lg bg-[#0b0e15] border border-[#1b2233] relative overflow-hidden">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>RELATIONAL PIPELINE ARCHITECTURE (TARGET → ENTITIES)</span>
            <span className="text-[10px] text-cyan-400">SELECT NODE TO INSPECT DESIGN</span>
          </div>

          {/* Node Flow Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
            {nodes.map((node, index) => {
              const Icon = node.icon;
              const isSelected = selectedNode === node.id;

              return (
                <div key={node.id} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedNode(node.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all duration-150 relative ${node.color} ${
                      isSelected
                        ? 'ring-2 ring-cyan-400/50 shadow-lg scale-[1.02]'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-[9px] font-mono opacity-70">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-[11px] font-bold tracking-tight truncate">
                      {node.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {node.sub}
                    </div>
                  </button>

                  {/* Flow Arrow (except last) */}
                  {index < nodes.length - 1 && (
                    <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Node Details Box */}
          {selectedNode !== null && (
            <div className="mt-3 p-3 rounded bg-[#0f131d] border border-[#202738] text-xs font-mono">
              <div className="text-cyan-300 font-bold uppercase tracking-wider text-[11px] mb-1">
                Forensic Entity Scope: {nodes[selectedNode].label}
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {nodes[selectedNode].description}
              </p>
            </div>
          )}
        </div>

        <ModulePlaceholderNotice
          moduleTarget="RELATIONSHIP GRAPH (V0.6)"
          description="Interactive D3/WebGL force-directed entity graph will render real nodes, pivot links, and cross-domain asset clusters in V0.6."
        />
      </div>
    </ModuleCard>
  );
};
