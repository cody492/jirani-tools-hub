import {
  TargetMetadata,
  HttpFinding,
  InfrastructureFinding,
  TechnologyReport,
  SecurityReport,
  GraphNodeData,
  GraphEdgeData,
  GraphSummaryData,
  RelationshipGraphData,
  GraphNodeCategory,
  GraphRelationshipType,
  GraphConfidence,
} from '../types';

export interface GraphLayoutNode extends GraphNodeData {
  x: number;
  y: number;
}

export interface TransformedGraphResult {
  nodes: GraphLayoutNode[];
  edges: GraphEdgeData[];
  summary: GraphSummaryData;
  generatedAt: string;
}

interface TransformInputs {
  target: TargetMetadata;
  httpFinding?: HttpFinding | null;
  infrastructureFinding?: InfrastructureFinding | null;
  technologyFinding?: TechnologyReport | null;
  securityFinding?: SecurityReport | null;
}

/**
 * Normalizes an identifier string to guarantee stable, deterministic deduplication.
 */
function normalizeId(prefix: string, value: string): string {
  return `${prefix}:${value.trim().toLowerCase().replace(/[\s/]+/g, '-')}`;
}

/**
 * Pure transformation layer that converts forensic investigation findings
 * into an evidence-backed relationship graph.
 */
