import net from 'net';
import { WhoisRecord } from '../src/types';

/**
 * Common multi-part public suffixes to identify the root registrable domain
 */
const MULTI_PART_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'net.uk',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'co.nz',
  'net.nz',
  'org.nz',
  'co.jp',
  'ne.jp',
  'co.kr',
  'com.br',
  'net.br',
  'com.mx',
  'co.za',
  'com.tr',
  'com.sg',
  'com.hk',
  'com.tw',
  'co.in',
  'net.in',
  'org.in',
  'gen.in',
  'firm.in',
]);

/**
 * Extracts the base registrable domain from a given hostname or URL.
 * e.g. "www.shopify.com" -> "shopify.com", "sub.domain.co.uk" -> "domain.co.uk"
 */
export function extractRegistrableDomain(input: string): string {
  if (!input) return '';
  let clean = input.trim().toLowerCase();

  // Strip protocol
  clean = clean.replace(/^[a-zA-Z]+:\/\//, '');
  // Strip path and query
  clean = clean.split('/')[0].split('?')[0].split('#')[0];
  // Strip port
  clean = clean.split(':')[0];

  const parts = clean.split('.').filter(Boolean);
  if (parts.length <= 2) {
    return parts.join('.');
  }

  // Check last two parts for multi-part TLD (e.g. co.uk)
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }

  // Standard domain with single TLD (e.g. shopify.com)
  return parts.slice(-2).join('.');
}

/**
 * Standard registry WHOIS servers for popular TLDs
 */
const TLD_WHOIS_SERVERS: Record<string, string> = {
  com: 'whois.verisign-grs.com',
  net: 'whois.verisign-grs.com',
  org: 'whois.publicinterestregistry.org',
  info: 'whois.afilias.net',
  biz: 'whois.biz',
  io: 'whois.nic.io',
  co: 'whois.nic.co',
  me: 'whois.nic.me',
  us: 'whois.nic.us',
  uk: 'whois.nic.uk',
  ca: 'whois.cira.ca',
  de: 'whois.denic.de',
  fr: 'whois.nic.fr',
  eu: 'whois.eu',
  nl: 'whois.domain-registry.nl',
  ai: 'whois.nic.ai',
  in: 'whois.registry.in',
  dev: 'whois.nic.google',
  app: 'whois.nic.google',
  cloud: 'whois.nic.cloud',
  tech: 'whois.nic.tech',
  store: 'whois.nic.store',
  xyz: 'whois.nic.xyz',
};

/**
 * Direct TCP socket query to a WHOIS server on port 43 with timeout
 */
function queryWhoisTcp(domain: string, server: string, timeoutMs = 3500): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = '';
    let isDone = false;

    const cleanup = () => {
      if (!isDone) {
        isDone = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);

    socket.connect(43, server, () => {
      // Send standard WHOIS request: domain name followed by CRLF
      socket.write(`${domain}\r\n`);
    });

    socket.on('data', (chunk) => {
      data += chunk.toString();
      // Cap at 100KB to avoid excessive memory on verbose outputs
      if (data.length > 100000) {
        cleanup();
        resolve(data);
      }
    });

    socket.on('end', () => {
      cleanup();
      resolve(data);
    });

    socket.on('error', (err) => {
      cleanup();
      reject(err);
    });

    socket.on('timeout', () => {
      cleanup();
      reject(new Error(`WHOIS socket connection to ${server} timed out after ${timeoutMs}ms`));
    });
  });
}

/**
 * Parses raw WHOIS text into a structured WhoisRecord
 */
