import {
  HttpFinding,
  HttpHeaderItem,
  HttpInspectionError,
  PageMetadata,
  RedirectHop,
  WebResourceMetaTag,
  WebResourceTelemetry,
} from '../src/types';
import { getHttpStatusExplanation } from '../src/utils/httpStatusExplainer';

function isPrivateIpOrHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.includes('metadata.google.internal')
  ) {
    return true;
  }

  // IPv4 checks
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, o1, o2] = ipv4Match.map(Number);
    if (o1 === 10) return true; // 10.0.0.0/8
    if (o1 === 127) return true; // 127.0.0.0/8
    if (o1 === 169 && o2 === 254) return true; // 169.254.0.0/16 Link-local
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true; // 172.16.0.0/12
    if (o1 === 192 && o2 === 168) return true; // 192.168.0.0/16
    if (o1 === 0) return true;
  }

  return false;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const SECURITY_HEADER_NAMES = new Set([
  'strict-transport-security',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-opener-policy',
  'cross-origin-embedder-policy',
  'cross-origin-resource-policy',
  'x-xss-protection',
]);

function categorizeHeader(name: string): HttpHeaderItem['category'] {
  const lower = name.toLowerCase();
  if (SECURITY_HEADER_NAMES.has(lower)) return 'security';
  if (
    lower.includes('cache') ||
    lower.includes('age') ||
    lower === 'etag' ||
    lower === 'expires' ||
    lower === 'last-modified' ||
    lower === 'pragma'
  ) {
    return 'caching';
  }
  if (
    lower === 'server' ||
    lower === 'x-powered-by' ||
    lower === 'via' ||
    lower.includes('cloudflare') ||
    lower.includes('fastly') ||
    lower.includes('varnish') ||
    lower.includes('nginx')
  ) {
    return 'server';
  }
  if (
    lower === 'connection' ||
    lower === 'keep-alive' ||
    lower === 'upgrade' ||
    lower === 'alt-svc' ||
    lower === 'host'
  ) {
    return 'transport';
  }
  if (
    lower.includes('content') ||
    lower === 'accept' ||
    lower.includes('encoding') ||
    lower.includes('length') ||
    lower.includes('type')
  ) {
    return 'content';
  }
  return 'other';
}

function detectDocumentType(
  contentType: string,
  bodyText: string
): HttpFinding['documentType'] {
  const lowerCt = contentType.toLowerCase();
  if (lowerCt.includes('text/html') || lowerCt.includes('application/xhtml+xml')) {
    return 'HTML';
  }
  if (
    lowerCt.includes('application/json') ||
    lowerCt.includes('+json') ||
    lowerCt.includes('text/json')
  ) {
    return 'JSON';
  }
  if (
    lowerCt.includes('application/xml') ||
    lowerCt.includes('text/xml') ||
    lowerCt.includes('+xml')
  ) {
    return 'XML';
  }
  if (lowerCt.includes('text/plain')) {
    return 'Plain Text';
  }
  if (
    lowerCt.includes('image/') ||
    lowerCt.includes('video/') ||
    lowerCt.includes('audio/') ||
    lowerCt.includes('application/pdf') ||
    lowerCt.includes('application/octet-stream')
  ) {
    return 'Binary / Media';
  }

  // Sniff from body if Content-Type was generic
  if (bodyText) {
    const trimmed = bodyText.trim();
    if (trimmed.startsWith('<!DOCTYPE html') || /<html[\s>]/i.test(trimmed)) {
      return 'HTML';
    }
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      return 'JSON';
    }
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<rss')) {
      return 'XML';
    }
  }

  return 'Other';
}

function extractPageMetadata(html: string, contentType: string): PageMetadata | null {
  if (!html || (!contentType.includes('html') && !/<html[\s>]/i.test(html))) {
    return null;
  }

  // Title: <title[^>]*>([\s\S]*?)<\/title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;

  // Description: <meta name="description" content="..."
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : null;

  // Canonical: <link rel="canonical" href="..."
  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : null;

  // Language: <html ... lang="..."
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  const language = langMatch ? langMatch[1].trim() : null;

  // Charset: <meta charset="..." or from content-type header
  const charsetMetaMatch = html.match(/<meta[^>]+charset=["']([^"']*)["']/i);
  const charsetHeaderMatch = contentType.match(/charset=([a-zA-Z0-9_-]+)/i);
  const charset = charsetMetaMatch
    ? charsetMetaMatch[1].trim()
    : charsetHeaderMatch
    ? charsetHeaderMatch[1].trim()
    : null;

  // Viewport
  const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i);
  const viewport = viewportMatch ? viewportMatch[1].trim() : null;

  // Generator / CMS
  const generatorMatch = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)["']/i);
  const generator = generatorMatch ? generatorMatch[1].trim() : null;

  // OpenGraph Title
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
  const openGraphTitle = ogTitleMatch ? ogTitleMatch[1].trim() : null;

  return {
    title: title || null,
    description: description || null,
    canonicalUrl: canonicalUrl || null,
    language: language || null,
    charset: charset || null,
    viewport: viewport || null,
    generator: generator || null,
    openGraphTitle: openGraphTitle || null,
  };
}

