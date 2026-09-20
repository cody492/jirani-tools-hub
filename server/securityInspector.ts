import tls from 'tls';
import {
  TlsObservationDetail,
  SecurityReport,
  HttpFinding,
  InfrastructureFinding,
  TechnologyReport,
} from '../src/types';
import { analyzeSecurityConfiguration } from '../src/services/securityAnalysisEngine';

export interface TlsFetchResult {
  detail: TlsObservationDetail;
  error?: string;
}

/**
 * Safely and passively inspects the peer TLS/X.509 certificate for the target host on port 443.
 * Uses passive socket connection only; does not transmit HTTP requests or intrusive payloads.
 */
export async function inspectTlsPeer(
  hostname: string,
  port: number = 443,
  timeoutMs: number = 4500
): Promise<TlsFetchResult> {
  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (res: TlsFetchResult) => {
      if (!resolved) {
        resolved = true;
        resolve(res);
      }
    };

    try {
      const options: tls.ConnectionOptions = {
        host: hostname,
        port: port,
        servername: hostname, // SNI support
        rejectUnauthorized: false, // Do not drop connection so self-signed / expired certs can be inspected
        minVersion: 'TLSv1',
      };

      const socket = tls.connect(options, () => {
        try {
          const cert = socket.getPeerCertificate(true);
          const protocol = socket.getProtocol() || undefined;
          const cipherInfo = socket.getCipher();
          const cipher = cipherInfo ? `${cipherInfo.name} (${cipherInfo.version})` : undefined;
          const isAuthorized = socket.authorized;
          const authError = socket.authorizationError ? String(socket.authorizationError) : undefined;

          socket.destroy();

          if (!cert || Object.keys(cert).length === 0) {
            safeResolve({
              detail: {
                available: false,
                status: 'NOT_AVAILABLE',
                unavailabilityReason: 'No peer TLS certificate presented by the target server on port 443.',
              },
            });
            return;
          }

          const now = Date.now();
          const validFrom = cert.valid_from ? new Date(cert.valid_from).toISOString() : undefined;
          const validTo = cert.valid_to ? new Date(cert.valid_to).toISOString() : undefined;
          const validToMs = cert.valid_to ? new Date(cert.valid_to).getTime() : 0;
          const daysRemaining = validToMs ? Math.floor((validToMs - now) / (1000 * 60 * 60 * 24)) : undefined;
          const isExpired = typeof daysRemaining === 'number' ? daysRemaining < 0 : false;
          const isExpiringSoon = typeof daysRemaining === 'number' ? daysRemaining >= 0 && daysRemaining <= 30 : false;

          let status: TlsObservationDetail['status'] = 'AVAILABLE';
          if (isExpired) {
            status = 'EXPIRED';
          } else if (!isAuthorized && authError && authError.toLowerCase().includes('self signed')) {
            status = 'SELF_SIGNED';
          }

          const formatCertField = (val: string | string[] | undefined): string | undefined => {
            if (!val) return undefined;
            return Array.isArray(val) ? val.join(', ') : val;
          };

          // Parse SAN list
          let sanList: string[] = [];
          if (cert.subjectaltname) {
            sanList = cert.subjectaltname
              .split(',')
              .map((s) => s.trim().replace(/^DNS:/, ''))
              .filter(Boolean);
          }

          safeResolve({
            detail: {
              available: true,
              status,
              protocol,
              cipher,
              subject: {
                commonName: formatCertField(cert.subject?.CN),
                organization: formatCertField(cert.subject?.O),
                country: formatCertField(cert.subject?.C),
              },
              issuer: {
                commonName: formatCertField(cert.issuer?.CN),
                organization: formatCertField(cert.issuer?.O),
                country: formatCertField(cert.issuer?.C),
              },
              validFrom,
              validTo,
              daysRemaining,
              isExpired,
              isExpiringSoon,
              sanList: sanList.slice(0, 15), // Top 15 SAN entries
              serialNumber: cert.serialNumber || undefined,
              fingerprint: cert.fingerprint256 || cert.fingerprint || undefined,
              unavailabilityReason: authError ? `TLS Note: ${authError}` : undefined,
            },
          });
        } catch (err: any) {
          socket.destroy();
          safeResolve({
            detail: {
              available: false,
              status: 'NOT_AVAILABLE',
              unavailabilityReason: `Failed to extract TLS certificate metadata: ${err?.message || err}`,
            },
            error: err?.message,
          });
        }
      });

      socket.setTimeout(timeoutMs);
      socket.on('timeout', () => {
        socket.destroy();
        safeResolve({
          detail: {
            available: false,
            status: 'NOT_AVAILABLE',
            unavailabilityReason: `Connection timed out after ${timeoutMs}ms while connecting to port 443.`,
          },
          error: 'TIMEOUT',
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        safeResolve({
          detail: {
            available: false,
            status: 'NOT_AVAILABLE',
            unavailabilityReason: `Target refused or did not establish TLS connection: ${err?.message || 'Connection failed'}`,
          },
          error: err?.message,
        });
      });
    } catch (err: any) {
      safeResolve({
        detail: {
          available: false,
          status: 'NOT_AVAILABLE',
          unavailabilityReason: `Could not initiate TLS connection: ${err?.message || err}`,
        },
        error: err?.message,
      });
    }
  });
}

/**
 * Executes server-side security analysis combining passive TLS handshake and existing inspection telemetry.
 */
export async function inspectSecurity(params: {
  domain: string;
  hostname: string;
  targetUrl: string;
  httpFinding?: HttpFinding | null;
  infrastructureFinding?: InfrastructureFinding | null;
  technologyReport?: TechnologyReport | null;
}): Promise<{ success: boolean; report: SecurityReport }> {
  const { domain, hostname, targetUrl, httpFinding, infrastructureFinding, technologyReport } = params;

  // Attempt real passive TLS probe on hostname
  let tlsDetail: TlsObservationDetail = {
    available: false,
    status: 'NOT_AVAILABLE',
    unavailabilityReason: 'TLS handshake not performed.',
  };

  const isHttps = targetUrl.toLowerCase().startsWith('https://') || httpFinding?.finalUrl.toLowerCase().startsWith('https://');

  if (isHttps || !targetUrl.toLowerCase().startsWith('http://')) {
    const tlsResult = await inspectTlsPeer(hostname, 443, 4000);
    tlsDetail = tlsResult.detail;
  } else {
    tlsDetail = {
      available: false,
      status: 'UNENCRYPTED_HTTP',
      unavailabilityReason: 'Target endpoint was requested and served over unencrypted HTTP (port 80).',
    };
  }

  // Run the unified Security Analysis Engine
  const report = analyzeSecurityConfiguration({
    domain,
    hostname,
    targetUrl,
    httpFinding: httpFinding || null,
    infrastructureFinding: infrastructureFinding || null,
    technologyReport: technologyReport || null,
    tlsObservation: tlsDetail,
  });

  return {
    success: true,
    report,
  };
}
