import React from 'react';
import { GitFork } from 'lucide-react';
import {
  TargetMetadata,
  HttpFinding,
  InfrastructureFinding,
  TechnologyReport,
  SecurityReport,
} from '../../types';
import { RelationshipGraph } from '../graph/RelationshipGraph';

interface RelationshipGraphModuleProps {
  target: TargetMetadata;
  httpFinding?: HttpFinding | null;
  infrastructureFinding?: InfrastructureFinding | null;
  technologyFinding?: TechnologyReport | null;
  securityFinding?: SecurityReport | null;
  onNavigateToModule?: (targetModuleId: string) => void;
}

export const RelationshipGraphModule: React.FC<RelationshipGraphModuleProps> = ({
  target,
  httpFinding,
  infrastructureFinding,
  technologyFinding,
  securityFinding,
  onNavigateToModule,
}) => {
  return (
    <div id="module-relationships" className="w-full">
      <RelationshipGraph
        target={target}
        httpFinding={httpFinding}
        infrastructureFinding={infrastructureFinding}
        technologyFinding={technologyFinding}
        securityFinding={securityFinding}
        onNavigateToModule={onNavigateToModule}
      />
    </div>
  );
};
