import {
  InfrastructureFinding,
  InfrastructureInspectionError,
  WhoisRecord,
} from '../types';

export interface InfrastructureAnalysisResponse {
  success: boolean;
  finding?: InfrastructureFinding;
  whois?: WhoisRecord;
  error?: InfrastructureInspectionError;
}

export class InfrastructureAnalysisService {
  /**
   * Analyze target domain infrastructure, DNS topology & public WHOIS registration via the backend service.
   */
  public static async analyze(
    domain: string,
    hostname?: string,
    httpClues?: { serverHeader?: string; cdnHeaders?: string[] }
  ): Promise<InfrastructureAnalysisResponse> {
    try {
      const response = await fetch('/api/inspect-infrastructure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, hostname, httpClues }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data && data.error) {
          return {
            success: false,
            error: data.error,
          };
        }

        return {
          success: false,
          error: {
            code: 'SERVICE_ERROR',
            title: `Infrastructure Lookup Error (${response.status})`,
            message: data?.message || 'Server-side infrastructure analysis endpoint returned an error.',
            technicalDetail: `Endpoint responded with status ${response.status} ${response.statusText}`,
            targetDomain: domain,
          },
        };
      }

      const finding = data as InfrastructureFinding;

      // Ensure WHOIS data is also available at the top-level response
      return {
        success: true,
        finding,
        whois: finding.whois || undefined,
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      return {
        success: false,
        error: {
          code: 'DNS_LOOKUP_UNAVAILABLE',
          title: 'Infrastructure Service Unreachable',
          message: 'Unable to communicate with the infrastructure analysis endpoint.',
          technicalDetail: `Client network fault: ${errMsg}. Ensure local inspection daemon or /api/inspect-infrastructure is active.`,
          targetDomain: domain,
        },
      };
    }
  }

  /**
   * Fetch basic public WHOIS / RDAP registration data for a domain (domain registrar, creation/expiration dates).
   */
  public static async fetchWhois(
    domain: string
  ): Promise<{ success: boolean; whois?: WhoisRecord; error?: InfrastructureInspectionError }> {
    try {
      const response = await fetch('/api/inspect-whois', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || {
            code: 'SERVICE_ERROR',
            title: 'WHOIS Service Error',
            message: 'Failed to retrieve WHOIS registration data.',
            technicalDetail: `Server responded with status ${response.status}`,
            targetDomain: domain,
          },
        };
      }

      return {
        success: true,
        whois: data as WhoisRecord,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          title: 'WHOIS Endpoint Unreachable',
          message: 'Unable to communicate with the WHOIS analysis service.',
          technicalDetail: err?.message || String(err),
          targetDomain: domain,
        },
      };
    }
  }
}

