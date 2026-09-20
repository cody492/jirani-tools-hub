import {
  HttpFinding,
  InfrastructureFinding,
  TechnologyReport,
  SecurityReport,
  SecurityObservation,
  SecuritySummaryData,
  HttpsObservationDetail,
  CspObservationDetail,
  HstsObservationDetail,
  FramingProtectionDetail,
  CookieSecurityItem,
  CookieSecuritySummary,
  TlsObservationDetail,
  CspDirectiveInfo,
} from '../types';

interface AnalysisEngineInputs {
  domain: string;
  hostname: string;
  targetUrl: string;
  httpFinding: HttpFinding | null;
  infrastructureFinding?: InfrastructureFinding | null;
  technologyReport?: TechnologyReport | null;
  tlsObservation?: TlsObservationDetail | null;
}

/**
 * Parses header values case-insensitively from the HTTP finding.
 */
function getHeaderValue(headers: Array<{ name: string; value: string }> = [], headerName: string): string | null {
  const target = headerName.toLowerCase();
  for (const h of headers) {
    if (h.name.toLowerCase() === target) {
      return h.value;
    }
  }
  return null;
}

/**
 * Analyzes Content-Security-Policy header.
 */
function parseCsp(rawHeader: string | null): CspObservationDetail {
  if (!rawHeader) {
    return {
      present: false,
      status: 'MISSING',
      rawPolicy: null,
      directives: [],
      hasDefaultSrc: false,
      hasScriptSrc: false,
      hasStyleSrc: false,
      hasImgSrc: false,
      hasConnectSrc: false,
      hasFrameAncestors: false,
      hasObjectSrc: false,
      hasUpgradeInsecureRequests: false,
      allowsUnsafeInline: false,
      allowsUnsafeEval: false,
    };
  }

  const parts = rawHeader.split(';').map((p) => p.trim()).filter(Boolean);
  const directives: CspDirectiveInfo[] = [];

  let hasDefaultSrc = false;
  let hasScriptSrc = false;
  let hasStyleSrc = false;
  let hasImgSrc = false;
  let hasConnectSrc = false;
  let hasFrameAncestors = false;
  let hasObjectSrc = false;
  let hasUpgradeInsecureRequests = false;
  let allowsUnsafeInline = false;
  let allowsUnsafeEval = false;

  for (const part of parts) {
    const tokens = part.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    const dirName = tokens[0].toLowerCase();
    const values = tokens.slice(1);
    directives.push({ directive: dirName, values });

    if (dirName === 'default-src') hasDefaultSrc = true;
    if (dirName === 'script-src') hasScriptSrc = true;
    if (dirName === 'style-src') hasStyleSrc = true;
    if (dirName === 'img-src') hasImgSrc = true;
    if (dirName === 'connect-src') hasConnectSrc = true;
    if (dirName === 'frame-ancestors') hasFrameAncestors = true;
    if (dirName === 'object-src') hasObjectSrc = true;
    if (dirName === 'upgrade-insecure-requests') hasUpgradeInsecureRequests = true;

    for (const val of values) {
      const lower = val.toLowerCase();
      if (lower === "'unsafe-inline'") allowsUnsafeInline = true;
      if (lower === "'unsafe-eval'") allowsUnsafeEval = true;
    }
  }

  return {
    present: true,
    status: 'PRESENT',
    rawPolicy: rawHeader,
    directives,
    hasDefaultSrc,
    hasScriptSrc,
    hasStyleSrc,
    hasImgSrc,
    hasConnectSrc,
    hasFrameAncestors,
    hasObjectSrc,
    hasUpgradeInsecureRequests,
    allowsUnsafeInline,
    allowsUnsafeEval,
  };
}

/**
 * Analyzes Strict-Transport-Security header.
 */
function parseHsts(rawHeader: string | null): HstsObservationDetail {
  if (!rawHeader) {
    return {
      present: false,
      status: 'MISSING',
      rawHeader: null,
      maxAge: null,
      maxAgeFormatted: null,
      includeSubDomains: false,
      preload: false,
      isPreloadEligible: false,
    };
  }

  const parts = rawHeader.split(';').map((p) => p.trim());
  let maxAge: number | null = null;
  let includeSubDomains = false;
  let preload = false;

  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    const cleanKey = key.trim().toLowerCase();
    const val = rest.join('=').trim();

    if (cleanKey === 'max-age') {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) {
        maxAge = parsed;
      }
    } else if (cleanKey === 'includesubdomains') {
      includeSubDomains = true;
    } else if (cleanKey === 'preload') {
      preload = true;
    }
  }

  let maxAgeFormatted: string | null = null;
  if (maxAge !== null) {
    const days = Math.round(maxAge / 86400);
    if (days >= 365) {
      const years = (days / 365).toFixed(1).replace(/\.0$/, '');
      maxAgeFormatted = `${maxAge.toLocaleString()}s (~${years} ${years === '1' ? 'year' : 'years'})`;
    } else if (days >= 1) {
      maxAgeFormatted = `${maxAge.toLocaleString()}s (~${days} days)`;
    } else {
      maxAgeFormatted = `${maxAge.toLocaleString()}s`;
    }
  }

  const isPreloadEligible = (maxAge !== null && maxAge >= 31536000 && includeSubDomains && preload);

  return {
    present: true,
    status: 'PRESENT',
    rawHeader,
    maxAge,
    maxAgeFormatted,
    includeSubDomains,
    preload,
    isPreloadEligible,
  };
}