function extractWebResources(
  html: string,
  headers: HttpHeaderItem[]
): WebResourceTelemetry | undefined {
  if (!html) return undefined;

  const scripts: string[] = [];
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (scripts.length < 100) {
      scripts.push(match[1].trim());
    }
  }

  // Inline script snippets (scan for recognizable signatures)
  const inlineScriptSnippets: string[] = [];
  const inlineScriptRegex = /<script(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineMatch;
  while ((inlineMatch = inlineScriptRegex.exec(html)) !== null) {
    const text = inlineMatch[1].trim();
    if (text.length > 0 && inlineScriptSnippets.length < 80) {
      if (
        /gtag|gtm|analytics|fbq|pixel|stripe|paypal|shopify|__next|__nuxt|remix|webpack|drupal|wp-|tailwind|react|vue|angular|svelte|payment|checkout|card|visa|mastercard|amex|discover|apple[-_]?pay|google[-_]?pay|shop[-_]?pay|klarna|afterpay|affirm|adyen|square/i.test(
          text
        )
      ) {
        inlineScriptSnippets.push(text.slice(0, 800));
      }
    }
  }

  // Check Schema.org JSON-LD scripts for payment acceptance disclosures
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      const jsonStr = JSON.stringify(parsed).toLowerCase();
      if (jsonStr.includes('paymentaccepted') || jsonStr.includes('acceptedpaymentmethod')) {
        inlineScriptSnippets.push(jsonLdMatch[1].slice(0, 1000));
      }
    } catch {
      // ignore parse failures on malformed ld+json
    }
  }

  const stylesheets: string[] = [];
  const linkRegex =
    /<link[^>]+(?:rel=["']stylesheet["'][^>]+href=["']([^"']+)["']|href=["']([^"']+)["'][^>]+rel=["']stylesheet["'])/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1] || linkMatch[2];
    if (href && stylesheets.length < 50) {
      stylesheets.push(href.trim());
    }
  }

  const metaTags: WebResourceMetaTag[] = [];
  const metaRegex = /<meta[^>]+>/gi;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    const tag = metaMatch[0];
    const nameMatch = tag.match(/name=["']([^"']*)["']/i);
    const propMatch = tag.match(/property=["']([^"']*)["']/i);
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);
    if ((nameMatch || propMatch) && contentMatch && metaTags.length < 60) {
      metaTags.push({
        name: nameMatch ? nameMatch[1] : undefined,
        property: propMatch ? propMatch[1] : undefined,
        content: contentMatch[1],
      });
    }
  }

  // Extract cookies from Set-Cookie headers
  const cookies: string[] = [];
  for (const h of headers) {
    if (h.name === 'set-cookie') {
      const cookieName = h.value.split(';')[0]?.split('=')[0]?.trim();
      if (cookieName) cookies.push(cookieName);
    }
  }

  // Common DOM markers check: Frontend, CSS, and Card/Payment acceptance
  const domMarkers: string[] = [];
  const markerChecks: Array<{ pattern: RegExp; marker: string }> = [
    // Frameworks & Runtimes
    { pattern: /id=["']__next["']/i, marker: 'id="__next"' },
    { pattern: /id=["']__nuxt["']/i, marker: 'id="__nuxt"' },
    { pattern: /id=["']root["']/i, marker: 'id="root"' },
    { pattern: /id=["']app["']/i, marker: 'id="app"' },
    { pattern: /data-reactroot/i, marker: 'data-reactroot' },
    { pattern: /data-reactid/i, marker: 'data-reactid' },
    { pattern: /data-react-helmet/i, marker: 'data-react-helmet' },
    { pattern: /_reactListening|__reactFiber|__reactEvents/i, marker: 'framework:react' },
    { pattern: /ng-version/i, marker: 'ng-version' },
    { pattern: /data-v-[a-f0-9]{6,}/i, marker: 'data-v-* (Vue scoped)' },
    { pattern: /data-wf-page|data-wf-site/i, marker: 'data-wf-page/site (Webflow)' },
    { pattern: /wp-content\/themes/i, marker: 'wp-content/themes' },
    { pattern: /wp-content\/plugins/i, marker: 'wp-content/plugins' },
    { pattern: /wp-includes/i, marker: 'wp-includes' },
    { pattern: /astro-island/i, marker: 'astro-island' },
    { pattern: /class=["'][^"']*svelte-[a-z0-9]+/i, marker: 'svelte-* class' },
    { pattern: /cdn\.shopify\.com/i, marker: 'cdn.shopify.com' },

    // CSS Frameworks
    { pattern: /--tw-(?:ring|shadow|border|translate|rotate|skew|scale|space|text|bg)/i, marker: 'tailwindcss-custom-properties' },
    { pattern: /--bs-(?:primary|secondary|body|gutter|font)/i, marker: 'bootstrap-custom-properties' },
    { pattern: /class=["'][^"']*(?:container-fluid|navbar-expand|btn-primary)/i, marker: 'bootstrap-classes' },

    // Card Payment Networks (Visa, Mastercard, Amex, Discover, Diners Club, JCB, UnionPay, Maestro)
    {
      pattern: /aria-label=["'](?:pay with )?visa["']|alt=["'](?:pay with )?visa(?: payment| card| logo)?["']|class=["'][^"']*(?:payment-icon--visa|icon-visa|icon--visa|fa-cc-visa|svg-icon-visa|badge--visa|payment-badge-visa)|id=["'](?:icon-visa|visa-icon|svg-visa|pi-visa)["']|<title[^>]*>Visa<\/title>|"paymentaccepted"[^}]*visa/i,
      marker: 'payment-card:visa',
    },
    {
      pattern: /aria-label=["'](?:pay with )?mastercard["']|alt=["'](?:pay with )?mastercard(?: payment| card| logo)?["']|class=["'][^"']*(?:payment-icon--mastercard|icon-mastercard|icon--mastercard|fa-cc-mastercard|svg-icon-mastercard|badge--mastercard|payment-badge-mastercard)|id=["'](?:icon-mastercard|mastercard-icon|svg-mastercard|pi-master|pi-mastercard)["']|<title[^>]*>Mastercard<\/title>|"paymentaccepted"[^}]*mastercard/i,
      marker: 'payment-card:mastercard',
    },
    {
      pattern: /aria-label=["'](?:pay with )?(?:american express|amex)["']|alt=["'](?:pay with )?(?:american express|amex)(?: payment| card| logo)?["']|class=["'][^"']*(?:payment-icon--american_express|payment-icon--amex|icon-amex|icon--amex|fa-cc-amex|svg-icon-amex|badge--amex)|id=["'](?:icon-american_express|icon-amex|amex-icon|svg-amex|pi-american_express|pi-amex)["']|<title[^>]*>(?:American Express|Amex)<\/title>|"paymentaccepted"[^}]*(?:american express|amex)/i,
      marker: 'payment-card:amex',
    },
    {
      pattern: /aria-label=["'](?:pay with )?discover["']|alt=["'](?:pay with )?discover(?: card| logo)?["']|class=["'][^"']*(?:payment-icon--discover|icon-discover|icon--discover|fa-cc-discover|svg-icon-discover)|id=["'](?:icon-discover|discover-icon|svg-discover|pi-discover)["']|<title[^>]*>Discover<\/title>|"paymentaccepted"[^}]*discover/i,
      marker: 'payment-card:discover',
    },
    {
      pattern: /aria-label=["'](?:pay with )?diners club["']|alt=["'](?:pay with )?diners club["']|class=["'][^"']*(?:payment-icon--diners_club|icon-diners|fa-cc-diners-club)|id=["'](?:icon-diners_club|pi-diners_club)["']/i,
      marker: 'payment-card:diners_club',
    },
    {
      pattern: /aria-label=["'](?:pay with )?jcb["']|alt=["'](?:pay with )?jcb["']|class=["'][^"']*(?:payment-icon--jcb|icon-jcb|fa-cc-jcb)|id=["'](?:icon-jcb|pi-jcb)["']/i,
      marker: 'payment-card:jcb',
    },
    {
      pattern: /aria-label=["'](?:pay with )?(?:unionpay|union pay)["']|alt=["'](?:pay with )?(?:unionpay|union pay)["']|class=["'][^"']*(?:payment-icon--unionpay|icon-unionpay)|id=["'](?:icon-unionpay|pi-unionpay)["']/i,
      marker: 'payment-card:unionpay',
    },
    {
      pattern: /aria-label=["'](?:pay with )?maestro["']|alt=["'](?:pay with )?maestro["']|class=["'][^"']*(?:payment-icon--maestro|icon-maestro|fa-cc-maestro)|id=["'](?:icon-maestro|pi-maestro)["']/i,
      marker: 'payment-card:maestro',
    },

    // Digital Wallets & Accelerated Checkouts
    {
      pattern: /apple-pay-button|data-apple-pay|aria-label=["'](?:pay with )?apple pay["']|alt=["'](?:pay with )?apple pay(?: logo)?["']|class=["'][^"']*(?:apple-pay-button|payment-icon--apple_pay|icon-apple-pay|fa-cc-apple-pay)|id=["'](?:icon-apple_pay|apple-pay-button|pi-apple_pay)["']|<title[^>]*>Apple Pay<\/title>/i,
      marker: 'payment-wallet:apple_pay',
    },
    {
      pattern: /google-pay-button|aria-label=["'](?:pay with )?google pay["']|alt=["'](?:pay with )?google pay(?: logo)?["']|class=["'][^"']*(?:google-pay-button|payment-icon--google_pay|icon-google-pay)|id=["'](?:icon-google_pay|google-pay-button|pi-google_pay)["']|<title[^>]*>Google Pay<\/title>/i,
      marker: 'payment-wallet:google_pay',
    },
    {
      pattern: /shopify-payment-button|aria-label=["'](?:pay with )?(?:shop pay|shopify pay)["']|alt=["'](?:pay with )?(?:shop pay|shopify pay)(?: logo)?["']|class=["'][^"']*(?:shopify-payment-button|payment-icon--shopify_pay|payment-icon--shop_pay|shop-pay-button)|id=["'](?:icon-shopify_pay|icon-shop_pay|pi-shopify_pay)["']|<title[^>]*>Shop Pay<\/title>/i,
      marker: 'payment-platform:shop_pay',
    },
    {
      pattern: /aria-label=["'](?:pay with )?amazon pay["']|alt=["'](?:pay with )?amazon pay["']|class=["'][^"']*(?:payment-icon--amazon_payments|amazon-pay-button)/i,
      marker: 'payment-wallet:amazon_pay',
    },

    // Processors & BNPL
    {
      pattern: /paypal\.Buttons|payment-icon--paypal|aria-label=["'](?:pay with )?paypal["']|alt=["'](?:pay with )?paypal["']|id=["'](?:icon-paypal|pi-paypal)["']|<title[^>]*>PayPal<\/title>/i,
      marker: 'payment-gateway:paypal',
    },
    {
      pattern: /js\.stripe\.com|checkout\.stripe\.com|data-stripe|stripe-elements|Stripe\(['"]pk_/i,
      marker: 'payment-gateway:stripe',
    },
    {
      pattern: /x\.klarnacdn\.net|aria-label=["'](?:pay with )?klarna["']|alt=["'](?:pay with )?klarna["']|class=["'][^"']*(?:payment-icon--klarna|klarna-badge)|id=["'](?:icon-klarna|pi-klarna)["']/i,
      marker: 'payment-bnpl:klarna',
    },
    {
      pattern: /afterpay-placement|aria-label=["'](?:pay with )?afterpay["']|alt=["'](?:pay with )?afterpay["']|class=["'][^"']*(?:payment-icon--afterpay|afterpay-badge)|id=["'](?:icon-afterpay|pi-afterpay)["']/i,
      marker: 'payment-bnpl:afterpay',
    },
    {
      pattern: /affirm-as-low-as|aria-label=["'](?:pay with )?affirm["']|alt=["'](?:pay with )?affirm["']|class=["'][^"']*(?:payment-icon--affirm|affirm-badge)|id=["'](?:icon-affirm|pi-affirm)["']/i,
      marker: 'payment-bnpl:affirm',
    },
  ];

  for (const check of markerChecks) {
    if (check.pattern.test(html)) {
      domMarkers.push(check.marker);
    }
  }

  // Preserve generous HTML snippet up to 512KB, including head, body, and footer sections
  let htmlSnippet: string;
  if (html.length <= 524288) {
    htmlSnippet = html;
  } else {
    // Keep first 384KB and footer 128KB so closing scripts, footer badges and checkout icons are preserved
    htmlSnippet = html.slice(0, 393216) + '\n<!-- TRUNCATED_MIDDLE_SECTION -->\n' + html.slice(-131072);
  }

  return {
    scripts,
    inlineScriptSnippets,
    stylesheets,
    metaTags,
    cookies,
    domMarkers,
    htmlSnippet,
  };
}

export async function inspectHttp(targetUrl: string): Promise<HttpFinding> {
  const parsedTarget = new URL(targetUrl);

  // SSRF guard
  if (isPrivateIpOrHost(parsedTarget.hostname)) {
    const err: HttpInspectionError = {
      code: 'BLOCKED_PRIVATE_IP',
      title: 'Target Address Restricted',
      message: 'Private loopback and internal network IP ranges are restricted.',
      technicalDetail: `Target host "${parsedTarget.hostname}" resolved to a prohibited private subnet or loopback interface.`,
      targetUrl,
    };
    throw err;
  }

  const maxRedirects = 10;
  const timeoutMs = 12000;
  let currentUrl = targetUrl;
  const redirects: RedirectHop[] = [];
  let hopIndex = 1;

  const overallStartTime = Date.now();
  let finalResponse: Response | null = null;
  let finalUrl = targetUrl;
  let finalDurationMs = 0;

  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (WebForensics/0.2; Public Inspector)';

  while (hopIndex <= maxRedirects) {
    const hopStart = Date.now();
    let res: Response;

    try {
      res = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: any) {
      const errorDuration = Date.now() - hopStart;
      let inspectionError: HttpInspectionError;

      const errName = err?.name || '';
      const errMsg = err?.message || String(err);
      const errCode = err?.cause?.code || err?.code || '';

      if (errName === 'TimeoutError' || errName === 'AbortError' || errCode === 'ETIMEDOUT') {
        inspectionError = {
          code: 'CONNECTION_TIMED_OUT',
          title: 'Connection Timed Out',
          message: `The target host did not respond within ${timeoutMs / 1000} seconds.`,
          technicalDetail: `Connection to ${currentUrl} exceeded ${timeoutMs}ms limit. (${errCode || errName})`,
          targetUrl: currentUrl,
        };
      } else if (
        errCode === 'ENOTFOUND' ||
        errMsg.includes('getaddrinfo ENOTFOUND') ||
        errMsg.includes('Could not resolve host')
      ) {
        inspectionError = {
          code: 'DNS_RESOLUTION_FAILED',
          title: 'DNS Resolution Failed',
          message: 'Unable to resolve the domain name. Verify the domain exists and public DNS is configured.',
          technicalDetail: `Host lookup failed for ${parsedTarget.hostname}: ${errMsg}`,
          targetUrl: currentUrl,
        };
      } else if (errCode === 'ECONNREFUSED' || errMsg.includes('ECONNREFUSED')) {
        inspectionError = {
          code: 'CONNECTION_REFUSED',
          title: 'Connection Refused',
          message: 'The remote host actively refused the TCP connection on the designated port.',
          technicalDetail: `Target host refused handshake: ${errCode || errMsg}`,
          targetUrl: currentUrl,
        };
      } else if (
        errCode?.startsWith?.('CERT_') ||
        errCode?.startsWith?.('SSL_') ||
        errMsg.includes('certificate') ||
        errMsg.includes('SSL')
      ) {
        inspectionError = {
          code: 'TLS_SECURITY_ERROR',
          title: 'TLS / SSL Negotiation Failed',
          message: 'Secure handshake failed due to an invalid, expired, or untrusted certificate authority.',
          technicalDetail: `Cryptographic negotiation rejected: ${errMsg} (${errCode})`,
          targetUrl: currentUrl,
        };
      } else {
        inspectionError = {
          code: 'NETWORK_ERROR',
          title: 'Connection Failed',
          message: 'Unable to retrieve a response from the target host.',
          technicalDetail: `Socket failure: ${errMsg} (code: ${errCode || 'UNKNOWN'})`,
          targetUrl: currentUrl,
        };
      }

      throw inspectionError;
    }

    const hopDuration = Date.now() - hopStart;
    const statusCode = res.status;
    const statusText = res.statusText || (statusCode === 200 ? 'OK' : '');
    const locationHeader = res.headers.get('location') || undefined;

    // Is this a redirect?
    const isRedirect =
      (statusCode >= 300 && statusCode < 400) ||
      statusCode === 301 ||
      statusCode === 302 ||
      statusCode === 303 ||
      statusCode === 307 ||
      statusCode === 308;

    if (isRedirect && locationHeader) {
      redirects.push({
        hopNumber: hopIndex,
        url: currentUrl,
        statusCode,
        statusText,
        locationHeader,
        responseTimeMs: hopDuration,
      });

      // Resolve destination
      try {
        const nextResolved = new URL(locationHeader, currentUrl).href;
        currentUrl = nextResolved;
        hopIndex++;
      } catch {
        // Cannot resolve location, break
        finalResponse = res;
        finalUrl = currentUrl;
        finalDurationMs = hopDuration;
        break;
      }
    } else {
      // Final response reached
      finalResponse = res;
      finalUrl = currentUrl;
      finalDurationMs = hopDuration;
      break;
    }
  }

  if (!finalResponse) {
    throw {
      code: 'NETWORK_ERROR',
      title: 'Redirect Limit Exceeded',
      message: 'Too many redirects encountered (exceeded 10 hops).',
      technicalDetail: `Target entered redirect loop across ${redirects.length} hops.`,
      targetUrl,
    } as HttpInspectionError;
  }

  // Parse Headers
  const headersList: HttpHeaderItem[] = [];
  finalResponse.headers.forEach((val, key) => {
    headersList.push({
      name: key.toLowerCase(),
      value: val,
      category: categorizeHeader(key),
      isSecurityHeader: SECURITY_HEADER_NAMES.has(key.toLowerCase()),
    });
  });

  // Sort headers alphabetically
  headersList.sort((a, b) => a.name.localeCompare(b.name));

  const contentType = finalResponse.headers.get('content-type') || 'unknown';
  const rawContentLength = finalResponse.headers.get('content-length');
  const contentLength = rawContentLength ? parseInt(rawContentLength, 10) : null;

  // Read response body for metadata if applicable (limit to 1MB)
  let bodyText = '';
  const canReadBody =
    contentType.includes('text') ||
    contentType.includes('html') ||
    contentType.includes('json') ||
    contentType.includes('xml');

  if (canReadBody) {
    try {
      const reader = finalResponse.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let bytesRead = 0;
        const maxBytes = 1024 * 1024; // 1MB cap

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            bytesRead += value.length;
            if (bytesRead >= maxBytes) {
              await reader.cancel();
              break;
            }
          }
        }

        const totalBuffer = new Uint8Array(bytesRead);
        let offset = 0;
        for (const chunk of chunks) {
          totalBuffer.set(chunk.slice(0, Math.min(chunk.length, bytesRead - offset)), offset);
          offset += chunk.length;
        }

        const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
        bodyText = decoder.decode(totalBuffer);
      }
    } catch {
      // Body read error is non-fatal for HTTP headers inspection
    }
  }

  const documentType = detectDocumentType(contentType, bodyText);
  const pageMetadata = extractPageMetadata(bodyText, contentType);
  const webResources = extractWebResources(bodyText, headersList);

  const totalTime = Date.now() - overallStartTime;
  const statusExplanation = getHttpStatusExplanation(finalResponse.status);

  return {
    requestedUrl: targetUrl,
    finalUrl,
    method: 'GET',
    protocol: finalUrl.startsWith('https:') ? 'HTTPS / HTTP/1.1' : 'HTTP / HTTP/1.1',
    statusCode: finalResponse.status,
    statusText: finalResponse.statusText || statusExplanation.phrase,
    statusCategory: statusExplanation.category,
    statusExplanation,
    contentType,
    contentLength,
    contentLengthFormatted: contentLength !== null ? formatBytes(contentLength) : null,
    responseTimeMs: totalTime,
    redirects,
    redirectCount: redirects.length,
    hasRedirect: redirects.length > 0,
    pageMetadata,
    headers: headersList,
    rawHeadersCount: headersList.length,
    documentType,
    webResources,
    analyzedAt: new Date().toISOString(),
    executionMode: 'SERVER_PROBE',
    error: null,
  };
}
