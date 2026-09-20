import {
  ConflictingSignal,
  HttpFinding,
  InfrastructureFinding,
  TechnologyCategory,
  TechnologyConfidence,
  TechnologyEvidence,
  TechnologyFinding,
  TechnologyRelationship,
  TechnologyReport,
  TechnologySummaryData,
} from '../types';
import {
  TECHNOLOGY_SIGNATURES,
  TechnologySignature,
} from './technologySignatures';

export interface DetectionInput {
  domain: string;
  hostname: string;
  httpFinding?: HttpFinding | null;
  infrastructureFinding?: InfrastructureFinding | null;
}

export function detectTechnologies(input: DetectionInput): TechnologyReport {
  const { domain, hostname, httpFinding, infrastructureFinding } = input;
  const webRes = httpFinding ? httpFinding.webResources : undefined;
  const headers = httpFinding?.headers || [];

  const detectedFindings: TechnologyFinding[] = [];

  // Iterate over all technology signatures
  for (const sig of TECHNOLOGY_SIGNATURES) {
    const evidenceList: TechnologyEvidence[] = [];

    // 1. Check Headers
    if (sig.indicators.headers) {
      for (const hInd of sig.indicators.headers) {
        const matchingHeader = headers.find(
          (h) => h.name.toLowerCase() === hInd.name.toLowerCase()
        );
        if (matchingHeader) {
          if (!hInd.valueRegex || hInd.valueRegex.test(matchingHeader.value)) {
            evidenceList.push({
              id: `${sig.id}-hdr-${hInd.name}`,
              type: 'HEADER',
              source: `Header: ${matchingHeader.name}`,
              observed: `${matchingHeader.name}: ${matchingHeader.value}`,
              interpretation: hInd.interpretation,
              weight: hInd.weight,
            });
          }
        }
      }
    }

    // 2. Check DOM Markers
    if (sig.indicators.domMarkers && webRes?.domMarkers) {
      for (const domInd of sig.indicators.domMarkers) {
        if (webRes.domMarkers.includes(domInd.marker)) {
          evidenceList.push({
            id: `${sig.id}-dom-${domInd.marker}`,
            type: 'HTML',
            source: `DOM Marker: ${domInd.marker}`,
            observed: `DOM element matching: ${domInd.marker}`,
            interpretation: domInd.interpretation,
            weight: domInd.weight,
          });
        }
      }
    }

    // 3. Check Scripts
    if (sig.indicators.scripts && webRes?.scripts) {
      for (const sInd of sig.indicators.scripts) {
        for (const scriptUrl of webRes.scripts) {
          if (sInd.pattern.test(scriptUrl)) {
            evidenceList.push({
              id: `${sig.id}-script-${scriptUrl.slice(-40)}`,
              type: 'SCRIPT',
              source: 'Script Reference',
              observed: scriptUrl,
              interpretation: sInd.interpretation,
              weight: sInd.weight,
            });
            break; // 1 match per indicator is enough
          }
        }

        // Also check inline script snippets if available
        if (webRes.inlineScriptSnippets) {
          for (const snippet of webRes.inlineScriptSnippets) {
            if (sInd.pattern.test(snippet)) {
              evidenceList.push({
                id: `${sig.id}-inline-script`,
                type: 'SCRIPT',
                source: 'Inline Script Snippet',
                observed: snippet.slice(0, 120) + '...',
                interpretation: sInd.interpretation,
                weight: Math.round(sInd.weight * 0.9),
              });
              break;
            }
          }
        }
      }
    }

    // 4. Check Stylesheets / Links
    if (sig.indicators.stylesheets && webRes?.stylesheets) {
      for (const lInd of sig.indicators.stylesheets) {
        for (const sheetUrl of webRes.stylesheets) {
          if (lInd.pattern.test(sheetUrl)) {
            evidenceList.push({
              id: `${sig.id}-link-${sheetUrl.slice(-40)}`,
              type: 'LINK',
              source: 'Stylesheet Reference',
              observed: sheetUrl,
              interpretation: lInd.interpretation,
              weight: lInd.weight,
            });
            break;
          }
        }
      }
    }

    // 5. Check Meta Tags
    if (sig.indicators.meta && webRes?.metaTags) {
      for (const mInd of sig.indicators.meta) {
        for (const metaTag of webRes.metaTags) {
          const nameOrProp = metaTag.name || metaTag.property || '';
          if (mInd.nameOrPropRegex.test(nameOrProp)) {
            if (!mInd.contentRegex || mInd.contentRegex.test(metaTag.content)) {
              evidenceList.push({
                id: `${sig.id}-meta-${nameOrProp}`,
                type: 'META',
                source: `Meta Tag (${nameOrProp})`,
                observed: `<meta ${nameOrProp ? `name="${nameOrProp}"` : ''} content="${metaTag.content}">`,
                interpretation: mInd.interpretation,
                weight: mInd.weight,
              });
              break;
            }
          }
        }
      }
    }

    // Also check pageMetadata.generator if available
    if (httpFinding?.pageMetadata?.generator && sig.indicators.meta) {
      for (const mInd of sig.indicators.meta) {
        if (mInd.nameOrPropRegex.test('generator')) {
          if (!mInd.contentRegex || mInd.contentRegex.test(httpFinding.pageMetadata.generator)) {
            const exists = evidenceList.some((e) => e.type === 'META' && e.source.includes('generator'));
            if (!exists) {
              evidenceList.push({
                id: `${sig.id}-meta-page-gen`,
                type: 'META',
                source: 'Meta Tag (generator)',
                observed: `<meta name="generator" content="${httpFinding.pageMetadata.generator}">`,
                interpretation: mInd.interpretation,
                weight: mInd.weight,
              });
            }
          }
        }
      }
    }

    // 6. Check Cookies
    if (sig.indicators.cookies && webRes?.cookies) {
      for (const cInd of sig.indicators.cookies) {
        for (const cookieName of webRes.cookies) {
          if (cInd.nameRegex.test(cookieName)) {
            evidenceList.push({
              id: `${sig.id}-cookie-${cookieName}`,
              type: 'COOKIE',
              source: 'Observed Cookie',
              observed: `Set-Cookie: ${cookieName}`,
              interpretation: cInd.interpretation,
              weight: cInd.weight,
            });
            break;
          }
        }
      }
    }

    // 7. Check HTML Snippet Regex
    if (sig.indicators.html && webRes?.htmlSnippet) {
      for (const hInd of sig.indicators.html) {
        const match = webRes.htmlSnippet.match(hInd.regex);
        if (match) {
          evidenceList.push({
            id: `${sig.id}-html-regex`,
            type: 'HTML',
            source: 'Document HTML Body',
            observed: match[0].slice(0, 100),
            interpretation: hInd.interpretation,
            weight: hInd.weight,
          });
        }
      }
    }

    // 8. Check Infrastructure finding
    if (sig.indicators.infrastructure && infrastructureFinding) {
      for (const iInd of sig.indicators.infrastructure) {
        let matched = false;

        if (iInd.nsMatch && infrastructureFinding.nsRecords) {
          for (const ns of infrastructureFinding.nsRecords) {
            if (iInd.nsMatch.test(ns.host)) {
              evidenceList.push({
                id: `${sig.id}-infra-ns`,
                type: 'INFRASTRUCTURE',
                source: 'Authoritative Nameserver',
                observed: `NS: ${ns.host}`,
                interpretation: iInd.interpretation,
                weight: iInd.weight,
              });
              matched = true;
              break;
            }
          }
        }

        if (!matched && iInd.cnameMatch && infrastructureFinding.cnameRecords) {
          for (const cname of infrastructureFinding.cnameRecords) {
            if (iInd.cnameMatch.test(cname.target)) {
              evidenceList.push({
                id: `${sig.id}-infra-cname`,
                type: 'INFRASTRUCTURE',
                source: 'CNAME Target Host',
                observed: `CNAME: ${cname.target}`,
                interpretation: iInd.interpretation,
                weight: iInd.weight,
              });
              matched = true;
              break;
            }
          }
        }

        if (!matched && iInd.cdnMatch && infrastructureFinding.indicators) {
          const cdnInd = infrastructureFinding.indicators.find(
            (ind) => ind.name.toLowerCase().includes(iInd.cdnMatch!.toLowerCase())
          );
          if (cdnInd) {
            evidenceList.push({
              id: `${sig.id}-infra-cdn`,
              type: 'INFRASTRUCTURE',
              source: 'Infrastructure Telemetry',
              observed: `${cdnInd.name} (${cdnInd.evidence})`,
              interpretation: iInd.interpretation,
              weight: iInd.weight,
            });
          }
        }
      }
    }

    // Deduplicate evidence by ID
    const uniqueEvidenceMap = new Map<string, TechnologyEvidence>();
    for (const ev of evidenceList) {
      if (!uniqueEvidenceMap.has(ev.id)) {
        uniqueEvidenceMap.set(ev.id, ev);
      }
    }
    const uniqueEvidence = Array.from(uniqueEvidenceMap.values());

    // If we gathered evidence, calculate confidence score
    if (uniqueEvidence.length > 0) {
      let rawScore = uniqueEvidence.reduce((sum, ev) => sum + ev.weight, 0);

      // Multi-evidence diversity bonus:
      const distinctTypes = new Set(uniqueEvidence.map((e) => e.type));
      if (distinctTypes.size >= 3) {
        rawScore += 25;
      } else if (distinctTypes.size >= 2) {
        rawScore += 15;
      }

      // Cap confidence score
      const confidenceScore = Math.min(99, Math.max(10, rawScore));

      // Minimum reporting threshold: 25 points
      if (confidenceScore >= 25) {
        let confidence: TechnologyConfidence = 'LOW';
        if (confidenceScore >= 70) {
          confidence = 'HIGH';
        } else if (confidenceScore >= 40) {
          confidence = 'MEDIUM';
        }

        // Version Extraction (strict - NO guessing)
        let detectedVersion: string | null = null;
        let versionReliability: TechnologyFinding['versionReliability'] = 'NOT_DETERMINED';

        if (sig.versionPatterns) {
          for (const vp of sig.versionPatterns) {
            let candidateText = '';
            if (vp.source === 'header') {
              const serverHdr = headers.find((h) => h.name.toLowerCase() === 'server');
              candidateText = serverHdr ? serverHdr.value : '';
            } else if (vp.source === 'meta') {
              candidateText = httpFinding?.pageMetadata?.generator || '';
              if (!candidateText && webRes?.metaTags) {
                const genMeta = webRes.metaTags.find((m) => m.name === 'generator');
                if (genMeta) candidateText = genMeta.content;
              }
            } else if (vp.source === 'script') {
              // Check matching script URLs
              if (webRes?.scripts) {
                for (const s of webRes.scripts) {
                  const m = s.match(vp.regex);
                  if (m && m[vp.groupIndex]) {
                    detectedVersion = m[vp.groupIndex];
                    versionReliability = vp.reliability;
                    break;
                  }
                }
              }
            } else if (vp.source === 'link') {
              if (webRes?.stylesheets) {
                for (const l of webRes.stylesheets) {
                  const m = l.match(vp.regex);
                  if (m && m[vp.groupIndex]) {
                    detectedVersion = m[vp.groupIndex];
                    versionReliability = vp.reliability;
                    break;
                  }
                }
              }
            } else if (vp.source === 'html' && webRes?.htmlSnippet) {
              candidateText = webRes.htmlSnippet;
            }

            if (!detectedVersion && candidateText) {
              const vMatch = candidateText.match(vp.regex);
              if (vMatch && vMatch[vp.groupIndex]) {
                detectedVersion = vMatch[vp.groupIndex];
                versionReliability = vp.reliability;
                break;
              }
            }
          }
        }

        detectedFindings.push({
          id: sig.id,
          name: sig.name,
          slug: sig.slug,
          category: sig.category,
          categoryLabel: sig.categoryLabel,
          version: detectedVersion,
          versionReliability,
          confidence,
          confidenceScore,
          description: sig.description,
          website: sig.website,
          evidence: uniqueEvidence,
          evidenceSourcesCount: distinctTypes.size,
        });
      }
    }
  }

  // ==========================================
  // CONFLICTING SIGNALS EVALUATION
  // ==========================================
  const conflicts: ConflictingSignal[] = [];

  // Group by category to find conflicting CMS or primary frameworks
  const cmsFindings = detectedFindings.filter((f) => f.category === 'cms');
  if (cmsFindings.length > 1) {
    const names = cmsFindings.map((f) => f.name);
    conflicts.push({
      id: 'conflict-cms-multiple',
      conflictType: 'Multiple Content Management Systems',
      technologies: names,
      reason: `Observable signatures for multiple CMS platforms (${names.join(', ')}) were detected simultaneously.`,
      recommendation:
        'Target may employ headless content syndication, a reverse proxy splitting paths across legacy and modern platforms, or residual marketing tracking markers.',
    });

    for (const f of cmsFindings) {
      f.isConflicted = true;
      f.conflictDetails = `Contradictory CMS signal detected alongside ${names.filter((n) => n !== f.name).join(', ')}.`;
    }
  }

  // Check competing primary SSR frameworks (e.g. Next.js vs Nuxt.js)
  const ssrFrameworks = detectedFindings.filter((f) =>
    ['nextjs', 'nuxtjs', 'remix', 'astro'].includes(f.id)
  );
  if (ssrFrameworks.length > 1) {
    const names = ssrFrameworks.map((f) => f.name);
    conflicts.push({
      id: 'conflict-ssr-frameworks',
      conflictType: 'Competing Full-Stack Web Frameworks',
      technologies: names,
      reason: `Multiple top-level full-stack SSR framework markers (${names.join(', ')}) were identified in page structure.`,
      recommendation:
        'Target architecture likely utilizes micro-frontends or gateway reverse-proxying routing distinct page routes to different application containers.',
    });

    for (const f of ssrFrameworks) {
      f.isConflicted = true;
      f.conflictDetails = `Coexists with competing SSR framework (${names.filter((n) => n !== f.name).join(', ')}).`;
    }
  }

  // Sort detected findings by confidenceScore descending
  detectedFindings.sort((a, b) => b.confidenceScore - a.confidenceScore);

  // Group findings by category
  const allCategories: TechnologyCategory[] = [
    'frontend_framework',
    'cms',
    'javascript_library',
    'css_ui',
    'analytics',
    'advertising',
    'payment',
    'cdn_edge',
    'hosting_cloud',
    'web_server',
  ];

  const groupedByCategory = {} as Record<TechnologyCategory, TechnologyFinding[]>;
  for (const cat of allCategories) {
    groupedByCategory[cat] = detectedFindings.filter((f) => f.category === cat);
  }

  // Prepare Relationships for V0.6 (DOMAIN -> USES -> TECHNOLOGY)
  const relationships: TechnologyRelationship[] = detectedFindings.map((f) => ({
    domain,
    relationship: 'USES',
    technologyId: f.id,
    technologyName: f.name,
    category: f.category,
    confidence: f.confidence,
  }));

  // Build Summary Data
  const highConfidenceCount = detectedFindings.filter((f) => f.confidence === 'HIGH').length;
  const mediumConfidenceCount = detectedFindings.filter((f) => f.confidence === 'MEDIUM').length;
  const lowConfidenceCount = detectedFindings.filter((f) => f.confidence === 'LOW').length;
  const categoriesCount = new Set(detectedFindings.map((f) => f.category)).size;
  const versionDetectedCount = detectedFindings.filter((f) => f.version !== null).length;

  let status: TechnologySummaryData['status'] = 'SUCCESS';
  if (detectedFindings.length === 0) {
    status = 'NO_TECHNOLOGIES_DETECTED';
  } else if (conflicts.length > 0 || lowConfidenceCount > highConfidenceCount) {
    status = 'PARTIAL';
  }

  const summary: TechnologySummaryData = {
    totalDetected: detectedFindings.length,
    highConfidenceCount,
    mediumConfidenceCount,
    lowConfidenceCount,
    categoriesCount,
    versionDetectedCount,
    conflictingSignalsCount: conflicts.length,
    status,
  };

  return {
    domain,
    hostname,
    analyzedAt: new Date().toISOString(),
    summary,
    technologies: detectedFindings,
    groupedByCategory,
    conflicts,
    relationships,
    rawAnalyzedInputs: {
      headersCount: headers.length,
      scriptsAnalyzed: webRes?.scripts.length || 0,
      metaTagsAnalyzed: webRes?.metaTags.length || 0,
      linksAnalyzed: webRes?.stylesheets.length || 0,
      cookiesCount: webRes?.cookies.length || 0,
      infrastructureCluesCount: infrastructureFinding?.indicators.length || 0,
    },
    error: null,
  };
}