export function buildRelationshipGraph(inputs: TransformInputs): TransformedGraphResult {
  const { target, httpFinding, infrastructureFinding, technologyFinding, securityFinding } = inputs;

  const nodeMap = new Map<string, GraphNodeData>();
  const edgeMap = new Map<string, GraphEdgeData>();

  const targetId = normalizeId('target', target.domain);

  // 1. Central TARGET Node
  const targetSublabel = httpFinding
    ? `${httpFinding.protocol} ${httpFinding.statusCode} ${httpFinding.statusText} (${httpFinding.responseTimeMs}ms)`
    : target.normalizedUrl;

  nodeMap.set(targetId, {
    id: targetId,
    label: target.domain,
    sublabel: targetSublabel,
    category: 'TARGET',
    categoryLabel: 'Target Domain',
    confidence: 'VERIFIED',
    sourceModule: 'Target Identity & Resolution',
    isTarget: true,
    targetNavModule: 'module-target-identity',
    metadata: {
      domain: target.domain,
      hostname: target.hostname,
      normalizedUrl: target.normalizedUrl,
      rawInput: target.rawInput,
      protocol: target.protocol,
      port: target.port,
      statusCode: httpFinding?.statusCode,
      finalUrl: httpFinding?.finalUrl,
      documentType: httpFinding?.documentType,
    },
    evidenceCount: httpFinding ? 1 + (httpFinding.redirectCount || 0) : 1,
    evidenceSnippets: [
      `Input Target: ${target.rawInput}`,
      `Normalized URL: ${target.normalizedUrl}`,
      ...(httpFinding ? [`HTTP Status: ${httpFinding.statusCode} ${httpFinding.statusText}`] : []),
    ],
  });

  // Helper to add edges safely with deduplication
  const addEdge = (
    source: string,
    targetNodeId: string,
    relationship: GraphRelationshipType,
    relationshipLabel: string,
    evidence: string,
    confidence: GraphConfidence,
    sourceModule: string
  ) => {
    const edgeKey = `${source}->${relationship}->${targetNodeId}`;
    if (!edgeMap.has(edgeKey)) {
      edgeMap.set(edgeKey, {
        id: edgeKey,
        source,
        target: targetNodeId,
        relationship,
        relationshipLabel,
        evidence,
        confidence,
        sourceModule,
      });
    }
  };

  // 2. INFRASTRUCTURE ENTITIES (IPs, Nameservers, MX, CNAME)
  if (infrastructureFinding) {
    // 2a. IP Addresses (A / AAAA Records)
    const ipObs = infrastructureFinding.ipObservations || [];
    for (const ip of ipObs) {
      if (!ip.address) continue;
      const ipId = normalizeId('ip', ip.address);
      const isV6 = ip.address.includes(':') || ip.version === 'IPv6';

      if (!nodeMap.has(ipId)) {
        nodeMap.set(ipId, {
          id: ipId,
          label: ip.address,
          sublabel: `${isV6 ? 'IPv6' : 'IPv4'} Host (${ip.recordType} Record)`,
          category: 'IP_ADDRESS',
          categoryLabel: isV6 ? 'IPv6 Address' : 'IPv4 Address',
          confidence: 'VERIFIED',
          sourceModule: 'Infrastructure Intelligence',
          targetNavModule: 'module-infrastructure',
          metadata: {
            address: ip.address,
            version: ip.version,
            recordType: ip.recordType,
            ttl: ip.ttl,
            fact: ip.fact,
            observation: ip.observation,
          },
          evidenceCount: 1,
          evidenceSnippets: [ip.fact, ip.observation].filter(Boolean),
        });
      }

      addEdge(
        targetId,
        ipId,
        'RESOLVES_TO',
        'RESOLVES TO',
        `DNS ${isV6 ? 'AAAA' : 'A'} record resolves ${target.domain} to ${ip.address}`,
        'VERIFIED',
        'Infrastructure Intelligence'
      );
    }

    // 2b. Nameservers (NS Records)
    const nsObs = infrastructureFinding.nameserverObservations || [];
    for (const ns of nsObs) {
      if (!ns.host) continue;
      const cleanHost = ns.host.replace(/\.$/, '').toLowerCase();
      const nsId = normalizeId('ns', cleanHost);

      if (!nodeMap.has(nsId)) {
        nodeMap.set(nsId, {
          id: nsId,
          label: cleanHost,
          sublabel: 'Authoritative Nameserver',
          category: 'NAMESERVER',
          categoryLabel: 'Nameserver',
          confidence: 'VERIFIED',
          sourceModule: 'Infrastructure Intelligence',
          targetNavModule: 'module-infrastructure',
          metadata: {
            host: cleanHost,
            ttl: ns.ttl,
            fact: ns.fact,
            observation: ns.observation,
          },
          evidenceCount: 1,
          evidenceSnippets: [ns.fact, ns.observation].filter(Boolean),
        });
      }

      addEdge(
        targetId,
        nsId,
        'USES_NAMESERVER',
        'USES NAMESERVER',
        `DNS NS record delegates ${target.domain} to ${cleanHost}`,
        'VERIFIED',
        'Infrastructure Intelligence'
      );
    }

    // 2c. Mail Servers (MX Records)
    const mxObs = infrastructureFinding.mailServerObservations || [];
    for (const mx of mxObs) {
      if (!mx.host) continue;
      const cleanHost = mx.host.replace(/\.$/, '').toLowerCase();
      const mxId = normalizeId('mx', cleanHost);

      if (!nodeMap.has(mxId)) {
        nodeMap.set(mxId, {
          id: mxId,
          label: cleanHost,
          sublabel: `MX Preference ${mx.priority}`,
          category: 'MAIL_SERVER',
          categoryLabel: 'Mail Relay (MX)',
          confidence: 'VERIFIED',
          sourceModule: 'Infrastructure Intelligence',
          targetNavModule: 'module-infrastructure',
          metadata: {
            host: cleanHost,
            priority: mx.priority,
            ttl: mx.ttl,
            fact: mx.fact,
            observation: mx.observation,
          },
          evidenceCount: 1,
          evidenceSnippets: [mx.fact, mx.observation].filter(Boolean),
        });
      }

      addEdge(
        targetId,
        mxId,
        'MAIL_ROUTES_TO',
        'MAIL ROUTES TO',
        `DNS MX record specifies mail priority ${mx.priority} via ${cleanHost}`,
        'VERIFIED',
        'Infrastructure Intelligence'
      );
    }

    // 2d. Canonical CNAME Aliases
    const cnameObs = infrastructureFinding.cnameRelationships || [];
    for (const cname of cnameObs) {
      if (!cname.target) continue;
      const cleanTarget = cname.target.replace(/\.$/, '').toLowerCase();
      const cnameId = normalizeId('cname', cleanTarget);

      if (!nodeMap.has(cnameId)) {
        nodeMap.set(cnameId, {
          id: cnameId,
          label: cleanTarget,
          sublabel: 'Canonical Alias Host',
          category: 'CNAME',
          categoryLabel: 'CNAME Target',
          confidence: 'VERIFIED',
          sourceModule: 'Infrastructure Intelligence',
          targetNavModule: 'module-infrastructure',
          metadata: {
            source: cname.source,
            target: cleanTarget,
            ttl: cname.ttl,
            fact: cname.fact,
            observation: cname.observation,
          },
          evidenceCount: 1,
          evidenceSnippets: [cname.fact, cname.observation].filter(Boolean),
        });
      }

      addEdge(
        targetId,
        cnameId,
        'ALIASES_TO',
        'ALIASES TO',
        `DNS CNAME canonical delegation from ${cname.source} to ${cleanTarget}`,
        'VERIFIED',
        'Infrastructure Intelligence'
      );
    }
  }

  // 3. TECHNOLOGY ENTITIES (V0.4 Findings)
  if (technologyFinding && technologyFinding.technologies) {
    for (const tech of technologyFinding.technologies) {
      const techId = normalizeId('tech', tech.slug || tech.name);
      const versionLabel = tech.version ? ` v${tech.version}` : '';

      if (!nodeMap.has(techId)) {
        nodeMap.set(techId, {
          id: techId,
          label: tech.name,
          sublabel: `${tech.categoryLabel}${versionLabel}`,
          category: 'TECHNOLOGY',
          categoryLabel: tech.categoryLabel || 'Technology',
          confidence: tech.confidence || 'MEDIUM',
          sourceModule: 'Technology Fingerprinting',
          targetNavModule: 'module-technology',
          metadata: {
            name: tech.name,
            slug: tech.slug,
            category: tech.category,
            categoryLabel: tech.categoryLabel,
            version: tech.version,
            confidenceScore: tech.confidenceScore,
            description: tech.description,
            website: tech.website,
            evidenceSourcesCount: tech.evidenceSourcesCount,
          },
          evidenceCount: tech.evidence?.length || 0,
          evidenceSnippets: (tech.evidence || []).map(
            (e) => `[${e.type}] ${e.source}: ${e.observed}`
          ),
        });
      }

      const evidenceSummary = tech.evidence?.length
        ? `Identified via ${tech.evidence.length} evidence signature(s): ${tech.evidence
            .map((e) => e.source)
            .slice(0, 2)
            .join(', ')}`
        : `Identified by passive fingerprint signatures`;

      addEdge(
        targetId,
        techId,
        'USES',
        'USES',
        evidenceSummary,
        tech.confidence || 'MEDIUM',
        'Technology Fingerprinting'
      );
    }
  }

  // 4. SIGNIFICANT SECURITY OBSERVATIONS (V0.5 Findings)
  // Per specification: represent significant security observations where useful (e.g. TLS Certificate, HSTS, CSP)
  // without cluttering with every low-level header.
  if (securityFinding) {
    // 4a. TLS Certificate Node (if TLS details are available)
    if (securityFinding.tls?.available && securityFinding.tls.protocol) {
      const tlsId = 'sec:tls-certificate';
      const issuer =
        securityFinding.tls.issuer?.organization ||
        securityFinding.tls.issuer?.commonName ||
        'Public Certificate Authority';
      const days = securityFinding.tls.daysRemaining;
      const daysText = typeof days === 'number' ? ` (${days}d remaining)` : '';

      if (!nodeMap.has(tlsId)) {
        nodeMap.set(tlsId, {
          id: tlsId,
          label: `TLS ${securityFinding.tls.protocol}`,
          sublabel: `${issuer}${daysText}`,
          category: 'SECURITY_OBSERVATION',
          categoryLabel: 'TLS Certificate',
          confidence: 'VERIFIED',
          sourceModule: 'Security Observations',
          targetNavModule: 'module-security',
          metadata: {
            protocol: securityFinding.tls.protocol,
            cipher: securityFinding.tls.cipher,
            issuer: securityFinding.tls.issuer,
            subject: securityFinding.tls.subject,
            daysRemaining: securityFinding.tls.daysRemaining,
            validTo: securityFinding.tls.validTo,
            isExpired: securityFinding.tls.isExpired,
            isExpiringSoon: securityFinding.tls.isExpiringSoon,
            sanList: securityFinding.tls.sanList,
          },
          evidenceCount: 1,
          evidenceSnippets: [
            `TLS Protocol: ${securityFinding.tls.protocol}`,
            `Cipher Suite: ${securityFinding.tls.cipher || 'Standard'}`,
            `Issuer: ${issuer}`,
          ],
        });
      }

      addEdge(
        targetId,
        tlsId,
        'SECURED_BY',
        'SECURED BY',
        `Passive TLS Handshake negotiated ${securityFinding.tls.protocol} with ${issuer}`,
        'VERIFIED',
        'Security Observations'
      );
    }

    // 4b. Strict-Transport-Security (HSTS) if observed
    if (securityFinding.hsts?.present) {
      const hstsId = 'sec:hsts-enforced';
      if (!nodeMap.has(hstsId)) {
        nodeMap.set(hstsId, {
          id: hstsId,
          label: 'HSTS Enforced',
          sublabel: securityFinding.hsts.maxAgeFormatted || 'Transport Security Policy',
          category: 'SECURITY_OBSERVATION',
          categoryLabel: 'Security Policy',
          confidence: 'VERIFIED',
          sourceModule: 'Security Observations',
          targetNavModule: 'module-security',
          metadata: {
            maxAge: securityFinding.hsts.maxAge,
            includeSubDomains: securityFinding.hsts.includeSubDomains,
            preload: securityFinding.hsts.preload,
            rawHeader: securityFinding.hsts.rawHeader,
          },
          evidenceCount: 1,
          evidenceSnippets: [
            `Strict-Transport-Security: ${securityFinding.hsts.rawHeader || 'Declared'}`,
            `IncludeSubDomains: ${securityFinding.hsts.includeSubDomains ? 'YES' : 'NO'}`,
          ],
        });
      }

      addEdge(
        targetId,
        hstsId,
        'OBSERVED',
        'ENFORCES',
        `RFC 6797 Strict-Transport-Security header declared (${securityFinding.hsts.maxAgeFormatted})`,
        'VERIFIED',
        'Security Observations'
      );
    }

    // 4c. Content-Security-Policy (CSP) if observed
    if (securityFinding.csp?.present && securityFinding.csp.directives.length > 0) {
      const cspId = 'sec:csp-policy';
      if (!nodeMap.has(cspId)) {
        nodeMap.set(cspId, {
          id: cspId,
          label: 'Content Security Policy',
          sublabel: `${securityFinding.csp.directives.length} directives configured`,
          category: 'SECURITY_OBSERVATION',
          categoryLabel: 'Browser Defense Policy',
          confidence: 'VERIFIED',
          sourceModule: 'Security Observations',
          targetNavModule: 'module-security',
          metadata: {
            directivesCount: securityFinding.csp.directives.length,
            hasDefaultSrc: securityFinding.csp.hasDefaultSrc,
            hasScriptSrc: securityFinding.csp.hasScriptSrc,
            hasFrameAncestors: securityFinding.csp.hasFrameAncestors,
            rawPolicy: securityFinding.csp.rawPolicy,
          },
          evidenceCount: 1,
          evidenceSnippets: [
            `Content-Security-Policy: ${securityFinding.csp.directives.length} directives active`,
          ],
        });
      }

      addEdge(
        targetId,
        cspId,
        'OBSERVED',
        'DECLARES',
        `Content-Security-Policy observed with ${securityFinding.csp.directives.length} directive rules`,
        'VERIFIED',
        'Security Observations'
      );
    }
  }

  // 5. CALCULATE COHESIVE RADIAL / SECTOR LAYOUT
  // The layout positions the target centrally (500, 350) and organizes
  // categories cleanly into cardinal quadrants to avoid overlapping:
  // - Top / North: Technologies
  // - Left / West: Infrastructure (IPs)
  // - Bottom / South: DNS (Nameservers, MX, CNAME)
  // - Right / East: Security Observations (TLS, Policies)

  const nodesList = Array.from(nodeMap.values());
  const edgesList = Array.from(edgeMap.values());

  const centerX = 500;
  const centerY = 350;

  // Group nodes by category for positional computation
  const techNodes = nodesList.filter((n) => n.category === 'TECHNOLOGY');
  const ipNodes = nodesList.filter((n) => n.category === 'IP_ADDRESS');
  const dnsNodes = nodesList.filter((n) =>
    ['NAMESERVER', 'MAIL_SERVER', 'CNAME'].includes(n.category)
  );
  const secNodes = nodesList.filter((n) => n.category === 'SECURITY_OBSERVATION');

  const layoutNodes: GraphLayoutNode[] = [];

  // Helper to arrange nodes in an angular arc
  const arrangeArc = (
    items: GraphNodeData[],
    startAngleDeg: number,
    endAngleDeg: number,
    minRadius: number,
    radiusStep: number = 70
  ) => {
    const count = items.length;
    if (count === 0) return;

    items.forEach((item, index) => {
      let angleDeg: number;
      if (count === 1) {
        angleDeg = (startAngleDeg + endAngleDeg) / 2;
      } else {
        const span = endAngleDeg - startAngleDeg;
        angleDeg = startAngleDeg + (index / (count - 1)) * span;
      }

      // Add a slight concentric stagger if there are many nodes
      const tier = index % 2 === 0 ? 0 : 1;
      const radius = minRadius + (count > 6 ? tier * radiusStep : 0);

      const rad = (angleDeg * Math.PI) / 180;
      const x = Math.round(centerX + radius * Math.cos(rad));
      const y = Math.round(centerY + radius * Math.sin(rad));

      layoutNodes.push({
        ...item,
        x,
        y,
      });
    });
  };

  // Add Target Node at center
  const targetNode = nodesList.find((n) => n.isTarget);
  if (targetNode) {
    layoutNodes.push({
      ...targetNode,
      x: centerX,
      y: centerY,
    });
  }

  // North Sector (230° to 310°): Technologies
  arrangeArc(techNodes, 220, 320, 240, 75);

  // West Sector (145° to 215°): IP Addresses
  arrangeArc(ipNodes, 140, 220, 230, 65);

  // South Sector (40° to 140°): DNS (NS, MX, CNAME)
  arrangeArc(dnsNodes, 40, 140, 240, 70);

  // East Sector (-35° to 35°): Security Observations
  arrangeArc(secNodes, -35, 35, 230, 60);

  // Summary Metrics
  const categoriesPresent = new Set(nodesList.map((n) => n.category));

  const summary: GraphSummaryData = {
    totalNodes: nodesList.length,
    totalEdges: edgesList.length,
    categoriesCount: categoriesPresent.size,
    targetCount: targetNode ? 1 : 0,
    ipCount: ipNodes.length,
    nameserverCount: dnsNodes.filter((n) => n.category === 'NAMESERVER').length,
    mailServerCount: dnsNodes.filter((n) => n.category === 'MAIL_SERVER').length,
    cnameCount: dnsNodes.filter((n) => n.category === 'CNAME').length,
    technologyCount: techNodes.length,
    securityCount: secNodes.length,
    status: nodesList.length > 1 ? 'POPULATED' : 'EMPTY',
  };

  return {
    nodes: layoutNodes,
    edges: edgesList,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
