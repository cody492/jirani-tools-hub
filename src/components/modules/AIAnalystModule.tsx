import React from 'react';
import { Bot, Sparkles, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';
import { ModuleCard, ModulePlaceholderNotice } from '../ui/ModuleCard';

export const AIAnalystModule: React.FC = () => {
  return (
    <ModuleCard
      id="module-ai-analyst"
      title="AI FORENSIC ANALYST"
      subtitle="Automated anomaly detection, correlation narratives & risk synthesis"
      icon={Bot}
      versionBadge="PLANNED: V0.7"
      statusBadge={{
        label: 'AWAITING TELEMETRY',
        variant: 'standby',
      }}
    >
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-3 bg-[#0d1017] rounded-lg border border-[#1b212f] my-auto">
        <div className="w-12 h-12 rounded-full bg-[#151a26] border border-[#232b3d] flex items-center justify-center text-slate-500">
          <Bot className="w-6 h-6 stroke-[1.5]" />
        </div>

        <div className="space-y-1 max-w-md">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            INTELLIGENCE AGENT STANDBY
          </div>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            AI analysis will appear here once forensic data is available.
          </p>
        </div>

        <div className="pt-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <span>V0.7 ROADMAP TARGET • NO MODEL INFERENCE IN V0.1</span>
        </div>
      </div>

      <ModulePlaceholderNotice
        moduleTarget="AI FORENSIC ANALYST (V0.7)"
        description="Structured reasoning engine to summarize multi-source DNS, HTTP anomalies, certificate expiration risks, and infrastructure correlations into actionable investigative briefings."
      />
    </ModuleCard>
  );
};