/**
 * Analyzes Cookie security attributes without exposing sensitive values.
 */
function parseCookies(headers: Array<{ name: string; value: string }> = []): {
  summary: CookieSecuritySummary;
  items: CookieSecurityItem[];
} {
  const cookieHeaders: string[] = [];
  for (const h of headers) {
    if (h.name.toLowerCase() === 'set-cookie') {
      cookieHeaders.push(h.value);
    }
  }

  if (cookieHeaders.length === 0) {
    return {
      summary: {
        totalCount: 0,
        secureCount: 0,
        httpOnlyCount: 0,
        sameSiteCount: 0,
        status: 'NO_COOKIES_OBSERVED',
        note: 'No Set-Cookie response headers observed on initial inspection endpoint.',
      },
      items: [],
    };
  }

  const items: CookieSecurityItem[] = [];

  for (const raw of cookieHeaders) {
    // A Set-Cookie header contains directives separated by semicolon
    const directives = raw.split(';').map((d) => d.trim());
    if (directives.length === 0) continue;

    // First directive is Name=Value
    const first = directives[0];
    const eqIdx = first.indexOf('=');
    const name = eqIdx > -1 ? first.substring(0, eqIdx).trim() : first.trim();

    let secure = false;
    let httpOnly = false;
    let sameSite: 'Strict' | 'Lax' | 'None' | 'Not Set' = 'Not Set';
    let domain: string | undefined = undefined;
    let path: string | undefined = undefined;
    let expires: string | undefined = undefined;
    let maxAge: number | undefined = undefined;

    for (let i = 1; i < directives.length; i++) {
      const d = directives[i];
      const dLower = d.toLowerCase();

      if (dLower === 'secure') {
        secure = true;
      } else if (dLower === 'httponly') {
        httpOnly = true;
      } else if (dLower.startsWith('samesite=')) {
        const val = d.substring(9).trim().toLowerCase();
        if (val === 'strict') sameSite = 'Strict';
        else if (val === 'lax') sameSite = 'Lax';
        else if (val === 'none') sameSite = 'None';
      } else if (dLower.startsWith('domain=')) {
        domain = d.substring(7).trim();
      } else if (dLower.startsWith('path=')) {
        path = d.substring(5).trim();
      } else if (dLower.startsWith('expires=')) {
        expires = d.substring(8).trim();
      } else if (dLower.startsWith('max-age=')) {
        const ma = parseInt(d.substring(8).trim(), 10);
        if (!isNaN(ma)) maxAge = ma;
      }
    }

    const lowerName = name.toLowerCase();
    const isSessionCookie =
      lowerName.includes('session') ||
      lowerName.includes('sess') ||
      lowerName.includes('auth') ||
      lowerName.includes('token') ||
      lowerName.includes('jwt') ||
      lowerName.includes('csrf') ||
      lowerName.includes('sid');

    items.push({
      name,
      isSessionCookie,
      secure,
      httpOnly,
      sameSite,
      domain,
      path,
      expires,
      maxAge,
    });
  }

  const secureCount = items.filter((c) => c.secure).length;
  const httpOnlyCount = items.filter((c) => c.httpOnly).length;
  const sameSiteCount = items.filter((c) => c.sameSite !== 'Not Set').length;

  return {
    summary: {
      totalCount: items.length,
      secureCount,
      httpOnlyCount,
      sameSiteCount,
      status: 'COOKIES_OBSERVED',
      note: `${items.length} ${items.length === 1 ? 'cookie' : 'cookies'} observed across response telemetry.`,
    },
    items,
  };
}

/**
 * Unified Core Security Analysis Engine (V0.5)
 * Analyzes configuration passively, factually, and without vulnerability exaggeration.
 */
