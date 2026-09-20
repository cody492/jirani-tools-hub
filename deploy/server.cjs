var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");

// src/utils/httpStatusExplainer.ts
var STATUS_DICTIONARY = {
  // 1xx Informational
  100: {
    phrase: "Continue",
    category: "informational",
    fact: "Server returned HTTP status 100 Continue.",
    observation: "The server received the initial request headers and signaled the client to continue sending the payload.",
    interpretation: "Protocol negotiation indicates the server is ready to accept the remainder of the request body."
  },
  101: {
    phrase: "Switching Protocols",
    category: "informational",
    fact: "Server returned HTTP status 101 Switching Protocols.",
    observation: "The server accepted an Upgrade request header to transition to an alternative transport protocol.",
    interpretation: "Typically used when upgrading to WebSocket or HTTP/2 protocol layers."
  },
  // 2xx Success
  200: {
    phrase: "OK",
    category: "success",
    fact: "Server returned HTTP status 200 OK.",
    observation: "The request succeeded and the server returned the requested resource payload.",
    interpretation: "The target endpoint is actively serving content and processing HTTP requests normally."
  },
  201: {
    phrase: "Created",
    category: "success",
    fact: "Server returned HTTP status 201 Created.",
    observation: "The request has been fulfilled and resulted in one or more new resources being created.",
    interpretation: "The endpoint completed a resource creation action as requested."
  },
  204: {
    phrase: "No Content",
    category: "success",
    fact: "Server returned HTTP status 204 No Content.",
    observation: "The server successfully fulfilled the request and returned headers without a message body.",
    interpretation: "The action completed without requiring document transmission back to the client."
  },
  206: {
    phrase: "Partial Content",
    category: "success",
    fact: "Server returned HTTP status 206 Partial Content.",
    observation: "The server fulfilled a partial GET request specified by a Range header.",
    interpretation: "The target supports byte-range serving, common in streaming media or resumed downloads."
  },
  // 3xx Redirection
  301: {
    phrase: "Moved Permanently",
    category: "redirection",
    fact: "Server returned HTTP status 301 Moved Permanently with a Location header.",
    observation: "The requested resource has been assigned a new permanent URI.",
    interpretation: "The target operates an automatic permanent redirect rule, frequently to canonicalize www/non-www or upgrade http to https."
  },
  302: {
    phrase: "Found",
    category: "redirection",
    fact: "Server returned HTTP status 302 Found with a Location header.",
    observation: "The target resource resides temporarily under a different URI.",
    interpretation: "The server redirected the client temporarily; future requests should continue to use the original URI unless configured otherwise."
  },
  303: {
    phrase: "See Other",
    category: "redirection",
    fact: "Server returned HTTP status 303 See Other with a Location header.",
    observation: "The response directs the client to get the resource at another URI with a GET request.",
    interpretation: "Commonly used in web applications after a POST submission to prevent form resubmission."
  },
  304: {
    phrase: "Not Modified",
    category: "redirection",
    fact: "Server returned HTTP status 304 Not Modified.",
    observation: "The server verified that the cached version held by the client matches the current resource.",
    interpretation: "Conditional headers (ETag, If-Modified-Since) matched; no response payload was transferred."
  },
  307: {
    phrase: "Temporary Redirect",
    category: "redirection",
    fact: "Server returned HTTP status 307 Temporary Redirect with a Location header.",
    observation: "The target resource temporarily resides under a different URI with guaranteed request method preservation.",
    interpretation: "The client must repeat the exact request method and body at the target URI."
  },
  308: {
    phrase: "Permanent Redirect",
    category: "redirection",
    fact: "Server returned HTTP status 308 Permanent Redirect with a Location header.",
    observation: "The target resource has permanently moved to a new URI with request method preservation.",
    interpretation: "Permanent redirect where the client must preserve the HTTP method (e.g. POST remains POST)."
  },
  // 4xx Client Error
  400: {
    phrase: "Bad Request",
    category: "client_error",
    fact: "Server returned HTTP status 400 Bad Request.",
    observation: "The server cannot or will not process the request due to perceived client-side malformation.",
    interpretation: "The request syntax, framing, or routing parameters were rejected by the remote server parser."
  },
  401: {
    phrase: "Unauthorized",
    category: "client_error",
    fact: "Server returned HTTP status 401 Unauthorized.",
    observation: "The request requires user authentication credentials (WWW-Authenticate header may be present).",
    interpretation: "The resource is restricted to authenticated sessions and no valid authentication token was provided."
  },
  403: {
    phrase: "Forbidden",
    category: "client_error",
    fact: "Server returned HTTP status 403 Forbidden.",
    observation: "The server understood the request but refuses to authorize it.",
    interpretation: "Access to this resource is prohibited by server policy, access control lists, or endpoint restrictions. Authentication will not necessarily grant access."
  },
  404: {
    phrase: "Not Found",
    category: "client_error",
    fact: "Server returned HTTP status 404 Not Found.",
    observation: "The origin server did not find a current representation for the target resource.",
    interpretation: "No document exists at the specified URI path, or the server is deliberately hiding the existence of the resource."
  },
  405: {
    phrase: "Method Not Allowed",
    category: "client_error",
    fact: "Server returned HTTP status 405 Method Not Allowed.",
    observation: "The method received in the request-line is known to the origin server but not supported by the target resource.",
    interpretation: "The endpoint does not permit the requested HTTP method (e.g. GET instead of POST)."
  },
  408: {
    phrase: "Request Timeout",
    category: "client_error",
    fact: "Server returned HTTP status 408 Request Timeout.",
    observation: "The server did not receive a complete request message within the time it was prepared to wait.",
    interpretation: "The client connection took longer than the server timeout threshold allowed."
  },
  410: {
    phrase: "Gone",
    category: "client_error",
    fact: "Server returned HTTP status 410 Gone.",
    observation: "Access to the target resource is no longer available at the origin server and this condition is likely permanent.",
    interpretation: "The resource has been deliberately purged with no forwarding address."
  },
  429: {
    phrase: "Too Many Requests",
    category: "client_error",
    fact: "Server returned HTTP status 429 Too Many Requests.",
    observation: "The user or source IP has sent too many requests in a given amount of time.",
    interpretation: "Rate limiting controls are enforced on the target server. A Retry-After header may specify the backoff window."
  },
  // 5xx Server Error
  500: {
    phrase: "Internal Server Error",
    category: "server_error",
    fact: "Server returned HTTP status 500 Internal Server Error.",
    observation: "The server encountered an unexpected condition that prevented it from fulfilling the request.",
    interpretation: "An application runtime failure, unhandled exception, or misconfiguration occurred on the origin server."
  },
  502: {
    phrase: "Bad Gateway",
    category: "server_error",
    fact: "Server returned HTTP status 502 Bad Gateway.",
    observation: "The server, while acting as a gateway or proxy, received an invalid response from an inbound server.",
    interpretation: "An upstream backend server failed to communicate properly with the edge reverse proxy or load balancer."
  },
  503: {
    phrase: "Service Unavailable",
    category: "server_error",
    fact: "Server returned HTTP status 503 Service Unavailable.",
    observation: "The server is currently unable to handle the request due to temporary overload or maintenance.",
    interpretation: "The service is temporarily down or congested; the condition is generally temporary and may resolve on retry."
  },
  504: {
    phrase: "Gateway Timeout",
    category: "server_error",
    fact: "Server returned HTTP status 504 Gateway Timeout.",
    observation: "The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server.",
    interpretation: "The reverse proxy or CDN edge timed out waiting for the origin application server to respond."
  }
};
function getHttpStatusExplanation(statusCode) {
  if (STATUS_DICTIONARY[statusCode]) {
    const def = STATUS_DICTIONARY[statusCode];
    return {
      code: statusCode,
      phrase: def.phrase,
      category: def.category,
      fact: def.fact,
      observation: def.observation,
      interpretation: def.interpretation
    };
  }
  let category = "unknown";
  let genericPhrase = "Unknown Status";
  if (statusCode >= 100 && statusCode < 200) {
    category = "informational";
    genericPhrase = "Informational";
  } else if (statusCode >= 200 && statusCode < 300) {
    category = "success";
    genericPhrase = "Success";
  } else if (statusCode >= 300 && statusCode < 400) {
    category = "redirection";
    genericPhrase = "Redirection";
  } else if (statusCode >= 400 && statusCode < 500) {
    category = "client_error";
    genericPhrase = "Client Error";
  } else if (statusCode >= 500 && statusCode < 600) {
    category = "server_error";
    genericPhrase = "Server Error";
  }
  return {
    code: statusCode,
    phrase: genericPhrase,
    category,
    fact: `Server returned HTTP status code ${statusCode}.`,
    observation: `The response code indicates a ${category.replace("_", " ")} condition according to RFC HTTP specifications.`,
    interpretation: `Standard HTTP specification categorizes status ${statusCode} under class ${Math.floor(statusCode / 100)}xx. Specific application context determines behavior.`
  };
}

