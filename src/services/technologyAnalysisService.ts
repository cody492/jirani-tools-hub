import {
  HttpFinding,
  InfrastructureFinding,
  TechnologyInspectionError,
  TechnologyReport,
} from '../types';
import { detectTechnologies } from './technologyDetectionEngine';

export interface TechnologyAnalysisResult {
  success: boolean;
  report?: TechnologyReport;
  error?: TechnologyInspectionError;
}

export class TechnologyAnalysisService {
  static async analyze(
    domain: string,
    hostname: string,
    httpFinding?: HttpFinding | null,
    infrastructureFinding?: InfrastructureFinding | null
  ): Promise<TechnologyAnalysisResult> {
    try {
      // First attempt server-side endpoint for canonical execution
      const res = await fetch('/api/inspect-technology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          hostname,
          httpFinding,
          infrastructureFinding,
        }),
      });

      if (res.ok) {
        const report: TechnologyReport = await res.json();
        return { success: true, report };
      }

      // If server returned structured error
      const errorJson = await res.json().catch(() => null);
      if (errorJson?.error) {
        // Fallback to client-side engine if httpFinding is available
        if (httpFinding) {
          const clientReport = detectTechnologies({
            domain,
            hostname,
            httpFinding,
            infrastructureFinding,
          });
          return { success: true, report: clientReport };
        }
        return { success: false, error: errorJson.error };
      }
    } catch (err: any) {
      // Network failure reaching /api/inspect-technology
      // If we have httpFinding, perform detection locally
      if (httpFinding) {
        try {
          const clientReport = detectTechnologies({
            domain,
            hostname,
            httpFinding,
            infrastructureFinding,
          });
          return { success: true, report: clientReport };
        } catch (engineErr: any) {
          return {
            success: false,
            error: {
              code: 'DETECTION_ERROR',
              title: 'Client Detection Fault',
              message: 'Failed to process technology signatures in client runtime.',
              technicalDetail: engineErr?.message,
              targetDomain: domain,
            },
          };
        }
      }
    }

    // If we have httpFinding, always try client-side detection engine
    if (httpFinding) {
      try {
        const fallbackReport = detectTechnologies({
          domain,
          hostname,
          httpFinding,
          infrastructureFinding,
        });
        return { success: true, report: fallbackReport };
      } catch (e: any) {
        return {
          success: false,
          error: {
            code: 'DETECTION_ERROR',
            title: 'Detection Engine Error',
            message: 'Unable to evaluate technology fingerprints.',
            technicalDetail: e?.message,
            targetDomain: domain,
          },
        };
      }
    }

    return {
      success: false,
      error: {
        code: 'INPUTS_MISSING',
        title: 'Missing Telemetry Inputs',
        message: 'Technology fingerprinting requires HTTP headers and markup telemetry.',
        targetDomain: domain,
      },
    };
  }
}