export function analyzeSecurityConfiguration(inputs: AnalysisEngineInputs): SecurityReport {
  const {
    domain,
    hostname,
    targetUrl,
    httpFinding,
    infrastructureFinding,
    technologyReport,
    tlsObservation,
  } = inputs;

  const headers = httpFinding?.headers || [];
  const rawAnalyzedHeaders = headers.map((h) => h.name);
  const observations: SecurityObservation[] = [];

  // Technology context indicators (e.g. CMS or CDN)
  const techNames = technologyReport?.technologies.map((t) => t.name) || [];
  const hasCdn = technologyReport?.technologies.some((t) => t.category === 'cdn_edge') || false;
  const hasCms = technologyReport?.technologies.some((t) => t.category === 'cms') || false;
  const detectedCms = technologyReport?.technologies.find((t) => t.category === 'cms');

  // ==========================================
  // 1. HTTPS & Transport Security Analysis
  // ==========================================
  const finalUrl = httpFinding?.finalUrl || targetUrl;
  const isFinalHttps = finalUrl.toLowerCase().startsWith('https://');
  const isInitialHttp = targetUrl.toLowerCase().startsWith('http://');

  let redirectedFromHttpToHttps = false;
  if (httpFinding?.redirects && httpFinding.redirects.length > 0) {
    const firstUrl = httpFinding.redirects[0].url.toLowerCase();
    const lastUrl = finalUrl.toLowerCase();
    if (firstUrl.startsWith('http://') && lastUrl.startsWith('https://')) {
      redirectedFromHttpToHttps = true;
    }
  }

  // Raw HSTS
  const rawHsts = getHeaderValue(headers, 'strict-transport-security');
  const hsts = parseHsts(rawHsts);

  const httpsDetail: HttpsObservationDetail = {
    httpsEnabled: isFinalHttps,
    httpUsed: isInitialHttp,
    redirectedFromHttpToHttps,
    finalProtocol: httpFinding?.protocol ? `${isFinalHttps ? 'HTTPS' : 'HTTP'} (${httpFinding.protocol})` : (isFinalHttps ? 'HTTPS' : 'HTTP'),
    hstsObserved: hsts.present,
    summary: isFinalHttps
      ? (redirectedFromHttpToHttps
          ? 'Enforced HTTPS with automatic redirect from HTTP'
          : 'HTTPS active on final destination endpoint')
      : 'Target is served over plaintext HTTP',
  };

  if (isFinalHttps) {
    observations.push({
      id: 'sec-https-enabled',
      category: 'https_transport',
      title: 'HTTPS Transport Encryption',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: finalUrl,
      fact: `Final destination URL uses HTTPS (${finalUrl}).`,
      context: 'HTTPS establishes TLS encryption between client and origin, protecting confidentiality and data integrity in transit.',
      assessment: 'Encrypted transport protocol observed on the primary web endpoint.',
      evidence: {
        source: 'Final HTTP Response URL',
        observedKey: 'URL Scheme',
        observedValue: 'https://',
      },
      technologyContext: hasCdn ? 'CDN/Edge network detected; transport encryption may terminate at the edge proxy.' : undefined,
    });
  } else {
    observations.push({
      id: 'sec-https-missing',
      category: 'https_transport',
      title: 'Plaintext HTTP Transport',
      status: 'MISSING',
      severity: 'REVIEW',
      observedValue: finalUrl,
      fact: `Target responded over plaintext HTTP protocol (${finalUrl}).`,
      context: 'Unencrypted HTTP traffic transmits application data and cookies in cleartext across the network.',
      assessment: 'No HTTPS transport observed for the inspected target.',
      recommendation: 'Review whether an SSL/TLS certificate should be provisioned and HTTPS redirection enabled.',
      evidence: {
        source: 'Final HTTP Response URL',
        observedKey: 'URL Scheme',
        observedValue: 'http://',
      },
    });
  }

  if (redirectedFromHttpToHttps) {
    observations.push({
      id: 'sec-https-redirect',
      category: 'https_transport',
      title: 'HTTP to HTTPS Redirection',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: `${targetUrl} -> ${finalUrl}`,
      fact: 'Plaintext HTTP request was automatically redirected to an HTTPS endpoint.',
      context: 'Automatic HTTP-to-HTTPS redirect ensures users attempting unencrypted visits are upgraded to secure transport.',
      assessment: 'Transport upgrade redirection observed in the response redirect chain.',
      evidence: {
        source: 'HTTP Redirect Sequence',
        observedKey: '301 / 302 Redirection',
        observedValue: `Hop 1: ${httpFinding?.redirects[0]?.url} (${httpFinding?.redirects[0]?.statusCode})`,
      },
    });
  }

  // ==========================================
  // 2. Strict-Transport-Security (HSTS)
  // ==========================================
  if (hsts.present) {
    observations.push({
      id: 'sec-hsts',
      category: 'hsts',
      title: 'Strict-Transport-Security (HSTS)',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: hsts.rawHeader,
      fact: `HSTS header observed: max-age=${hsts.maxAge}${hsts.includeSubDomains ? '; includeSubDomains' : ''}${hsts.preload ? '; preload' : ''}.`,
      context: 'HSTS instructs compliant web browsers to only interact with the domain over HTTPS for the declared policy duration, preventing SSL stripping.',
      assessment: `HSTS policy active with ${hsts.maxAgeFormatted || 'declared max-age'}${hsts.includeSubDomains ? ' and subdomains covered' : ''}.`,
      recommendation: hsts.isPreloadEligible ? 'Domain configuration appears eligible for browser HSTS preload list submission.' : undefined,
      evidence: {
        source: 'HTTP Response Header',
        observedKey: 'Strict-Transport-Security',
        observedValue: hsts.rawHeader,
      },
    });
  } else if (isFinalHttps) {
    observations.push({
      id: 'sec-hsts-missing',
      category: 'hsts',
      title: 'Strict-Transport-Security (HSTS)',
      status: 'MISSING',
      severity: 'REVIEW',
      observedValue: null,
      fact: 'Strict-Transport-Security response header was not observed.',
      context: 'Without HSTS, browsers may initially attempt plaintext HTTP connections before being redirected, leaving a window for interception.',
      assessment: 'HSTS policy is not currently declared in the web response headers.',
      recommendation: 'Review whether declaring Strict-Transport-Security with a gradual max-age rollout is appropriate.',
      evidence: {
        source: 'HTTP Response Headers',
        observedKey: 'Strict-Transport-Security',
        observedValue: 'Header not present in response',
      },
      technologyContext: hasCdn ? 'Some edge CDN services allow enabling HSTS directly in edge delivery settings.' : undefined,
    });
  }

  // ==========================================
  // 3. Content-Security-Policy (CSP)
  // ==========================================
  const rawCsp = getHeaderValue(headers, 'content-security-policy');
  const rawCspReportOnly = getHeaderValue(headers, 'content-security-policy-report-only');
  const activeCsp = rawCsp || rawCspReportOnly;
  const csp = parseCsp(activeCsp);

  if (csp.present) {
    const isReportOnly = !rawCsp && !!rawCspReportOnly;
    observations.push({
      id: 'sec-csp',
      category: 'content_security_policy',
      title: isReportOnly ? 'Content-Security-Policy (Report-Only)' : 'Content-Security-Policy (CSP)',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: csp.rawPolicy,
      fact: `Content-Security-Policy header observed with ${csp.directives.length} directives declared.`,
      context: 'Content-Security-Policy restricts browser loading of executable scripts, stylesheets, frames, and multimedia to designated trusted sources.',
      assessment: `CSP active (${csp.directives.map((d) => d.directive).slice(0, 4).join(', ')}${csp.directives.length > 4 ? '...' : ''}).`,
      recommendation: (csp.allowsUnsafeInline || csp.allowsUnsafeEval)
        ? "Policy includes 'unsafe-inline' or 'unsafe-eval' keywords; review whether nonces or hashes could replace broad inline allowances."
        : undefined,
      evidence: {
        source: isReportOnly ? 'HTTP Header (Report-Only)' : 'HTTP Response Header',
        observedKey: isReportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
        observedValue: csp.rawPolicy,
      },
    });
  } else {
    observations.push({
      id: 'sec-csp-missing',
      category: 'content_security_policy',
      title: 'Content-Security-Policy (CSP)',
      status: 'MISSING',
      severity: 'REVIEW',
      observedValue: null,
      fact: 'Content-Security-Policy header was not observed in the HTTP response.',
      context: 'CSP provides browser-side defense-in-depth against cross-site scripting (XSS) and unauthorized resource injection.',
      assessment: 'No Content-Security-Policy restrictions observed.',
      recommendation: 'Review whether a Content-Security-Policy is appropriate for this application.',
      evidence: {
        source: 'HTTP Response Headers',
        observedKey: 'Content-Security-Policy',
        observedValue: 'Header not present in response',
      },
      technologyContext: detectedCms ? `${detectedCms.name} often requires careful CSP definition to accommodate dynamic plugins and themes.` : undefined,
    });
  }

  // ==========================================
  // 4. Content Type Protection (X-Content-Type-Options)
  // ==========================================
  const rawXcto = getHeaderValue(headers, 'x-content-type-options');
  if (rawXcto) {
    const isNosniff = rawXcto.toLowerCase().includes('nosniff');
    observations.push({
      id: 'sec-xcto',
      category: 'content_type',
      title: 'MIME Type Sniffing Protection',
      status: isNosniff ? 'PRESENT' : 'PARTIAL',
      severity: 'INFO',
      observedValue: rawXcto,
      fact: `X-Content-Type-Options: ${rawXcto} was observed.`,
      context: 'Instructs the browser to strictly respect declared Content-Type headers rather than guessing (sniffing) alternative MIME types.',
      assessment: isNosniff ? 'MIME sniffing protection enabled with "nosniff".' : `Observed value "${rawXcto}".`,
      evidence: {
        source: 'HTTP Response Header',
        observedKey: 'X-Content-Type-Options',
        observedValue: rawXcto,
      },
    });
  } else {
    observations.push({
      id: 'sec-xcto-missing',
      category: 'content_type',
      title: 'MIME Type Sniffing Protection',
      status: 'MISSING',
      severity: 'REVIEW',
      observedValue: null,
      fact: 'X-Content-Type-Options header was not observed.',
      context: 'Without "nosniff", older or non-standard browsers may attempt to interpret text/plain or image files as executable scripts.',
      assessment: 'No MIME sniffing restriction observed.',
      recommendation: 'Review whether declaring "X-Content-Type-Options: nosniff" aligns with content serving requirements.',
      evidence: {
        source: 'HTTP Response Headers',
        observedKey: 'X-Content-Type-Options',
        observedValue: 'Header not present in response',
      },
    });
  }

  // ==========================================
  // 5. Clickjacking & Framing Restrictions
  // ==========================================
  const rawXfo = getHeaderValue(headers, 'x-frame-options');
  const hasCspFrameAncestors = csp.hasFrameAncestors;
  const cspFrameAncestorsDirective = csp.directives.find((d) => d.directive === 'frame-ancestors');
  const cspFrameAncestorsVal = cspFrameAncestorsDirective ? cspFrameAncestorsDirective.values.join(' ') : null;

  const framingProtectionObserved = !!rawXfo || hasCspFrameAncestors;
  let framingSummary = 'No framing restriction observed.';
  if (rawXfo && hasCspFrameAncestors) {
    framingSummary = `Protected via both X-Frame-Options (${rawXfo}) and CSP frame-ancestors (${cspFrameAncestorsVal})`;
  } else if (rawXfo) {
    framingSummary = `Protected via X-Frame-Options: ${rawXfo}`;
  } else if (hasCspFrameAncestors) {
    framingSummary = `Protected via CSP frame-ancestors: ${cspFrameAncestorsVal}`;
  }

  const framingDetail: FramingProtectionDetail = {
    hasXFrameOptions: !!rawXfo,
    xFrameOptionsValue: rawXfo,
    hasCspFrameAncestors,
    cspFrameAncestorsValue: cspFrameAncestorsVal,
    protectionObserved: framingProtectionObserved,
    summary: framingSummary,
  };

  if (framingProtectionObserved) {
    observations.push({
      id: 'sec-framing',
      category: 'clickjacking',
      title: 'Framing & Clickjacking Controls',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: rawXfo || cspFrameAncestorsVal,
      fact: framingSummary,
      context: 'Framing controls instruct browsers whether a page may be embedded inside <iframe> or <frame> elements on third-party origins.',
      assessment: 'Framing restriction controls observed in response configuration.',
      evidence: {
        source: rawXfo ? 'X-Frame-Options Header' : 'CSP frame-ancestors Directive',
        observedKey: rawXfo ? 'X-Frame-Options' : 'Content-Security-Policy',
        observedValue: rawXfo || cspFrameAncestorsVal,
      },
    });
  } else {
    observations.push({
      id: 'sec-framing-missing',
      category: 'clickjacking',
      title: 'Framing & Clickjacking Controls',
      status: 'MISSING',
      severity: 'REVIEW',
      observedValue: null,
      fact: 'No framing restriction observed.',
      context: 'Framing restrictions (such as X-Frame-Options or CSP frame-ancestors) prevent unauthorized third parties from embedding the site in opaque overlay frames.',
      assessment: 'Neither X-Frame-Options nor CSP frame-ancestors was observed in response headers.',
      recommendation: 'Review whether framing controls (e.g. DENY, SAMEORIGIN, or CSP frame-ancestors) should be declared.',
      evidence: {
        source: 'HTTP Response Headers',
        observedKey: 'X-Frame-Options / frame-ancestors',
        observedValue: 'Neither control present',
      },
    });
  }

  // ==========================================
  // 6. Referrer-Policy
  // ==========================================
  const rawReferrer = getHeaderValue(headers, 'referrer-policy');
  if (rawReferrer) {
    observations.push({
      id: 'sec-referrer-policy',
      category: 'security_headers',
      title: 'Referrer-Policy',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: rawReferrer,
      fact: `Referrer-Policy: ${rawReferrer} was observed.`,
      context: 'Controls what referrer information (URL path and query parameters) the browser sends when navigating to external destinations.',
      assessment: `Active referrer policy "${rawReferrer}" declared.`,
      evidence: {
        source: 'HTTP Response Header',
        observedKey: 'Referrer-Policy',
        observedValue: rawReferrer,
      },
    });
  } else {
    observations.push({
      id: 'sec-referrer-missing',
      category: 'security_headers',
      title: 'Referrer-Policy',
      status: 'MISSING',
      severity: 'REVIEW',
      observedValue: null,
      fact: 'Referrer-Policy header was not observed.',
      context: 'When omitted, modern standards-compliant browsers default to strict-origin-when-cross-origin, but explicit declaration ensures consistent cross-browser privacy.',
      assessment: 'No explicit Referrer-Policy header declared; browser defaults apply.',
      recommendation: 'Review whether explicitly declaring Referrer-Policy: strict-origin-when-cross-origin aligns with privacy objectives.',
      evidence: {
        source: 'HTTP Response Headers',
        observedKey: 'Referrer-Policy',
        observedValue: 'Header not present in response',
      },
    });
  }

  // ==========================================
  // 7. Permissions-Policy
  // ==========================================
  const rawPermissions = getHeaderValue(headers, 'permissions-policy') || getHeaderValue(headers, 'feature-policy');
  if (rawPermissions) {
    observations.push({
      id: 'sec-permissions-policy',
      category: 'permissions_policy',
      title: 'Permissions-Policy',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: rawPermissions,
      fact: `Permissions-Policy header observed: ${rawPermissions.substring(0, 80)}${rawPermissions.length > 80 ? '...' : ''}`,
      context: 'Permissions-Policy allows site owners to selectively restrict browser hardware access (e.g. camera, microphone, geolocation, sensors).',
      assessment: 'Browser hardware feature restrictions declared.',
      evidence: {
        source: 'HTTP Response Header',
        observedKey: 'Permissions-Policy',
        observedValue: rawPermissions,
      },
    });
  } else {
    observations.push({
      id: 'sec-permissions-missing',
      category: 'permissions_policy',
      title: 'Permissions-Policy',
      status: 'MISSING',
      severity: 'REVIEW',
      observedValue: null,
      fact: 'Permissions-Policy header was not observed.',
      context: 'Permissions-Policy allows developers to restrict browser APIs that the application does not intend to use.',
      assessment: 'No explicit Permissions-Policy declared in response headers.',
      recommendation: 'Review whether defining a Permissions-Policy to explicitly disallow unused device APIs is beneficial.',
      evidence: {
        source: 'HTTP Response Headers',
        observedKey: 'Permissions-Policy',
        observedValue: 'Header not present in response',
      },
    });
  }

  // Legacy header note (e.g. X-XSS-Protection)
  const rawXxss = getHeaderValue(headers, 'x-xss-protection');
  if (rawXxss) {
    observations.push({
      id: 'sec-xxss-legacy',
      category: 'security_headers',
      title: 'X-XSS-Protection (Legacy)',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: rawXxss,
      fact: `X-XSS-Protection: ${rawXxss} observed.`,
      context: 'X-XSS-Protection is a legacy header originally used by older browsers. Modern web standards emphasize Content-Security-Policy instead.',
      assessment: 'Legacy XSS filter header present; modern browsers rely on CSP.',
      evidence: {
        source: 'HTTP Response Header',
        observedKey: 'X-XSS-Protection',
        observedValue: rawXxss,
      },
    });
  }

  // ==========================================
  // 8. Cookie Security Analysis
  // ==========================================
  const cookieData = parseCookies(headers);

  if (cookieData.summary.status === 'COOKIES_OBSERVED') {
    const total = cookieData.summary.totalCount;
    const insecureCookies = cookieData.items.filter((c) => !c.secure);
    const scriptAccessibleSessionCookies = cookieData.items.filter((c) => c.isSessionCookie && !c.httpOnly);
    const noSameSiteCookies = cookieData.items.filter((c) => c.sameSite === 'Not Set');

    if (insecureCookies.length > 0 && isFinalHttps) {
      observations.push({
        id: 'sec-cookie-secure-missing',
        category: 'cookie_security',
        title: 'Cookie "Secure" Flag Observation',
        status: 'PARTIAL',
        severity: 'ATTENTION',
        observedValue: `${cookieData.summary.secureCount} / ${total} Secure`,
        fact: `${insecureCookies.length} of ${total} observable cookies omit the "Secure" flag (${insecureCookies.map((c) => c.name).join(', ')}).`,
        context: 'The Secure attribute ensures cookies are exclusively transmitted over TLS encrypted connections, preventing eavesdropping.',
        assessment: 'Unflagged cookies could theoretically be transmitted over plaintext HTTP if accessed without encryption.',
        recommendation: 'Review whether all sensitive cookies set by this domain should include the Secure flag.',
        evidence: {
          source: 'HTTP Set-Cookie Headers',
          observedKey: 'Secure Attribute',
          observedValue: `${insecureCookies.length} cookies lack Secure attribute`,
        },
      });
    }

    if (scriptAccessibleSessionCookies.length > 0) {
      observations.push({
        id: 'sec-cookie-httponly-missing',
        category: 'cookie_security',
        title: 'Session Cookie "HttpOnly" Flag Observation',
        status: 'PARTIAL',
        severity: 'ATTENTION',
        observedValue: `${cookieData.summary.httpOnlyCount} / ${total} HttpOnly`,
        fact: `Session-related cookie (${scriptAccessibleSessionCookies.map((c) => c.name).join(', ')}) omits the "HttpOnly" flag.`,
        context: 'HttpOnly prevents client-side JavaScript from accessing the cookie via document.cookie, mitigating session token exfiltration via XSS.',
        assessment: 'Client-side script access to observable session cookies is not restricted by HttpOnly.',
        recommendation: 'Review whether authentication and session tokens should enforce the HttpOnly attribute.',
        evidence: {
          source: 'HTTP Set-Cookie Headers',
          observedKey: 'HttpOnly Attribute',
          observedValue: `Session cookie "${scriptAccessibleSessionCookies[0].name}" missing HttpOnly`,
        },
      });
    }

    if (cookieData.summary.secureCount === total && cookieData.summary.httpOnlyCount >= Math.floor(total / 2)) {
      observations.push({
        id: 'sec-cookie-hygiene',
        category: 'cookie_security',
        title: 'Cookie Security Controls',
        status: 'PRESENT',
        severity: 'INFO',
        observedValue: `${cookieData.summary.secureCount}/${total} Secure, ${cookieData.summary.httpOnlyCount}/${total} HttpOnly`,
        fact: `All ${total} observable cookies declare the Secure flag.`,
        context: 'Enforcing Secure and SameSite attributes safeguards session integrity and prevents cross-site request forgery.',
        assessment: 'Solid cookie security attributes observed across response cookies.',
        evidence: {
          source: 'HTTP Set-Cookie Headers',
          observedKey: 'Cookie Attributes',
          observedValue: `${total} cookies audited`,
        },
      });
    }
  }

  // ==========================================
  // 9. TLS / Cryptography Observation
  // ==========================================
  const tlsDetail: TlsObservationDetail = tlsObservation || {
    available: false,
    status: 'NOT_AVAILABLE',
    unavailabilityReason: 'TLS handshake details not available in the current environment.',
  };

  if (tlsDetail.available && tlsDetail.status === 'EXPIRED') {
    observations.push({
      id: 'sec-tls-expired',
      category: 'tls_cryptography',
      title: 'TLS Certificate Validity',
      status: 'ERROR',
      severity: 'ATTENTION',
      observedValue: `Expired: ${tlsDetail.validTo}`,
      fact: `TLS certificate expired on ${tlsDetail.validTo ? new Date(tlsDetail.validTo).toUTCString() : 'date'}.`,
      context: 'Expired TLS certificates trigger prominent browser security warnings and break automated client connections.',
      assessment: 'Target certificate has exceeded its validity window.',
      recommendation: 'Renew or re-issue the TLS/X.509 certificate for this domain immediately.',
      evidence: {
        source: 'X.509 Peer Certificate',
        observedKey: 'valid_to',
        observedValue: tlsDetail.validTo,
      },
    });
  } else if (tlsDetail.available && tlsDetail.isExpiringSoon) {
    observations.push({
      id: 'sec-tls-expiring-soon',
      category: 'tls_cryptography',
      title: 'TLS Certificate Expiration Window',
      status: 'PARTIAL',
      severity: 'ATTENTION',
      observedValue: `${tlsDetail.daysRemaining} days remaining`,
      fact: `TLS certificate will expire in ${tlsDetail.daysRemaining} days (valid until ${tlsDetail.validTo ? new Date(tlsDetail.validTo).toLocaleDateString() : 'date'}).`,
      context: 'Certificates approaching expiration require prompt renewal to ensure continuity of secure communication.',
      assessment: 'Certificate renewal window is active.',
      recommendation: 'Verify automated certificate renewal jobs (e.g. Let’s Encrypt / Certbot / Cloud CDN).',
      evidence: {
        source: 'X.509 Peer Certificate',
        observedKey: 'valid_to',
        observedValue: `${tlsDetail.daysRemaining} days remaining`,
      },
    });
  } else if (tlsDetail.available) {
    observations.push({
      id: 'sec-tls-valid',
      category: 'tls_cryptography',
      title: 'TLS Certificate Validity',
      status: 'PRESENT',
      severity: 'INFO',
      observedValue: `${tlsDetail.protocol || 'TLS'} - ${tlsDetail.daysRemaining} days remaining`,
      fact: `Valid certificate issued by ${tlsDetail.issuer?.organization || tlsDetail.issuer?.commonName || 'Certificate Authority'} (valid until ${tlsDetail.validTo ? new Date(tlsDetail.validTo).toLocaleDateString() : 'unknown'}).`,
      context: 'Cryptographic identification of the target origin established through verified X.509 trust chain.',
      assessment: `Valid TLS certificate in effect with ${tlsDetail.daysRemaining} days remaining.`,
      evidence: {
        source: 'X.509 Peer Certificate Handshake',
        observedKey: 'Subject & Issuer',
        observedValue: `Subject: ${tlsDetail.subject?.commonName || domain}, Issuer: ${tlsDetail.issuer?.commonName || 'CA'}`,
      },
    });
  } else if (isFinalHttps) {
    observations.push({
      id: 'sec-tls-unavailable',
      category: 'tls_cryptography',
      title: 'TLS Certificate Deep Telemetry',
      status: 'NOT_OBSERVABLE',
      severity: 'INFO',
      observedValue: null,
      fact: 'TLS details not available in current analysis environment.',
      context: tlsDetail.unavailabilityReason || 'Direct TLS handshake inspection is reserved for server-side execution.',
      assessment: 'Underlying certificate details were not extracted in this probe session.',
      evidence: {
        source: 'TLS Handshake Probe',
        observedKey: 'Status',
        observedValue: tlsDetail.unavailabilityReason || 'Not Observable',
      },
    });
  }

  // ==========================================
  // 10. Summary Calculations (No Arbitrary Score!)
  // ==========================================
  const positiveObservationsCount = observations.filter((o) => o.severity === 'INFO').length;
  const reviewItemsCount = observations.filter((o) => o.severity === 'REVIEW').length;
  const attentionItemsCount = observations.filter((o) => o.severity === 'ATTENTION').length;
  const unavailableChecksCount = observations.filter((o) => o.status === 'NOT_OBSERVABLE').length;

  // 6 core headers: CSP, HSTS, X-Content-Type-Options, X-Frame-Options/framing, Referrer-Policy, Permissions-Policy
  let secHeadersObserved = 0;
  if (csp.present) secHeadersObserved++;
  if (hsts.present) secHeadersObserved++;
  if (rawXcto) secHeadersObserved++;
  if (framingProtectionObserved) secHeadersObserved++;
  if (rawReferrer) secHeadersObserved++;
  if (rawPermissions) secHeadersObserved++;

  let cookieControlsStatus: SecuritySummaryData['cookieControlsStatus'] = 'NO_COOKIES';
  if (cookieData.summary.totalCount === 0) {
    cookieControlsStatus = 'NO_COOKIES';
  } else if (cookieData.summary.secureCount === cookieData.summary.totalCount && cookieData.summary.httpOnlyCount === cookieData.summary.totalCount) {
    cookieControlsStatus = 'ALL_OBSERVED';
  } else if (cookieData.summary.secureCount >= Math.floor(cookieData.summary.totalCount / 2)) {
    cookieControlsStatus = 'MOSTLY_OBSERVED';
  } else if (cookieData.summary.secureCount > 0) {
    cookieControlsStatus = 'PARTIALLY_OBSERVED';
  } else {
    cookieControlsStatus = 'NOT_OBSERVED';
  }

  let tlsDetailsStatus: SecuritySummaryData['tlsDetailsStatus'] = 'NOT_AVAILABLE';
  if (!isFinalHttps) {
    tlsDetailsStatus = 'UNENCRYPTED';
  } else if (tlsDetail.available) {
    if (tlsDetail.isExpired) tlsDetailsStatus = 'EXPIRED';
    else if (tlsDetail.isExpiringSoon) tlsDetailsStatus = 'EXPIRING_SOON';
    else tlsDetailsStatus = 'AVAILABLE';
  } else {
    tlsDetailsStatus = 'NOT_AVAILABLE';
  }

  let httpsStatus: SecuritySummaryData['httpsStatus'] = 'HTTP_ONLY';
  if (isFinalHttps) {
    httpsStatus = redirectedFromHttpToHttps ? 'REDIRECTED' : 'ENABLED';
  } else {
    httpsStatus = 'NOT_OBSERVED';
  }

  const summary: SecuritySummaryData = {
    totalChecksPerformed: observations.length,
    positiveObservationsCount,
    reviewItemsCount,
    attentionItemsCount,
    unavailableChecksCount,
    httpsStatus,
    securityHeadersObservedCount: secHeadersObserved,
    securityHeadersTotalChecked: 6,
    cookieControlsStatus,
    tlsDetailsStatus,
  };

  return {
    domain,
    hostname,
    targetUrl,
    analyzedAt: new Date().toISOString(),
    summary,
    https: httpsDetail,
    csp,
    hsts,
    framing: framingDetail,
    cookies: cookieData,
    tls: tlsDetail,
    observations,
    rawAnalyzedHeaders,
  };
}