function parseWhoisText(rawText: string, domain: string, serverUsed: string): WhoisRecord {
  const now = Date.now();

  // Match Registrar
  const registrarMatch =
    rawText.match(/(?:Registrar|Sponsoring Registrar|registrar-name|Registrar Name):\s*([^\r\n]+)/i);
  const registrarIanaMatch = rawText.match(/(?:Registrar IANA ID|IANA ID):\s*(\d+)/i);

  // Match Dates
  const createdMatch = rawText.match(
    /(?:Creation Date|Created|created|Registration Time|Registered on|Registration Date):\s*([^\r\n]+)/i
  );
  const expiryMatch = rawText.match(
    /(?:Registry Expiry Date|Registrar Registration Expiration Date|Expiration Date|Registry Expiry|paid-till|Expires|Expiry date|Renewal Date):\s*([^\r\n]+)/i
  );
  const updatedMatch = rawText.match(
    /(?:Updated Date|Last Updated|last-changed|Modified|Last Modified):\s*([^\r\n]+)/i
  );

  // Match DNSSEC & Status
  const dnssecMatch = rawText.match(/(?:DNSSEC|dnssec):\s*([^\r\n]+)/i);
  const statusMatches = [...rawText.matchAll(/(?:Domain Status|status):\s*([^\r\n\s]+)/gi)].map(
    (m) => m[1].replace(/https?:\/\/\S+/gi, '').trim()
  ).filter(Boolean);

  // Match Nameservers
  const nsMatches = [...rawText.matchAll(/(?:Name Server|nserver):\s*([^\r\n\s]+)/gi)]
    .map((m) => m[1].toLowerCase().trim())
    .filter((ns) => ns.length > 3 && ns.includes('.'));

  let creationDate: string | undefined;
  let expirationDate: string | undefined;
  let updatedDate: string | undefined;
  let ageDays: number | undefined;
  let daysUntilExpiration: number | undefined;

  if (createdMatch) {
    const d = new Date(createdMatch[1].trim());
    if (!isNaN(d.getTime())) {
      creationDate = d.toISOString();
      ageDays = Math.max(0, Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  if (expiryMatch) {
    const d = new Date(expiryMatch[1].trim());
    if (!isNaN(d.getTime())) {
      expirationDate = d.toISOString();
      daysUntilExpiration = Math.floor((d.getTime() - now) / (1000 * 60 * 60 * 24));
    }
  }

  if (updatedMatch) {
    const d = new Date(updatedMatch[1].trim());
    if (!isNaN(d.getTime())) {
      updatedDate = d.toISOString();
    }
  }

  const rawSample = rawText.length > 3500 ? rawText.slice(0, 3500) + '\n...[truncated for brevity]' : rawText;

  const isSuccess = Boolean(registrarMatch || createdMatch || expiryMatch);

  return {
    domain,
    registrar: registrarMatch ? registrarMatch[1].trim() : undefined,
    registrarIanaId: registrarIanaMatch ? registrarIanaMatch[1].trim() : undefined,
    creationDate,
    expirationDate,
    updatedDate,
    ageDays,
    daysUntilExpiration,
    status: statusMatches.length > 0 ? Array.from(new Set(statusMatches)) : undefined,
    nameservers: nsMatches.length > 0 ? Array.from(new Set(nsMatches)) : undefined,
    dnssec: dnssecMatch ? dnssecMatch[1].trim() : undefined,
    whoisServer: serverUsed,
    rawText: rawSample,
    lookupSource: 'WHOIS',
    lookupStatus: isSuccess ? 'SUCCESS' : 'NOT_FOUND',
    queriedAt: new Date().toISOString(),
  };
}

/**
 * Query RDAP via HTTPS for TLDs with robust RDAP APIs (e.g. Verisign for .com / .net)
 */
async function queryRdap(domain: string, tld: string): Promise<WhoisRecord | null> {
  try {
    let rdapUrl: string | null = null;
    if (tld === 'com' || tld === 'net') {
      rdapUrl = `https://rdap.verisign.com/${tld}/v1/domain/${encodeURIComponent(domain)}`;
    } else if (tld === 'org') {
      rdapUrl = `https://rdap.publicinterestregistry.org/rdap/domain/${encodeURIComponent(domain)}`;
    }

    if (!rdapUrl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(rdapUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/rdap+json, application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; WebForensics/1.0; Public OSINT)',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const data: any = await res.json();
    if (!data) return null;

    const now = Date.now();
    let creationDate: string | undefined;
    let expirationDate: string | undefined;
    let updatedDate: string | undefined;
    let ageDays: number | undefined;
    let daysUntilExpiration: number | undefined;

    if (Array.isArray(data.events)) {
      for (const ev of data.events) {
        if (!ev.eventDate) continue;
        const d = new Date(ev.eventDate);
        if (isNaN(d.getTime())) continue;

        if (ev.eventAction === 'registration') {
          creationDate = d.toISOString();
          ageDays = Math.max(0, Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24)));
        } else if (ev.eventAction === 'expiration') {
          expirationDate = d.toISOString();
          daysUntilExpiration = Math.floor((d.getTime() - now) / (1000 * 60 * 60 * 24));
        } else if (ev.eventAction === 'last changed' || ev.eventAction === 'last update') {
          updatedDate = d.toISOString();
        }
      }
    }

    // Extract Registrar
    let registrar: string | undefined;
    let registrarIanaId: string | undefined;

    if (Array.isArray(data.entities)) {
      for (const entity of data.entities) {
        if (entity.roles && entity.roles.includes('registrar')) {
          // vcardArray: ["vcard", [ ["version", {}, "text", "4.0"], ["fn", {}, "text", "MarkMonitor Inc."] ]]
          if (Array.isArray(entity.vcardArray) && Array.isArray(entity.vcardArray[1])) {
            const fnItem = entity.vcardArray[1].find((v: any) => Array.isArray(v) && v[0] === 'fn');
            if (fnItem && fnItem[3]) {
              registrar = String(fnItem[3]).trim();
            }
          }
          if (Array.isArray(entity.publicIds)) {
            const ianaItem = entity.publicIds.find(
              (p: any) => p.type === 'IANA Registrar ID' || p.type === 'iana'
            );
            if (ianaItem?.identifier) {
              registrarIanaId = String(ianaItem.identifier).trim();
            }
          }
          if (registrar) break;
        }
      }
    }

    const nameservers = Array.isArray(data.nameservers)
      ? data.nameservers.map((n: any) => (n.ldhName || n.handle || '').toLowerCase()).filter(Boolean)
      : undefined;

    const status = Array.isArray(data.status) ? data.status : undefined;
    const dnssec = data.secureDNS?.delegationSigned ? 'signedDelegation' : 'unsigned';

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
      rawText: JSON.stringify(data, null, 2).slice(0, 3000),
      lookupSource: 'RDAP',
      lookupStatus: 'SUCCESS',
      queriedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Main inspectWhois function: queries RDAP or TCP WHOIS with fallback
 */
export async function inspectWhois(domainInput: string): Promise<WhoisRecord> {
  const domain = extractRegistrableDomain(domainInput);

  if (!domain || !domain.includes('.')) {
    return {
      domain: domainInput,
      lookupStatus: 'NOT_FOUND',
      error: 'Invalid or missing top-level domain identifier.',
      queriedAt: new Date().toISOString(),
    };
  }

  const parts = domain.split('.');
  const tld = parts[parts.length - 1];

  // 1. Try RDAP HTTPS first if supported
  try {
    const rdapRecord = await queryRdap(domain, tld);
    if (rdapRecord && (rdapRecord.registrar || rdapRecord.creationDate)) {
      return rdapRecord;
    }
  } catch {
    // Continue to standard WHOIS
  }

  // 2. Query WHOIS via TCP port 43
  try {
    // Determine appropriate registry WHOIS server
    let targetServer = TLD_WHOIS_SERVERS[tld];

    if (!targetServer) {
      // Query whois.iana.org to find the referral server
      try {
        const ianaText = await queryWhoisTcp(domain, 'whois.iana.org', 2500);
        const referMatch =
          ianaText.match(/refer:\s+([^\s]+)/i) || ianaText.match(/whois:\s+([^\s]+)/i);
        if (referMatch && referMatch[1]) {
          targetServer = referMatch[1].trim();
        }
      } catch {
        targetServer = 'whois.iana.org';
      }
    }

    if (!targetServer) {
      targetServer = 'whois.iana.org';
    }

    const rawWhois = await queryWhoisTcp(domain, targetServer, 3500);
    const parsed = parseWhoisText(rawWhois, domain, targetServer);

    // If IANA answered without domain details, check if it referred to another server
    if (!parsed.registrar && !parsed.creationDate) {
      const referMatch =
        rawWhois.match(/refer:\s+([^\s]+)/i) || rawWhois.match(/whois:\s+([^\s]+)/i);
      if (referMatch && referMatch[1] && referMatch[1] !== targetServer) {
        const secondServer = referMatch[1].trim();
        try {
          const secondRaw = await queryWhoisTcp(domain, secondServer, 3500);
          const secondParsed = parseWhoisText(secondRaw, domain, secondServer);
          if (secondParsed.registrar || secondParsed.creationDate) {
            return secondParsed;
          }
        } catch {
          // Keep first parsed
        }
      }
    }

    return parsed;
  } catch (err: any) {
    return {
      domain,
      lookupStatus: 'UNAVAILABLE',
      error: `WHOIS lookup failed or timed out: ${err?.message || String(err)}`,
      lookupSource: 'WHOIS',
      queriedAt: new Date().toISOString(),
    };
  }
}
