import {
  HttpFinding,
  InfrastructureFinding,
  TechnologyReport,
} from '../src/types';
import { detectTechnologies } from '../src/services/technologyDetectionEngine';
import { inspectHttp } from './httpInspector';
import { inspectInfrastructure } from './infrastructureInspector';

export interface TechnologyProbeOptions {
  domain: string;
  hostname?: string;
  httpFinding?: HttpFinding | null;
  infrastructureFinding?: InfrastructureFinding | null;
}

export async function inspectTechnology(
  options: TechnologyProbeOptions
): Promise<TechnologyReport> {
  const domain = options.domain.trim().toLowerCase();
  const hostname = (options.hostname || domain).trim().toLowerCase();

  let httpFinding = options.httpFinding;
  let infrastructureFinding = options.infrastructureFinding;

  // If HTTP intelligence was not provided, probe target directly
  if (!httpFinding) {
    const targetUrl = domain.startsWith('http://') || domain.startsWith('https://')
      ? domain
      : `https://${domain}`;
    try {
      httpFinding = await inspectHttp(targetUrl);
    } catch (err: any) {
      // Fallback to HTTP
      const fallbackUrl = `http://${domain}`;
      try {
        httpFinding = await inspectHttp(fallbackUrl);
      } catch (err2: any) {
        return {
          domain,
          hostname,
          analyzedAt: new Date().toISOString(),
          summary: {
            totalDetected: 0,
            highConfidenceCount: 0,
            mediumConfidenceCount: 0,
            lowConfidenceCount: 0,
            categoriesCount: 0,
            versionDetectedCount: 0,
            conflictingSignalsCount: 0,
            status: 'ERROR',
          },
          technologies: [],
          groupedByCategory: {
            frontend_framework: [],
            cms: [],
            javascript_library: [],
            css_ui: [],
            analytics: [],
            advertising: [],
            payment: [],
            cdn_edge: [],
            hosting_cloud: [],
            web_server: [],
          },
          conflicts: [],
          relationships: [],
          rawAnalyzedInputs: {
            headersCount: 0,
            scriptsAnalyzed: 0,
            metaTagsAnalyzed: 0,
            linksAnalyzed: 0,
            cookiesCount: 0,
            infrastructureCluesCount: 0,
          },
          error: {
            code: 'INPUTS_MISSING',
            title: 'HTTP Observation Required',
            message: `Could not retrieve HTTP response data for ${domain}. Technology fingerprinting requires public HTTP telemetry.`,
            technicalDetail: err2?.message || err?.message,
            targetDomain: domain,
          },
        };
      }
    }
  }

  // If infrastructure intelligence wasn't passed, optionally run it in parallel or leave null
  if (!infrastructureFinding) {
    try {
      infrastructureFinding = await inspectInfrastructure(hostname);
    } catch {
      // Non-fatal
      infrastructureFinding = null;
    }
  }

  try {
    const report = detectTechnologies({
      domain,
      hostname,
      httpFinding,
      infrastructureFinding,
    });
    return report;
  } catch (err: any) {
    return {
      domain,
      hostname,
      analyzedAt: new Date().toISOString(),
      summary: {
        totalDetected: 0,
        highConfidenceCount: 0,
        mediumConfidenceCount: 0,
        lowConfidenceCount: 0,
        categoriesCount: 0,
        versionDetectedCount: 0,
        conflictingSignalsCount: 0,
        status: 'ERROR',
      },
      technologies: [],
      groupedByCategory: {
        frontend_framework: [],
        cms: [],
        javascript_library: [],
        css_ui: [],
        analytics: [],
        advertising: [],
        payment: [],
        cdn_edge: [],
        hosting_cloud: [],
        web_server: [],
      },
      conflicts: [],
      relationships: [],
      rawAnalyzedInputs: {
        headersCount: httpFinding?.headers?.length || 0,
        scriptsAnalyzed: 0,
        metaTagsAnalyzed: 0,
        linksAnalyzed: 0,
        cookiesCount: 0,
        infrastructureCluesCount: 0,
      },
      error: {
        code: 'DETECTION_ERROR',
        title: 'Technology Detection Fault',
        message: 'An internal error occurred while analyzing technology signatures.',
        technicalDetail: err?.message,
        targetDomain: domain,
      },
    };
  }
}