// server/httpInspector.ts
function isPrivateIpOrHost(hostname) {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "0.0.0.0" || lower === "::1" || lower.endsWith(".local") || lower.endsWith(".internal") || lower.includes("metadata.google.internal")) {
    return true;
  }
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, o1, o2] = ipv4Match.map(Number);
    if (o1 === 10) return true;
    if (o1 === 127) return true;
    if (o1 === 169 && o2 === 254) return true;
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    if (o1 === 192 && o2 === 168) return true;
    if (o1 === 0) return true;
  }
  return false;
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
var SECURITY_HEADER_NAMES = /* @__PURE__ */ new Set([
  "strict-transport-security",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "x-xss-protection"
]);
function categorizeHeader(name) {
  const lower = name.toLowerCase();
  if (SECURITY_HEADER_NAMES.has(lower)) return "security";
  if (lower.includes("cache") || lower.includes("age") || lower === "etag" || lower === "expires" || lower === "last-modified" || lower === "pragma") {
    return "caching";
  }
  if (lower === "server" || lower === "x-powered-by" || lower === "via" || lower.includes("cloudflare") || lower.includes("fastly") || lower.includes("varnish") || lower.includes("nginx")) {
    return "server";
  }
  if (lower === "connection" || lower === "keep-alive" || lower === "upgrade" || lower === "alt-svc" || lower === "host") {
    return "transport";
  }
  if (lower.includes("content") || lower === "accept" || lower.includes("encoding") || lower.includes("length") || lower.includes("type")) {
    return "content";
  }
  return "other";
}
function detectDocumentType(contentType, bodyText) {
  const lowerCt = contentType.toLowerCase();
  if (lowerCt.includes("text/html") || lowerCt.includes("application/xhtml+xml")) {
    return "HTML";
  }
  if (lowerCt.includes("application/json") || lowerCt.includes("+json") || lowerCt.includes("text/json")) {
    return "JSON";
  }
  if (lowerCt.includes("application/xml") || lowerCt.includes("text/xml") || lowerCt.includes("+xml")) {
    return "XML";
  }
  if (lowerCt.includes("text/plain")) {
    return "Plain Text";
  }
  if (lowerCt.includes("image/") || lowerCt.includes("video/") || lowerCt.includes("audio/") || lowerCt.includes("application/pdf") || lowerCt.includes("application/octet-stream")) {
    return "Binary / Media";
  }
  if (bodyText) {
    const trimmed = bodyText.trim();
    if (trimmed.startsWith("<!DOCTYPE html") || /<html[\s>]/i.test(trimmed)) {
      return "HTML";
    }
    if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return "JSON";
    }
    if (trimmed.startsWith("<?xml") || trimmed.startsWith("<rss")) {
      return "XML";
    }
  }
  return "Other";
}
function extractPageMetadata(html, contentType) {
  if (!html || !contentType.includes("html") && !/<html[\s>]/i.test(html)) {
    return null;
  }
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null;
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i) || html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1].replace(/\s+/g, " ").trim() : null;
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) || html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : null;
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  const language = langMatch ? langMatch[1].trim() : null;
  const charsetMetaMatch = html.match(/<meta[^>]+charset=["']([^"']*)["']/i);
  const charsetHeaderMatch = contentType.match(/charset=([a-zA-Z0-9_-]+)/i);
  const charset = charsetMetaMatch ? charsetMetaMatch[1].trim() : charsetHeaderMatch ? charsetHeaderMatch[1].trim() : null;
  const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i);
  const viewport = viewportMatch ? viewportMatch[1].trim() : null;
  const generatorMatch = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)["']/i);
  const generator = generatorMatch ? generatorMatch[1].trim() : null;
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
    openGraphTitle: openGraphTitle || null
  };
}
function extractWebResources(html, headers) {
  if (!html) return void 0;
  const scripts = [];
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (scripts.length < 100) {
      scripts.push(match[1].trim());
    }
  }
  const inlineScriptSnippets = [];
  const inlineScriptRegex = /<script(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineMatch;
  while ((inlineMatch = inlineScriptRegex.exec(html)) !== null) {
    const text = inlineMatch[1].trim();
    if (text.length > 0 && inlineScriptSnippets.length < 80) {
      if (/gtag|gtm|analytics|fbq|pixel|stripe|paypal|shopify|__next|__nuxt|remix|webpack|drupal|wp-|tailwind|react|vue|angular|svelte|payment|checkout|card|visa|mastercard|amex|discover|apple[-_]?pay|google[-_]?pay|shop[-_]?pay|klarna|afterpay|affirm|adyen|square/i.test(
        text
      )) {
        inlineScriptSnippets.push(text.slice(0, 800));
      }
    }
  }
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1]);
      const jsonStr = JSON.stringify(parsed).toLowerCase();
      if (jsonStr.includes("paymentaccepted") || jsonStr.includes("acceptedpaymentmethod")) {
        inlineScriptSnippets.push(jsonLdMatch[1].slice(0, 1e3));
      }
    } catch {
    }
  }
  const stylesheets = [];
  const linkRegex = /<link[^>]+(?:rel=["']stylesheet["'][^>]+href=["']([^"']+)["']|href=["']([^"']+)["'][^>]+rel=["']stylesheet["'])/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1] || linkMatch[2];
    if (href && stylesheets.length < 50) {
      stylesheets.push(href.trim());
    }
  }
  const metaTags = [];
  const metaRegex = /<meta[^>]+>/gi;
  let metaMatch;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    const tag = metaMatch[0];
    const nameMatch = tag.match(/name=["']([^"']*)["']/i);
    const propMatch = tag.match(/property=["']([^"']*)["']/i);
    const contentMatch = tag.match(/content=["']([^"']*)["']/i);
    if ((nameMatch || propMatch) && contentMatch && metaTags.length < 60) {
      metaTags.push({
        name: nameMatch ? nameMatch[1] : void 0,
        property: propMatch ? propMatch[1] : void 0,
        content: contentMatch[1]
      });
    }
  }
  const cookies = [];
  for (const h of headers) {
    if (h.name === "set-cookie") {
      const cookieName = h.value.split(";")[0]?.split("=")[0]?.trim();
      if (cookieName) cookies.push(cookieName);
    }
  }
  const domMarkers = [];
  const markerChecks = [
    // Frameworks & Runtimes
    { pattern: /id=["']__next["']/i, marker: 'id="__next"' },
    { pattern: /id=["']__nuxt["']/i, marker: 'id="__nuxt"' },
    { pattern: /id=["']root["']/i, marker: 'id="root"' },
    { pattern: /id=["']app["']/i, marker: 'id="app"' },
    { pattern: /data-reactroot/i, marker: "data-reactroot" },
    { pattern: /data-reactid/i, marker: "data-reactid" },
    { pattern: /data-react-helmet/i, marker: "data-react-helmet" },
    { pattern: /_reactListening|__reactFiber|__reactEvents/i, marker: "framework:react" },
    { pattern: /ng-version/i, marker: "ng-version" },
    { pattern: /data-v-[a-f0-9]{6,}/i, marker: "data-v-* (Vue scoped)" },
    { pattern: /data-wf-page|data-wf-site/i, marker: "data-wf-page/site (Webflow)" },
    { pattern: /wp-content\/themes/i, marker: "wp-content/themes" },
    { pattern: /wp-content\/plugins/i, marker: "wp-content/plugins" },
    { pattern: /wp-includes/i, marker: "wp-includes" },
    { pattern: /astro-island/i, marker: "astro-island" },
    { pattern: /class=["'][^"']*svelte-[a-z0-9]+/i, marker: "svelte-* class" },
    { pattern: /cdn\.shopify\.com/i, marker: "cdn.shopify.com" },
    // CSS Frameworks
    { pattern: /--tw-(?:ring|shadow|border|translate|rotate|skew|scale|space|text|bg)/i, marker: "tailwindcss-custom-properties" },
    { pattern: /--bs-(?:primary|secondary|body|gutter|font)/i, marker: "bootstrap-custom-properties" },
    { pattern: /class=["'][^"']*(?:container-fluid|navbar-expand|btn-primary)/i, marker: "bootstrap-classes" },
    // Card Payment Networks (Visa, Mastercard, Amex, Discover, Diners Club, JCB, UnionPay, Maestro)
    {
      pattern: /aria-label=["'](?:pay with )?visa["']|alt=["'](?:pay with )?visa(?: payment| card| logo)?["']|class=["'][^"']*(?:payment-icon--visa|icon-visa|icon--visa|fa-cc-visa|svg-icon-visa|badge--visa|payment-badge-visa)|id=["'](?:icon-visa|visa-icon|svg-visa|pi-visa)["']|<title[^>]*>Visa<\/title>|"paymentaccepted"[^}]*visa/i,
      marker: "payment-card:visa"
    },
    {
      pattern: /aria-label=["'](?:pay with )?mastercard["']|alt=["'](?:pay with )?mastercard(?: payment| card| logo)?["']|class=["'][^"']*(?:payment-icon--mastercard|icon-mastercard|icon--mastercard|fa-cc-mastercard|svg-icon-mastercard|badge--mastercard|payment-badge-mastercard)|id=["'](?:icon-mastercard|mastercard-icon|svg-mastercard|pi-master|pi-mastercard)["']|<title[^>]*>Mastercard<\/title>|"paymentaccepted"[^}]*mastercard/i,
      marker: "payment-card:mastercard"
    },
    {
      pattern: /aria-label=["'](?:pay with )?(?:american express|amex)["']|alt=["'](?:pay with )?(?:american express|amex)(?: payment| card| logo)?["']|class=["'][^"']*(?:payment-icon--american_express|payment-icon--amex|icon-amex|icon--amex|fa-cc-amex|svg-icon-amex|badge--amex)|id=["'](?:icon-american_express|icon-amex|amex-icon|svg-amex|pi-american_express|pi-amex)["']|<title[^>]*>(?:American Express|Amex)<\/title>|"paymentaccepted"[^}]*(?:american express|amex)/i,
      marker: "payment-card:amex"
    },
    {
      pattern: /aria-label=["'](?:pay with )?discover["']|alt=["'](?:pay with )?discover(?: card| logo)?["']|class=["'][^"']*(?:payment-icon--discover|icon-discover|icon--discover|fa-cc-discover|svg-icon-discover)|id=["'](?:icon-discover|discover-icon|svg-discover|pi-discover)["']|<title[^>]*>Discover<\/title>|"paymentaccepted"[^}]*discover/i,
      marker: "payment-card:discover"
    },
    {
      pattern: /aria-label=["'](?:pay with )?diners club["']|alt=["'](?:pay with )?diners club["']|class=["'][^"']*(?:payment-icon--diners_club|icon-diners|fa-cc-diners-club)|id=["'](?:icon-diners_club|pi-diners_club)["']/i,
      marker: "payment-card:diners_club"
    },
    {
      pattern: /aria-label=["'](?:pay with )?jcb["']|alt=["'](?:pay with )?jcb["']|class=["'][^"']*(?:payment-icon--jcb|icon-jcb|fa-cc-jcb)|id=["'](?:icon-jcb|pi-jcb)["']/i,
      marker: "payment-card:jcb"
    },
    {
      pattern: /aria-label=["'](?:pay with )?(?:unionpay|union pay)["']|alt=["'](?:pay with )?(?:unionpay|union pay)["']|class=["'][^"']*(?:payment-icon--unionpay|icon-unionpay)|id=["'](?:icon-unionpay|pi-unionpay)["']/i,
      marker: "payment-card:unionpay"
    },
    {
      pattern: /aria-label=["'](?:pay with )?maestro["']|alt=["'](?:pay with )?maestro["']|class=["'][^"']*(?:payment-icon--maestro|icon-maestro|fa-cc-maestro)|id=["'](?:icon-maestro|pi-maestro)["']/i,
      marker: "payment-card:maestro"
    },
    // Digital Wallets & Accelerated Checkouts
    {
      pattern: /apple-pay-button|data-apple-pay|aria-label=["'](?:pay with )?apple pay["']|alt=["'](?:pay with )?apple pay(?: logo)?["']|class=["'][^"']*(?:apple-pay-button|payment-icon--apple_pay|icon-apple-pay|fa-cc-apple-pay)|id=["'](?:icon-apple_pay|apple-pay-button|pi-apple_pay)["']|<title[^>]*>Apple Pay<\/title>/i,
      marker: "payment-wallet:apple_pay"
    },
    {
      pattern: /google-pay-button|aria-label=["'](?:pay with )?google pay["']|alt=["'](?:pay with )?google pay(?: logo)?["']|class=["'][^"']*(?:google-pay-button|payment-icon--google_pay|icon-google-pay)|id=["'](?:icon-google_pay|google-pay-button|pi-google_pay)["']|<title[^>]*>Google Pay<\/title>/i,
      marker: "payment-wallet:google_pay"
    },
    {
      pattern: /shopify-payment-button|aria-label=["'](?:pay with )?(?:shop pay|shopify pay)["']|alt=["'](?:pay with )?(?:shop pay|shopify pay)(?: logo)?["']|class=["'][^"']*(?:shopify-payment-button|payment-icon--shopify_pay|payment-icon--shop_pay|shop-pay-button)|id=["'](?:icon-shopify_pay|icon-shop_pay|pi-shopify_pay)["']|<title[^>]*>Shop Pay<\/title>/i,
      marker: "payment-platform:shop_pay"
    },
    {
      pattern: /aria-label=["'](?:pay with )?amazon pay["']|alt=["'](?:pay with )?amazon pay["']|class=["'][^"']*(?:payment-icon--amazon_payments|amazon-pay-button)/i,
      marker: "payment-wallet:amazon_pay"
    },
    // Processors & BNPL
    {
      pattern: /paypal\.Buttons|payment-icon--paypal|aria-label=["'](?:pay with )?paypal["']|alt=["'](?:pay with )?paypal["']|id=["'](?:icon-paypal|pi-paypal)["']|<title[^>]*>PayPal<\/title>/i,
      marker: "payment-gateway:paypal"
    },
    {
      pattern: /js\.stripe\.com|checkout\.stripe\.com|data-stripe|stripe-elements|Stripe\(['"]pk_/i,
      marker: "payment-gateway:stripe"
    },
    {
      pattern: /x\.klarnacdn\.net|aria-label=["'](?:pay with )?klarna["']|alt=["'](?:pay with )?klarna["']|class=["'][^"']*(?:payment-icon--klarna|klarna-badge)|id=["'](?:icon-klarna|pi-klarna)["']/i,
      marker: "payment-bnpl:klarna"
    },
    {
      pattern: /afterpay-placement|aria-label=["'](?:pay with )?afterpay["']|alt=["'](?:pay with )?afterpay["']|class=["'][^"']*(?:payment-icon--afterpay|afterpay-badge)|id=["'](?:icon-afterpay|pi-afterpay)["']/i,
      marker: "payment-bnpl:afterpay"
    },
    {
      pattern: /affirm-as-low-as|aria-label=["'](?:pay with )?affirm["']|alt=["'](?:pay with )?affirm["']|class=["'][^"']*(?:payment-icon--affirm|affirm-badge)|id=["'](?:icon-affirm|pi-affirm)["']/i,
      marker: "payment-bnpl:affirm"
    }
  ];
  for (const check of markerChecks) {
    if (check.pattern.test(html)) {
      domMarkers.push(check.marker);
    }
  }
  let htmlSnippet;
  if (html.length <= 524288) {
    htmlSnippet = html;
  } else {
    htmlSnippet = html.slice(0, 393216) + "\n<!-- TRUNCATED_MIDDLE_SECTION -->\n" + html.slice(-131072);
  }
  return {
    scripts,
    inlineScriptSnippets,
    stylesheets,
    metaTags,
    cookies,
    domMarkers,
    htmlSnippet
  };
}
async function inspectHttp(targetUrl) {
  const parsedTarget = new URL(targetUrl);
  if (isPrivateIpOrHost(parsedTarget.hostname)) {
    const err = {
      code: "BLOCKED_PRIVATE_IP",
      title: "Target Address Restricted",
      message: "Private loopback and internal network IP ranges are restricted.",
      technicalDetail: `Target host "${parsedTarget.hostname}" resolved to a prohibited private subnet or loopback interface.`,
      targetUrl
    };
    throw err;
  }
  const maxRedirects = 10;
  const timeoutMs = 12e3;
  let currentUrl = targetUrl;
  const redirects = [];
  let hopIndex = 1;
  const overallStartTime = Date.now();
  let finalResponse = null;
  let finalUrl = targetUrl;
  let finalDurationMs = 0;
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (WebForensics/0.2; Public Inspector)";
  while (hopIndex <= maxRedirects) {
    const hopStart = Date.now();
    let res;
    try {
      res = await fetch(currentUrl, {
        method: "GET",
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        },
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (err) {
      const errorDuration = Date.now() - hopStart;
      let inspectionError;
      const errName = err?.name || "";
      const errMsg = err?.message || String(err);
      const errCode = err?.cause?.code || err?.code || "";
      if (errName === "TimeoutError" || errName === "AbortError" || errCode === "ETIMEDOUT") {
        inspectionError = {
          code: "CONNECTION_TIMED_OUT",
          title: "Connection Timed Out",
          message: `The target host did not respond within ${timeoutMs / 1e3} seconds.`,
          technicalDetail: `Connection to ${currentUrl} exceeded ${timeoutMs}ms limit. (${errCode || errName})`,
          targetUrl: currentUrl
        };
      } else if (errCode === "ENOTFOUND" || errMsg.includes("getaddrinfo ENOTFOUND") || errMsg.includes("Could not resolve host")) {
        inspectionError = {
          code: "DNS_RESOLUTION_FAILED",
          title: "DNS Resolution Failed",
          message: "Unable to resolve the domain name. Verify the domain exists and public DNS is configured.",
          technicalDetail: `Host lookup failed for ${parsedTarget.hostname}: ${errMsg}`,
          targetUrl: currentUrl
        };
      } else if (errCode === "ECONNREFUSED" || errMsg.includes("ECONNREFUSED")) {
        inspectionError = {
          code: "CONNECTION_REFUSED",
          title: "Connection Refused",
          message: "The remote host actively refused the TCP connection on the designated port.",
          technicalDetail: `Target host refused handshake: ${errCode || errMsg}`,
          targetUrl: currentUrl
        };
      } else if (errCode?.startsWith?.("CERT_") || errCode?.startsWith?.("SSL_") || errMsg.includes("certificate") || errMsg.includes("SSL")) {
        inspectionError = {
          code: "TLS_SECURITY_ERROR",
          title: "TLS / SSL Negotiation Failed",
          message: "Secure handshake failed due to an invalid, expired, or untrusted certificate authority.",
          technicalDetail: `Cryptographic negotiation rejected: ${errMsg} (${errCode})`,
          targetUrl: currentUrl
        };
      } else {
        inspectionError = {
          code: "NETWORK_ERROR",
          title: "Connection Failed",
          message: "Unable to retrieve a response from the target host.",
          technicalDetail: `Socket failure: ${errMsg} (code: ${errCode || "UNKNOWN"})`,
          targetUrl: currentUrl
        };
      }
      throw inspectionError;
    }
    const hopDuration = Date.now() - hopStart;
    const statusCode = res.status;
    const statusText = res.statusText || (statusCode === 200 ? "OK" : "");
    const locationHeader = res.headers.get("location") || void 0;
    const isRedirect = statusCode >= 300 && statusCode < 400 || statusCode === 301 || statusCode === 302 || statusCode === 303 || statusCode === 307 || statusCode === 308;
    if (isRedirect && locationHeader) {
      redirects.push({
        hopNumber: hopIndex,
        url: currentUrl,
        statusCode,
        statusText,
        locationHeader,
        responseTimeMs: hopDuration
      });
      try {
        const nextResolved = new URL(locationHeader, currentUrl).href;
        currentUrl = nextResolved;
        hopIndex++;
      } catch {
        finalResponse = res;
        finalUrl = currentUrl;
        finalDurationMs = hopDuration;
        break;
      }
    } else {
      finalResponse = res;
      finalUrl = currentUrl;
      finalDurationMs = hopDuration;
      break;
    }
  }
  if (!finalResponse) {
    throw {
      code: "NETWORK_ERROR",
      title: "Redirect Limit Exceeded",
      message: "Too many redirects encountered (exceeded 10 hops).",
      technicalDetail: `Target entered redirect loop across ${redirects.length} hops.`,
      targetUrl
    };
  }
  const headersList = [];
  finalResponse.headers.forEach((val, key) => {
    headersList.push({
      name: key.toLowerCase(),
      value: val,
      category: categorizeHeader(key),
      isSecurityHeader: SECURITY_HEADER_NAMES.has(key.toLowerCase())
    });
  });
  headersList.sort((a, b) => a.name.localeCompare(b.name));
  const contentType = finalResponse.headers.get("content-type") || "unknown";
  const rawContentLength = finalResponse.headers.get("content-length");
  const contentLength = rawContentLength ? parseInt(rawContentLength, 10) : null;
  let bodyText = "";
  const canReadBody = contentType.includes("text") || contentType.includes("html") || contentType.includes("json") || contentType.includes("xml");
  if (canReadBody) {
    try {
      const reader = finalResponse.body?.getReader();
      if (reader) {
        const chunks = [];
        let bytesRead = 0;
        const maxBytes = 1024 * 1024;
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
        const decoder = new TextDecoder("utf-8", { fatal: false, ignoreBOM: true });
        bodyText = decoder.decode(totalBuffer);
      }
    } catch {
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
    method: "GET",
    protocol: finalUrl.startsWith("https:") ? "HTTPS / HTTP/1.1" : "HTTP / HTTP/1.1",
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
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    executionMode: "SERVER_PROBE",
    error: null
  };
}

// server/infrastructureInspector.ts
var import_promises = __toESM(require("dns/promises"), 1);

// server/whoisInspector.ts
var import_net = __toESM(require("net"), 1);
var MULTI_PART_SUFFIXES = /* @__PURE__ */ new Set([
  "co.uk",
  "org.uk",
  "gov.uk",
  "ac.uk",
  "net.uk",
  "com.au",
  "net.au",
  "org.au",
  "edu.au",
  "co.nz",
  "net.nz",
  "org.nz",
  "co.jp",
  "ne.jp",
  "co.kr",
  "com.br",
  "net.br",
  "com.mx",
  "co.za",
  "com.tr",
  "com.sg",
  "com.hk",
  "com.tw",
  "co.in",
  "net.in",
  "org.in",
  "gen.in",
  "firm.in"
]);
function extractRegistrableDomain(input) {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  clean = clean.replace(/^[a-zA-Z]+:\/\//, "");
  clean = clean.split("/")[0].split("?")[0].split("#")[0];
  clean = clean.split(":")[0];
  const parts = clean.split(".").filter(Boolean);
  if (parts.length <= 2) {
    return parts.join(".");
  }
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}
var TLD_WHOIS_SERVERS = {
  com: "whois.verisign-grs.com",
  net: "whois.verisign-grs.com",
  org: "whois.publicinterestregistry.org",
  info: "whois.afilias.net",
  biz: "whois.biz",
  io: "whois.nic.io",
  co: "whois.nic.co",
  me: "whois.nic.me",
  us: "whois.nic.us",
  uk: "whois.nic.uk",
  ca: "whois.cira.ca",
  de: "whois.denic.de",
  fr: "whois.nic.fr",
  eu: "whois.eu",
  nl: "whois.domain-registry.nl",
  ai: "whois.nic.ai",
  in: "whois.registry.in",
  dev: "whois.nic.google",
  app: "whois.nic.google",
  cloud: "whois.nic.cloud",
  tech: "whois.nic.tech",
  store: "whois.nic.store",
  xyz: "whois.nic.xyz"
};
function queryWhoisTcp(domain, server, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    const socket = new import_net.default.Socket();
    let data = "";
    let isDone = false;
    const cleanup = () => {
      if (!isDone) {
        isDone = true;
        socket.destroy();
      }
    };
    socket.setTimeout(timeoutMs);
    socket.connect(43, server, () => {
      socket.write(`${domain}\r
`);
    });
    socket.on("data", (chunk) => {
      data += chunk.toString();
      if (data.length > 1e5) {
        cleanup();
        resolve(data);
      }
    });
    socket.on("end", () => {
      cleanup();
      resolve(data);
    });
    socket.on("error", (err) => {
      cleanup();
      reject(err);
    });
    socket.on("timeout", () => {
      cleanup();
      reject(new Error(`WHOIS socket connection to ${server} timed out after ${timeoutMs}ms`));
    });
  });
}
function parseWhoisText(rawText, domain, serverUsed) {
  const now = Date.now();
  const registrarMatch = rawText.match(/(?:Registrar|Sponsoring Registrar|registrar-name|Registrar Name):\s*([^\r\n]+)/i);
  const registrarIanaMatch = rawText.match(/(?:Registrar IANA ID|IANA ID):\s*(\d+)/i);
  const createdMatch = rawText.match(
    /(?:Creation Date|Created|created|Registration Time|Registered on|Registration Date):\s*([^\r\n]+)/i
  );
  const expiryMatch = rawText.match(
    /(?:Registry Expiry Date|Registrar Registration Expiration Date|Expiration Date|Registry Expiry|paid-till|Expires|Expiry date|Renewal Date):\s*([^\r\n]+)/i
  );
  const updatedMatch = rawText.match(
    /(?:Updated Date|Last Updated|last-changed|Modified|Last Modified):\s*([^\r\n]+)/i
  );
  const dnssecMatch = rawText.match(/(?:DNSSEC|dnssec):\s*([^\r\n]+)/i);
  const statusMatches = [...rawText.matchAll(/(?:Domain Status|status):\s*([^\r\n\s]+)/gi)].map(
    (m) => m[1].replace(/https?:\/\/\S+/gi, "").trim()
  ).filter(Boolean);
  const nsMatches = [...rawText.matchAll(/(?:Name Server|nserver):\s*([^\r\n\s]+)/gi)].map((m) => m[1].toLowerCase().trim()).filter((ns) => ns.length > 3 && ns.includes("."));
  let creationDate;
  let expirationDate;
  let updatedDate;
  let ageDays;
  let daysUntilExpiration;
  if (createdMatch) {
    const d = new Date(createdMatch[1].trim());
    if (!isNaN(d.getTime())) {
      creationDate = d.toISOString();
      ageDays = Math.max(0, Math.floor((now - d.getTime()) / (1e3 * 60 * 60 * 24)));
    }
  }
  if (expiryMatch) {
    const d = new Date(expiryMatch[1].trim());
    if (!isNaN(d.getTime())) {
      expirationDate = d.toISOString();
      daysUntilExpiration = Math.floor((d.getTime() - now) / (1e3 * 60 * 60 * 24));
    }
  }
  if (updatedMatch) {
    const d = new Date(updatedMatch[1].trim());
    if (!isNaN(d.getTime())) {
      updatedDate = d.toISOString();
    }
  }
  const rawSample = rawText.length > 3500 ? rawText.slice(0, 3500) + "\n...[truncated for brevity]" : rawText;
  const isSuccess = Boolean(registrarMatch || createdMatch || expiryMatch);
  return {
    domain,
    registrar: registrarMatch ? registrarMatch[1].trim() : void 0,
    registrarIanaId: registrarIanaMatch ? registrarIanaMatch[1].trim() : void 0,
    creationDate,
    expirationDate,
    updatedDate,
    ageDays,
    daysUntilExpiration,
    status: statusMatches.length > 0 ? Array.from(new Set(statusMatches)) : void 0,
    nameservers: nsMatches.length > 0 ? Array.from(new Set(nsMatches)) : void 0,
    dnssec: dnssecMatch ? dnssecMatch[1].trim() : void 0,
    whoisServer: serverUsed,
    rawText: rawSample,
    lookupSource: "WHOIS",
    lookupStatus: isSuccess ? "SUCCESS" : "NOT_FOUND",
    queriedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function queryRdap(domain, tld) {
  try {
    let rdapUrl = null;
    if (tld === "com" || tld === "net") {
      rdapUrl = `https://rdap.verisign.com/${tld}/v1/domain/${encodeURIComponent(domain)}`;
    } else if (tld === "org") {
      rdapUrl = `https://rdap.publicinterestregistry.org/rdap/domain/${encodeURIComponent(domain)}`;
    }
    if (!rdapUrl) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(rdapUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/rdap+json, application/json",
        "User-Agent": "Mozilla/5.0 (compatible; WebForensics/1.0; Public OSINT)"
      }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    const now = Date.now();
    let creationDate;
    let expirationDate;
    let updatedDate;
    let ageDays;
    let daysUntilExpiration;
    if (Array.isArray(data.events)) {
      for (const ev of data.events) {
        if (!ev.eventDate) continue;
        const d = new Date(ev.eventDate);
        if (isNaN(d.getTime())) continue;
        if (ev.eventAction === "registration") {
          creationDate = d.toISOString();
          ageDays = Math.max(0, Math.floor((now - d.getTime()) / (1e3 * 60 * 60 * 24)));
        } else if (ev.eventAction === "expiration") {
          expirationDate = d.toISOString();
          daysUntilExpiration = Math.floor((d.getTime() - now) / (1e3 * 60 * 60 * 24));
        } else if (ev.eventAction === "last changed" || ev.eventAction === "last update") {
          updatedDate = d.toISOString();
        }
      }
    }
    let registrar;
    let registrarIanaId;
    if (Array.isArray(data.entities)) {
      for (const entity of data.entities) {
        if (entity.roles && entity.roles.includes("registrar")) {
          if (Array.isArray(entity.vcardArray) && Array.isArray(entity.vcardArray[1])) {
            const fnItem = entity.vcardArray[1].find((v) => Array.isArray(v) && v[0] === "fn");
            if (fnItem && fnItem[3]) {
              registrar = String(fnItem[3]).trim();
            }
          }
          if (Array.isArray(entity.publicIds)) {
            const ianaItem = entity.publicIds.find(
              (p) => p.type === "IANA Registrar ID" || p.type === "iana"
            );
            if (ianaItem?.identifier) {
              registrarIanaId = String(ianaItem.identifier).trim();
            }
          }
          if (registrar) break;
        }
      }
    }
    const nameservers = Array.isArray(data.nameservers) ? data.nameservers.map((n) => (n.ldhName || n.handle || "").toLowerCase()).filter(Boolean) : void 0;
    const status = Array.isArray(data.status) ? data.status : void 0;
    const dnssec = data.secureDNS?.delegationSigned ? "signedDelegation" : "unsigned";
    return {
      domain,
      registrar,
      registrarIanaId,
      creationDate,
      expirationDate,
      updatedDate,
      ageDays,
      daysUntilExpiration,
      status,
      nameservers,
      dnssec,
      whoisServer: rdapUrl,
      rawText: JSON.stringify(data, null, 2).slice(0, 3e3),
      lookupSource: "RDAP",
      lookupStatus: "SUCCESS",
      queriedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch {
    return null;
  }
}
async function inspectWhois(domainInput) {
  const domain = extractRegistrableDomain(domainInput);
  if (!domain || !domain.includes(".")) {
    return {
      domain: domainInput,
      lookupStatus: "NOT_FOUND",
      error: "Invalid or missing top-level domain identifier.",
      queriedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const parts = domain.split(".");
  const tld = parts[parts.length - 1];
  try {
    const rdapRecord = await queryRdap(domain, tld);
    if (rdapRecord && (rdapRecord.registrar || rdapRecord.creationDate)) {
      return rdapRecord;
    }
  } catch {
  }
  try {
    let targetServer = TLD_WHOIS_SERVERS[tld];
    if (!targetServer) {
      try {
        const ianaText = await queryWhoisTcp(domain, "whois.iana.org", 2500);
        const referMatch = ianaText.match(/refer:\s+([^\s]+)/i) || ianaText.match(/whois:\s+([^\s]+)/i);
        if (referMatch && referMatch[1]) {
          targetServer = referMatch[1].trim();
        }
      } catch {
        targetServer = "whois.iana.org";
      }
    }
    if (!targetServer) {
      targetServer = "whois.iana.org";
    }
    const rawWhois = await queryWhoisTcp(domain, targetServer, 3500);
    const parsed = parseWhoisText(rawWhois, domain, targetServer);
    if (!parsed.registrar && !parsed.creationDate) {
      const referMatch = rawWhois.match(/refer:\s+([^\s]+)/i) || rawWhois.match(/whois:\s+([^\s]+)/i);
      if (referMatch && referMatch[1] && referMatch[1] !== targetServer) {
        const secondServer = referMatch[1].trim();
        try {
          const secondRaw = await queryWhoisTcp(domain, secondServer, 3500);
          const secondParsed = parseWhoisText(secondRaw, domain, secondServer);
          if (secondParsed.registrar || secondParsed.creationDate) {
            return secondParsed;
          }
        } catch {
        }
      }
    }
    return parsed;
  } catch (err) {
    return {
      domain,
      lookupStatus: "UNAVAILABLE",
      error: `WHOIS lookup failed or timed out: ${err?.message || String(err)}`,
      lookupSource: "WHOIS",
      queriedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}

// server/infrastructureInspector.ts
function isPrivateIpOrHost2(hostname) {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "127.0.0.1" || lower === "0.0.0.0" || lower === "::1" || lower.endsWith(".local") || lower.endsWith(".internal") || lower.includes("metadata.google.internal")) {
    return true;
  }
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, o1, o2] = ipv4Match.map(Number);
    if (o1 === 10) return true;
    if (o1 === 127) return true;
    if (o1 === 169 && o2 === 254) return true;
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    if (o1 === 192 && o2 === 168) return true;
    if (o1 === 0) return true;
  }
  return false;
}
async function withTimeout(promise, timeoutMs, label) {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const err = new Error(`${label} timed out after ${timeoutMs}ms`);
      err.code = "ETIMEOUT";
      reject(err);
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}
async function queryGoogleDoh(name, type) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4e3);
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
      signal: controller.signal,
      headers: { Accept: "application/dns-json" }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
function categorizeTxtRecord(fullText) {
  const lower = fullText.toLowerCase().trim();
  if (lower.startsWith("v=spf1") || lower.includes("include:_spf") || lower.includes("redirect=_spf")) {
    return { category: "spf", label: "SPF (Sender Policy Framework)" };
  }
  if (lower.startsWith("v=dmarc1")) {
    return { category: "dmarc", label: "DMARC Security Policy" };
  }
  if (lower.includes("verification") || lower.includes("verify") || lower.startsWith("ms=") || lower.startsWith("google-site-verification=") || lower.startsWith("facebook-domain-verification=") || lower.startsWith("apple-domain-verification=") || lower.startsWith("atlassian-domain-verification=") || lower.startsWith("stripe-verification=") || lower.startsWith("docusign=") || lower.startsWith("onetrust-domain-verification=") || lower.startsWith("status-page-domain-verification=") || lower.startsWith("cisco-ci-domain-verification=")) {
    return { category: "verification", label: "Domain Verification / Third-Party Token" };
  }
  return { category: "other", label: "General TXT Telemetry" };
}
async function inspectInfrastructure(domainInput, hostnameInput, httpClues) {
  const hostname = (hostnameInput || domainInput).trim().toLowerCase();
  const domain = domainInput.trim().toLowerCase();
  if (isPrivateIpOrHost2(hostname) || isPrivateIpOrHost2(domain)) {
    const err = {
      code: "BLOCKED_PRIVATE_TARGET",
      title: "Target Address Prohibited",
      message: "Resolution against loopback, link-local, and private RFC 1918 addresses is restricted.",
      technicalDetail: `Target host "${hostname}" resolved to a prohibited private subnet.`,
      targetDomain: domain
    };
    throw err;
  }
  const queryStatuses = {
    A: { status: "lookup_unavailable", count: 0 },
    AAAA: { status: "lookup_unavailable", count: 0 },
    CNAME: { status: "lookup_unavailable", count: 0 },
    MX: { status: "lookup_unavailable", count: 0 },
    NS: { status: "lookup_unavailable", count: 0 },
    TXT: { status: "lookup_unavailable", count: 0 }
  };
  const aRecords = [];
  const aaaaRecords = [];
  const cnameRecords = [];
  const mxRecords = [];
  const nsRecords = [];
  const txtRecords = [];
  const allRecords = [];
  const TIMEOUT_MS = 5e3;
  const whoisPromise = inspectWhois(domain);
  try {
    const rawA = await withTimeout(import_promises.default.resolve4(hostname, { ttl: true }), TIMEOUT_MS, "DNS A");
    if (rawA && rawA.length > 0) {
      for (const item of rawA) {
        aRecords.push({ type: "A", address: item.address, ttl: item.ttl });
        allRecords.push({
          id: `rec-a-${item.address}`,
          type: "A",
          name: hostname,
          value: item.address,
          ttl: item.ttl,
          raw: item
        });
      }
      queryStatuses.A = { status: "success", count: aRecords.length };
    } else {
      queryStatuses.A = { status: "no_records_found", count: 0 };
    }
  } catch (err) {
    if (err?.code === "ENODATA" || err?.code === "ENOTFOUND") {
      queryStatuses.A = { status: "no_records_found", count: 0 };
    } else {
      const doh = await queryGoogleDoh(hostname, "A");
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 1) {
            aRecords.push({ type: "A", address: ans.data, ttl: ans.TTL });
            allRecords.push({
              id: `rec-a-${ans.data}`,
              type: "A",
              name: hostname,
              value: ans.data,
              ttl: ans.TTL,
              raw: ans
            });
          }
        }
        queryStatuses.A = { status: "success", count: aRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.A = { status: "no_records_found", count: 0 };
      } else {
        queryStatuses.A = { status: "lookup_failed", count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }
  try {
    const rawAaaa = await withTimeout(import_promises.default.resolve6(hostname, { ttl: true }), TIMEOUT_MS, "DNS AAAA");
    if (rawAaaa && rawAaaa.length > 0) {
      for (const item of rawAaaa) {
        aaaaRecords.push({ type: "AAAA", address: item.address, ttl: item.ttl });
        allRecords.push({
          id: `rec-aaaa-${item.address}`,
          type: "AAAA",
          name: hostname,
          value: item.address,
          ttl: item.ttl,
          raw: item
        });
      }
      queryStatuses.AAAA = { status: "success", count: aaaaRecords.length };
    } else {
      queryStatuses.AAAA = { status: "no_records_found", count: 0 };
    }
  } catch (err) {
    if (err?.code === "ENODATA" || err?.code === "ENOTFOUND") {
      queryStatuses.AAAA = { status: "no_records_found", count: 0 };
    } else {
      const doh = await queryGoogleDoh(hostname, "AAAA");
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 28) {
            aaaaRecords.push({ type: "AAAA", address: ans.data, ttl: ans.TTL });
            allRecords.push({
              id: `rec-aaaa-${ans.data}`,
              type: "AAAA",
              name: hostname,
              value: ans.data,
              ttl: ans.TTL,
              raw: ans
            });
          }
        }
        queryStatuses.AAAA = { status: "success", count: aaaaRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.AAAA = { status: "no_records_found", count: 0 };
      } else {
        queryStatuses.AAAA = { status: "lookup_failed", count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }
  try {
    const rawCname = await withTimeout(import_promises.default.resolveCname(hostname), TIMEOUT_MS, "DNS CNAME");
    if (rawCname && rawCname.length > 0) {
      for (const target of rawCname) {
        cnameRecords.push({ type: "CNAME", target });
        allRecords.push({
          id: `rec-cname-${target}`,
          type: "CNAME",
          name: hostname,
          value: target,
          raw: target
        });
      }
      queryStatuses.CNAME = { status: "success", count: cnameRecords.length };
    } else {
      queryStatuses.CNAME = { status: "no_records_found", count: 0 };
    }
  } catch (err) {
    if (err?.code === "ENODATA" || err?.code === "ENOTFOUND") {
      queryStatuses.CNAME = { status: "no_records_found", count: 0 };
    } else {
      const doh = await queryGoogleDoh(hostname, "CNAME");
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 5) {
            cnameRecords.push({ type: "CNAME", target: ans.data, ttl: ans.TTL });
            allRecords.push({
              id: `rec-cname-${ans.data}`,
              type: "CNAME",
              name: hostname,
              value: ans.data,
              ttl: ans.TTL,
              raw: ans
            });
          }
        }
        queryStatuses.CNAME = { status: "success", count: cnameRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.CNAME = { status: "no_records_found", count: 0 };
      } else {
        queryStatuses.CNAME = { status: "lookup_failed", count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }
  let targetNsHost = hostname;
  try {
    let rawNs = [];
    try {
      rawNs = await withTimeout(import_promises.default.resolveNs(hostname), TIMEOUT_MS, "DNS NS (host)");
    } catch (nsErr) {
      if ((nsErr?.code === "ENODATA" || nsErr?.code === "ENOTFOUND") && hostname !== domain) {
        targetNsHost = domain;
        rawNs = await withTimeout(import_promises.default.resolveNs(domain), TIMEOUT_MS, "DNS NS (domain)");
      } else {
        throw nsErr;
      }
    }
    if (rawNs && rawNs.length > 0) {
      for (const ns of rawNs) {
        nsRecords.push({ type: "NS", host: ns });
        allRecords.push({
          id: `rec-ns-${ns}`,
          type: "NS",
          name: targetNsHost,
          value: ns,
          raw: ns
        });
      }
      queryStatuses.NS = { status: "success", count: nsRecords.length };
    } else {
      queryStatuses.NS = { status: "no_records_found", count: 0 };
    }
  } catch (err) {
    if (err?.code === "ENODATA" || err?.code === "ENOTFOUND") {
      queryStatuses.NS = { status: "no_records_found", count: 0 };
    } else {
      const doh = await queryGoogleDoh(domain, "NS");
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 2) {
            nsRecords.push({ type: "NS", host: ans.data, ttl: ans.TTL });
            allRecords.push({
              id: `rec-ns-${ans.data}`,
              type: "NS",
              name: domain,
              value: ans.data,
              ttl: ans.TTL,
              raw: ans
            });
          }
        }
        queryStatuses.NS = { status: "success", count: nsRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.NS = { status: "no_records_found", count: 0 };
      } else {
        queryStatuses.NS = { status: "lookup_failed", count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }
  let targetMxHost = hostname;
  try {
    let rawMx = [];
    try {
      rawMx = await withTimeout(import_promises.default.resolveMx(hostname), TIMEOUT_MS, "DNS MX (host)");
    } catch (mxErr) {
      if ((mxErr?.code === "ENODATA" || mxErr?.code === "ENOTFOUND") && hostname !== domain) {
        targetMxHost = domain;
        rawMx = await withTimeout(import_promises.default.resolveMx(domain), TIMEOUT_MS, "DNS MX (domain)");
      } else {
        throw mxErr;
      }
    }
    if (rawMx && rawMx.length > 0) {
      rawMx.sort((a, b) => a.priority - b.priority);
      for (const mx of rawMx) {
        mxRecords.push({ type: "MX", host: mx.exchange, priority: mx.priority });
        allRecords.push({
          id: `rec-mx-${mx.exchange}-${mx.priority}`,
          type: "MX",
          name: targetMxHost,
          value: mx.exchange,
          secondaryValue: `Priority ${mx.priority}`,
          raw: mx
        });
      }
      queryStatuses.MX = { status: "success", count: mxRecords.length };
    } else {
      queryStatuses.MX = { status: "no_records_found", count: 0 };
    }
  } catch (err) {
    if (err?.code === "ENODATA" || err?.code === "ENOTFOUND") {
      queryStatuses.MX = { status: "no_records_found", count: 0 };
    } else {
      const doh = await queryGoogleDoh(domain, "MX");
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 15) {
            const parts = ans.data.split(/\s+/);
            const prio = parseInt(parts[0], 10) || 10;
            const exch = (parts[1] || "").replace(/\.$/, "");
            mxRecords.push({ type: "MX", host: exch, priority: prio, ttl: ans.TTL });
            allRecords.push({
              id: `rec-mx-${exch}-${prio}`,
              type: "MX",
              name: domain,
              value: exch,
              secondaryValue: `Priority ${prio}`,
              ttl: ans.TTL,
              raw: ans
            });
          }
        }
        mxRecords.sort((a, b) => a.priority - b.priority);
        queryStatuses.MX = { status: "success", count: mxRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.MX = { status: "no_records_found", count: 0 };
      } else {
        queryStatuses.MX = { status: "lookup_failed", count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }
  let targetTxtHost = hostname;
  try {
    let rawTxt = [];
    try {
      rawTxt = await withTimeout(import_promises.default.resolveTxt(hostname), TIMEOUT_MS, "DNS TXT (host)");
    } catch (txtErr) {
      if ((txtErr?.code === "ENODATA" || txtErr?.code === "ENOTFOUND") && hostname !== domain) {
        targetTxtHost = domain;
        rawTxt = await withTimeout(import_promises.default.resolveTxt(domain), TIMEOUT_MS, "DNS TXT (domain)");
      } else {
        throw txtErr;
      }
    }
    if (rawTxt && rawTxt.length > 0) {
      for (const chunks of rawTxt) {
        const fullText = chunks.join("");
        const { category, label } = categorizeTxtRecord(fullText);
        txtRecords.push({
          type: "TXT",
          entries: chunks,
          fullText,
          category,
          categoryLabel: label
        });
        allRecords.push({
          id: `rec-txt-${Math.random().toString(36).substring(2, 8)}`,
          type: "TXT",
          name: targetTxtHost,
          value: fullText,
          secondaryValue: label,
          raw: chunks
        });
      }
      queryStatuses.TXT = { status: "success", count: txtRecords.length };
    } else {
      queryStatuses.TXT = { status: "no_records_found", count: 0 };
    }
  } catch (err) {
    if (err?.code === "ENODATA" || err?.code === "ENOTFOUND") {
      queryStatuses.TXT = { status: "no_records_found", count: 0 };
    } else {
      const doh = await queryGoogleDoh(domain, "TXT");
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 16) {
            const cleanText = (ans.data || "").replace(/^"|"$/g, "").replace(/""/g, "");
            const { category, label } = categorizeTxtRecord(cleanText);
            txtRecords.push({
              type: "TXT",
              entries: [cleanText],
              fullText: cleanText,
              category,
              categoryLabel: label,
              ttl: ans.TTL
            });
            allRecords.push({
              id: `rec-txt-${Math.random().toString(36).substring(2, 8)}`,
              type: "TXT",
              name: domain,
              value: cleanText,
              secondaryValue: label,
              ttl: ans.TTL,
              raw: ans
            });
          }
        }
        queryStatuses.TXT = { status: "success", count: txtRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.TXT = { status: "no_records_found", count: 0 };
      } else {
        queryStatuses.TXT = { status: "lookup_failed", count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }
  const ipObservations = [
    ...aRecords.map((a) => ({
      address: a.address,
      version: "IPv4",
      recordType: "A",
      ttl: a.ttl,
      fact: `Target domain ${hostname} resolved to IPv4 address ${a.address} via DNS A record.`,
      observation: `Observed active routing destination for IPv4 TCP/UDP traffic.`,
      interpretation: `Direct network routing endpoint. Distinct architectural role (e.g. edge proxy vs application origin) is not observable from DNS alone.`
    })),
    ...aaaaRecords.map((aaaa) => ({
      address: aaaa.address,
      version: "IPv6",
      recordType: "AAAA",
      ttl: aaaa.ttl,
      fact: `Target domain ${hostname} resolved to IPv6 address ${aaaa.address} via DNS AAAA record.`,
      observation: `Observed active IPv6 unicast network layer address.`,
      interpretation: `Endpoint supports native dual-stack IPv6 transport.`
    }))
  ];
  const nameserverObservations = nsRecords.map((ns) => ({
    host: ns.host,
    ttl: ns.ttl,
    fact: `Authoritative nameserver record lists ${ns.host}.`,
    observation: `Zone authority and DNS delegation for ${domain} is handled by ${ns.host}.`
  }));
  const mailServerObservations = mxRecords.map((mx) => ({
    host: mx.host,
    priority: mx.priority,
    ttl: mx.ttl,
    fact: `Mail exchange (MX) record points to ${mx.host} with priority ${mx.priority}.`,
    observation: `Public mail routing for @${domain} designates ${mx.host} at priority rank ${mx.priority}.`
  }));
  const cnameRelationships = cnameRecords.map((cname) => ({
    source: hostname,
    target: cname.target,
    ttl: cname.ttl,
    fact: `Canonical Name (CNAME) record delegates ${hostname} to ${cname.target}.`,
    observation: `The requested hostname is an alias mapping to ${cname.target}. Traffic resolution chains through this canonical entity.`
  }));
  const indicators = [];
  const nsJoined = nsRecords.map((n) => n.host.toLowerCase()).join(" ");
  if (nsJoined.includes("awsdns-")) {
    indicators.push({
      id: "ind-dns-route53",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "Amazon Route 53",
      confidence: "HIGH",
      evidence: "Observed authoritative NS hostnames matching awsdns-*.{com,net,org,co.uk}",
      technicalDetail: "Anycast DNS zone hosted on AWS Route 53 managed nameserver infrastructure."
    });
  } else if (nsJoined.includes("cloudflare.com")) {
    indicators.push({
      id: "ind-dns-cloudflare",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "Cloudflare DNS",
      confidence: "HIGH",
      evidence: "Observed authoritative NS hostnames matching *.cloudflare.com",
      technicalDetail: "Managed edge authoritative DNS hosted on Cloudflare anycast infrastructure."
    });
  } else if (nsJoined.includes("googledomains.com") || nsJoined.includes("google.com")) {
    indicators.push({
      id: "ind-dns-google",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "Google Cloud DNS / Domains",
      confidence: "HIGH",
      evidence: "Observed authoritative NS hostnames matching Google DNS domain patterns",
      technicalDetail: "Authoritative zone hosted on Google anycast nameserver infrastructure."
    });
  } else if (nsJoined.includes("azure-dns")) {
    indicators.push({
      id: "ind-dns-azure",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "Microsoft Azure DNS",
      confidence: "HIGH",
      evidence: "Observed authoritative NS hostnames matching *.azure-dns.*",
      technicalDetail: "Managed zone hosted on Microsoft Azure DNS edge infrastructure."
    });
  } else if (nsJoined.includes("nsone.net")) {
    indicators.push({
      id: "ind-dns-ns1",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "NS1 (IBM)",
      confidence: "HIGH",
      evidence: "Observed authoritative NS hostnames matching *.p*.nsone.net",
      technicalDetail: "Enterprise anycast managed DNS provided by NS1 / IBM network."
    });
  } else if (nsJoined.includes("akam.net") || nsJoined.includes("akamai.com")) {
    indicators.push({
      id: "ind-dns-akamai",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "Akamai Edge DNS",
      confidence: "HIGH",
      evidence: "Observed authoritative NS hostnames matching Akamai edge patterns",
      technicalDetail: "Enterprise authoritative DNS routed through Akamai distributed edge."
    });
  } else if (nsJoined.includes("registrar-servers.com")) {
    indicators.push({
      id: "ind-dns-namecheap",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "Namecheap DNS",
      confidence: "HIGH",
      evidence: "Observed authoritative NS hostnames matching registrar-servers.com",
      technicalDetail: "Default registrar DNS service provided by Namecheap."
    });
  } else if (nsJoined.includes("domaincontrol.com")) {
    indicators.push({
      id: "ind-dns-godaddy",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "GoDaddy DNS",
      confidence: "HIGH",
      evidence: "Observed authoritative NS hostnames matching domaincontrol.com",
      technicalDetail: "Default registrar DNS service provided by GoDaddy."
    });
  } else if (nsRecords.length > 0) {
    indicators.push({
      id: "ind-dns-custom",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "Custom / Undetermined Provider",
      confidence: "MEDIUM",
      evidence: `Nameservers observed (${nsRecords.slice(0, 2).map((n) => n.host).join(", ")}), but no known major public provider signature matched`,
      technicalDetail: "Nameserver hostnames do not correlate with standard public managed DNS signatures."
    });
  } else {
    indicators.push({
      id: "ind-dns-unknown",
      category: "dns_provider",
      categoryLabel: "Authoritative DNS Provider",
      name: "NOT DETERMINED",
      confidence: "UNKNOWN",
      evidence: "No authoritative nameservers were resolved during query sequence",
      technicalDetail: "Nameserver lookup returned no records or query was unanswerable."
    });
  }
  const cnameJoined = cnameRecords.map((c) => c.target.toLowerCase()).join(" ");
  const serverHeader = (httpClues?.serverHeader || "").toLowerCase();
  const cdnHeaderJoined = (httpClues?.cdnHeaders || []).join(" ").toLowerCase();
  if (cnameJoined.includes("cloudflare.net") || nsJoined.includes("cloudflare.com") || serverHeader.includes("cloudflare") || cdnHeaderJoined.includes("cf-ray")) {
    indicators.push({
      id: "ind-cdn-cloudflare",
      category: "cdn",
      categoryLabel: "Content Delivery Network (CDN)",
      name: "Cloudflare Edge Network",
      confidence: "HIGH",
      evidence: "Cross-correlated Cloudflare indicators observed in DNS nameservers and/or HTTP edge headers",
      technicalDetail: "Inbound traffic is proxied through Cloudflare global anycast reverse proxy infrastructure."
    });
  } else if (cnameJoined.includes("cloudfront.net")) {
    indicators.push({
      id: "ind-cdn-cloudfront",
      category: "cdn",
      categoryLabel: "Content Delivery Network (CDN)",
      name: "Amazon CloudFront",
      confidence: "HIGH",
      evidence: "CNAME canonical delegation matches *.cloudfront.net distribution",
      technicalDetail: "Traffic is routed through Amazon Web Services CloudFront content delivery network."
    });
  } else if (cnameJoined.includes("fastly.net") || serverHeader.includes("fastly")) {
    indicators.push({
      id: "ind-cdn-fastly",
      category: "cdn",
      categoryLabel: "Content Delivery Network (CDN)",
      name: "Fastly Edge Cloud",
      confidence: "HIGH",
      evidence: "Observed Fastly CNAME target or response routing headers",
      technicalDetail: "Content caching and edge delivery managed by Fastly edge network."
    });
  } else if (cnameJoined.includes("akamaiedge.net") || cnameJoined.includes("edgesuite.net")) {
    indicators.push({
      id: "ind-cdn-akamai",
      category: "cdn",
      categoryLabel: "Content Delivery Network (CDN)",
      name: "Akamai Edge Network",
      confidence: "HIGH",
      evidence: "CNAME canonical delegation matches Akamai distribution domain",
      technicalDetail: "Edge caching and delivery handled by Akamai distributed network."
    });
  } else if (cnameJoined.includes("azureedge.net")) {
    indicators.push({
      id: "ind-cdn-azure",
      category: "cdn",
      categoryLabel: "Content Delivery Network (CDN)",
      name: "Microsoft Azure CDN",
      confidence: "HIGH",
      evidence: "CNAME canonical delegation matches *.azureedge.net",
      technicalDetail: "Application fronted by Microsoft Azure Content Delivery Network."
    });
  } else if (cnameJoined.includes("github.io")) {
    indicators.push({
      id: "ind-cdn-github",
      category: "cdn",
      categoryLabel: "Hosting / Edge Platform",
      name: "GitHub Pages",
      confidence: "HIGH",
      evidence: "CNAME canonical target maps to github.io endpoint",
      technicalDetail: "Static site served via Fastly/GitHub Pages edge platform."
    });
  } else if (cnameJoined.includes("vercel-dns.com") || cnameJoined.includes("vercel.app")) {
    indicators.push({
      id: "ind-cdn-vercel",
      category: "cdn",
      categoryLabel: "Hosting / Edge Platform",
      name: "Vercel Edge Network",
      confidence: "HIGH",
      evidence: "Observed Vercel routing CNAME alias",
      technicalDetail: "Serverless deployment hosted on Vercel distributed platform."
    });
  } else {
    indicators.push({
      id: "ind-cdn-none",
      category: "cdn",
      categoryLabel: "Content Delivery Network (CDN)",
      name: "NOT DETERMINED",
      confidence: "UNKNOWN",
      evidence: "No canonical CNAME alias or recognized edge headers observed",
      technicalDetail: "Target may serve content directly from origin, employ direct DNS routing, or use an unlisted CDN."
    });
  }
  const mxJoined = mxRecords.map((m) => m.host.toLowerCase()).join(" ");
  if (mxJoined.includes("outlook.com") || mxJoined.includes("microsoft")) {
    indicators.push({
      id: "ind-mail-m365",
      category: "mail_security",
      categoryLabel: "Mail Exchange Infrastructure",
      name: "Microsoft 365 / Exchange Online",
      confidence: "HIGH",
      evidence: "MX host points to Microsoft Protection gateway (*.mail.protection.outlook.com)",
      technicalDetail: "Enterprise mail exchange handled by Microsoft Exchange Online cloud infrastructure."
    });
  } else if (mxJoined.includes("google.com") || mxJoined.includes("googlemail.com")) {
    indicators.push({
      id: "ind-mail-google",
      category: "mail_security",
      categoryLabel: "Mail Exchange Infrastructure",
      name: "Google Workspace / Gmail",
      confidence: "HIGH",
      evidence: "MX host points to Google mail server infrastructure (*.google.com / aspmx.l.google.com)",
      technicalDetail: "Inbound email routed through Google Workspace cloud mail services."
    });
  } else if (mxJoined.includes("pphosted.com")) {
    indicators.push({
      id: "ind-mail-proofpoint",
      category: "mail_security",
      categoryLabel: "Mail Security Gateway",
      name: "Proofpoint Email Protection",
      confidence: "HIGH",
      evidence: "MX host points to Proofpoint secure gateway (*.pphosted.com)",
      technicalDetail: "Inbound mail inspected by Proofpoint enterprise security filtering."
    });
  } else if (mxJoined.includes("mimecast.com")) {
    indicators.push({
      id: "ind-mail-mimecast",
      category: "mail_security",
      categoryLabel: "Mail Security Gateway",
      name: "Mimecast Secure Gateway",
      confidence: "HIGH",
      evidence: "MX host points to Mimecast mail routing gateway",
      technicalDetail: "Email filtered through Mimecast secure perimeter."
    });
  } else if (mxRecords.length > 0) {
    indicators.push({
      id: "ind-mail-custom",
      category: "mail_security",
      categoryLabel: "Mail Exchange Infrastructure",
      name: "Private / Custom Mail Gateway",
      confidence: "MEDIUM",
      evidence: `MX hosts observed (${mxRecords.slice(0, 2).map((m) => m.host).join(", ")}), but no major vendor pattern matched`,
      technicalDetail: "Mail routing is handled by domain-specific or private email relays."
    });
  } else {
    indicators.push({
      id: "ind-mail-none",
      category: "mail_security",
      categoryLabel: "Mail Exchange Infrastructure",
      name: "NO MX CONFIGURED",
      confidence: "HIGH",
      evidence: "Zero MX records observed in DNS query results",
      technicalDetail: "Target domain does not advertise public mail exchange routing records."
    });
  }
  if (nsJoined.includes("awsdns") || cnameJoined.includes("amazonaws.com") || cnameJoined.includes("cloudfront.net")) {
    indicators.push({
      id: "ind-cloud-aws",
      category: "cloud",
      categoryLabel: "Cloud Ecosystem Clues",
      name: "Amazon Web Services (AWS)",
      confidence: "HIGH",
      evidence: "Observable DNS and routing components belong to AWS public cloud service domains",
      technicalDetail: "Part or all of the authoritative domain and edge topology operates in AWS."
    });
  } else if (nsJoined.includes("azure-dns") || cnameJoined.includes("azure") || mxJoined.includes("outlook.com")) {
    indicators.push({
      id: "ind-cloud-microsoft",
      category: "cloud",
      categoryLabel: "Cloud Ecosystem Clues",
      name: "Microsoft Cloud (Azure / M365)",
      confidence: "HIGH",
      evidence: "Observable DNS or enterprise routing components map to Microsoft cloud networks",
      technicalDetail: "DNS and/or mail infrastructure is provisioned through Microsoft commercial cloud services."
    });
  } else if (nsJoined.includes("google") || mxJoined.includes("google")) {
    indicators.push({
      id: "ind-cloud-google",
      category: "cloud",
      categoryLabel: "Cloud Ecosystem Clues",
      name: "Google Cloud / Workspace",
      confidence: "HIGH",
      evidence: "Observable DNS or mail infrastructure routes through Google networks",
      technicalDetail: "Core domain services integrate with Google cloud platforms."
    });
  } else {
    indicators.push({
      id: "ind-cloud-unknown",
      category: "cloud",
      categoryLabel: "Cloud Ecosystem Clues",
      name: "NOT DETERMINED",
      confidence: "UNKNOWN",
      evidence: "No definitive cloud provider signatures observed in public DNS topology",
      technicalDetail: "Evidence does not permit specific cloud platform attribution without active network probing."
    });
  }
  const entities = [
    {
      id: `entity-dom-${domain}`,
      type: "DOMAIN",
      label: "Target Domain",
      value: domain
    }
  ];
  const links = [];
  for (const ip of ipObservations) {
    const ipId = `entity-ip-${ip.address}`;
    if (!entities.find((e) => e.id === ipId)) {
      entities.push({
        id: ipId,
        type: "IP_ADDRESS",
        label: `${ip.version} Address`,
        value: ip.address,
        metadata: ip.recordType
      });
    }
    links.push({
      id: `link-${domain}-to-${ip.address}`,
      sourceId: `entity-dom-${domain}`,
      targetId: ipId,
      relationship: "RESOLVES_TO",
      relationshipLabel: `Resolves to (${ip.recordType})`,
      description: `Domain ${domain} routes to network address ${ip.address}`
    });
  }
  for (const ns of nsRecords) {
    const nsId = `entity-ns-${ns.host}`;
    if (!entities.find((e) => e.id === nsId)) {
      entities.push({
        id: nsId,
        type: "NAMESERVER",
        label: "Nameserver",
        value: ns.host
      });
    }
    links.push({
      id: `link-${domain}-to-ns-${ns.host}`,
      sourceId: `entity-dom-${domain}`,
      targetId: nsId,
      relationship: "USES_NAMESERVER",
      relationshipLabel: "Delegated to NS",
      description: `Zone authority for ${domain} is delegated to ${ns.host}`
    });
  }
  for (const mx of mxRecords) {
    const mxId = `entity-mx-${mx.host}`;
    if (!entities.find((e) => e.id === mxId)) {
      entities.push({
        id: mxId,
        type: "MAIL_SERVER",
        label: "Mail Server",
        value: mx.host,
        metadata: `Priority ${mx.priority}`
      });
    }
    links.push({
      id: `link-${domain}-to-mx-${mx.host}`,
      sourceId: `entity-dom-${domain}`,
      targetId: mxId,
      relationship: "MAIL_ROUTES_TO",
      relationshipLabel: `Mail routes to (P${mx.priority})`,
      description: `Inbound mail for @${domain} routes to ${mx.host}`
    });
  }
  for (const cname of cnameRecords) {
    const cnameId = `entity-cname-${cname.target}`;
    if (!entities.find((e) => e.id === cnameId)) {
      entities.push({
        id: cnameId,
        type: "CNAME_TARGET",
        label: "Canonical Target",
        value: cname.target
      });
    }
    links.push({
      id: `link-${hostname}-to-cname-${cname.target}`,
      sourceId: `entity-dom-${domain}`,
      targetId: cnameId,
      relationship: "ALIASES_TO",
      relationshipLabel: "Aliases to CNAME",
      description: `Target ${hostname} is a canonical alias for ${cname.target}`
    });
  }
  let typesDiscoveredCount = 0;
  if (aRecords.length > 0) typesDiscoveredCount++;
  if (aaaaRecords.length > 0) typesDiscoveredCount++;
  if (cnameRecords.length > 0) typesDiscoveredCount++;
  if (mxRecords.length > 0) typesDiscoveredCount++;
  if (nsRecords.length > 0) typesDiscoveredCount++;
  if (txtRecords.length > 0) typesDiscoveredCount++;
  const totalRecordsCount = aRecords.length + aaaaRecords.length + cnameRecords.length + mxRecords.length + nsRecords.length + txtRecords.length;
  let whoisResult = null;
  try {
    whoisResult = await whoisPromise;
  } catch (err) {
    whoisResult = {
      domain,
      lookupStatus: "UNAVAILABLE",
      error: err?.message || String(err),
      queriedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  if (whoisResult?.registrar) {
    const regDateStr = whoisResult.creationDate ? new Date(whoisResult.creationDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) : null;
    const expDateStr = whoisResult.expirationDate ? new Date(whoisResult.expirationDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) : null;
    indicators.push({
      id: `ind-whois-reg-${domain}`,
      category: "dns_provider",
      categoryLabel: "Domain Registrar",
      name: whoisResult.registrar,
      confidence: "HIGH",
      evidence: `Registrar: ${whoisResult.registrar}${whoisResult.registrarIanaId ? ` (IANA ID: ${whoisResult.registrarIanaId})` : ""}`,
      technicalDetail: [
        `Registrar: ${whoisResult.registrar}`,
        regDateStr ? `Registered: ${regDateStr}` : "",
        expDateStr ? `Expires: ${expDateStr}` : "",
        whoisResult.whoisServer ? `Registry Server: ${whoisResult.whoisServer}` : ""
      ].filter(Boolean).join(" | ")
    });
  }
  const summaryStatus = totalRecordsCount > 0 ? "COMPLETE" : queryStatuses.A.status === "lookup_failed" ? "LOOKUP_FAILED" : "NO_RECORDS";
  return {
    domain,
    hostname,
    queriedAt: (/* @__PURE__ */ new Date()).toISOString(),
    summary: {
      ipv4Count: aRecords.length,
      ipv6Count: aaaaRecords.length,
      nameserverCount: nsRecords.length,
      mailServerCount: mxRecords.length,
      recordTypesDiscoveredCount: typesDiscoveredCount,
      totalRecordsCount,
      status: summaryStatus
    },
    aRecords,
    aaaaRecords,
    cnameRecords,
    mxRecords,
    nsRecords,
    txtRecords,
    allRecords,
    ipObservations,
    nameserverObservations,
    mailServerObservations,
    cnameRelationships,
    indicators,
    relationships: {
      entities,
      links
    },
    queryStatuses,
    whois: whoisResult,
    error: null
  };
}

// src/services/technologySignatures.ts
var TECHNOLOGY_SIGNATURES = [
  // ==========================================
  // 1. FRONTEND FRAMEWORKS
  // ==========================================
  {
    id: "nextjs",
    name: "Next.js",
    slug: "nextjs",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "The React framework for the Web with hybrid static & server rendering.",
    website: "https://nextjs.org",
    indicators: {
      headers: [
        {
          name: "x-powered-by",
          valueRegex: /Next\.js/i,
          interpretation: "Explicit X-Powered-By response header announces Next.js runtime.",
          weight: 50
        }
      ],
      domMarkers: [
        {
          marker: 'id="__next"',
          interpretation: "Found canonical Next.js root DOM wrapper element (#__next).",
          weight: 50
        }
      ],
      scripts: [
        {
          pattern: /\/_next\/static\//i,
          interpretation: "Script URL pattern matches Next.js compiled static asset distribution path (/_next/static/).",
          weight: 45
        },
        {
          pattern: /\/_next\/data\//i,
          interpretation: "Dynamic client route data fetching endpoint pattern (/_next/data/).",
          weight: 45
        }
      ],
      html: [
        {
          regex: /<script id="__NEXT_DATA__"/i,
          interpretation: "Next.js embedded hydration script tag (__NEXT_DATA__) located in document body.",
          weight: 55
        }
      ]
    },
    versionPatterns: [
      {
        source: "html",
        regex: /"buildId":"([^"]+)"/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ],
    conflictsWith: ["nuxtjs", "remix", "astro"]
  },
  {
    id: "react",
    name: "React",
    slug: "react",
    category: "frontend_framework",
    categoryLabel: "JavaScript Framework",
    description: "A declarative, component-based JavaScript library and UI runtime engine.",
    website: "https://react.dev",
    indicators: {
      domMarkers: [
        {
          marker: "data-reactroot",
          interpretation: "React server-side rendering root marker (data-reactroot) detected on DOM container.",
          weight: 55
        },
        {
          marker: "data-reactid",
          interpretation: "React client component ID marker (data-reactid) observed on DOM elements.",
          weight: 50
        },
        {
          marker: "data-react-helmet",
          interpretation: "React Helmet metadata injector attributes found on document tags.",
          weight: 40
        },
        {
          marker: "framework:react",
          interpretation: "React synthetic event system or fiber node properties identified in active DOM.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /data-reactroot|data-reactid/i,
          interpretation: "Document contains React hydration/rendering boundary attributes.",
          weight: 50
        },
        {
          regex: /data-react-helmet/i,
          interpretation: "React Helmet metadata injector attributes found on document tags.",
          weight: 40
        },
        {
          regex: /_reactListening|__reactFiber|__reactEvents|__reactInternalInstance|_reactProps/i,
          interpretation: "React synthetic event listener or Fiber node internals present in page code.",
          weight: 50
        },
        {
          regex: /ReactDOM\.(?:createRoot|render|hydrate)|createRoot\(/i,
          interpretation: "ReactDOM mounting and hydration entry point call identified.",
          weight: 45
        },
        {
          regex: /__REACT_DEVTOOLS_GLOBAL_HOOK__|window\.__REACT_CONTEXT__/i,
          interpretation: "React DevTools global hook integration marker observed.",
          weight: 45
        }
      ],
      scripts: [
        {
          pattern: /react(?:\.production(?:\.min)?)?\.js/i,
          interpretation: "Direct React production runtime script bundle referenced.",
          weight: 50
        },
        {
          pattern: /react-dom(?:\.production(?:\.min)?)?\.js/i,
          interpretation: "React DOM rendering package bundle script located.",
          weight: 50
        },
        {
          pattern: /react@[0-9.]+|react-dom@[0-9.]+/i,
          interpretation: "CDN script package references versioned React distribution.",
          weight: 50
        },
        {
          pattern: /\/chunks\/(?:framework|react|main)-[a-f0-9]+\.js/i,
          interpretation: "Framework chunk bundle signature packaging React core runtime.",
          weight: 40
        },
        {
          pattern: /react-router/i,
          interpretation: "React Router declarative navigation bundle observed.",
          weight: 40
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /react(?:@|-)([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      },
      {
        source: "html",
        regex: /react\/([\d.]+)\/(?:umd\/)?react/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "vuejs",
    name: "Vue.js",
    slug: "vuejs",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "An approachable, performant and versatile framework for building web user interfaces.",
    website: "https://vuejs.org",
    indicators: {
      domMarkers: [
        {
          marker: "data-v-* (Vue scoped)",
          interpretation: "Scoped CSS template attribute data-v-[hash] observed on DOM nodes.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /data-v-[a-f0-9]{6,}/i,
          interpretation: "Observable Vue single-file component scoped attribute hash.",
          weight: 45
        },
        {
          regex: /__vue__/i,
          interpretation: "Vue DOM instance mount property detected in HTML script structure.",
          weight: 45
        }
      ],
      scripts: [
        {
          pattern: /vue(?:\.runtime)?(?:\.esm)?(?:\.min)?\.js/i,
          interpretation: "Public Vue JavaScript runtime referenced in document script element.",
          weight: 45
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /vue(?:@|-)([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ],
    conflictsWith: ["react", "angular"]
  },
  {
    id: "nuxtjs",
    name: "Nuxt.js",
    slug: "nuxtjs",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "The intuitive Vue framework for creating full-stack web applications and websites.",
    website: "https://nuxt.com",
    indicators: {
      headers: [
        {
          name: "x-powered-by",
          valueRegex: /Nuxt/i,
          interpretation: "Header x-powered-by reports Nuxt server execution.",
          weight: 50
        }
      ],
      domMarkers: [
        {
          marker: 'id="__nuxt"',
          interpretation: "Nuxt canonical entry element (#__nuxt) identified.",
          weight: 50
        }
      ],
      scripts: [
        {
          pattern: /\/_nuxt\//i,
          interpretation: "Nuxt build directory resource path (/_nuxt/) referenced in script tags.",
          weight: 45
        }
      ],
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Nuxt/i,
          interpretation: "Meta generator tag declares Nuxt.",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "meta",
        regex: /Nuxt(?:\s+v?)([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ],
    conflictsWith: ["nextjs"]
  },
  {
    id: "angular",
    name: "Angular",
    slug: "angular",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "A platform and framework for building single-page client applications using TypeScript.",
    website: "https://angular.dev",
    indicators: {
      domMarkers: [
        {
          marker: "ng-version",
          interpretation: "ng-version attribute detected on application root element.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /ng-version=["']([^"']+)["']/i,
          interpretation: "Explicit ng-version attribute declares Angular application bootstrap.",
          weight: 55
        },
        {
          regex: /<app-root[\s>]/i,
          interpretation: "Default Angular application root selector tag (<app-root>) found in markup.",
          weight: 40
        }
      ],
      scripts: [
        {
          pattern: /@angular\/core/i,
          interpretation: "Angular core distribution script bundle referenced in resources.",
          weight: 40
        }
      ]
    },
    versionPatterns: [
      {
        source: "html",
        regex: /ng-version=["']([^"']+)["']/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ],
    conflictsWith: ["react", "vuejs"]
  },
  {
    id: "svelte",
    name: "Svelte",
    slug: "svelte",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "A cybernetically enhanced web framework that compiles components into efficient vanilla JS.",
    website: "https://svelte.dev",
    indicators: {
      domMarkers: [
        {
          marker: "svelte-* class",
          interpretation: "Scoped CSS class signature svelte-[hash] detected on elements.",
          weight: 45
        }
      ],
      html: [
        {
          regex: /class=["'][^"']*svelte-[a-z0-9]+/i,
          interpretation: "Svelte compiler-generated scoped CSS class prefix present in DOM markup.",
          weight: 45
        }
      ],
      scripts: [
        {
          pattern: /\/_app\/immutable\//i,
          interpretation: "SvelteKit immutable chunk directory route structure (/_app/immutable/).",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /svelte(?:@|-)([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "astro",
    name: "Astro",
    slug: "astro",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "The web framework for content-driven websites with zero-JS by default.",
    website: "https://astro.build",
    indicators: {
      domMarkers: [
        {
          marker: "astro-island",
          interpretation: "Astro interactive hydration component wrapper (<astro-island>) present.",
          weight: 55
        }
      ],
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Astro/i,
          interpretation: "Meta generator explicitly announces Astro build engine.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /data-astro-cid-[a-z0-9]+/i,
          interpretation: "Astro scoped component identifier attribute (data-astro-cid-*) observed.",
          weight: 45
        }
      ]
    },
    versionPatterns: [
      {
        source: "meta",
        regex: /Astro(?:\s+v?)([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "remix",
    name: "Remix",
    slug: "remix",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "A full stack web framework focused on web standards and modern UX.",
    website: "https://remix.run",
    indicators: {
      html: [
        {
          regex: /window\.__remixContext/i,
          interpretation: "Remix client hydration payload context (window.__remixContext) embedded in HTML.",
          weight: 55
        },
        {
          regex: /window\.__remixRouteModules/i,
          interpretation: "Remix route module registry object defined on window.",
          weight: 50
        }
      ],
      scripts: [
        {
          pattern: /\/build\/entry\.client/i,
          interpretation: "Standard Remix build output client entry bundle path.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "alpinejs",
    name: "Alpine.js",
    slug: "alpinejs",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "A rugged, minimal tool for composing behavior directly in your HTML markup.",
    website: "https://alpinejs.dev",
    indicators: {
      html: [
        {
          regex: /x-data=["'][^"']*["']/i,
          interpretation: "Alpine directive x-data component initialization observed in HTML tags.",
          weight: 45
        },
        {
          regex: /x-init=["'][^"']*["']/i,
          interpretation: "Alpine directive x-init lifecycle hook present on DOM nodes.",
          weight: 40
        }
      ],
      scripts: [
        {
          pattern: /alpine(?:\.min)?\.js/i,
          interpretation: "Alpine.js JavaScript runtime script included in document.",
          weight: 45
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /alpinejs@([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "htmx",
    name: "htmx",
    slug: "htmx",
    category: "frontend_framework",
    categoryLabel: "Frontend Framework",
    description: "High power tools for HTML - access AJAX, WebSockets and Server Sent Events directly in HTML.",
    website: "https://htmx.org",
    indicators: {
      html: [
        {
          regex: /hx-get=["'][^"']*["']/i,
          interpretation: "htmx AJAX query attribute (hx-get) observed in HTML markup.",
          weight: 45
        },
        {
          regex: /hx-post=["'][^"']*["']/i,
          interpretation: "htmx AJAX mutation attribute (hx-post) observed in HTML markup.",
          weight: 45
        },
        {
          regex: /hx-target=["'][^"']*["']/i,
          interpretation: "htmx DOM swap target directive (hx-target) found.",
          weight: 40
        }
      ],
      scripts: [
        {
          pattern: /htmx(?:\.min)?\.js/i,
          interpretation: "htmx core JavaScript distribution script tag observed.",
          weight: 45
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /htmx\.org@([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  // ==========================================
  // 2. CONTENT MANAGEMENT SYSTEMS (CMS)
  // ==========================================
  {
    id: "wordpress",
    name: "WordPress",
    slug: "wordpress",
    category: "cms",
    categoryLabel: "Content Management (CMS)",
    description: "Open source publishing platform powering a large share of the web.",
    website: "https://wordpress.org",
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /WordPress/i,
          interpretation: "Meta generator tag explicitly identifies WordPress core installation.",
          weight: 55
        }
      ],
      headers: [
        {
          name: "x-pingback",
          valueRegex: /xmlrpc\.php/i,
          interpretation: "Response header X-Pingback points to WordPress XML-RPC endpoint.",
          weight: 50
        },
        {
          name: "link",
          valueRegex: /wp-json/i,
          interpretation: "Link header advertises WordPress REST API endpoint (/wp-json/).",
          weight: 40
        }
      ],
      domMarkers: [
        {
          marker: "wp-content/themes",
          interpretation: "Theme assets served from canonical wp-content/themes hierarchy.",
          weight: 45
        },
        {
          marker: "wp-content/plugins",
          interpretation: "Plugin assets served from canonical wp-content/plugins hierarchy.",
          weight: 45
        },
        {
          marker: "wp-includes",
          interpretation: "WordPress core JavaScript/CSS served from /wp-includes/.",
          weight: 45
        }
      ],
      html: [
        {
          regex: /wp-content\/themes/i,
          interpretation: "HTML document references stylesheets or media inside /wp-content/themes/.",
          weight: 40
        },
        {
          regex: /wp-content\/plugins/i,
          interpretation: "HTML document references scripts inside /wp-content/plugins/.",
          weight: 40
        }
      ]
    },
    versionPatterns: [
      {
        source: "meta",
        regex: /WordPress\s+([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      },
      {
        source: "script",
        regex: /ver=([0-9.]+)/i,
        groupIndex: 1,
        reliability: "MAJOR_MINOR"
      }
    ],
    conflictsWith: ["shopify", "webflow", "drupal", "joomla"]
  },
  {
    id: "shopify",
    name: "Shopify",
    slug: "shopify",
    category: "cms",
    categoryLabel: "Content Management (CMS)",
    description: "Hosted multi-channel commerce platform and storefront engine.",
    website: "https://shopify.com",
    indicators: {
      headers: [
        {
          name: "x-shopid",
          interpretation: "Proprietary X-ShopId header present in server response.",
          weight: 55
        },
        {
          name: "x-shopify-stage",
          interpretation: "Response header indicates Shopify edge cluster routing stage.",
          weight: 50
        }
      ],
      domMarkers: [
        {
          marker: "cdn.shopify.com",
          interpretation: "Page resources loaded directly from Shopify global edge CDN.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /cdn\.shopify\.com/i,
          interpretation: "Observable references to cdn.shopify.com in page stylesheets or media.",
          weight: 45
        },
        {
          regex: /Shopify\.theme/i,
          interpretation: "Shopify theme runtime configuration object detected in document scope.",
          weight: 50
        }
      ]
    },
    conflictsWith: ["wordpress", "webflow"]
  },
  {
    id: "webflow",
    name: "Webflow",
    slug: "webflow",
    category: "cms",
    categoryLabel: "Content Management (CMS)",
    description: "Visual web design platform, CMS, and hosting service.",
    website: "https://webflow.com",
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Webflow/i,
          interpretation: "Meta generator tag explicitly identifies Webflow site export or hosting.",
          weight: 55
        }
      ],
      domMarkers: [
        {
          marker: "data-wf-page/site (Webflow)",
          interpretation: "Found Webflow tracking attributes data-wf-page or data-wf-site.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /assets\.webflow\.com/i,
          interpretation: "Observable asset resources linked to assets.webflow.com CDN.",
          weight: 45
        }
      ]
    },
    conflictsWith: ["wordpress", "shopify"]
  },
  {
    id: "drupal",
    name: "Drupal",
    slug: "drupal",
    category: "cms",
    categoryLabel: "Content Management (CMS)",
    description: "Enterprise open source digital experience and content management framework.",
    website: "https://drupal.org",
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Drupal/i,
          interpretation: "Meta generator tag identifies Drupal content engine.",
          weight: 55
        }
      ],
      headers: [
        {
          name: "x-generator",
          valueRegex: /Drupal/i,
          interpretation: "Response header X-Generator reports Drupal.",
          weight: 55
        },
        {
          name: "x-drupal-cache",
          interpretation: "Response header X-Drupal-Cache discloses Drupal caching subsystem.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /Drupal\.settings/i,
          interpretation: "Drupal global settings JS dictionary object identified in HTML.",
          weight: 45
        },
        {
          regex: /sites\/default\/files/i,
          interpretation: "Canonical Drupal file storage directory path observed in media links.",
          weight: 35
        }
      ]
    },
    versionPatterns: [
      {
        source: "meta",
        regex: /Drupal\s+([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ],
    conflictsWith: ["wordpress", "joomla"]
  },
  {
    id: "joomla",
    name: "Joomla!",
    slug: "joomla",
    category: "cms",
    categoryLabel: "Content Management (CMS)",
    description: "Open source content management system for web publishing.",
    website: "https://joomla.org",
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Joomla!/i,
          interpretation: "Meta generator indicates Joomla! installation.",
          weight: 55
        }
      ],
      headers: [
        {
          name: "x-content-encoded-by",
          valueRegex: /Joomla!/i,
          interpretation: "Response header reports Joomla encoding.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /\/media\/system\/js\/core\.js/i,
          interpretation: "Standard Joomla core JavaScript utility script referenced.",
          weight: 45
        }
      ]
    },
    versionPatterns: [
      {
        source: "meta",
        regex: /Joomla!\s+([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ],
    conflictsWith: ["wordpress", "drupal"]
  },
  {
    id: "ghost",
    name: "Ghost",
    slug: "ghost",
    category: "cms",
    categoryLabel: "Content Management (CMS)",
    description: "Professional open source publishing platform built on Node.js.",
    website: "https://ghost.org",
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Ghost/i,
          interpretation: "Meta generator tag explicitly announces Ghost publishing engine.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /ghost-search|ghost-portal/i,
          interpretation: "Ghost client-side search or membership portal markers found in HTML.",
          weight: 45
        }
      ]
    },
    versionPatterns: [
      {
        source: "meta",
        regex: /Ghost\s+([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "squarespace",
    name: "Squarespace",
    slug: "squarespace",
    category: "cms",
    categoryLabel: "Content Management (CMS)",
    description: "All-in-one website building and hosting platform.",
    website: "https://squarespace.com",
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Squarespace/i,
          interpretation: "Meta generator tag declares Squarespace platform.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /static1\.squarespace\.com/i,
          interpretation: "Resource assets linked to Squarespace asset CDN.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "wix",
    name: "Wix",
    slug: "wix",
    category: "cms",
    categoryLabel: "Content Management (CMS)",
    description: "Cloud-based web development platform.",
    website: "https://wix.com",
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Wix\.com/i,
          interpretation: "Meta generator declares Wix.com Website Builder.",
          weight: 55
        }
      ],
      headers: [
        {
          name: "x-wix-request-id",
          interpretation: "Response header discloses Wix gateway request ID.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /static\.parastorage\.com/i,
          interpretation: "Observable resource links to Wix Parastorage CDN infrastructure.",
          weight: 50
        }
      ]
    }
  },
  // ==========================================
  // 3. JAVASCRIPT LIBRARIES
  // ==========================================
  {
    id: "jquery",
    name: "jQuery",
    slug: "jquery",
    category: "javascript_library",
    categoryLabel: "JavaScript Libraries",
    description: "Fast, small, and feature-rich JavaScript DOM manipulation library.",
    website: "https://jquery.com",
    indicators: {
      scripts: [
        {
          pattern: /jquery(?:-([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: "Observable script tag loads jQuery library distribution file.",
          weight: 50
        },
        {
          pattern: /jquery@([0-9.]+)/i,
          interpretation: "CDN package import pattern specifies jQuery dependency version.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /window\.jQuery|jQuery\.fn\.jquery/i,
          interpretation: "Direct reference to jQuery global instance in document scripts.",
          weight: 40
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /jquery[/-]([0-9.]+)(?:\.min)?\.js/i,
        groupIndex: 1,
        reliability: "EXACT"
      },
      {
        source: "script",
        regex: /jquery@([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "lodash",
    name: "Lodash",
    slug: "lodash",
    category: "javascript_library",
    categoryLabel: "JavaScript Libraries",
    description: "A modern JavaScript utility library delivering modularity and performance.",
    website: "https://lodash.com",
    indicators: {
      scripts: [
        {
          pattern: /lodash(?:-([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: "Script tag references Lodash utility distribution file.",
          weight: 50
        },
        {
          pattern: /lodash@([0-9.]+)/i,
          interpretation: "Package URL pattern specifies Lodash version.",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /lodash[/-]([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "axios",
    name: "Axios",
    slug: "axios",
    category: "javascript_library",
    categoryLabel: "JavaScript Libraries",
    description: "Promise based HTTP client for the browser and node.js.",
    website: "https://axios-http.com",
    indicators: {
      scripts: [
        {
          pattern: /axios(?:@([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: "Observable script tag loads Axios HTTP client library.",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /axios@([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "momentjs",
    name: "Moment.js",
    slug: "momentjs",
    category: "javascript_library",
    categoryLabel: "JavaScript Libraries",
    description: "Parse, validate, manipulate, and display dates and times in JavaScript.",
    website: "https://momentjs.com",
    indicators: {
      scripts: [
        {
          pattern: /moment(?:-([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: "Script resource loads Moment.js date handling library.",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /moment[/-]([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "swiper",
    name: "Swiper",
    slug: "swiper",
    category: "javascript_library",
    categoryLabel: "JavaScript Libraries",
    description: "Modern mobile touch slider with hardware accelerated transitions.",
    website: "https://swiperjs.com",
    indicators: {
      scripts: [
        {
          pattern: /swiper(?:-bundle)?(?:\.min)?\.js/i,
          interpretation: "Observable Swiper slider script resource loaded.",
          weight: 45
        }
      ],
      stylesheets: [
        {
          pattern: /swiper(?:-bundle)?(?:\.min)?\.css/i,
          interpretation: "Swiper CSS stylesheet link referenced.",
          weight: 40
        }
      ],
      html: [
        {
          regex: /class=["'][^"']*swiper-(?:container|wrapper|slide)/i,
          interpretation: "Swiper slider markup classes detected in HTML elements.",
          weight: 40
        }
      ]
    }
  },
  {
    id: "d3",
    name: "D3.js",
    slug: "d3",
    category: "javascript_library",
    categoryLabel: "JavaScript Libraries",
    description: "JavaScript library for bespoke data visualization and document manipulation.",
    website: "https://d3js.org",
    indicators: {
      scripts: [
        {
          pattern: /d3(?:\.v([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: "Script resource loads D3.js visualization library.",
          weight: 50
        },
        {
          pattern: /d3@([0-9.]+)/i,
          interpretation: "Package URL references D3 versioned distribution.",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "script",
        regex: /d3(?:\.v|@)([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  // ==========================================
  // 4. CSS / UI TECHNOLOGIES
  // ==========================================
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    slug: "tailwindcss",
    category: "css_ui",
    categoryLabel: "CSS Framework",
    description: "A utility-first CSS framework packed with classes that can be composed directly in markup.",
    website: "https://tailwindcss.com",
    indicators: {
      domMarkers: [
        {
          marker: "tailwindcss-custom-properties",
          interpretation: "Tailwind CSS engine custom properties (--tw-*) detected in document styles.",
          weight: 60
        }
      ],
      scripts: [
        {
          pattern: /cdn\.tailwindcss\.com/i,
          interpretation: "Tailwind Play CDN standalone script referenced in document head.",
          weight: 60
        },
        {
          pattern: /tailwindcss/i,
          interpretation: "Script URL references Tailwind CSS library.",
          weight: 45
        }
      ],
      stylesheets: [
        {
          pattern: /tailwind(?:\.min)?\.css/i,
          interpretation: "External stylesheet URL named tailwind.css observed.",
          weight: 55
        },
        {
          pattern: /tailwindcss/i,
          interpretation: "Stylesheet URL references Tailwind CSS.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /--tw-(?:ring|shadow|border|translate|rotate|skew|scale|space|text|bg|gradient|blur)/i,
          interpretation: "Tailwind CSS custom variable properties (--tw-*) present in embedded style blocks or markup.",
          weight: 60
        },
        {
          regex: /\/\*! tailwindcss v([0-9.]+)/i,
          interpretation: "Compiled stylesheet header with Tailwind CSS version signature detected.",
          weight: 65
        },
        {
          regex: /class=["'][^"']*(?:(?:flex|grid|inline-flex)\s+(?:items-|justify-|gap-|space-[xy]-)|(?:p|m)[xytb]?-[0-9]+\s+(?:flex|grid|w-|text-)|(?:text|bg)-(?:gray|slate|zinc|neutral|stone|blue|red|green|emerald|indigo|amber|purple|pink|rose|yellow)-[0-9]{2,3}|(?:hover|focus|sm|md|lg|xl|dark):[a-z0-9-]+)/i,
          interpretation: "Distinctive multi-class Tailwind utility composition pattern observed in DOM elements.",
          weight: 40
        },
        {
          regex: /class=["'][^"']*(?:grid-cols-[1-9]|max-w-(?:xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)|rounded-(?:sm|md|lg|xl|2xl|3xl|full)|shadow-(?:sm|md|lg|xl|2xl|inner))/i,
          interpretation: "Tailwind specific scale tokens (max-w-*, grid-cols-*, rounded-*) present in class attributes.",
          weight: 35
        }
      ]
    },
    versionPatterns: [
      {
        source: "html",
        regex: /\/\*! tailwindcss v([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      },
      {
        source: "link",
        regex: /tailwindcss[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      },
      {
        source: "script",
        regex: /tailwindcss[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "bootstrap",
    name: "Bootstrap",
    slug: "bootstrap",
    category: "css_ui",
    categoryLabel: "CSS Framework",
    description: "Responsive frontend component library for building modern responsive web apps.",
    website: "https://getbootstrap.com",
    indicators: {
      domMarkers: [
        {
          marker: "bootstrap-custom-properties",
          interpretation: "Bootstrap CSS custom variable properties (--bs-*) detected in document.",
          weight: 55
        },
        {
          marker: "bootstrap-classes",
          interpretation: "Bootstrap standard responsive layout and navigation classes detected.",
          weight: 45
        }
      ],
      stylesheets: [
        {
          pattern: /bootstrap(?:-([0-9.]+))?(?:\.min)?\.css/i,
          interpretation: "Stylesheet link references Bootstrap CSS distribution.",
          weight: 50
        },
        {
          pattern: /bootstrap@([0-9.]+)/i,
          interpretation: "CDN stylesheet import specifies Bootstrap version.",
          weight: 50
        }
      ],
      scripts: [
        {
          pattern: /bootstrap(?:\.bundle)?(?:-([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: "Script tag references Bootstrap JavaScript bundle.",
          weight: 45
        }
      ],
      html: [
        {
          regex: /--bs-(?:primary|secondary|success|info|warning|danger|light|dark|body|gutter|font)/i,
          interpretation: "Bootstrap CSS custom variables (--bs-*) present in stylesheets or markup.",
          weight: 55
        },
        {
          regex: /data-bs-(?:toggle|target|dismiss|slide|ride)=/i,
          interpretation: "Bootstrap 5 data-bs-* JavaScript interactive attributes detected on elements.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:container-fluid|navbar-brand|col-(?:sm|md|lg)-[0-9]|btn-(?:primary|secondary|outline)|form-control)/i,
          interpretation: "Standard Bootstrap grid and button utility class composition detected in HTML markup.",
          weight: 40
        }
      ]
    },
    versionPatterns: [
      {
        source: "html",
        regex: /\/\*! Bootstrap v([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      },
      {
        source: "link",
        regex: /bootstrap[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      },
      {
        source: "script",
        regex: /bootstrap[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "material_ui",
    name: "Material UI (MUI)",
    slug: "material-ui",
    category: "css_ui",
    categoryLabel: "UI Component Library",
    description: "React component library implementing Google Material Design guidelines.",
    website: "https://mui.com",
    indicators: {
      html: [
        {
          regex: /class=["'][^"']*MuiButton-root/i,
          interpretation: "Observable MuiButton-root component styling class marker present.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*MuiTypography-root/i,
          interpretation: "Observable MuiTypography-root typography class marker present.",
          weight: 45
        },
        {
          regex: /class=["'][^"']*MuiBox-root/i,
          interpretation: "Observable MuiBox-root layout component class present.",
          weight: 45
        },
        {
          regex: /class=["'][^"']*MuiGrid-root/i,
          interpretation: "Observable MuiGrid-root layout component class present.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "chakra_ui",
    name: "Chakra UI",
    slug: "chakra-ui",
    category: "css_ui",
    categoryLabel: "UI Component Library",
    description: "Simple, modular and accessible component library that gives building blocks for React applications.",
    website: "https://chakra-ui.com",
    indicators: {
      html: [
        {
          regex: /class=["'][^"']*(?:chakra-button|chakra-stack|chakra-portal|chakra-container)/i,
          interpretation: "Chakra UI component class markers observed in DOM elements.",
          weight: 55
        },
        {
          regex: /--chakra-(?:colors|space|fontSizes|radii)/i,
          interpretation: "Chakra UI theme CSS custom properties (--chakra-*) detected in document.",
          weight: 60
        }
      ]
    }
  },
  {
    id: "ant_design",
    name: "Ant Design",
    slug: "ant-design",
    category: "css_ui",
    categoryLabel: "UI Component Library",
    description: "An enterprise-class UI design language and React UI library.",
    website: "https://ant.design",
    indicators: {
      stylesheets: [
        {
          pattern: /antd(?:\.min)?\.css/i,
          interpretation: "Stylesheet link references Ant Design CSS package.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /class=["'][^"']*(?:ant-btn|ant-layout|ant-menu|ant-row|ant-col|ant-form)/i,
          interpretation: "Ant Design prefix classes (ant-*) observed in HTML markup.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "shadcn_ui",
    name: "Shadcn UI / Radix UI",
    slug: "shadcn-ui",
    category: "css_ui",
    categoryLabel: "UI Component Library",
    description: "Accessible, unstyled UI primitives paired with Tailwind CSS styling.",
    website: "https://ui.shadcn.com",
    indicators: {
      html: [
        {
          regex: /data-radix-[a-z-]+/i,
          interpretation: "Radix UI primitive element attributes (data-radix-*) detected in DOM markup.",
          weight: 55
        },
        {
          regex: /data-state=["'](?:open|closed|checked|unchecked|active)["'][^>]*data-orientation=/i,
          interpretation: "Radix UI state and orientation interactive attributes present on components.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "styled_components",
    name: "Styled Components",
    slug: "styled-components",
    category: "css_ui",
    categoryLabel: "CSS-in-JS",
    description: "Visual primitives for the component age, allowing actual CSS in JavaScript code.",
    website: "https://styled-components.com",
    indicators: {
      html: [
        {
          regex: /data-styled(?:-version)?=["']/i,
          interpretation: "Styled Components runtime style injector attribute (data-styled) detected in DOM.",
          weight: 60
        },
        {
          regex: /class=["'][^"']*\bsc-[a-zA-Z0-9]+-[0-9]+\b/i,
          interpretation: "Styled Components generated class hash pattern (sc-*) observed on elements.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "fontawesome",
    name: "Font Awesome",
    slug: "fontawesome",
    category: "css_ui",
    categoryLabel: "Icon Toolkit",
    description: "The web iconic font and vector icon toolkit.",
    website: "https://fontawesome.com",
    indicators: {
      stylesheets: [
        {
          pattern: /font-awesome(?:\.min)?\.css/i,
          interpretation: "Stylesheet link specifies Font Awesome CSS.",
          weight: 50
        },
        {
          pattern: /fontawesome(?:\.min)?\.css/i,
          interpretation: "External stylesheet URL contains fontawesome.",
          weight: 50
        }
      ],
      scripts: [
        {
          pattern: /fontawesome(?:\.min)?\.js/i,
          interpretation: "Script tag references Font Awesome SVG JavaScript bundle.",
          weight: 45
        }
      ],
      html: [
        {
          regex: /class=["'][^"']*(?:fa-solid|fa-regular|fa-brands|fas\s+fa-|far\s+fa-|fab\s+fa-)/i,
          interpretation: "Font Awesome icon class markup observed in inline tags.",
          weight: 40
        }
      ]
    },
    versionPatterns: [
      {
        source: "link",
        regex: /font-awesome[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "bulma",
    name: "Bulma",
    slug: "bulma",
    category: "css_ui",
    categoryLabel: "CSS Framework",
    description: "Free, open source CSS framework based on Flexbox.",
    website: "https://bulma.io",
    indicators: {
      stylesheets: [
        {
          pattern: /bulma(?:\.min)?\.css/i,
          interpretation: "Stylesheet link references Bulma CSS framework.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /class=["'][^"']*(?:is-primary|navbar-item|hero-body|columns\s+is-multiline)/i,
          interpretation: "Bulma class nomenclature observed in DOM elements.",
          weight: 40
        }
      ]
    }
  },
  {
    id: "foundation",
    name: "Foundation",
    slug: "foundation",
    category: "css_ui",
    categoryLabel: "CSS Framework",
    description: "Advanced responsive front-end framework for any device, medium, and accessibility level.",
    website: "https://get.foundation",
    indicators: {
      stylesheets: [
        {
          pattern: /foundation(?:\.min)?\.css/i,
          interpretation: "Stylesheet link references Foundation CSS distribution.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /class=["'][^"']*(?:top-bar|grid-x|cell\s+(?:small|medium|large)-[0-9])/i,
          interpretation: "Foundation XY Grid and top-bar navigation class composition detected in HTML.",
          weight: 45
        }
      ]
    }
  },
  // ==========================================
  // 5. ANALYTICS
  // ==========================================
  {
    id: "google_analytics",
    name: "Google Analytics",
    slug: "google-analytics",
    category: "analytics",
    categoryLabel: "Analytics",
    description: "Digital analytics platform providing detailed audience insights and event tracking.",
    website: "https://analytics.google.com",
    indicators: {
      scripts: [
        {
          pattern: /googletagmanager\.com\/gtag\/js\?id=(?:G-|UA-)/i,
          interpretation: "Script tag loads Google Global Site Tag (gtag.js) tracking client.",
          weight: 55
        },
        {
          pattern: /google-analytics\.com\/analytics\.js/i,
          interpretation: "Script loads legacy Universal Analytics library (analytics.js).",
          weight: 50
        }
      ],
      html: [
        {
          regex: /gtag\('config',\s*['"](G-[A-Z0-9]+|UA-[0-9]+-[0-9]+)['"]\)/i,
          interpretation: "Inline tracking script initiates Google Analytics measurement configuration.",
          weight: 50
        },
        {
          regex: /ga\('create',\s*['"](UA-[0-9]+-[0-9]+)['"]/i,
          interpretation: "Universal Analytics tracker creation observed in document script.",
          weight: 50
        }
      ],
      cookies: [
        {
          nameRegex: /^_ga(?:_[A-Z0-9]+)?$/i,
          interpretation: "Standard Google Analytics client session cookie (_ga) set by host.",
          weight: 40
        }
      ]
    },
    versionPatterns: [
      {
        source: "html",
        regex: /gtag\('config',\s*['"](G-[A-Z0-9]+)['"]\)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "google_tag_manager",
    name: "Google Tag Manager",
    slug: "google-tag-manager",
    category: "analytics",
    categoryLabel: "Analytics",
    description: "Tag management system that allows updating measurement codes and tracking tags.",
    website: "https://tagmanager.google.com",
    indicators: {
      scripts: [
        {
          pattern: /googletagmanager\.com\/gtm\.js\?id=GTM-[A-Z0-9]+/i,
          interpretation: "Script loads Google Tag Manager container bundle (GTM-*).",
          weight: 55
        }
      ],
      html: [
        {
          regex: /gtm\.start/i,
          interpretation: "GTM dataLayer initialization snippet observed in document body.",
          weight: 45
        },
        {
          regex: /googletagmanager\.com\/ns\.html\?id=(GTM-[A-Z0-9]+)/i,
          interpretation: "GTM noscript fallback iframe container located in HTML markup.",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "html",
        regex: /id=(GTM-[A-Z0-9]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "meta_pixel",
    name: "Meta Pixel",
    slug: "meta-pixel",
    category: "analytics",
    categoryLabel: "Analytics",
    description: "Conversion tracking pixel for Meta (Facebook & Instagram) ad campaigns.",
    website: "https://business.facebook.com",
    indicators: {
      scripts: [
        {
          pattern: /connect\.facebook\.net\/(?:[a-zA-Z_]+)\/fbevents\.js/i,
          interpretation: "Script tag loads Meta Pixel event measurement library (fbevents.js).",
          weight: 55
        }
      ],
      html: [
        {
          regex: /fbq\('init',\s*['"]([0-9]+)['"]\)/i,
          interpretation: "Inline script calls Meta Pixel initialization (fbq) with dataset ID.",
          weight: 50
        }
      ],
      cookies: [
        {
          nameRegex: /^_fbp$/i,
          interpretation: "Browser cookie _fbp set to identify Meta advertisement click attribution.",
          weight: 40
        }
      ]
    }
  },
  {
    id: "hotjar",
    name: "Hotjar",
    slug: "hotjar",
    category: "analytics",
    categoryLabel: "Analytics",
    description: "Behavior analytics and user feedback service with session recordings and heatmaps.",
    website: "https://hotjar.com",
    indicators: {
      scripts: [
        {
          pattern: /static\.hotjar\.com\/c\/hotjar-([0-9]+)\.js/i,
          interpretation: "Script tag loads Hotjar tracking client package.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /_hjSettings/i,
          interpretation: "Hotjar configuration object (_hjSettings) identified in document scope.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "plausible",
    name: "Plausible Analytics",
    slug: "plausible",
    category: "analytics",
    categoryLabel: "Analytics",
    description: "Lightweight and open-source web analytics with no cookies and full GDPR compliance.",
    website: "https://plausible.io",
    indicators: {
      scripts: [
        {
          pattern: /plausible\.io\/js\/(?:script|plausible)\.js/i,
          interpretation: "Script loads Plausible lightweight privacy-friendly analytics tracker.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "segment",
    name: "Segment",
    slug: "segment",
    category: "analytics",
    categoryLabel: "Analytics",
    description: "Customer data platform (CDP) routing telemetry events to multiple downstream services.",
    website: "https://segment.com",
    indicators: {
      scripts: [
        {
          pattern: /cdn\.segment\.com\/analytics\.js/i,
          interpretation: "Script tag loads Segment analytics.js tracking multiplexer.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /analytics\.load\(/i,
          interpretation: "Segment initialization snippet analytics.load() present in page code.",
          weight: 45
        }
      ]
    }
  },
  // ==========================================
  // 6. ADVERTISING
  // ==========================================
  {
    id: "google_adsense",
    name: "Google AdSense",
    slug: "google-adsense",
    category: "advertising",
    categoryLabel: "Advertising",
    description: "Programmatic advertising platform monetizing public websites through banner displays.",
    website: "https://adsense.google.com",
    indicators: {
      scripts: [
        {
          pattern: /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i,
          interpretation: "Script loads Google AdSense client runtime script (adsbygoogle.js).",
          weight: 55
        }
      ],
      html: [
        {
          regex: /class=["'][^"']*adsbygoogle/i,
          interpretation: "HTML contains adsbygoogle class banner insertion slot.",
          weight: 45
        },
        {
          regex: /data-ad-client=["']ca-pub-[0-9]+["']/i,
          interpretation: "AdSense publisher account identifier (ca-pub-*) defined on ad element.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "amazon_advertising",
    name: "Amazon Advertising",
    slug: "amazon-advertising",
    category: "advertising",
    categoryLabel: "Advertising",
    description: "Amazon Publisher Services header bidding and monetization platform.",
    website: "https://advertising.amazon.com",
    indicators: {
      scripts: [
        {
          pattern: /c\.amazon-adsystem\.com\/aax2\/apstag\.js/i,
          interpretation: "Script loads Amazon Publisher Services header bidding library (apstag.js).",
          weight: 55
        }
      ],
      html: [
        {
          regex: /apstag\.init/i,
          interpretation: "Amazon apstag.init configuration present in document script.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "criteo",
    name: "Criteo",
    slug: "criteo",
    category: "advertising",
    categoryLabel: "Advertising",
    description: "Commerce media platform providing personalized retargeting ad campaigns.",
    website: "https://criteo.com",
    indicators: {
      scripts: [
        {
          pattern: /static\.criteo\.net\/js\/ld\/ld\.js/i,
          interpretation: "Script loads Criteo event tag library (ld.js).",
          weight: 55
        }
      ]
    }
  },
  {
    id: "taboola",
    name: "Taboola",
    slug: "taboola",
    category: "advertising",
    categoryLabel: "Advertising",
    description: "Content discovery and native advertising network platform.",
    website: "https://taboola.com",
    indicators: {
      scripts: [
        {
          pattern: /cdn\.taboola\.com\/libtrc\//i,
          interpretation: "Script loads Taboola native advertising discovery widget (libtrc).",
          weight: 55
        }
      ]
    }
  },
  // ==========================================
  // 7. PAYMENT & CHECKOUT ACCEPTANCE
  // ==========================================
  {
    id: "visa",
    name: "Visa",
    slug: "visa",
    category: "payment",
    categoryLabel: "Payment Acceptance (Card Network)",
    description: "Visa global card payment network accepted by merchant for credit, debit, and prepaid checkout.",
    website: "https://visa.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-card:visa",
          interpretation: "Verified Visa card payment acceptance badge observed in document.",
          weight: 60
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?visa["']/i,
          interpretation: "Accessible payment element explicitly designates Visa card acceptance.",
          weight: 55
        },
        {
          regex: /alt=["'](?:pay with )?visa(?: payment| card| logo)?["']/i,
          interpretation: "Payment badge image alt text specifies Visa card support.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--visa|icon-visa|icon--visa|fa-cc-visa|svg-icon-visa|badge--visa|payment-badge-visa)/i,
          interpretation: "DOM markup includes distinctive Visa payment icon class identifier.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-visa|visa-icon|svg-visa|pi-visa)["']/i,
          interpretation: "SVG or icon container element ID designates Visa payment method.",
          weight: 50
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Visa<\/title>/i,
          interpretation: "Inline vector graphics title explicitly identifies Visa payment method.",
          weight: 55
        },
        {
          regex: /"paymentaccepted"[^}]*visa/i,
          interpretation: "Schema.org structured metadata advertises Visa card acceptance.",
          weight: 60
        },
        {
          regex: /"accepted_payment_methods"[^}]*visa/i,
          interpretation: "Storefront payment gateway configuration specifies Visa card processing.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "mastercard",
    name: "Mastercard",
    slug: "mastercard",
    category: "payment",
    categoryLabel: "Payment Acceptance (Card Network)",
    description: "Mastercard global payment network accepted by merchant for credit, debit, and Maestro checkout.",
    website: "https://mastercard.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-card:mastercard",
          interpretation: "Verified Mastercard payment acceptance badge observed in document.",
          weight: 60
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?mastercard["']/i,
          interpretation: "Accessible payment element explicitly designates Mastercard card acceptance.",
          weight: 55
        },
        {
          regex: /alt=["'](?:pay with )?mastercard(?: payment| card| logo)?["']/i,
          interpretation: "Payment badge image alt text specifies Mastercard card support.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--mastercard|icon-mastercard|icon--mastercard|fa-cc-mastercard|svg-icon-mastercard|badge--mastercard|payment-badge-mastercard)/i,
          interpretation: "DOM markup includes distinctive Mastercard payment icon class identifier.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-mastercard|mastercard-icon|svg-mastercard|pi-master|pi-mastercard)["']/i,
          interpretation: "SVG or icon container element ID designates Mastercard payment method.",
          weight: 50
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Mastercard<\/title>/i,
          interpretation: "Inline vector graphics title explicitly identifies Mastercard payment method.",
          weight: 55
        },
        {
          regex: /"paymentaccepted"[^}]*mastercard/i,
          interpretation: "Schema.org structured metadata advertises Mastercard card acceptance.",
          weight: 60
        },
        {
          regex: /"accepted_payment_methods"[^}]*mastercard/i,
          interpretation: "Storefront payment gateway configuration specifies Mastercard card processing.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "amex",
    name: "American Express (Amex)",
    slug: "american-express",
    category: "payment",
    categoryLabel: "Payment Acceptance (Card Network)",
    description: "American Express credit and charge card payment network accepted by merchant.",
    website: "https://americanexpress.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-card:amex",
          interpretation: "Verified American Express payment acceptance badge observed in document.",
          weight: 60
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?(?:american express|amex)["']/i,
          interpretation: "Accessible payment element explicitly designates American Express card acceptance.",
          weight: 55
        },
        {
          regex: /alt=["'](?:pay with )?(?:american express|amex)(?: payment| card| logo)?["']/i,
          interpretation: "Payment badge image alt text specifies American Express card support.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--american_express|payment-icon--amex|icon-amex|icon--amex|fa-cc-amex|svg-icon-amex|badge--amex)/i,
          interpretation: "DOM markup includes distinctive American Express payment icon class identifier.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-american_express|icon-amex|amex-icon|svg-amex|pi-american_express|pi-amex)["']/i,
          interpretation: "SVG or icon container element ID designates American Express payment method.",
          weight: 50
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>(?:American Express|Amex)<\/title>/i,
          interpretation: "Inline vector graphics title explicitly identifies American Express payment method.",
          weight: 55
        },
        {
          regex: /"paymentaccepted"[^}]*(?:american express|amex)/i,
          interpretation: "Schema.org structured metadata advertises American Express card acceptance.",
          weight: 60
        }
      ]
    }
  },
  {
    id: "discover",
    name: "Discover",
    slug: "discover",
    category: "payment",
    categoryLabel: "Payment Acceptance (Card Network)",
    description: "Discover financial network card payment acceptance for online checkout.",
    website: "https://discover.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-card:discover",
          interpretation: "Verified Discover payment acceptance badge observed in document.",
          weight: 60
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?discover["']/i,
          interpretation: "Accessible payment element explicitly designates Discover card acceptance.",
          weight: 55
        },
        {
          regex: /alt=["'](?:pay with )?discover(?: card| logo)?["']/i,
          interpretation: "Payment badge image alt text specifies Discover card support.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--discover|icon-discover|icon--discover|fa-cc-discover|svg-icon-discover)/i,
          interpretation: "DOM markup includes distinctive Discover payment icon class identifier.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-discover|discover-icon|svg-discover|pi-discover)["']/i,
          interpretation: "SVG or icon container element ID designates Discover payment method.",
          weight: 50
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Discover<\/title>/i,
          interpretation: "Inline vector graphics title explicitly identifies Discover payment method.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "diners_club",
    name: "Diners Club",
    slug: "diners-club",
    category: "payment",
    categoryLabel: "Payment Acceptance (Card Network)",
    description: "Diners Club International charge card network acceptance.",
    website: "https://dinersclub.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-card:diners_club",
          interpretation: "Diners Club card acceptance marker detected.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?diners club["']/i,
          interpretation: "Diners Club card acceptance designated in DOM.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--diners_club|icon-diners|fa-cc-diners-club)/i,
          interpretation: "Diners Club icon class identifier observed.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-diners_club|pi-diners_club)["']/i,
          interpretation: "Diners Club icon element ID observed.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "jcb",
    name: "JCB",
    slug: "jcb",
    category: "payment",
    categoryLabel: "Payment Acceptance (Card Network)",
    description: "Japan Credit Bureau (JCB) international card payment network acceptance.",
    website: "https://global.jcb/en/",
    indicators: {
      domMarkers: [
        {
          marker: "payment-card:jcb",
          interpretation: "JCB card acceptance marker detected.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?jcb["']/i,
          interpretation: "JCB card acceptance designated in DOM.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--jcb|icon-jcb|fa-cc-jcb)/i,
          interpretation: "JCB icon class identifier observed.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-jcb|pi-jcb)["']/i,
          interpretation: "JCB icon element ID observed.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "unionpay",
    name: "UnionPay",
    slug: "unionpay",
    category: "payment",
    categoryLabel: "Payment Acceptance (Card Network)",
    description: "China UnionPay global bankcard payment network acceptance.",
    website: "https://unionpayintl.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-card:unionpay",
          interpretation: "UnionPay card acceptance marker detected.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?(?:unionpay|union pay)["']/i,
          interpretation: "UnionPay card acceptance designated in DOM.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--unionpay|icon-unionpay)/i,
          interpretation: "UnionPay icon class identifier observed.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-unionpay|pi-unionpay)["']/i,
          interpretation: "UnionPay icon element ID observed.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "maestro",
    name: "Maestro",
    slug: "maestro",
    category: "payment",
    categoryLabel: "Payment Acceptance (Card Network)",
    description: "Mastercard Maestro international debit card payment network acceptance.",
    website: "https://mastercard.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-card:maestro",
          interpretation: "Maestro debit card acceptance marker detected.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?maestro["']/i,
          interpretation: "Maestro debit card acceptance designated in DOM.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--maestro|icon-maestro|fa-cc-maestro)/i,
          interpretation: "Maestro icon class identifier observed.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-maestro|pi-maestro)["']/i,
          interpretation: "Maestro icon element ID observed.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "apple_pay",
    name: "Apple Pay",
    slug: "apple-pay",
    category: "payment",
    categoryLabel: "Digital Wallet & Payments",
    description: "Apple Pay contactless mobile payment and one-touch digital wallet checkout.",
    website: "https://apple.com/apple-pay/",
    indicators: {
      domMarkers: [
        {
          marker: "payment-wallet:apple_pay",
          interpretation: "Verified Apple Pay digital wallet checkout element observed.",
          weight: 60
        },
        {
          marker: "apple-pay-button",
          interpretation: "Apple Pay dedicated checkout button element found in DOM.",
          weight: 55
        }
      ],
      scripts: [
        {
          pattern: /apple-pay-sdk\.js|applepay\.cdn-apple\.com|applepay/i,
          interpretation: "Document loads Apple Pay JavaScript SDK client.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?apple pay["']/i,
          interpretation: "Accessible payment element explicitly designates Apple Pay checkout.",
          weight: 55
        },
        {
          regex: /alt=["'](?:pay with )?apple pay(?: logo)?["']/i,
          interpretation: "Payment badge image alt text specifies Apple Pay.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:apple-pay-button|payment-icon--apple_pay|icon-apple-pay|fa-cc-apple-pay)/i,
          interpretation: "DOM markup includes Apple Pay button or badge classes.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-apple_pay|apple-pay-button|pi-apple_pay)["']/i,
          interpretation: "Icon container element ID designates Apple Pay.",
          weight: 50
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Apple Pay<\/title>/i,
          interpretation: "Vector graphics title designates Apple Pay.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "google_pay",
    name: "Google Pay",
    slug: "google-pay",
    category: "payment",
    categoryLabel: "Digital Wallet & Payments",
    description: "Google Pay online checkout and contactless wallet integration.",
    website: "https://pay.google.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-wallet:google_pay",
          interpretation: "Verified Google Pay digital wallet checkout element observed.",
          weight: 60
        },
        {
          marker: "google-pay-button",
          interpretation: "Google Pay dedicated checkout button element found in DOM.",
          weight: 55
        }
      ],
      scripts: [
        {
          pattern: /pay\.google\.com\/gp\/p\/js\/pay\.js/i,
          interpretation: "Document loads Google Pay JavaScript SDK client.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?google pay["']/i,
          interpretation: "Accessible payment element explicitly designates Google Pay checkout.",
          weight: 55
        },
        {
          regex: /alt=["'](?:pay with )?google pay(?: logo)?["']/i,
          interpretation: "Payment badge image alt text specifies Google Pay.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:google-pay-button|payment-icon--google_pay|icon-google-pay)/i,
          interpretation: "DOM markup includes Google Pay button or badge classes.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-google_pay|google-pay-button|pi-google_pay)["']/i,
          interpretation: "Icon container element ID designates Google Pay.",
          weight: 50
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Google Pay<\/title>/i,
          interpretation: "Vector graphics title designates Google Pay.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "shop_pay",
    name: "Shop Pay",
    slug: "shop-pay",
    category: "payment",
    categoryLabel: "Payment Platform",
    description: "Shopify accelerated one-tap checkout and installment payment service.",
    website: "https://shoppay.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-platform:shop_pay",
          interpretation: "Verified Shop Pay accelerated checkout element observed in document.",
          weight: 60
        },
        {
          marker: "shopify-payment-button",
          interpretation: "Shopify dynamic checkout button element found in DOM.",
          weight: 55
        }
      ],
      scripts: [
        {
          pattern: /cdn\.shopify\.com\/shopifycloud\/shopify_pay\//i,
          interpretation: "Document loads Shopify Pay accelerated checkout client script.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?(?:shop pay|shopify pay)["']/i,
          interpretation: "Accessible payment element explicitly designates Shop Pay checkout.",
          weight: 55
        },
        {
          regex: /alt=["'](?:pay with )?(?:shop pay|shopify pay)(?: logo)?["']/i,
          interpretation: "Payment badge image alt text specifies Shop Pay.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:shopify-payment-button|payment-icon--shopify_pay|payment-icon--shop_pay|shop-pay-button)/i,
          interpretation: "DOM markup includes Shop Pay button or badge classes.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-shopify_pay|icon-shop_pay|pi-shopify_pay)["']/i,
          interpretation: "Icon container element ID designates Shop Pay.",
          weight: 50
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Shop Pay<\/title>/i,
          interpretation: "Vector graphics title designates Shop Pay.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "amazon_pay",
    name: "Amazon Pay",
    slug: "amazon-pay",
    category: "payment",
    categoryLabel: "Digital Wallet & Payments",
    description: "Online payment service using payment methods and address details stored in Amazon accounts.",
    website: "https://pay.amazon.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-wallet:amazon_pay",
          interpretation: "Amazon Pay checkout container detected in DOM.",
          weight: 55
        }
      ],
      scripts: [
        {
          pattern: /static-na\.payments-amazon\.com|amazon\.com\/payments/i,
          interpretation: "Amazon Pay client script loaded.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?amazon pay["']/i,
          interpretation: "Amazon Pay element designated.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--amazon_payments|amazon-pay-button)/i,
          interpretation: "Amazon Pay icon or button class detected.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "stripe",
    name: "Stripe",
    slug: "stripe",
    category: "payment",
    categoryLabel: "Payment Gateway & Processor",
    description: "Financial infrastructure platform for payment processing and billing APIs.",
    website: "https://stripe.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-gateway:stripe",
          interpretation: "Stripe payment processor components or client tokens identified in DOM.",
          weight: 60
        }
      ],
      scripts: [
        {
          pattern: /js\.stripe\.com\/v3\/?/i,
          interpretation: "Script tag references Stripe.js v3 secure payment tokenization client.",
          weight: 60
        },
        {
          pattern: /checkout\.stripe\.com/i,
          interpretation: "Script or checkout link references Stripe Checkout.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /Stripe\(['"]pk_(?:live|test)_[a-zA-Z0-9]+['"]\)/i,
          interpretation: "Inline script initializes Stripe Elements with a public API key (pk_*).",
          weight: 55
        },
        {
          regex: /stripe\.elements\(|data-stripe|stripe-elements/i,
          interpretation: "Stripe Elements secure payment field mounting code observed in document.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "paypal",
    name: "PayPal",
    slug: "paypal",
    category: "payment",
    categoryLabel: "Payment Platform",
    description: "Global digital payment, digital wallet, and merchant checkout platform.",
    website: "https://paypal.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-gateway:paypal",
          interpretation: "PayPal payment checkout buttons or container verified in DOM.",
          weight: 60
        }
      ],
      scripts: [
        {
          pattern: /paypal\.com\/sdk\/js/i,
          interpretation: "Script tag loads PayPal JavaScript SDK client package.",
          weight: 60
        },
        {
          pattern: /paypalobjects\.com\/api\/checkout\.js/i,
          interpretation: "Script loads PayPal legacy Checkout.js library.",
          weight: 50
        }
      ],
      html: [
        {
          regex: /paypal\.Buttons\(/i,
          interpretation: "PayPal smart payment buttons initialization observed in page code.",
          weight: 50
        },
        {
          regex: /aria-label=["'](?:pay with )?paypal["']/i,
          interpretation: "Accessible payment button explicitly designates PayPal checkout.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--paypal|icon-paypal|fa-cc-paypal)/i,
          interpretation: "PayPal payment icon class identifier present.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-paypal|pi-paypal)["']/i,
          interpretation: "PayPal payment badge element ID observed.",
          weight: 50
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>PayPal<\/title>/i,
          interpretation: "Vector title explicitly specifies PayPal payment method.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "square",
    name: "Square",
    slug: "square",
    category: "payment",
    categoryLabel: "Payment Gateway & Processor",
    description: "Commerce and point-of-sale payment gateway ecosystem.",
    website: "https://squareup.com",
    indicators: {
      scripts: [
        {
          pattern: /web\.squarecdn\.com\/v1\/square\.js|squareup\.com/i,
          interpretation: "Script tag loads Square Web Payments SDK.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /Square\.payments\(/i,
          interpretation: "Square Web Payments SDK initialization call identified in script.",
          weight: 55
        }
      ]
    }
  },
  {
    id: "klarna",
    name: "Klarna",
    slug: "klarna",
    category: "payment",
    categoryLabel: "Buy Now Pay Later (BNPL)",
    description: "Buy now, pay later (BNPL) and flexible installment payment provider.",
    website: "https://klarna.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-bnpl:klarna",
          interpretation: "Klarna installment payment widgets identified in DOM.",
          weight: 60
        }
      ],
      scripts: [
        {
          pattern: /x\.klarnacdn\.net\/kp\/lib\/v1\/api\.js|klarna\.com/i,
          interpretation: "Script tag loads Klarna Payments integration JavaScript library.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?klarna["']/i,
          interpretation: "Klarna installment payment option designated.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--klarna|klarna-badge)/i,
          interpretation: "Klarna payment icon class observed in DOM.",
          weight: 50
        },
        {
          regex: /id=["'](?:icon-klarna|pi-klarna)["']/i,
          interpretation: "Klarna icon element ID observed.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "afterpay",
    name: "Afterpay / Clearpay",
    slug: "afterpay",
    category: "payment",
    categoryLabel: "Buy Now Pay Later (BNPL)",
    description: "Installment payment solution allowing customers to split purchases into four interest-free payments.",
    website: "https://afterpay.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-bnpl:afterpay",
          interpretation: "Afterpay installment payment widget or badge identified.",
          weight: 60
        }
      ],
      scripts: [
        {
          pattern: /static\.afterpay\.com|portal\.afterpay\.com/i,
          interpretation: "Document loads Afterpay JavaScript SDK.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /afterpay-placement/i,
          interpretation: "Afterpay widget placement tag detected in DOM.",
          weight: 50
        },
        {
          regex: /aria-label=["'](?:pay with )?afterpay["']/i,
          interpretation: "Afterpay payment method designated.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--afterpay|afterpay-badge)/i,
          interpretation: "Afterpay icon class detected.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "affirm",
    name: "Affirm",
    slug: "affirm",
    category: "payment",
    categoryLabel: "Buy Now Pay Later (BNPL)",
    description: "Flexible transparent installment payment plans and credit at checkout.",
    website: "https://affirm.com",
    indicators: {
      domMarkers: [
        {
          marker: "payment-bnpl:affirm",
          interpretation: "Affirm installment payment widget or badge identified.",
          weight: 60
        }
      ],
      scripts: [
        {
          pattern: /cdn1\.affirm\.com\/js\/v2\/affirm\.js/i,
          interpretation: "Document loads Affirm JavaScript SDK.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /affirm-as-low-as/i,
          interpretation: "Affirm pricing installment widget detected.",
          weight: 50
        },
        {
          regex: /aria-label=["'](?:pay with )?affirm["']/i,
          interpretation: "Affirm payment method designated.",
          weight: 50
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--affirm|affirm-badge)/i,
          interpretation: "Affirm icon class detected.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "adyen",
    name: "Adyen",
    slug: "adyen",
    category: "payment",
    categoryLabel: "Payment Gateway & Processor",
    description: "Global financial technology platform providing end-to-end payment processing.",
    website: "https://adyen.com",
    indicators: {
      scripts: [
        {
          pattern: /checkoutshopper-(?:live|test)\.adyen\.com/i,
          interpretation: "Adyen Checkout client SDK script loaded.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /AdyenCheckout|adyen-checkout/i,
          interpretation: "Adyen Checkout component container found.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "braintree",
    name: "Braintree",
    slug: "braintree",
    category: "payment",
    categoryLabel: "Payment Gateway & Processor",
    description: "PayPal service providing full-stack payment processing for global merchants.",
    website: "https://braintreepayments.com",
    indicators: {
      scripts: [
        {
          pattern: /js\.braintreegateway\.com\/web\//i,
          interpretation: "Braintree web client SDK loaded.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /braintree\.client\.create/i,
          interpretation: "Braintree client initialization code found.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "authorizenet",
    name: "Authorize.Net",
    slug: "authorizenet",
    category: "payment",
    categoryLabel: "Payment Gateway & Processor",
    description: "Visa solution providing credit card and electronic check payment processing.",
    website: "https://authorize.net",
    indicators: {
      scripts: [
        {
          pattern: /js(?:test)?\.authorize\.net/i,
          interpretation: "Authorize.Net Accept.js secure payment client script loaded.",
          weight: 55
        }
      ],
      html: [
        {
          regex: /Accept\.dispatchData/i,
          interpretation: "Authorize.Net Accept.js dispatch call found.",
          weight: 50
        }
      ]
    }
  },
  // ==========================================
  // 8. CDN / EDGE
  // ==========================================
  {
    id: "cloudflare",
    name: "Cloudflare",
    slug: "cloudflare",
    category: "cdn_edge",
    categoryLabel: "CDN / Edge",
    description: "Global content delivery network, DDoS mitigation, and edge compute platform.",
    website: "https://cloudflare.com",
    indicators: {
      headers: [
        {
          name: "server",
          valueRegex: /^cloudflare$/i,
          interpretation: "HTTP Server response header identifies Cloudflare edge web server.",
          weight: 50
        },
        {
          name: "cf-ray",
          interpretation: "Presence of cf-ray trace header identifies request routed through Cloudflare edge.",
          weight: 50
        },
        {
          name: "cf-cache-status",
          interpretation: "Cloudflare edge caching header (cf-cache-status) present.",
          weight: 40
        }
      ],
      infrastructure: [
        {
          nsMatch: /cloudflare\.com$/i,
          cdnMatch: "Cloudflare",
          interpretation: "Authoritative nameserver zone delegated to Cloudflare infrastructure.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "cloudfront",
    name: "Amazon CloudFront",
    slug: "cloudfront",
    category: "cdn_edge",
    categoryLabel: "CDN / Edge",
    description: "Amazon Web Services global content delivery network service.",
    website: "https://aws.amazon.com/cloudfront",
    indicators: {
      headers: [
        {
          name: "via",
          valueRegex: /cloudfront\.net/i,
          interpretation: "Via response header reports transit through CloudFront edge proxy.",
          weight: 50
        },
        {
          name: "x-amz-cf-id",
          interpretation: "CloudFront routing transaction header (x-amz-cf-id) present in response.",
          weight: 55
        },
        {
          name: "x-amz-cf-pop",
          interpretation: "CloudFront Point-of-Presence edge indicator (x-amz-cf-pop) observed.",
          weight: 50
        }
      ],
      infrastructure: [
        {
          cnameMatch: /cloudfront\.net$/i,
          interpretation: "Canonical domain alias (CNAME) points to CloudFront edge distribution.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "fastly",
    name: "Fastly",
    slug: "fastly",
    category: "cdn_edge",
    categoryLabel: "CDN / Edge",
    description: "Edge cloud platform and programmable CDN providing content acceleration.",
    website: "https://fastly.com",
    indicators: {
      headers: [
        {
          name: "x-served-by",
          valueRegex: /cache-/i,
          interpretation: "Header x-served-by indicates caching through Fastly edge cache node.",
          weight: 50
        },
        {
          name: "fastly-debug-digest",
          interpretation: "Fastly cache debug digest header observed in response.",
          weight: 55
        },
        {
          name: "x-fastly-request-id",
          interpretation: "Fastly internal request tracing header present in response headers.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "akamai",
    name: "Akamai",
    slug: "akamai",
    category: "cdn_edge",
    categoryLabel: "CDN / Edge",
    description: "Global distributed edge platform providing cybersecurity and CDN services.",
    website: "https://akamai.com",
    indicators: {
      headers: [
        {
          name: "server",
          valueRegex: /AkamaiGHost/i,
          interpretation: "Server header discloses Akamai Global Host (AkamaiGHost) edge layer.",
          weight: 50
        },
        {
          name: "x-akamai-transformed",
          interpretation: "Akamai content transformation optimization header present.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "vercel_edge",
    name: "Vercel Edge Network",
    slug: "vercel-edge",
    category: "cdn_edge",
    categoryLabel: "CDN / Edge",
    description: "Serverless deployment platform and edge delivery network for frontend frameworks.",
    website: "https://vercel.com",
    indicators: {
      headers: [
        {
          name: "x-vercel-id",
          interpretation: "Response header x-vercel-id reveals routing through Vercel Edge.",
          weight: 55
        },
        {
          name: "x-vercel-cache",
          interpretation: "Vercel edge cache status header present.",
          weight: 45
        },
        {
          name: "server",
          valueRegex: /^vercel$/i,
          interpretation: "Server response header identifies Vercel server.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "netlify_edge",
    name: "Netlify Edge",
    slug: "netlify-edge",
    category: "cdn_edge",
    categoryLabel: "CDN / Edge",
    description: "Cloud hosting and serverless backend services platform for web applications.",
    website: "https://netlify.com",
    indicators: {
      headers: [
        {
          name: "x-nf-request-id",
          interpretation: "Response header x-nf-request-id discloses Netlify edge proxy trace.",
          weight: 55
        },
        {
          name: "server",
          valueRegex: /^Netlify$/i,
          interpretation: "Server header announces Netlify web server.",
          weight: 45
        }
      ]
    }
  },
  // ==========================================
  // 9. HOSTING / INFRASTRUCTURE
  // ==========================================
  {
    id: "aws_hosting",
    name: "Amazon Web Services (AWS)",
    slug: "aws",
    category: "hosting_cloud",
    categoryLabel: "Hosting / Cloud",
    description: "Comprehensive cloud computing platform providing compute, storage, and networking.",
    website: "https://aws.amazon.com",
    indicators: {
      headers: [
        {
          name: "x-amz-request-id",
          interpretation: "Header x-amz-request-id indicates request handled by AWS infrastructure (e.g., S3 / API Gateway).",
          weight: 50
        }
      ],
      infrastructure: [
        {
          nsMatch: /awsdns-[0-9]+/i,
          interpretation: "Domain nameservers resolve to Amazon Route 53 authoritative nameservers.",
          weight: 50
        },
        {
          cnameMatch: /amazonaws\.com$/i,
          interpretation: "Target CNAME points directly to an AWS service endpoint (e.g., ELB, S3).",
          weight: 50
        }
      ]
    }
  },
  {
    id: "google_cloud",
    name: "Google Cloud Platform (GCP)",
    slug: "gcp",
    category: "hosting_cloud",
    categoryLabel: "Hosting / Cloud",
    description: "Suite of cloud computing services running on the same infrastructure Google uses internally.",
    website: "https://cloud.google.com",
    indicators: {
      headers: [
        {
          name: "x-goog-generation",
          interpretation: "Response header indicates object served from Google Cloud Storage bucket.",
          weight: 50
        },
        {
          name: "server",
          valueRegex: /gws|gvh/i,
          interpretation: "Server header indicates Google Web Server internal infrastructure.",
          weight: 40
        }
      ],
      infrastructure: [
        {
          nsMatch: /googledomains\.com|cloud-dns/i,
          interpretation: "Authoritative DNS records managed by Google Cloud DNS.",
          weight: 45
        }
      ]
    }
  },
  {
    id: "github_pages",
    name: "GitHub Pages",
    slug: "github-pages",
    category: "hosting_cloud",
    categoryLabel: "Hosting / Cloud",
    description: "Static site hosting service that takes HTML, CSS, and JavaScript files straight from a repository.",
    website: "https://pages.github.com",
    indicators: {
      headers: [
        {
          name: "server",
          valueRegex: /^github\.com$/i,
          interpretation: "Response header Server identifies GitHub.com web server.",
          weight: 50
        },
        {
          name: "x-github-request-id",
          interpretation: "Header x-github-request-id indicates GitHub Pages routing infrastructure.",
          weight: 50
        }
      ],
      infrastructure: [
        {
          cnameMatch: /github\.io$/i,
          interpretation: "Target CNAME record delegates directly to GitHub Pages (*.github.io).",
          weight: 55
        }
      ]
    }
  },
  // ==========================================
  // 10. WEB SERVERS
  // ==========================================
  {
    id: "nginx",
    name: "Nginx",
    slug: "nginx",
    category: "web_server",
    categoryLabel: "Web Server",
    description: "High-performance HTTP server, reverse proxy, and generic TCP/UDP proxy server.",
    website: "https://nginx.org",
    indicators: {
      headers: [
        {
          name: "server",
          valueRegex: /^nginx(?:\/([\d.]+))?/i,
          interpretation: "HTTP Server response header reports Nginx web server.",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "header",
        regex: /^nginx\/([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "apache",
    name: "Apache HTTP Server",
    slug: "apache",
    category: "web_server",
    categoryLabel: "Web Server",
    description: "Open-source cross-platform HTTP web server software developed by Apache.",
    website: "https://httpd.apache.org",
    indicators: {
      headers: [
        {
          name: "server",
          valueRegex: /^apache(?:\/([\d.]+))?/i,
          interpretation: "HTTP Server response header discloses Apache HTTP Server.",
          weight: 50
        }
      ]
    },
    versionPatterns: [
      {
        source: "header",
        regex: /^Apache\/([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  },
  {
    id: "litespeed",
    name: "LiteSpeed",
    slug: "litespeed",
    category: "web_server",
    categoryLabel: "Web Server",
    description: "Proprietary lightweight web server software compatible with Apache features.",
    website: "https://www.litespeedtech.com",
    indicators: {
      headers: [
        {
          name: "server",
          valueRegex: /^litespeed/i,
          interpretation: "HTTP Server header identifies LiteSpeed Web Server.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "caddy",
    name: "Caddy",
    slug: "caddy",
    category: "web_server",
    categoryLabel: "Web Server",
    description: "Enterprise-ready, open source web server with automatic HTTPS written in Go.",
    website: "https://caddyserver.com",
    indicators: {
      headers: [
        {
          name: "server",
          valueRegex: /^caddy/i,
          interpretation: "HTTP Server header identifies Caddy web server.",
          weight: 50
        }
      ]
    }
  },
  {
    id: "microsoft_iis",
    name: "Microsoft IIS",
    slug: "microsoft-iis",
    category: "web_server",
    categoryLabel: "Web Server",
    description: "Extensible web server created by Microsoft for use with Windows Server.",
    website: "https://www.iis.net",
    indicators: {
      headers: [
        {
          name: "server",
          valueRegex: /^microsoft-iis(?:\/([\d.]+))?/i,
          interpretation: "HTTP Server response header reports Microsoft-IIS web server.",
          weight: 50
        },
        {
          name: "x-powered-by",
          valueRegex: /ASP\.NET/i,
          interpretation: "Header reports ASP.NET application runtime typically hosted on IIS.",
          weight: 40
        }
      ]
    },
    versionPatterns: [
      {
        source: "header",
        regex: /^Microsoft-IIS\/([\d.]+)/i,
        groupIndex: 1,
        reliability: "EXACT"
      }
    ]
  }
];

// src/services/technologyDetectionEngine.ts
function detectTechnologies(input) {
  const { domain, hostname, httpFinding, infrastructureFinding } = input;
  const webRes = httpFinding ? httpFinding.webResources : void 0;
  const headers = httpFinding?.headers || [];
  const detectedFindings = [];
  for (const sig of TECHNOLOGY_SIGNATURES) {
    const evidenceList = [];
    if (sig.indicators.headers) {
      for (const hInd of sig.indicators.headers) {
        const matchingHeader = headers.find(
          (h) => h.name.toLowerCase() === hInd.name.toLowerCase()
        );
        if (matchingHeader) {
          if (!hInd.valueRegex || hInd.valueRegex.test(matchingHeader.value)) {
            evidenceList.push({
              id: `${sig.id}-hdr-${hInd.name}`,
              type: "HEADER",
              source: `Header: ${matchingHeader.name}`,
              observed: `${matchingHeader.name}: ${matchingHeader.value}`,
              interpretation: hInd.interpretation,
              weight: hInd.weight
            });
          }
        }
      }
    }
    if (sig.indicators.domMarkers && webRes?.domMarkers) {
      for (const domInd of sig.indicators.domMarkers) {
        if (webRes.domMarkers.includes(domInd.marker)) {
          evidenceList.push({
            id: `${sig.id}-dom-${domInd.marker}`,
            type: "HTML",
            source: `DOM Marker: ${domInd.marker}`,
            observed: `DOM element matching: ${domInd.marker}`,
            interpretation: domInd.interpretation,
            weight: domInd.weight
          });
        }
      }
    }
    if (sig.indicators.scripts && webRes?.scripts) {
      for (const sInd of sig.indicators.scripts) {
        for (const scriptUrl of webRes.scripts) {
          if (sInd.pattern.test(scriptUrl)) {
            evidenceList.push({
              id: `${sig.id}-script-${scriptUrl.slice(-40)}`,
              type: "SCRIPT",
              source: "Script Reference",
              observed: scriptUrl,
              interpretation: sInd.interpretation,
              weight: sInd.weight
            });
            break;
          }
        }
        if (webRes.inlineScriptSnippets) {
          for (const snippet of webRes.inlineScriptSnippets) {
            if (sInd.pattern.test(snippet)) {
              evidenceList.push({
                id: `${sig.id}-inline-script`,
                type: "SCRIPT",
                source: "Inline Script Snippet",
                observed: snippet.slice(0, 120) + "...",
                interpretation: sInd.interpretation,
                weight: Math.round(sInd.weight * 0.9)
              });
              break;
            }
          }
        }
      }
    }
    if (sig.indicators.stylesheets && webRes?.stylesheets) {
      for (const lInd of sig.indicators.stylesheets) {
        for (const sheetUrl of webRes.stylesheets) {
          if (lInd.pattern.test(sheetUrl)) {
            evidenceList.push({
              id: `${sig.id}-link-${sheetUrl.slice(-40)}`,
              type: "LINK",
              source: "Stylesheet Reference",
              observed: sheetUrl,
              interpretation: lInd.interpretation,
              weight: lInd.weight
            });
            break;
          }
        }
      }
    }
    if (sig.indicators.meta && webRes?.metaTags) {
      for (const mInd of sig.indicators.meta) {
        for (const metaTag of webRes.metaTags) {
          const nameOrProp = metaTag.name || metaTag.property || "";
          if (mInd.nameOrPropRegex.test(nameOrProp)) {
            if (!mInd.contentRegex || mInd.contentRegex.test(metaTag.content)) {
              evidenceList.push({
                id: `${sig.id}-meta-${nameOrProp}`,
                type: "META",
                source: `Meta Tag (${nameOrProp})`,
                observed: `<meta ${nameOrProp ? `name="${nameOrProp}"` : ""} content="${metaTag.content}">`,
                interpretation: mInd.interpretation,
                weight: mInd.weight
              });
              break;
            }
          }
        }
      }
    }
    if (httpFinding?.pageMetadata?.generator && sig.indicators.meta) {
      for (const mInd of sig.indicators.meta) {
        if (mInd.nameOrPropRegex.test("generator")) {
          if (!mInd.contentRegex || mInd.contentRegex.test(httpFinding.pageMetadata.generator)) {
            const exists = evidenceList.some((e) => e.type === "META" && e.source.includes("generator"));
            if (!exists) {
              evidenceList.push({
                id: `${sig.id}-meta-page-gen`,
                type: "META",
                source: "Meta Tag (generator)",
                observed: `<meta name="generator" content="${httpFinding.pageMetadata.generator}">`,
                interpretation: mInd.interpretation,
                weight: mInd.weight
              });
            }
          }
        }
      }
    }
    if (sig.indicators.cookies && webRes?.cookies) {
      for (const cInd of sig.indicators.cookies) {
        for (const cookieName of webRes.cookies) {
          if (cInd.nameRegex.test(cookieName)) {
            evidenceList.push({
              id: `${sig.id}-cookie-${cookieName}`,
              type: "COOKIE",
              source: "Observed Cookie",
              observed: `Set-Cookie: ${cookieName}`,
              interpretation: cInd.interpretation,
              weight: cInd.weight
            });
            break;
          }
        }
      }
    }
    if (sig.indicators.html && webRes?.htmlSnippet) {
      for (const hInd of sig.indicators.html) {
        const match = webRes.htmlSnippet.match(hInd.regex);
        if (match) {
          evidenceList.push({
            id: `${sig.id}-html-regex`,
            type: "HTML",
            source: "Document HTML Body",
            observed: match[0].slice(0, 100),
            interpretation: hInd.interpretation,
            weight: hInd.weight
          });
        }
      }
    }
    if (sig.indicators.infrastructure && infrastructureFinding) {
      for (const iInd of sig.indicators.infrastructure) {
        let matched = false;
        if (iInd.nsMatch && infrastructureFinding.nsRecords) {
          for (const ns of infrastructureFinding.nsRecords) {
            if (iInd.nsMatch.test(ns.host)) {
              evidenceList.push({
                id: `${sig.id}-infra-ns`,
                type: "INFRASTRUCTURE",
                source: "Authoritative Nameserver",
                observed: `NS: ${ns.host}`,
                interpretation: iInd.interpretation,
                weight: iInd.weight
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
                type: "INFRASTRUCTURE",
                source: "CNAME Target Host",
                observed: `CNAME: ${cname.target}`,
                interpretation: iInd.interpretation,
                weight: iInd.weight
              });
              matched = true;
              break;
            }
          }
        }
        if (!matched && iInd.cdnMatch && infrastructureFinding.indicators) {
          const cdnInd = infrastructureFinding.indicators.find(
            (ind) => ind.name.toLowerCase().includes(iInd.cdnMatch.toLowerCase())
          );
          if (cdnInd) {
            evidenceList.push({
              id: `${sig.id}-infra-cdn`,
              type: "INFRASTRUCTURE",
              source: "Infrastructure Telemetry",
              observed: `${cdnInd.name} (${cdnInd.evidence})`,
              interpretation: iInd.interpretation,
              weight: iInd.weight
            });
          }
        }
      }
    }
    const uniqueEvidenceMap = /* @__PURE__ */ new Map();
    for (const ev of evidenceList) {
      if (!uniqueEvidenceMap.has(ev.id)) {
        uniqueEvidenceMap.set(ev.id, ev);
      }
    }
    const uniqueEvidence = Array.from(uniqueEvidenceMap.values());
    if (uniqueEvidence.length > 0) {
      let rawScore = uniqueEvidence.reduce((sum, ev) => sum + ev.weight, 0);
      const distinctTypes = new Set(uniqueEvidence.map((e) => e.type));
      if (distinctTypes.size >= 3) {
        rawScore += 25;
      } else if (distinctTypes.size >= 2) {
        rawScore += 15;
      }
      const confidenceScore = Math.min(99, Math.max(10, rawScore));
      if (confidenceScore >= 25) {
        let confidence = "LOW";
        if (confidenceScore >= 70) {
          confidence = "HIGH";
        } else if (confidenceScore >= 40) {
          confidence = "MEDIUM";
        }
        let detectedVersion = null;
        let versionReliability = "NOT_DETERMINED";
        if (sig.versionPatterns) {
          for (const vp of sig.versionPatterns) {
            let candidateText = "";
            if (vp.source === "header") {
              const serverHdr = headers.find((h) => h.name.toLowerCase() === "server");
              candidateText = serverHdr ? serverHdr.value : "";
            } else if (vp.source === "meta") {
              candidateText = httpFinding?.pageMetadata?.generator || "";
              if (!candidateText && webRes?.metaTags) {
                const genMeta = webRes.metaTags.find((m) => m.name === "generator");
                if (genMeta) candidateText = genMeta.content;
              }
            } else if (vp.source === "script") {
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
            } else if (vp.source === "link") {
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
            } else if (vp.source === "html" && webRes?.htmlSnippet) {
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
          evidenceSourcesCount: distinctTypes.size
        });
      }
    }
  }
  const conflicts = [];
  const cmsFindings = detectedFindings.filter((f) => f.category === "cms");
  if (cmsFindings.length > 1) {
    const names = cmsFindings.map((f) => f.name);
    conflicts.push({
      id: "conflict-cms-multiple",
      conflictType: "Multiple Content Management Systems",
      technologies: names,
      reason: `Observable signatures for multiple CMS platforms (${names.join(", ")}) were detected simultaneously.`,
      recommendation: "Target may employ headless content syndication, a reverse proxy splitting paths across legacy and modern platforms, or residual marketing tracking markers."
    });
    for (const f of cmsFindings) {
      f.isConflicted = true;
      f.conflictDetails = `Contradictory CMS signal detected alongside ${names.filter((n) => n !== f.name).join(", ")}.`;
    }
  }
  const ssrFrameworks = detectedFindings.filter(
    (f) => ["nextjs", "nuxtjs", "remix", "astro"].includes(f.id)
  );
  if (ssrFrameworks.length > 1) {
    const names = ssrFrameworks.map((f) => f.name);
    conflicts.push({
      id: "conflict-ssr-frameworks",
      conflictType: "Competing Full-Stack Web Frameworks",
      technologies: names,
      reason: `Multiple top-level full-stack SSR framework markers (${names.join(", ")}) were identified in page structure.`,
      recommendation: "Target architecture likely utilizes micro-frontends or gateway reverse-proxying routing distinct page routes to different application containers."
    });
    for (const f of ssrFrameworks) {
      f.isConflicted = true;
      f.conflictDetails = `Coexists with competing SSR framework (${names.filter((n) => n !== f.name).join(", ")}).`;
    }
  }
  detectedFindings.sort((a, b) => b.confidenceScore - a.confidenceScore);
  const allCategories = [
    "frontend_framework",
    "cms",
    "javascript_library",
    "css_ui",
    "analytics",
    "advertising",
    "payment",
    "cdn_edge",
    "hosting_cloud",
    "web_server"
  ];
  const groupedByCategory = {};
  for (const cat of allCategories) {
    groupedByCategory[cat] = detectedFindings.filter((f) => f.category === cat);
  }
  const relationships = detectedFindings.map((f) => ({
    domain,
    relationship: "USES",
    technologyId: f.id,
    technologyName: f.name,
    category: f.category,
    confidence: f.confidence
  }));
  const highConfidenceCount = detectedFindings.filter((f) => f.confidence === "HIGH").length;
  const mediumConfidenceCount = detectedFindings.filter((f) => f.confidence === "MEDIUM").length;
  const lowConfidenceCount = detectedFindings.filter((f) => f.confidence === "LOW").length;
  const categoriesCount = new Set(detectedFindings.map((f) => f.category)).size;
  const versionDetectedCount = detectedFindings.filter((f) => f.version !== null).length;
  let status = "SUCCESS";
  if (detectedFindings.length === 0) {
    status = "NO_TECHNOLOGIES_DETECTED";
  } else if (conflicts.length > 0 || lowConfidenceCount > highConfidenceCount) {
    status = "PARTIAL";
  }
  const summary = {
    totalDetected: detectedFindings.length,
    highConfidenceCount,
    mediumConfidenceCount,
    lowConfidenceCount,
    categoriesCount,
    versionDetectedCount,
    conflictingSignalsCount: conflicts.length,
    status
  };
  return {
    domain,
    hostname,
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
      infrastructureCluesCount: infrastructureFinding?.indicators.length || 0
    },
    error: null
  };
}

// server/technologyDetector.ts
async function inspectTechnology(options) {
  const domain = options.domain.trim().toLowerCase();
  const hostname = (options.hostname || domain).trim().toLowerCase();
  let httpFinding = options.httpFinding;
  let infrastructureFinding = options.infrastructureFinding;
  if (!httpFinding) {
    const targetUrl = domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`;
    try {
      httpFinding = await inspectHttp(targetUrl);
    } catch (err) {
      const fallbackUrl = `http://${domain}`;
      try {
        httpFinding = await inspectHttp(fallbackUrl);
      } catch (err2) {
        return {
          domain,
          hostname,
          analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
          summary: {
            totalDetected: 0,
            highConfidenceCount: 0,
            mediumConfidenceCount: 0,
            lowConfidenceCount: 0,
            categoriesCount: 0,
            versionDetectedCount: 0,
            conflictingSignalsCount: 0,
            status: "ERROR"
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
            web_server: []
          },
          conflicts: [],
          relationships: [],
          rawAnalyzedInputs: {
            headersCount: 0,
            scriptsAnalyzed: 0,
            metaTagsAnalyzed: 0,
            linksAnalyzed: 0,
            cookiesCount: 0,
            infrastructureCluesCount: 0
          },
          error: {
            code: "INPUTS_MISSING",
            title: "HTTP Observation Required",
            message: `Could not retrieve HTTP response data for ${domain}. Technology fingerprinting requires public HTTP telemetry.`,
            technicalDetail: err2?.message || err?.message,
            targetDomain: domain
          }
        };
      }
    }
  }
  if (!infrastructureFinding) {
    try {
      infrastructureFinding = await inspectInfrastructure(hostname);
    } catch {
      infrastructureFinding = null;
    }
  }
  try {
    const report = detectTechnologies({
      domain,
      hostname,
      httpFinding,
      infrastructureFinding
    });
    return report;
  } catch (err) {
    return {
      domain,
      hostname,
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      summary: {
        totalDetected: 0,
        highConfidenceCount: 0,
        mediumConfidenceCount: 0,
        lowConfidenceCount: 0,
        categoriesCount: 0,
        versionDetectedCount: 0,
        conflictingSignalsCount: 0,
        status: "ERROR"
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
        web_server: []
      },
      conflicts: [],
      relationships: [],
      rawAnalyzedInputs: {
        headersCount: httpFinding?.headers?.length || 0,
        scriptsAnalyzed: 0,
        metaTagsAnalyzed: 0,
        linksAnalyzed: 0,
        cookiesCount: 0,
        infrastructureCluesCount: 0
      },
      error: {
        code: "DETECTION_ERROR",
        title: "Technology Detection Fault",
        message: "An internal error occurred while analyzing technology signatures.",
        technicalDetail: err?.message,
        targetDomain: domain
      }
    };
  }
}

// server/securityInspector.ts
var import_tls = __toESM(require("tls"), 1);

// src/services/securityAnalysisEngine.ts
function getHeaderValue(headers = [], headerName) {
  const target = headerName.toLowerCase();
  for (const h of headers) {
    if (h.name.toLowerCase() === target) {
      return h.value;
    }
  }
  return null;
}
function parseCsp(rawHeader) {
  if (!rawHeader) {
    return {
      present: false,
      status: "MISSING",
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
      allowsUnsafeEval: false
    };
  }
  const parts = rawHeader.split(";").map((p) => p.trim()).filter(Boolean);
  const directives = [];
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
    if (dirName === "default-src") hasDefaultSrc = true;
    if (dirName === "script-src") hasScriptSrc = true;
    if (dirName === "style-src") hasStyleSrc = true;
    if (dirName === "img-src") hasImgSrc = true;
    if (dirName === "connect-src") hasConnectSrc = true;
    if (dirName === "frame-ancestors") hasFrameAncestors = true;
    if (dirName === "object-src") hasObjectSrc = true;
    if (dirName === "upgrade-insecure-requests") hasUpgradeInsecureRequests = true;
    for (const val of values) {
      const lower = val.toLowerCase();
      if (lower === "'unsafe-inline'") allowsUnsafeInline = true;
      if (lower === "'unsafe-eval'") allowsUnsafeEval = true;
    }
  }
  return {
    present: true,
    status: "PRESENT",
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
    allowsUnsafeEval
  };
}
function parseHsts(rawHeader) {
  if (!rawHeader) {
    return {
      present: false,
      status: "MISSING",
      rawHeader: null,
      maxAge: null,
      maxAgeFormatted: null,
      includeSubDomains: false,
      preload: false,
      isPreloadEligible: false
    };
  }
  const parts = rawHeader.split(";").map((p) => p.trim());
  let maxAge = null;
  let includeSubDomains = false;
  let preload = false;
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    const cleanKey = key.trim().toLowerCase();
    const val = rest.join("=").trim();
    if (cleanKey === "max-age") {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) {
        maxAge = parsed;
      }
    } else if (cleanKey === "includesubdomains") {
      includeSubDomains = true;
    } else if (cleanKey === "preload") {
      preload = true;
    }
  }
  let maxAgeFormatted = null;
  if (maxAge !== null) {
    const days = Math.round(maxAge / 86400);
    if (days >= 365) {
      const years = (days / 365).toFixed(1).replace(/\.0$/, "");
      maxAgeFormatted = `${maxAge.toLocaleString()}s (~${years} ${years === "1" ? "year" : "years"})`;
    } else if (days >= 1) {
      maxAgeFormatted = `${maxAge.toLocaleString()}s (~${days} days)`;
    } else {
      maxAgeFormatted = `${maxAge.toLocaleString()}s`;
    }
  }
  const isPreloadEligible = maxAge !== null && maxAge >= 31536e3 && includeSubDomains && preload;
  return {
    present: true,
    status: "PRESENT",
    rawHeader,
    maxAge,
    maxAgeFormatted,
    includeSubDomains,
    preload,
    isPreloadEligible
  };
}
function parseCookies(headers = []) {
  const cookieHeaders = [];
  for (const h of headers) {
    if (h.name.toLowerCase() === "set-cookie") {
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
        status: "NO_COOKIES_OBSERVED",
        note: "No Set-Cookie response headers observed on initial inspection endpoint."
      },
      items: []
    };
  }
  const items = [];
  for (const raw of cookieHeaders) {
    const directives = raw.split(";").map((d) => d.trim());
    if (directives.length === 0) continue;
    const first = directives[0];
    const eqIdx = first.indexOf("=");
    const name = eqIdx > -1 ? first.substring(0, eqIdx).trim() : first.trim();
    let secure = false;
    let httpOnly = false;
    let sameSite = "Not Set";
    let domain = void 0;
    let path2 = void 0;
    let expires = void 0;
    let maxAge = void 0;
    for (let i = 1; i < directives.length; i++) {
      const d = directives[i];
      const dLower = d.toLowerCase();
      if (dLower === "secure") {
        secure = true;
      } else if (dLower === "httponly") {
        httpOnly = true;
      } else if (dLower.startsWith("samesite=")) {
        const val = d.substring(9).trim().toLowerCase();
        if (val === "strict") sameSite = "Strict";
        else if (val === "lax") sameSite = "Lax";
        else if (val === "none") sameSite = "None";
      } else if (dLower.startsWith("domain=")) {
        domain = d.substring(7).trim();
      } else if (dLower.startsWith("path=")) {
        path2 = d.substring(5).trim();
      } else if (dLower.startsWith("expires=")) {
        expires = d.substring(8).trim();
      } else if (dLower.startsWith("max-age=")) {
        const ma = parseInt(d.substring(8).trim(), 10);
        if (!isNaN(ma)) maxAge = ma;
      }
    }
    const lowerName = name.toLowerCase();
    const isSessionCookie = lowerName.includes("session") || lowerName.includes("sess") || lowerName.includes("auth") || lowerName.includes("token") || lowerName.includes("jwt") || lowerName.includes("csrf") || lowerName.includes("sid");
    items.push({
      name,
      isSessionCookie,
      secure,
      httpOnly,
      sameSite,
      domain,
      path: path2,
      expires,
      maxAge
    });
  }
  const secureCount = items.filter((c) => c.secure).length;
  const httpOnlyCount = items.filter((c) => c.httpOnly).length;
  const sameSiteCount = items.filter((c) => c.sameSite !== "Not Set").length;
  return {
    summary: {
      totalCount: items.length,
      secureCount,
      httpOnlyCount,
      sameSiteCount,
      status: "COOKIES_OBSERVED",
      note: `${items.length} ${items.length === 1 ? "cookie" : "cookies"} observed across response telemetry.`
    },
    items
  };
}
function analyzeSecurityConfiguration(inputs) {
  const {
    domain,
    hostname,
    targetUrl,
    httpFinding,
    infrastructureFinding,
    technologyReport,
    tlsObservation
  } = inputs;
  const headers = httpFinding?.headers || [];
  const rawAnalyzedHeaders = headers.map((h) => h.name);
  const observations = [];
  const techNames = technologyReport?.technologies.map((t) => t.name) || [];
  const hasCdn = technologyReport?.technologies.some((t) => t.category === "cdn_edge") || false;
  const hasCms = technologyReport?.technologies.some((t) => t.category === "cms") || false;
  const detectedCms = technologyReport?.technologies.find((t) => t.category === "cms");
  const finalUrl = httpFinding?.finalUrl || targetUrl;
  const isFinalHttps = finalUrl.toLowerCase().startsWith("https://");
  const isInitialHttp = targetUrl.toLowerCase().startsWith("http://");
  let redirectedFromHttpToHttps = false;
  if (httpFinding?.redirects && httpFinding.redirects.length > 0) {
    const firstUrl = httpFinding.redirects[0].url.toLowerCase();
    const lastUrl = finalUrl.toLowerCase();
    if (firstUrl.startsWith("http://") && lastUrl.startsWith("https://")) {
      redirectedFromHttpToHttps = true;
    }
  }
  const rawHsts = getHeaderValue(headers, "strict-transport-security");
  const hsts = parseHsts(rawHsts);
  const httpsDetail = {
    httpsEnabled: isFinalHttps,
    httpUsed: isInitialHttp,
    redirectedFromHttpToHttps,
    finalProtocol: httpFinding?.protocol ? `${isFinalHttps ? "HTTPS" : "HTTP"} (${httpFinding.protocol})` : isFinalHttps ? "HTTPS" : "HTTP",
    hstsObserved: hsts.present,
    summary: isFinalHttps ? redirectedFromHttpToHttps ? "Enforced HTTPS with automatic redirect from HTTP" : "HTTPS active on final destination endpoint" : "Target is served over plaintext HTTP"
  };
  if (isFinalHttps) {
    observations.push({
      id: "sec-https-enabled",
      category: "https_transport",
      title: "HTTPS Transport Encryption",
      status: "PRESENT",
      severity: "INFO",
      observedValue: finalUrl,
      fact: `Final destination URL uses HTTPS (${finalUrl}).`,
      context: "HTTPS establishes TLS encryption between client and origin, protecting confidentiality and data integrity in transit.",
      assessment: "Encrypted transport protocol observed on the primary web endpoint.",
      evidence: {
        source: "Final HTTP Response URL",
        observedKey: "URL Scheme",
        observedValue: "https://"
      },
      technologyContext: hasCdn ? "CDN/Edge network detected; transport encryption may terminate at the edge proxy." : void 0
    });
  } else {
    observations.push({
      id: "sec-https-missing",
      category: "https_transport",
      title: "Plaintext HTTP Transport",
      status: "MISSING",
      severity: "REVIEW",
      observedValue: finalUrl,
      fact: `Target responded over plaintext HTTP protocol (${finalUrl}).`,
      context: "Unencrypted HTTP traffic transmits application data and cookies in cleartext across the network.",
      assessment: "No HTTPS transport observed for the inspected target.",
      recommendation: "Review whether an SSL/TLS certificate should be provisioned and HTTPS redirection enabled.",
      evidence: {
        source: "Final HTTP Response URL",
        observedKey: "URL Scheme",
        observedValue: "http://"
      }
    });
  }
  if (redirectedFromHttpToHttps) {
    observations.push({
      id: "sec-https-redirect",
      category: "https_transport",
      title: "HTTP to HTTPS Redirection",
      status: "PRESENT",
      severity: "INFO",
      observedValue: `${targetUrl} -> ${finalUrl}`,
      fact: "Plaintext HTTP request was automatically redirected to an HTTPS endpoint.",
      context: "Automatic HTTP-to-HTTPS redirect ensures users attempting unencrypted visits are upgraded to secure transport.",
      assessment: "Transport upgrade redirection observed in the response redirect chain.",
      evidence: {
        source: "HTTP Redirect Sequence",
        observedKey: "301 / 302 Redirection",
        observedValue: `Hop 1: ${httpFinding?.redirects[0]?.url} (${httpFinding?.redirects[0]?.statusCode})`
      }
    });
  }
  if (hsts.present) {
    observations.push({
      id: "sec-hsts",
      category: "hsts",
      title: "Strict-Transport-Security (HSTS)",
      status: "PRESENT",
      severity: "INFO",
      observedValue: hsts.rawHeader,
      fact: `HSTS header observed: max-age=${hsts.maxAge}${hsts.includeSubDomains ? "; includeSubDomains" : ""}${hsts.preload ? "; preload" : ""}.`,
      context: "HSTS instructs compliant web browsers to only interact with the domain over HTTPS for the declared policy duration, preventing SSL stripping.",
      assessment: `HSTS policy active with ${hsts.maxAgeFormatted || "declared max-age"}${hsts.includeSubDomains ? " and subdomains covered" : ""}.`,
      recommendation: hsts.isPreloadEligible ? "Domain configuration appears eligible for browser HSTS preload list submission." : void 0,
      evidence: {
        source: "HTTP Response Header",
        observedKey: "Strict-Transport-Security",
        observedValue: hsts.rawHeader
      }
    });
  } else if (isFinalHttps) {
    observations.push({
      id: "sec-hsts-missing",
      category: "hsts",
      title: "Strict-Transport-Security (HSTS)",
      status: "MISSING",
      severity: "REVIEW",
      observedValue: null,
      fact: "Strict-Transport-Security response header was not observed.",
      context: "Without HSTS, browsers may initially attempt plaintext HTTP connections before being redirected, leaving a window for interception.",
      assessment: "HSTS policy is not currently declared in the web response headers.",
      recommendation: "Review whether declaring Strict-Transport-Security with a gradual max-age rollout is appropriate.",
      evidence: {
        source: "HTTP Response Headers",
        observedKey: "Strict-Transport-Security",
        observedValue: "Header not present in response"
      },
      technologyContext: hasCdn ? "Some edge CDN services allow enabling HSTS directly in edge delivery settings." : void 0
    });
  }
  const rawCsp = getHeaderValue(headers, "content-security-policy");
  const rawCspReportOnly = getHeaderValue(headers, "content-security-policy-report-only");
  const activeCsp = rawCsp || rawCspReportOnly;
  const csp = parseCsp(activeCsp);
  if (csp.present) {
    const isReportOnly = !rawCsp && !!rawCspReportOnly;
    observations.push({
      id: "sec-csp",
      category: "content_security_policy",
      title: isReportOnly ? "Content-Security-Policy (Report-Only)" : "Content-Security-Policy (CSP)",
      status: "PRESENT",
      severity: "INFO",
      observedValue: csp.rawPolicy,
      fact: `Content-Security-Policy header observed with ${csp.directives.length} directives declared.`,
      context: "Content-Security-Policy restricts browser loading of executable scripts, stylesheets, frames, and multimedia to designated trusted sources.",
      assessment: `CSP active (${csp.directives.map((d) => d.directive).slice(0, 4).join(", ")}${csp.directives.length > 4 ? "..." : ""}).`,
      recommendation: csp.allowsUnsafeInline || csp.allowsUnsafeEval ? "Policy includes 'unsafe-inline' or 'unsafe-eval' keywords; review whether nonces or hashes could replace broad inline allowances." : void 0,
      evidence: {
        source: isReportOnly ? "HTTP Header (Report-Only)" : "HTTP Response Header",
        observedKey: isReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
        observedValue: csp.rawPolicy
      }
    });
  } else {
    observations.push({
      id: "sec-csp-missing",
      category: "content_security_policy",
      title: "Content-Security-Policy (CSP)",
      status: "MISSING",
      severity: "REVIEW",
      observedValue: null,
      fact: "Content-Security-Policy header was not observed in the HTTP response.",
      context: "CSP provides browser-side defense-in-depth against cross-site scripting (XSS) and unauthorized resource injection.",
      assessment: "No Content-Security-Policy restrictions observed.",
      recommendation: "Review whether a Content-Security-Policy is appropriate for this application.",
      evidence: {
        source: "HTTP Response Headers",
        observedKey: "Content-Security-Policy",
        observedValue: "Header not present in response"
      },
      technologyContext: detectedCms ? `${detectedCms.name} often requires careful CSP definition to accommodate dynamic plugins and themes.` : void 0
    });
  }
  const rawXcto = getHeaderValue(headers, "x-content-type-options");
  if (rawXcto) {
    const isNosniff = rawXcto.toLowerCase().includes("nosniff");
    observations.push({
      id: "sec-xcto",
      category: "content_type",
      title: "MIME Type Sniffing Protection",
      status: isNosniff ? "PRESENT" : "PARTIAL",
      severity: "INFO",
      observedValue: rawXcto,
      fact: `X-Content-Type-Options: ${rawXcto} was observed.`,
      context: "Instructs the browser to strictly respect declared Content-Type headers rather than guessing (sniffing) alternative MIME types.",
      assessment: isNosniff ? 'MIME sniffing protection enabled with "nosniff".' : `Observed value "${rawXcto}".`,
      evidence: {
        source: "HTTP Response Header",
        observedKey: "X-Content-Type-Options",
        observedValue: rawXcto
      }
    });
  } else {
    observations.push({
      id: "sec-xcto-missing",
      category: "content_type",
      title: "MIME Type Sniffing Protection",
      status: "MISSING",
      severity: "REVIEW",
      observedValue: null,
      fact: "X-Content-Type-Options header was not observed.",
      context: 'Without "nosniff", older or non-standard browsers may attempt to interpret text/plain or image files as executable scripts.',
      assessment: "No MIME sniffing restriction observed.",
      recommendation: 'Review whether declaring "X-Content-Type-Options: nosniff" aligns with content serving requirements.',
      evidence: {
        source: "HTTP Response Headers",
        observedKey: "X-Content-Type-Options",
        observedValue: "Header not present in response"
      }
    });
  }
  const rawXfo = getHeaderValue(headers, "x-frame-options");
  const hasCspFrameAncestors = csp.hasFrameAncestors;
  const cspFrameAncestorsDirective = csp.directives.find((d) => d.directive === "frame-ancestors");
  const cspFrameAncestorsVal = cspFrameAncestorsDirective ? cspFrameAncestorsDirective.values.join(" ") : null;
  const framingProtectionObserved = !!rawXfo || hasCspFrameAncestors;
  let framingSummary = "No framing restriction observed.";
  if (rawXfo && hasCspFrameAncestors) {
    framingSummary = `Protected via both X-Frame-Options (${rawXfo}) and CSP frame-ancestors (${cspFrameAncestorsVal})`;
  } else if (rawXfo) {
    framingSummary = `Protected via X-Frame-Options: ${rawXfo}`;
  } else if (hasCspFrameAncestors) {
    framingSummary = `Protected via CSP frame-ancestors: ${cspFrameAncestorsVal}`;
  }
  const framingDetail = {
    hasXFrameOptions: !!rawXfo,
    xFrameOptionsValue: rawXfo,
    hasCspFrameAncestors,
    cspFrameAncestorsValue: cspFrameAncestorsVal,
    protectionObserved: framingProtectionObserved,
    summary: framingSummary
  };
  if (framingProtectionObserved) {
    observations.push({
      id: "sec-framing",
      category: "clickjacking",
      title: "Framing & Clickjacking Controls",
      status: "PRESENT",
      severity: "INFO",
      observedValue: rawXfo || cspFrameAncestorsVal,
      fact: framingSummary,
      context: "Framing controls instruct browsers whether a page may be embedded inside <iframe> or <frame> elements on third-party origins.",
      assessment: "Framing restriction controls observed in response configuration.",
      evidence: {
        source: rawXfo ? "X-Frame-Options Header" : "CSP frame-ancestors Directive",
        observedKey: rawXfo ? "X-Frame-Options" : "Content-Security-Policy",
        observedValue: rawXfo || cspFrameAncestorsVal
      }
    });
  } else {
    observations.push({
      id: "sec-framing-missing",
      category: "clickjacking",
      title: "Framing & Clickjacking Controls",
      status: "MISSING",
      severity: "REVIEW",
      observedValue: null,
      fact: "No framing restriction observed.",
      context: "Framing restrictions (such as X-Frame-Options or CSP frame-ancestors) prevent unauthorized third parties from embedding the site in opaque overlay frames.",
      assessment: "Neither X-Frame-Options nor CSP frame-ancestors was observed in response headers.",
      recommendation: "Review whether framing controls (e.g. DENY, SAMEORIGIN, or CSP frame-ancestors) should be declared.",
      evidence: {
        source: "HTTP Response Headers",
        observedKey: "X-Frame-Options / frame-ancestors",
        observedValue: "Neither control present"
      }
    });
  }
  const rawReferrer = getHeaderValue(headers, "referrer-policy");
  if (rawReferrer) {
    observations.push({
      id: "sec-referrer-policy",
      category: "security_headers",
      title: "Referrer-Policy",
      status: "PRESENT",
      severity: "INFO",
      observedValue: rawReferrer,
      fact: `Referrer-Policy: ${rawReferrer} was observed.`,
      context: "Controls what referrer information (URL path and query parameters) the browser sends when navigating to external destinations.",
      assessment: `Active referrer policy "${rawReferrer}" declared.`,
      evidence: {
        source: "HTTP Response Header",
        observedKey: "Referrer-Policy",
        observedValue: rawReferrer
      }
    });
  } else {
    observations.push({
      id: "sec-referrer-missing",
      category: "security_headers",
      title: "Referrer-Policy",
      status: "MISSING",
      severity: "REVIEW",
      observedValue: null,
      fact: "Referrer-Policy header was not observed.",
      context: "When omitted, modern standards-compliant browsers default to strict-origin-when-cross-origin, but explicit declaration ensures consistent cross-browser privacy.",
      assessment: "No explicit Referrer-Policy header declared; browser defaults apply.",
      recommendation: "Review whether explicitly declaring Referrer-Policy: strict-origin-when-cross-origin aligns with privacy objectives.",
      evidence: {
        source: "HTTP Response Headers",
        observedKey: "Referrer-Policy",
        observedValue: "Header not present in response"
      }
    });
  }
  const rawPermissions = getHeaderValue(headers, "permissions-policy") || getHeaderValue(headers, "feature-policy");
  if (rawPermissions) {
    observations.push({
      id: "sec-permissions-policy",
      category: "permissions_policy",
      title: "Permissions-Policy",
      status: "PRESENT",
      severity: "INFO",
      observedValue: rawPermissions,
      fact: `Permissions-Policy header observed: ${rawPermissions.substring(0, 80)}${rawPermissions.length > 80 ? "..." : ""}`,
      context: "Permissions-Policy allows site owners to selectively restrict browser hardware access (e.g. camera, microphone, geolocation, sensors).",
      assessment: "Browser hardware feature restrictions declared.",
      evidence: {
        source: "HTTP Response Header",
        observedKey: "Permissions-Policy",
        observedValue: rawPermissions
      }
    });
  } else {
    observations.push({
      id: "sec-permissions-missing",
      category: "permissions_policy",
      title: "Permissions-Policy",
      status: "MISSING",
      severity: "REVIEW",
      observedValue: null,
      fact: "Permissions-Policy header was not observed.",
      context: "Permissions-Policy allows developers to restrict browser APIs that the application does not intend to use.",
      assessment: "No explicit Permissions-Policy declared in response headers.",
      recommendation: "Review whether defining a Permissions-Policy to explicitly disallow unused device APIs is beneficial.",
      evidence: {
        source: "HTTP Response Headers",
        observedKey: "Permissions-Policy",
        observedValue: "Header not present in response"
      }
    });
  }
  const rawXxss = getHeaderValue(headers, "x-xss-protection");
  if (rawXxss) {
    observations.push({
      id: "sec-xxss-legacy",
      category: "security_headers",
      title: "X-XSS-Protection (Legacy)",
      status: "PRESENT",
      severity: "INFO",
      observedValue: rawXxss,
      fact: `X-XSS-Protection: ${rawXxss} observed.`,
      context: "X-XSS-Protection is a legacy header originally used by older browsers. Modern web standards emphasize Content-Security-Policy instead.",
      assessment: "Legacy XSS filter header present; modern browsers rely on CSP.",
      evidence: {
        source: "HTTP Response Header",
        observedKey: "X-XSS-Protection",
        observedValue: rawXxss
      }
    });
  }
  const cookieData = parseCookies(headers);
  if (cookieData.summary.status === "COOKIES_OBSERVED") {
    const total = cookieData.summary.totalCount;
    const insecureCookies = cookieData.items.filter((c) => !c.secure);
    const scriptAccessibleSessionCookies = cookieData.items.filter((c) => c.isSessionCookie && !c.httpOnly);
    const noSameSiteCookies = cookieData.items.filter((c) => c.sameSite === "Not Set");
    if (insecureCookies.length > 0 && isFinalHttps) {
      observations.push({
        id: "sec-cookie-secure-missing",
        category: "cookie_security",
        title: 'Cookie "Secure" Flag Observation',
        status: "PARTIAL",
        severity: "ATTENTION",
        observedValue: `${cookieData.summary.secureCount} / ${total} Secure`,
        fact: `${insecureCookies.length} of ${total} observable cookies omit the "Secure" flag (${insecureCookies.map((c) => c.name).join(", ")}).`,
        context: "The Secure attribute ensures cookies are exclusively transmitted over TLS encrypted connections, preventing eavesdropping.",
        assessment: "Unflagged cookies could theoretically be transmitted over plaintext HTTP if accessed without encryption.",
        recommendation: "Review whether all sensitive cookies set by this domain should include the Secure flag.",
        evidence: {
          source: "HTTP Set-Cookie Headers",
          observedKey: "Secure Attribute",
          observedValue: `${insecureCookies.length} cookies lack Secure attribute`
        }
      });
    }
    if (scriptAccessibleSessionCookies.length > 0) {
      observations.push({
        id: "sec-cookie-httponly-missing",
        category: "cookie_security",
        title: 'Session Cookie "HttpOnly" Flag Observation',
        status: "PARTIAL",
        severity: "ATTENTION",
        observedValue: `${cookieData.summary.httpOnlyCount} / ${total} HttpOnly`,
        fact: `Session-related cookie (${scriptAccessibleSessionCookies.map((c) => c.name).join(", ")}) omits the "HttpOnly" flag.`,
        context: "HttpOnly prevents client-side JavaScript from accessing the cookie via document.cookie, mitigating session token exfiltration via XSS.",
        assessment: "Client-side script access to observable session cookies is not restricted by HttpOnly.",
        recommendation: "Review whether authentication and session tokens should enforce the HttpOnly attribute.",
        evidence: {
          source: "HTTP Set-Cookie Headers",
          observedKey: "HttpOnly Attribute",
          observedValue: `Session cookie "${scriptAccessibleSessionCookies[0].name}" missing HttpOnly`
        }
      });
    }
    if (cookieData.summary.secureCount === total && cookieData.summary.httpOnlyCount >= Math.floor(total / 2)) {
      observations.push({
        id: "sec-cookie-hygiene",
        category: "cookie_security",
        title: "Cookie Security Controls",
        status: "PRESENT",
        severity: "INFO",
        observedValue: `${cookieData.summary.secureCount}/${total} Secure, ${cookieData.summary.httpOnlyCount}/${total} HttpOnly`,
        fact: `All ${total} observable cookies declare the Secure flag.`,
        context: "Enforcing Secure and SameSite attributes safeguards session integrity and prevents cross-site request forgery.",
        assessment: "Solid cookie security attributes observed across response cookies.",
        evidence: {
          source: "HTTP Set-Cookie Headers",
          observedKey: "Cookie Attributes",
          observedValue: `${total} cookies audited`
        }
      });
    }
  }
  const tlsDetail = tlsObservation || {
    available: false,
    status: "NOT_AVAILABLE",
    unavailabilityReason: "TLS handshake details not available in the current environment."
  };
  if (tlsDetail.available && tlsDetail.status === "EXPIRED") {
    observations.push({
      id: "sec-tls-expired",
      category: "tls_cryptography",
      title: "TLS Certificate Validity",
      status: "ERROR",
      severity: "ATTENTION",
      observedValue: `Expired: ${tlsDetail.validTo}`,
      fact: `TLS certificate expired on ${tlsDetail.validTo ? new Date(tlsDetail.validTo).toUTCString() : "date"}.`,
      context: "Expired TLS certificates trigger prominent browser security warnings and break automated client connections.",
      assessment: "Target certificate has exceeded its validity window.",
      recommendation: "Renew or re-issue the TLS/X.509 certificate for this domain immediately.",
      evidence: {
        source: "X.509 Peer Certificate",
        observedKey: "valid_to",
        observedValue: tlsDetail.validTo
      }
    });
  } else if (tlsDetail.available && tlsDetail.isExpiringSoon) {
    observations.push({
      id: "sec-tls-expiring-soon",
      category: "tls_cryptography",
      title: "TLS Certificate Expiration Window",
      status: "PARTIAL",
      severity: "ATTENTION",
      observedValue: `${tlsDetail.daysRemaining} days remaining`,
      fact: `TLS certificate will expire in ${tlsDetail.daysRemaining} days (valid until ${tlsDetail.validTo ? new Date(tlsDetail.validTo).toLocaleDateString() : "date"}).`,
      context: "Certificates approaching expiration require prompt renewal to ensure continuity of secure communication.",
      assessment: "Certificate renewal window is active.",
      recommendation: "Verify automated certificate renewal jobs (e.g. Let\u2019s Encrypt / Certbot / Cloud CDN).",
      evidence: {
        source: "X.509 Peer Certificate",
        observedKey: "valid_to",
        observedValue: `${tlsDetail.daysRemaining} days remaining`
      }
    });
  } else if (tlsDetail.available) {
    observations.push({
      id: "sec-tls-valid",
      category: "tls_cryptography",
      title: "TLS Certificate Validity",
      status: "PRESENT",
      severity: "INFO",
      observedValue: `${tlsDetail.protocol || "TLS"} - ${tlsDetail.daysRemaining} days remaining`,
      fact: `Valid certificate issued by ${tlsDetail.issuer?.organization || tlsDetail.issuer?.commonName || "Certificate Authority"} (valid until ${tlsDetail.validTo ? new Date(tlsDetail.validTo).toLocaleDateString() : "unknown"}).`,
      context: "Cryptographic identification of the target origin established through verified X.509 trust chain.",
      assessment: `Valid TLS certificate in effect with ${tlsDetail.daysRemaining} days remaining.`,
      evidence: {
        source: "X.509 Peer Certificate Handshake",
        observedKey: "Subject & Issuer",
        observedValue: `Subject: ${tlsDetail.subject?.commonName || domain}, Issuer: ${tlsDetail.issuer?.commonName || "CA"}`
      }
    });
  } else if (isFinalHttps) {
    observations.push({
      id: "sec-tls-unavailable",
      category: "tls_cryptography",
      title: "TLS Certificate Deep Telemetry",
      status: "NOT_OBSERVABLE",
      severity: "INFO",
      observedValue: null,
      fact: "TLS details not available in current analysis environment.",
      context: tlsDetail.unavailabilityReason || "Direct TLS handshake inspection is reserved for server-side execution.",
      assessment: "Underlying certificate details were not extracted in this probe session.",
      evidence: {
        source: "TLS Handshake Probe",
        observedKey: "Status",
        observedValue: tlsDetail.unavailabilityReason || "Not Observable"
      }
    });
  }
  const positiveObservationsCount = observations.filter((o) => o.severity === "INFO").length;
  const reviewItemsCount = observations.filter((o) => o.severity === "REVIEW").length;
  const attentionItemsCount = observations.filter((o) => o.severity === "ATTENTION").length;
  const unavailableChecksCount = observations.filter((o) => o.status === "NOT_OBSERVABLE").length;
  let secHeadersObserved = 0;
  if (csp.present) secHeadersObserved++;
  if (hsts.present) secHeadersObserved++;
  if (rawXcto) secHeadersObserved++;
  if (framingProtectionObserved) secHeadersObserved++;
  if (rawReferrer) secHeadersObserved++;
  if (rawPermissions) secHeadersObserved++;
  let cookieControlsStatus = "NO_COOKIES";
  if (cookieData.summary.totalCount === 0) {
    cookieControlsStatus = "NO_COOKIES";
  } else if (cookieData.summary.secureCount === cookieData.summary.totalCount && cookieData.summary.httpOnlyCount === cookieData.summary.totalCount) {
    cookieControlsStatus = "ALL_OBSERVED";
  } else if (cookieData.summary.secureCount >= Math.floor(cookieData.summary.totalCount / 2)) {
    cookieControlsStatus = "MOSTLY_OBSERVED";
  } else if (cookieData.summary.secureCount > 0) {
    cookieControlsStatus = "PARTIALLY_OBSERVED";
  } else {
    cookieControlsStatus = "NOT_OBSERVED";
  }
  let tlsDetailsStatus = "NOT_AVAILABLE";
  if (!isFinalHttps) {
    tlsDetailsStatus = "UNENCRYPTED";
  } else if (tlsDetail.available) {
    if (tlsDetail.isExpired) tlsDetailsStatus = "EXPIRED";
    else if (tlsDetail.isExpiringSoon) tlsDetailsStatus = "EXPIRING_SOON";
    else tlsDetailsStatus = "AVAILABLE";
  } else {
    tlsDetailsStatus = "NOT_AVAILABLE";
  }
  let httpsStatus = "HTTP_ONLY";
  if (isFinalHttps) {
    httpsStatus = redirectedFromHttpToHttps ? "REDIRECTED" : "ENABLED";
  } else {
    httpsStatus = "NOT_OBSERVED";
  }
  const summary = {
    totalChecksPerformed: observations.length,
    positiveObservationsCount,
    reviewItemsCount,
    attentionItemsCount,
    unavailableChecksCount,
    httpsStatus,
    securityHeadersObservedCount: secHeadersObserved,
    securityHeadersTotalChecked: 6,
    cookieControlsStatus,
    tlsDetailsStatus
  };
  return {
    domain,
    hostname,
    targetUrl,
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
    summary,
    https: httpsDetail,
    csp,
    hsts,
    framing: framingDetail,
    cookies: cookieData,
    tls: tlsDetail,
    observations,
    rawAnalyzedHeaders
  };
}

// server/securityInspector.ts
async function inspectTlsPeer(hostname, port = 443, timeoutMs = 4500) {
  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (res) => {
      if (!resolved) {
        resolved = true;
        resolve(res);
      }
    };
    try {
      const options = {
        host: hostname,
        port,
        servername: hostname,
        // SNI support
        rejectUnauthorized: false,
        // Do not drop connection so self-signed / expired certs can be inspected
        minVersion: "TLSv1"
      };
      const socket = import_tls.default.connect(options, () => {
        try {
          const cert = socket.getPeerCertificate(true);
          const protocol = socket.getProtocol() || void 0;
          const cipherInfo = socket.getCipher();
          const cipher = cipherInfo ? `${cipherInfo.name} (${cipherInfo.version})` : void 0;
          const isAuthorized = socket.authorized;
          const authError = socket.authorizationError ? String(socket.authorizationError) : void 0;
          socket.destroy();
          if (!cert || Object.keys(cert).length === 0) {
            safeResolve({
              detail: {
                available: false,
                status: "NOT_AVAILABLE",
                unavailabilityReason: "No peer TLS certificate presented by the target server on port 443."
              }
            });
            return;
          }
          const now = Date.now();
          const validFrom = cert.valid_from ? new Date(cert.valid_from).toISOString() : void 0;
          const validTo = cert.valid_to ? new Date(cert.valid_to).toISOString() : void 0;
          const validToMs = cert.valid_to ? new Date(cert.valid_to).getTime() : 0;
          const daysRemaining = validToMs ? Math.floor((validToMs - now) / (1e3 * 60 * 60 * 24)) : void 0;
          const isExpired = typeof daysRemaining === "number" ? daysRemaining < 0 : false;
          const isExpiringSoon = typeof daysRemaining === "number" ? daysRemaining >= 0 && daysRemaining <= 30 : false;
          let status = "AVAILABLE";
          if (isExpired) {
            status = "EXPIRED";
          } else if (!isAuthorized && authError && authError.toLowerCase().includes("self signed")) {
            status = "SELF_SIGNED";
          }
          const formatCertField = (val) => {
            if (!val) return void 0;
            return Array.isArray(val) ? val.join(", ") : val;
          };
          let sanList = [];
          if (cert.subjectaltname) {
            sanList = cert.subjectaltname.split(",").map((s) => s.trim().replace(/^DNS:/, "")).filter(Boolean);
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
                country: formatCertField(cert.subject?.C)
              },
              issuer: {
                commonName: formatCertField(cert.issuer?.CN),
                organization: formatCertField(cert.issuer?.O),
                country: formatCertField(cert.issuer?.C)
              },
              validFrom,
              validTo,
              daysRemaining,
              isExpired,
              isExpiringSoon,
              sanList: sanList.slice(0, 15),
              // Top 15 SAN entries
              serialNumber: cert.serialNumber || void 0,
              fingerprint: cert.fingerprint256 || cert.fingerprint || void 0,
              unavailabilityReason: authError ? `TLS Note: ${authError}` : void 0
            }
          });
        } catch (err) {
          socket.destroy();
          safeResolve({
            detail: {
              available: false,
              status: "NOT_AVAILABLE",
              unavailabilityReason: `Failed to extract TLS certificate metadata: ${err?.message || err}`
            },
            error: err?.message
          });
        }
      });
      socket.setTimeout(timeoutMs);
      socket.on("timeout", () => {
        socket.destroy();
        safeResolve({
          detail: {
            available: false,
            status: "NOT_AVAILABLE",
            unavailabilityReason: `Connection timed out after ${timeoutMs}ms while connecting to port 443.`
          },
          error: "TIMEOUT"
        });
      });
      socket.on("error", (err) => {
        socket.destroy();
        safeResolve({
          detail: {
            available: false,
            status: "NOT_AVAILABLE",
            unavailabilityReason: `Target refused or did not establish TLS connection: ${err?.message || "Connection failed"}`
          },
          error: err?.message
        });
      });
    } catch (err) {
      safeResolve({
        detail: {
          available: false,
          status: "NOT_AVAILABLE",
          unavailabilityReason: `Could not initiate TLS connection: ${err?.message || err}`
        },
        error: err?.message
      });
    }
  });
}
async function inspectSecurity(params) {
  const { domain, hostname, targetUrl, httpFinding, infrastructureFinding, technologyReport } = params;
  let tlsDetail = {
    available: false,
    status: "NOT_AVAILABLE",
    unavailabilityReason: "TLS handshake not performed."
  };
  const isHttps = targetUrl.toLowerCase().startsWith("https://") || httpFinding?.finalUrl.toLowerCase().startsWith("https://");
  if (isHttps || !targetUrl.toLowerCase().startsWith("http://")) {
    const tlsResult = await inspectTlsPeer(hostname, 443, 4e3);
    tlsDetail = tlsResult.detail;
  } else {
    tlsDetail = {
      available: false,
      status: "UNENCRYPTED_HTTP",
      unavailabilityReason: "Target endpoint was requested and served over unencrypted HTTP (port 80)."
    };
  }
  const report = analyzeSecurityConfiguration({
    domain,
    hostname,
    targetUrl,
    httpFinding: httpFinding || null,
    infrastructureFinding: infrastructureFinding || null,
    technologyReport: technologyReport || null,
    tlsObservation: tlsDetail
  });
  return {
    success: true,
    report
  };
}

// server/rateLimiter.ts
var DEFAULT_LIMIT = 10;
var DEFAULT_WINDOW_MS = 60 * 60 * 1e3;
var ipStore = /* @__PURE__ */ new Map();
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ips.trim();
  }
  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}
function cleanRecord(record, now, windowMs) {
  const cutoff = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
}
function getQuotaStatus(clientIp, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS) {
  const now = Date.now();
  let record = ipStore.get(clientIp);
  if (!record) {
    return {
      limit,
      remaining: limit,
      used: 0,
      windowMs,
      resetInSeconds: Math.ceil(windowMs / 1e3),
      resetTime: new Date(now + windowMs).toISOString(),
      isBlocked: false
    };
  }
  cleanRecord(record, now, windowMs);
  const used = record.timestamps.length;
  const remaining = Math.max(0, limit - used);
  const isBlocked = remaining === 0;
  const oldestTimestamp = record.timestamps[0] || now;
  const resetTimestamp = oldestTimestamp + windowMs;
  const resetInSeconds = isBlocked ? Math.max(1, Math.ceil((resetTimestamp - now) / 1e3)) : Math.ceil(windowMs / 1e3);
  return {
    limit,
    remaining,
    used,
    windowMs,
    resetInSeconds,
    resetTime: new Date(resetTimestamp).toISOString(),
    isBlocked
  };
}
function normalizeTarget(raw) {
  if (!raw) return "";
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/:\d+$/, "").replace(/\/.*$/, "");
}
function consumeQuota(clientIp, targetIdentifier, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS) {
  const now = Date.now();
  let record = ipStore.get(clientIp);
  if (!record) {
    record = { timestamps: [] };
    ipStore.set(clientIp, record);
  }
  cleanRecord(record, now, windowMs);
  const normTarget = normalizeTarget(targetIdentifier);
  const normLast = normalizeTarget(record.lastTarget);
  if (normTarget && normLast === normTarget && record.lastTargetTimestamp && now - record.lastTargetTimestamp < 6e4) {
    return {
      allowed: true,
      quota: getQuotaStatus(clientIp, limit, windowMs)
    };
  }
  if (record.timestamps.length >= limit) {
    return {
      allowed: false,
      quota: getQuotaStatus(clientIp, limit, windowMs)
    };
  }
  record.timestamps.push(now);
  if (targetIdentifier) {
    record.lastTarget = targetIdentifier;
    record.lastTargetTimestamp = now;
  }
  return {
    allowed: true,
    quota: getQuotaStatus(clientIp, limit, windowMs)
  };
}
function resetQuota(clientIp) {
  ipStore.delete(clientIp);
  return getQuotaStatus(clientIp);
}

// server.ts
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "V0.6-RELATIONSHIP-GRAPH" });
  });
  app.get("/api/quota", (req, res) => {
    const clientIp = getClientIp(req);
    const quota = getQuotaStatus(clientIp);
    res.setHeader("X-RateLimit-Limit", quota.limit);
    res.setHeader("X-RateLimit-Remaining", quota.remaining);
    res.setHeader("X-RateLimit-Reset", quota.resetTime);
    res.json(quota);
  });
  app.post("/api/quota/reset", (req, res) => {
    const clientIp = getClientIp(req);
    const quota = resetQuota(clientIp);
    res.json({ message: "Quota successfully reset for testing", quota });
  });
  const rateLimitMiddleware = (req, res, next) => {
    const clientIp = getClientIp(req);
    const targetIdentifier = req.body.url || req.body.domain || req.body.hostname;
    const { allowed, quota } = consumeQuota(clientIp, targetIdentifier);
    res.setHeader("X-RateLimit-Limit", quota.limit);
    res.setHeader("X-RateLimit-Remaining", quota.remaining);
    res.setHeader("X-RateLimit-Reset", quota.resetTime);
    if (!allowed) {
      res.setHeader("Retry-After", quota.resetInSeconds);
      return res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          title: "Target Analysis Quota Exceeded",
          message: `Defensive rate limit active: You have reached the maximum allowed limit of ${quota.limit} investigations per hour. Please wait for your quota to reset.`,
          retryAfterSeconds: quota.resetInSeconds,
          resetTime: quota.resetTime,
          quota
        }
      });
    }
    next();
  };
  app.post("/api/inspect-http", rateLimitMiddleware, async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({
        error: {
          code: "INVALID_TARGET",
          title: "Missing Target URL",
          message: "The URL parameter is required and must be a valid string.",
          targetUrl: ""
        }
      });
    }
    try {
      const result = await inspectHttp(url);
      return res.json(result);
    } catch (err) {
      if (err?.code) {
        return res.status(422).json({ error: err });
      }
      return res.status(500).json({
        error: {
          code: "NETWORK_ERROR",
          title: "HTTP Inspection Failure",
          message: "An unexpected internal error occurred during HTTP inspection.",
          technicalDetail: err?.message || String(err),
          targetUrl: url
        }
      });
    }
  });
  app.post("/api/inspect-infrastructure", rateLimitMiddleware, async (req, res) => {
    const { domain, hostname, httpClues } = req.body;
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        error: {
          code: "DNS_LOOKUP_FAILED",
          title: "Missing Domain Identifier",
          message: "The domain parameter is required for infrastructure analysis.",
          targetDomain: ""
        }
      });
    }
    try {
      const result = await inspectInfrastructure(domain, hostname, httpClues);
      return res.json(result);
    } catch (err) {
      if (err?.code) {
        return res.status(422).json({ error: err });
      }
      return res.status(500).json({
        error: {
          code: "SERVICE_ERROR",
          title: "Infrastructure Resolution Failure",
          message: "An unexpected internal error occurred during infrastructure DNS inspection.",
          technicalDetail: err?.message || String(err),
          targetDomain: domain
        }
      });
    }
  });
  app.post("/api/inspect-whois", rateLimitMiddleware, async (req, res) => {
    const { domain } = req.body;
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        error: {
          code: "INPUTS_MISSING",
          title: "Missing Domain Identifier",
          message: "The domain parameter is required for WHOIS registration lookup.",
          targetDomain: ""
        }
      });
    }
    try {
      const result = await inspectWhois(domain);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({
        error: {
          code: "WHOIS_LOOKUP_FAILED",
          title: "WHOIS Resolution Failure",
          message: "An unexpected internal error occurred during WHOIS registration inspection.",
          technicalDetail: err?.message || String(err),
          targetDomain: domain
        }
      });
    }
  });
  app.post("/api/inspect-technology", rateLimitMiddleware, async (req, res) => {
    const { domain, hostname, httpFinding, infrastructureFinding } = req.body;
    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        error: {
          code: "INPUTS_MISSING",
          title: "Missing Domain Parameter",
          message: "The domain parameter is required for technology fingerprinting.",
          targetDomain: ""
        }
      });
    }
    try {
      const result = await inspectTechnology({
        domain,
        hostname,
        httpFinding,
        infrastructureFinding
      });
      return res.json(result);
    } catch (err) {
      if (err?.code) {
        return res.status(422).json({ error: err });
      }
      return res.status(500).json({
        error: {
          code: "DETECTION_ERROR",
          title: "Technology Fingerprinting Failure",
          message: "An unexpected internal error occurred while fingerprinting website technologies.",
          technicalDetail: err?.message || String(err),
          targetDomain: domain
        }
      });
    }
  });
  app.post("/api/inspect-security", rateLimitMiddleware, async (req, res) => {
    const { domain, hostname, targetUrl, httpFinding, infrastructureFinding, technologyReport } = req.body;
    if (!domain || typeof domain !== "string" || !targetUrl) {
      return res.status(400).json({
        error: {
          code: "INPUTS_MISSING",
          title: "Missing Security Inspection Parameters",
          message: "Domain and targetUrl parameters are required for security observation analysis.",
          targetUrl: targetUrl || ""
        }
      });
    }
    try {
      const result = await inspectSecurity({
        domain,
        hostname: hostname || domain,
        targetUrl,
        httpFinding,
        infrastructureFinding,
        technologyReport
      });
      return res.json(result);
    } catch (err) {
      if (err?.code) {
        return res.status(422).json({ error: err });
      }
      return res.status(500).json({
        error: {
          code: "ANALYSIS_FAILED",
          title: "Security Analysis Failure",
          message: "An unexpected internal error occurred while analyzing security configuration.",
          technicalDetail: err?.message || String(err),
          targetUrl
        }
      });
    }
  });
  app.use("/api", (err, req, res, next) => {
    if (err && (err.type === "entity.too.large" || err.status === 413)) {
      return res.status(413).json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          title: "Payload Limit Exceeded",
          message: "The submitted request payload exceeded the maximum permitted size limit.",
          technicalDetail: err.message || "Request entity too large"
        }
      });
    }
    next(err);
  });
  app.get(["/privacy", "/privacy.html"], (req, res) => {
    const distPath = import_path.default.join(process.cwd(), "dist", "privacy.html");
    if (import_fs.default.existsSync(distPath)) return res.sendFile(distPath);
    res.sendFile(import_path.default.join(process.cwd(), "public", "privacy.html"));
  });
  app.get(["/terms", "/terms.html"], (req, res) => {
    const distPath = import_path.default.join(process.cwd(), "dist", "terms.html");
    if (import_fs.default.existsSync(distPath)) return res.sendFile(distPath);
    res.sendFile(import_path.default.join(process.cwd(), "public", "terms.html"));
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WEB FORENSICS V0.2 server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
