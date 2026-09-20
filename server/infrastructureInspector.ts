import dns from 'dns/promises';
import {
  DnsARecord,
  DnsAaaaRecord,
  DnsCnameRecord,
  DnsMxRecord,
  DnsNsRecord,
  DnsRecordItem,
  DnsTxtRecord,
  InfrastructureFinding,
  InfrastructureIndicator,
  InfrastructureInspectionError,
  IpAddressObservation,
  MailServerObservation,
  NameserverObservation,
  RelationshipEntity,
  RelationshipLink,
  TxtCategory,
  WhoisRecord,
} from '../src/types';
import { inspectWhois } from './whoisInspector';

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

/**
 * Execute a promise with a specified timeout in ms
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const err: any = new Error(`${label} timed out after ${timeoutMs}ms`);
      err.code = 'ETIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

/**
 * Query Google DoH as a resilient secondary resolver if system DNS is refused or restricted
 */
async function queryGoogleDoh(name: string, type: string): Promise<any> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/dns-json' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function categorizeTxtRecord(fullText: string): { category: TxtCategory; label: string } {
  const lower = fullText.toLowerCase().trim();

  if (lower.startsWith('v=spf1') || lower.includes('include:_spf') || lower.includes('redirect=_spf')) {
    return { category: 'spf', label: 'SPF (Sender Policy Framework)' };
  }

  if (lower.startsWith('v=dmarc1')) {
    return { category: 'dmarc', label: 'DMARC Security Policy' };
  }

  if (
    lower.includes('verification') ||
    lower.includes('verify') ||
    lower.startsWith('ms=') ||
    lower.startsWith('google-site-verification=') ||
    lower.startsWith('facebook-domain-verification=') ||
    lower.startsWith('apple-domain-verification=') ||
    lower.startsWith('atlassian-domain-verification=') ||
    lower.startsWith('stripe-verification=') ||
    lower.startsWith('docusign=') ||
    lower.startsWith('onetrust-domain-verification=') ||
    lower.startsWith('status-page-domain-verification=') ||
    lower.startsWith('cisco-ci-domain-verification=')
  ) {
    return { category: 'verification', label: 'Domain Verification / Third-Party Token' };
  }

  return { category: 'other', label: 'General TXT Telemetry' };
}

export async function inspectInfrastructure(
  domainInput: string,
  hostnameInput?: string,
  httpClues?: { serverHeader?: string; cdnHeaders?: string[] }
): Promise<InfrastructureFinding> {
  const hostname = (hostnameInput || domainInput).trim().toLowerCase();
  const domain = domainInput.trim().toLowerCase();

  // Safety checks
  if (isPrivateIpOrHost(hostname) || isPrivateIpOrHost(domain)) {
    const err: InfrastructureInspectionError = {
      code: 'BLOCKED_PRIVATE_TARGET',
      title: 'Target Address Prohibited',
      message: 'Resolution against loopback, link-local, and private RFC 1918 addresses is restricted.',
      technicalDetail: `Target host "${hostname}" resolved to a prohibited private subnet.`,
      targetDomain: domain,
    };
    throw err;
  }

  const queryStatuses: InfrastructureFinding['queryStatuses'] = {
    A: { status: 'lookup_unavailable', count: 0 },
    AAAA: { status: 'lookup_unavailable', count: 0 },
    CNAME: { status: 'lookup_unavailable', count: 0 },
    MX: { status: 'lookup_unavailable', count: 0 },
    NS: { status: 'lookup_unavailable', count: 0 },
    TXT: { status: 'lookup_unavailable', count: 0 },
  };

  const aRecords: DnsARecord[] = [];
  const aaaaRecords: DnsAaaaRecord[] = [];
  const cnameRecords: DnsCnameRecord[] = [];
  const mxRecords: DnsMxRecord[] = [];
  const nsRecords: DnsNsRecord[] = [];
  const txtRecords: DnsTxtRecord[] = [];
  const allRecords: DnsRecordItem[] = [];

  const TIMEOUT_MS = 5000;

  // Initiate WHOIS / RDAP lookup concurrently with DNS lookups
  const whoisPromise = inspectWhois(domain);

  // 1. Resolve A records (IPv4)
  try {
    const rawA = await withTimeout(dns.resolve4(hostname, { ttl: true }), TIMEOUT_MS, 'DNS A');
    if (rawA && rawA.length > 0) {
      for (const item of rawA) {
        aRecords.push({ type: 'A', address: item.address, ttl: item.ttl });
        allRecords.push({
          id: `rec-a-${item.address}`,
          type: 'A',
          name: hostname,
          value: item.address,
          ttl: item.ttl,
          raw: item,
        });
      }
      queryStatuses.A = { status: 'success', count: aRecords.length };
    } else {
      queryStatuses.A = { status: 'no_records_found', count: 0 };
    }
  } catch (err: any) {
    if (err?.code === 'ENODATA' || err?.code === 'ENOTFOUND') {
      queryStatuses.A = { status: 'no_records_found', count: 0 };
    } else {
      // Try DoH fallback
      const doh = await queryGoogleDoh(hostname, 'A');
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 1) {
            aRecords.push({ type: 'A', address: ans.data, ttl: ans.TTL });
            allRecords.push({
              id: `rec-a-${ans.data}`,
              type: 'A',
              name: hostname,
              value: ans.data,
              ttl: ans.TTL,
              raw: ans,
            });
          }
        }
        queryStatuses.A = { status: 'success', count: aRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.A = { status: 'no_records_found', count: 0 };
      } else {
        queryStatuses.A = { status: 'lookup_failed', count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }

  // 2. Resolve AAAA records (IPv6)
  try {
    const rawAaaa = await withTimeout(dns.resolve6(hostname, { ttl: true }), TIMEOUT_MS, 'DNS AAAA');
    if (rawAaaa && rawAaaa.length > 0) {
      for (const item of rawAaaa) {
        aaaaRecords.push({ type: 'AAAA', address: item.address, ttl: item.ttl });
        allRecords.push({
          id: `rec-aaaa-${item.address}`,
          type: 'AAAA',
          name: hostname,
          value: item.address,
          ttl: item.ttl,
          raw: item,
        });
      }
      queryStatuses.AAAA = { status: 'success', count: aaaaRecords.length };
    } else {
      queryStatuses.AAAA = { status: 'no_records_found', count: 0 };
    }
  } catch (err: any) {
    if (err?.code === 'ENODATA' || err?.code === 'ENOTFOUND') {
      queryStatuses.AAAA = { status: 'no_records_found', count: 0 };
    } else {
      // Try DoH fallback
      const doh = await queryGoogleDoh(hostname, 'AAAA');
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 28) {
            aaaaRecords.push({ type: 'AAAA', address: ans.data, ttl: ans.TTL });
            allRecords.push({
              id: `rec-aaaa-${ans.data}`,
              type: 'AAAA',
              name: hostname,
              value: ans.data,
              ttl: ans.TTL,
              raw: ans,
            });
          }
        }
        queryStatuses.AAAA = { status: 'success', count: aaaaRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.AAAA = { status: 'no_records_found', count: 0 };
      } else {
        queryStatuses.AAAA = { status: 'lookup_failed', count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }

  // 3. Resolve CNAME records
  try {
    const rawCname = await withTimeout(dns.resolveCname(hostname), TIMEOUT_MS, 'DNS CNAME');
    if (rawCname && rawCname.length > 0) {
      for (const target of rawCname) {
        cnameRecords.push({ type: 'CNAME', target });
        allRecords.push({
          id: `rec-cname-${target}`,
          type: 'CNAME',
          name: hostname,
          value: target,
          raw: target,
        });
      }
      queryStatuses.CNAME = { status: 'success', count: cnameRecords.length };
    } else {
      queryStatuses.CNAME = { status: 'no_records_found', count: 0 };
    }
  } catch (err: any) {
    if (err?.code === 'ENODATA' || err?.code === 'ENOTFOUND') {
      queryStatuses.CNAME = { status: 'no_records_found', count: 0 };
    } else {
      const doh = await queryGoogleDoh(hostname, 'CNAME');
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 5) {
            cnameRecords.push({ type: 'CNAME', target: ans.data, ttl: ans.TTL });
            allRecords.push({
              id: `rec-cname-${ans.data}`,
              type: 'CNAME',
              name: hostname,
              value: ans.data,
              ttl: ans.TTL,
              raw: ans,
            });
          }
        }
        queryStatuses.CNAME = { status: 'success', count: cnameRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.CNAME = { status: 'no_records_found', count: 0 };
      } else {
        queryStatuses.CNAME = { status: 'lookup_failed', count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }

  // 4. Resolve Authoritative Nameservers (NS)
  // Query hostname first; if empty or ENODATA and hostname !== domain, also query domain zone
  let targetNsHost = hostname;
  try {
    let rawNs: string[] = [];
    try {
      rawNs = await withTimeout(dns.resolveNs(hostname), TIMEOUT_MS, 'DNS NS (host)');
    } catch (nsErr: any) {
      if ((nsErr?.code === 'ENODATA' || nsErr?.code === 'ENOTFOUND') && hostname !== domain) {
        targetNsHost = domain;
        rawNs = await withTimeout(dns.resolveNs(domain), TIMEOUT_MS, 'DNS NS (domain)');
      } else {
        throw nsErr;
      }
    }

    if (rawNs && rawNs.length > 0) {
      for (const ns of rawNs) {
        nsRecords.push({ type: 'NS', host: ns });
        allRecords.push({
          id: `rec-ns-${ns}`,
          type: 'NS',
          name: targetNsHost,
          value: ns,
          raw: ns,
        });
      }
      queryStatuses.NS = { status: 'success', count: nsRecords.length };
    } else {
      queryStatuses.NS = { status: 'no_records_found', count: 0 };
    }
  } catch (err: any) {
    if (err?.code === 'ENODATA' || err?.code === 'ENOTFOUND') {
      queryStatuses.NS = { status: 'no_records_found', count: 0 };
    } else {
      // DoH fallback
      const doh = await queryGoogleDoh(domain, 'NS');
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 2) {
            nsRecords.push({ type: 'NS', host: ans.data, ttl: ans.TTL });
            allRecords.push({
              id: `rec-ns-${ans.data}`,
              type: 'NS',
              name: domain,
              value: ans.data,
              ttl: ans.TTL,
              raw: ans,
            });
          }
        }
        queryStatuses.NS = { status: 'success', count: nsRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.NS = { status: 'no_records_found', count: 0 };
      } else {
        queryStatuses.NS = { status: 'lookup_failed', count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }

  // 5. Resolve Mail Exchange (MX)
  let targetMxHost = hostname;
  try {
    let rawMx: Array<{ exchange: string; priority: number }> = [];
    try {
      rawMx = await withTimeout(dns.resolveMx(hostname), TIMEOUT_MS, 'DNS MX (host)');
    } catch (mxErr: any) {
      if ((mxErr?.code === 'ENODATA' || mxErr?.code === 'ENOTFOUND') && hostname !== domain) {
        targetMxHost = domain;
        rawMx = await withTimeout(dns.resolveMx(domain), TIMEOUT_MS, 'DNS MX (domain)');
      } else {
        throw mxErr;
      }
    }

    if (rawMx && rawMx.length > 0) {
      // Sort by priority ascending (lowest priority number = highest preference)
      rawMx.sort((a, b) => a.priority - b.priority);
      for (const mx of rawMx) {
        mxRecords.push({ type: 'MX', host: mx.exchange, priority: mx.priority });
        allRecords.push({
          id: `rec-mx-${mx.exchange}-${mx.priority}`,
          type: 'MX',
          name: targetMxHost,
          value: mx.exchange,
          secondaryValue: `Priority ${mx.priority}`,
          raw: mx,
        });
      }
      queryStatuses.MX = { status: 'success', count: mxRecords.length };
    } else {
      queryStatuses.MX = { status: 'no_records_found', count: 0 };
    }
  } catch (err: any) {
    if (err?.code === 'ENODATA' || err?.code === 'ENOTFOUND') {
      queryStatuses.MX = { status: 'no_records_found', count: 0 };
    } else {
      const doh = await queryGoogleDoh(domain, 'MX');
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 15) {
            // MX data format: "10 mail.example.com."
            const parts = ans.data.split(/\s+/);
            const prio = parseInt(parts[0], 10) || 10;
            const exch = (parts[1] || '').replace(/\.$/, '');
            mxRecords.push({ type: 'MX', host: exch, priority: prio, ttl: ans.TTL });
            allRecords.push({
              id: `rec-mx-${exch}-${prio}`,
              type: 'MX',
              name: domain,
              value: exch,
              secondaryValue: `Priority ${prio}`,
              ttl: ans.TTL,
              raw: ans,
            });
          }
        }
        mxRecords.sort((a, b) => a.priority - b.priority);
        queryStatuses.MX = { status: 'success', count: mxRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.MX = { status: 'no_records_found', count: 0 };
      } else {
        queryStatuses.MX = { status: 'lookup_failed', count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }

  // 6. Resolve TXT records
  let targetTxtHost = hostname;
  try {
    let rawTxt: string[][] = [];
    try {
      rawTxt = await withTimeout(dns.resolveTxt(hostname), TIMEOUT_MS, 'DNS TXT (host)');
    } catch (txtErr: any) {
      if ((txtErr?.code === 'ENODATA' || txtErr?.code === 'ENOTFOUND') && hostname !== domain) {
        targetTxtHost = domain;
        rawTxt = await withTimeout(dns.resolveTxt(domain), TIMEOUT_MS, 'DNS TXT (domain)');
      } else {
        throw txtErr;
      }
    }

    if (rawTxt && rawTxt.length > 0) {
      for (const chunks of rawTxt) {
        const fullText = chunks.join('');
        const { category, label } = categorizeTxtRecord(fullText);
        txtRecords.push({
          type: 'TXT',
          entries: chunks,
          fullText,
          category,
          categoryLabel: label,
        });
        allRecords.push({
          id: `rec-txt-${Math.random().toString(36).substring(2, 8)}`,
          type: 'TXT',
          name: targetTxtHost,
          value: fullText,
          secondaryValue: label,
          raw: chunks,
        });
      }
      queryStatuses.TXT = { status: 'success', count: txtRecords.length };
    } else {
      queryStatuses.TXT = { status: 'no_records_found', count: 0 };
    }
  } catch (err: any) {
    if (err?.code === 'ENODATA' || err?.code === 'ENOTFOUND') {
      queryStatuses.TXT = { status: 'no_records_found', count: 0 };
    } else {
      const doh = await queryGoogleDoh(domain, 'TXT');
      if (doh?.Answer && doh.Answer.length > 0) {
        for (const ans of doh.Answer) {
          if (ans.type === 16) {
            const cleanText = (ans.data || '').replace(/^"|"$/g, '').replace(/""/g, '');
            const { category, label } = categorizeTxtRecord(cleanText);
            txtRecords.push({
              type: 'TXT',
              entries: [cleanText],
              fullText: cleanText,
              category,
              categoryLabel: label,
              ttl: ans.TTL,
            });
            allRecords.push({
              id: `rec-txt-${Math.random().toString(36).substring(2, 8)}`,
              type: 'TXT',
              name: domain,
              value: cleanText,
              secondaryValue: label,
              ttl: ans.TTL,
              raw: ans,
            });
          }
        }
        queryStatuses.TXT = { status: 'success', count: txtRecords.length };
      } else if (doh?.Status === 3 || doh?.Status === 0) {
        queryStatuses.TXT = { status: 'no_records_found', count: 0 };
      } else {
        queryStatuses.TXT = { status: 'lookup_failed', count: 0, errorDetail: err?.message || String(err) };
      }
    }
  }

  // Build IP address observations (Fact vs Observation separation)
  const ipObservations: IpAddressObservation[] = [
    ...aRecords.map((a) => ({
      address: a.address,
      version: 'IPv4' as const,
      recordType: 'A' as const,
      ttl: a.ttl,
      fact: `Target domain ${hostname} resolved to IPv4 address ${a.address} via DNS A record.`,
      observation: `Observed active routing destination for IPv4 TCP/UDP traffic.`,
      interpretation: `Direct network routing endpoint. Distinct architectural role (e.g. edge proxy vs application origin) is not observable from DNS alone.`,
    })),
    ...aaaaRecords.map((aaaa) => ({
      address: aaaa.address,
      version: 'IPv6' as const,
      recordType: 'AAAA' as const,
      ttl: aaaa.ttl,
      fact: `Target domain ${hostname} resolved to IPv6 address ${aaaa.address} via DNS AAAA record.`,
      observation: `Observed active IPv6 unicast network layer address.`,
      interpretation: `Endpoint supports native dual-stack IPv6 transport.`,
    })),
  ];

  // Build Nameserver observations
  const nameserverObservations: NameserverObservation[] = nsRecords.map((ns) => ({
    host: ns.host,
    ttl: ns.ttl,
    fact: `Authoritative nameserver record lists ${ns.host}.`,
    observation: `Zone authority and DNS delegation for ${domain} is handled by ${ns.host}.`,
  }));

  // Build Mail Server observations
  const mailServerObservations: MailServerObservation[] = mxRecords.map((mx) => ({
    host: mx.host,
    priority: mx.priority,
    ttl: mx.ttl,
    fact: `Mail exchange (MX) record points to ${mx.host} with priority ${mx.priority}.`,
    observation: `Public mail routing for @${domain} designates ${mx.host} at priority rank ${mx.priority}.`,
  }));

  // Build CNAME relationships
  const cnameRelationships = cnameRecords.map((cname) => ({
    source: hostname,
    target: cname.target,
    ttl: cname.ttl,
    fact: `Canonical Name (CNAME) record delegates ${hostname} to ${cname.target}.`,
    observation: `The requested hostname is an alias mapping to ${cname.target}. Traffic resolution chains through this canonical entity.`,
  }));

  // Build Infrastructure Indicators (CDN, DNS Provider, Mail Security, Cloud/Hosting)
  const indicators: InfrastructureIndicator[] = [];

  // Indicator 1: DNS Provider
  const nsJoined = nsRecords.map((n) => n.host.toLowerCase()).join(' ');
  if (nsJoined.includes('awsdns-')) {
    indicators.push({
      id: 'ind-dns-route53',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'Amazon Route 53',
      confidence: 'HIGH',
      evidence: 'Observed authoritative NS hostnames matching awsdns-*.{com,net,org,co.uk}',
      technicalDetail: 'Anycast DNS zone hosted on AWS Route 53 managed nameserver infrastructure.',
    });
  } else if (nsJoined.includes('cloudflare.com')) {
    indicators.push({
      id: 'ind-dns-cloudflare',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'Cloudflare DNS',
      confidence: 'HIGH',
      evidence: 'Observed authoritative NS hostnames matching *.cloudflare.com',
      technicalDetail: 'Managed edge authoritative DNS hosted on Cloudflare anycast infrastructure.',
    });
  } else if (nsJoined.includes('googledomains.com') || nsJoined.includes('google.com')) {
    indicators.push({
      id: 'ind-dns-google',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'Google Cloud DNS / Domains',
      confidence: 'HIGH',
      evidence: 'Observed authoritative NS hostnames matching Google DNS domain patterns',
      technicalDetail: 'Authoritative zone hosted on Google anycast nameserver infrastructure.',
    });
  } else if (nsJoined.includes('azure-dns')) {
    indicators.push({
      id: 'ind-dns-azure',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'Microsoft Azure DNS',
      confidence: 'HIGH',
      evidence: 'Observed authoritative NS hostnames matching *.azure-dns.*',
      technicalDetail: 'Managed zone hosted on Microsoft Azure DNS edge infrastructure.',
    });
  } else if (nsJoined.includes('nsone.net')) {
    indicators.push({
      id: 'ind-dns-ns1',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'NS1 (IBM)',
      confidence: 'HIGH',
      evidence: 'Observed authoritative NS hostnames matching *.p*.nsone.net',
      technicalDetail: 'Enterprise anycast managed DNS provided by NS1 / IBM network.',
    });
  } else if (nsJoined.includes('akam.net') || nsJoined.includes('akamai.com')) {
    indicators.push({
      id: 'ind-dns-akamai',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'Akamai Edge DNS',
      confidence: 'HIGH',
      evidence: 'Observed authoritative NS hostnames matching Akamai edge patterns',
      technicalDetail: 'Enterprise authoritative DNS routed through Akamai distributed edge.',
    });
  } else if (nsJoined.includes('registrar-servers.com')) {
    indicators.push({
      id: 'ind-dns-namecheap',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'Namecheap DNS',
      confidence: 'HIGH',
      evidence: 'Observed authoritative NS hostnames matching registrar-servers.com',
      technicalDetail: 'Default registrar DNS service provided by Namecheap.',
    });
  } else if (nsJoined.includes('domaincontrol.com')) {
    indicators.push({
      id: 'ind-dns-godaddy',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'GoDaddy DNS',
      confidence: 'HIGH',
      evidence: 'Observed authoritative NS hostnames matching domaincontrol.com',
      technicalDetail: 'Default registrar DNS service provided by GoDaddy.',
    });
  } else if (nsRecords.length > 0) {
    indicators.push({
      id: 'ind-dns-custom',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'Custom / Undetermined Provider',
      confidence: 'MEDIUM',
      evidence: `Nameservers observed (${nsRecords.slice(0, 2).map((n) => n.host).join(', ')}), but no known major public provider signature matched`,
      technicalDetail: 'Nameserver hostnames do not correlate with standard public managed DNS signatures.',
    });
  } else {
    indicators.push({
      id: 'ind-dns-unknown',
      category: 'dns_provider',
      categoryLabel: 'Authoritative DNS Provider',
      name: 'NOT DETERMINED',
      confidence: 'UNKNOWN',
      evidence: 'No authoritative nameservers were resolved during query sequence',
      technicalDetail: 'Nameserver lookup returned no records or query was unanswerable.',
    });
  }

  // Indicator 2: CDN / Edge Distribution
  const cnameJoined = cnameRecords.map((c) => c.target.toLowerCase()).join(' ');
  const serverHeader = (httpClues?.serverHeader || '').toLowerCase();
  const cdnHeaderJoined = (httpClues?.cdnHeaders || []).join(' ').toLowerCase();

  if (
    cnameJoined.includes('cloudflare.net') ||
    nsJoined.includes('cloudflare.com') ||
    serverHeader.includes('cloudflare') ||
    cdnHeaderJoined.includes('cf-ray')
  ) {
    indicators.push({
      id: 'ind-cdn-cloudflare',
      category: 'cdn',
      categoryLabel: 'Content Delivery Network (CDN)',
      name: 'Cloudflare Edge Network',
      confidence: 'HIGH',
      evidence: 'Cross-correlated Cloudflare indicators observed in DNS nameservers and/or HTTP edge headers',
      technicalDetail: 'Inbound traffic is proxied through Cloudflare global anycast reverse proxy infrastructure.',
    });
  } else if (cnameJoined.includes('cloudfront.net')) {
    indicators.push({
      id: 'ind-cdn-cloudfront',
      category: 'cdn',
      categoryLabel: 'Content Delivery Network (CDN)',
      name: 'Amazon CloudFront',
      confidence: 'HIGH',
      evidence: 'CNAME canonical delegation matches *.cloudfront.net distribution',
      technicalDetail: 'Traffic is routed through Amazon Web Services CloudFront content delivery network.',
    });
  } else if (cnameJoined.includes('fastly.net') || serverHeader.includes('fastly')) {
    indicators.push({
      id: 'ind-cdn-fastly',
      category: 'cdn',
      categoryLabel: 'Content Delivery Network (CDN)',
      name: 'Fastly Edge Cloud',
      confidence: 'HIGH',
      evidence: 'Observed Fastly CNAME target or response routing headers',
      technicalDetail: 'Content caching and edge delivery managed by Fastly edge network.',
    });
  } else if (cnameJoined.includes('akamaiedge.net') || cnameJoined.includes('edgesuite.net')) {
    indicators.push({
      id: 'ind-cdn-akamai',
      category: 'cdn',
      categoryLabel: 'Content Delivery Network (CDN)',
      name: 'Akamai Edge Network',
      confidence: 'HIGH',
      evidence: 'CNAME canonical delegation matches Akamai distribution domain',
      technicalDetail: 'Edge caching and delivery handled by Akamai distributed network.',
    });
  } else if (cnameJoined.includes('azureedge.net')) {
    indicators.push({
      id: 'ind-cdn-azure',
      category: 'cdn',
      categoryLabel: 'Content Delivery Network (CDN)',
      name: 'Microsoft Azure CDN',
      confidence: 'HIGH',
      evidence: 'CNAME canonical delegation matches *.azureedge.net',
      technicalDetail: 'Application fronted by Microsoft Azure Content Delivery Network.',
    });
  } else if (cnameJoined.includes('github.io')) {
    indicators.push({
      id: 'ind-cdn-github',
      category: 'cdn',
      categoryLabel: 'Hosting / Edge Platform',
      name: 'GitHub Pages',
      confidence: 'HIGH',
      evidence: 'CNAME canonical target maps to github.io endpoint',
      technicalDetail: 'Static site served via Fastly/GitHub Pages edge platform.',
    });
  } else if (cnameJoined.includes('vercel-dns.com') || cnameJoined.includes('vercel.app')) {
    indicators.push({
      id: 'ind-cdn-vercel',
      category: 'cdn',
      categoryLabel: 'Hosting / Edge Platform',
      name: 'Vercel Edge Network',
      confidence: 'HIGH',
      evidence: 'Observed Vercel routing CNAME alias',
      technicalDetail: 'Serverless deployment hosted on Vercel distributed platform.',
    });
  } else {
    indicators.push({
      id: 'ind-cdn-none',
      category: 'cdn',
      categoryLabel: 'Content Delivery Network (CDN)',
      name: 'NOT DETERMINED',
      confidence: 'UNKNOWN',
      evidence: 'No canonical CNAME alias or recognized edge headers observed',
      technicalDetail: 'Target may serve content directly from origin, employ direct DNS routing, or use an unlisted CDN.',
    });
  }

  // Indicator 3: Mail Infrastructure & Security
  const mxJoined = mxRecords.map((m) => m.host.toLowerCase()).join(' ');
  if (mxJoined.includes('outlook.com') || mxJoined.includes('microsoft')) {
    indicators.push({
      id: 'ind-mail-m365',
      category: 'mail_security',
      categoryLabel: 'Mail Exchange Infrastructure',
      name: 'Microsoft 365 / Exchange Online',
      confidence: 'HIGH',
      evidence: 'MX host points to Microsoft Protection gateway (*.mail.protection.outlook.com)',
      technicalDetail: 'Enterprise mail exchange handled by Microsoft Exchange Online cloud infrastructure.',
    });
  } else if (mxJoined.includes('google.com') || mxJoined.includes('googlemail.com')) {
    indicators.push({
      id: 'ind-mail-google',
      category: 'mail_security',
      categoryLabel: 'Mail Exchange Infrastructure',
      name: 'Google Workspace / Gmail',
      confidence: 'HIGH',
      evidence: 'MX host points to Google mail server infrastructure (*.google.com / aspmx.l.google.com)',
      technicalDetail: 'Inbound email routed through Google Workspace cloud mail services.',
    });
  } else if (mxJoined.includes('pphosted.com')) {
    indicators.push({
      id: 'ind-mail-proofpoint',
      category: 'mail_security',
      categoryLabel: 'Mail Security Gateway',
      name: 'Proofpoint Email Protection',
      confidence: 'HIGH',
      evidence: 'MX host points to Proofpoint secure gateway (*.pphosted.com)',
      technicalDetail: 'Inbound mail inspected by Proofpoint enterprise security filtering.',
    });
  } else if (mxJoined.includes('mimecast.com')) {
    indicators.push({
      id: 'ind-mail-mimecast',
      category: 'mail_security',
      categoryLabel: 'Mail Security Gateway',
      name: 'Mimecast Secure Gateway',
      confidence: 'HIGH',
      evidence: 'MX host points to Mimecast mail routing gateway',
      technicalDetail: 'Email filtered through Mimecast secure perimeter.',
    });
  } else if (mxRecords.length > 0) {
    indicators.push({
      id: 'ind-mail-custom',
      category: 'mail_security',
      categoryLabel: 'Mail Exchange Infrastructure',
      name: 'Private / Custom Mail Gateway',
      confidence: 'MEDIUM',
      evidence: `MX hosts observed (${mxRecords.slice(0, 2).map((m) => m.host).join(', ')}), but no major vendor pattern matched`,
      technicalDetail: 'Mail routing is handled by domain-specific or private email relays.',
    });
  } else {
    indicators.push({
      id: 'ind-mail-none',
      category: 'mail_security',
      categoryLabel: 'Mail Exchange Infrastructure',
      name: 'NO MX CONFIGURED',
      confidence: 'HIGH',
      evidence: 'Zero MX records observed in DNS query results',
      technicalDetail: 'Target domain does not advertise public mail exchange routing records.',
    });
  }

  // Indicator 4: Cloud Infrastructure Clues
  if (nsJoined.includes('awsdns') || cnameJoined.includes('amazonaws.com') || cnameJoined.includes('cloudfront.net')) {
    indicators.push({
      id: 'ind-cloud-aws',
      category: 'cloud',
      categoryLabel: 'Cloud Ecosystem Clues',
      name: 'Amazon Web Services (AWS)',
      confidence: 'HIGH',
      evidence: 'Observable DNS and routing components belong to AWS public cloud service domains',
      technicalDetail: 'Part or all of the authoritative domain and edge topology operates in AWS.',
    });
  } else if (nsJoined.includes('azure-dns') || cnameJoined.includes('azure') || mxJoined.includes('outlook.com')) {
    indicators.push({
      id: 'ind-cloud-microsoft',
      category: 'cloud',
      categoryLabel: 'Cloud Ecosystem Clues',
      name: 'Microsoft Cloud (Azure / M365)',
      confidence: 'HIGH',
      evidence: 'Observable DNS or enterprise routing components map to Microsoft cloud networks',
      technicalDetail: 'DNS and/or mail infrastructure is provisioned through Microsoft commercial cloud services.',
    });
  } else if (nsJoined.includes('google') || mxJoined.includes('google')) {
    indicators.push({
      id: 'ind-cloud-google',
      category: 'cloud',
      categoryLabel: 'Cloud Ecosystem Clues',
      name: 'Google Cloud / Workspace',
      confidence: 'HIGH',
      evidence: 'Observable DNS or mail infrastructure routes through Google networks',
      technicalDetail: 'Core domain services integrate with Google cloud platforms.',
    });
  } else {
    indicators.push({
      id: 'ind-cloud-unknown',
      category: 'cloud',
      categoryLabel: 'Cloud Ecosystem Clues',
      name: 'NOT DETERMINED',
      confidence: 'UNKNOWN',
      evidence: 'No definitive cloud provider signatures observed in public DNS topology',
      technicalDetail: 'Evidence does not permit specific cloud platform attribution without active network probing.',
    });
  }

  // Build Relationship Entities and Links (V0.6 preparation)
  const entities: RelationshipEntity[] = [
    {
      id: `entity-dom-${domain}`,
      type: 'DOMAIN',
      label: 'Target Domain',
      value: domain,
    },
  ];

  const links: RelationshipLink[] = [];

  // IP links
  for (const ip of ipObservations) {
    const ipId = `entity-ip-${ip.address}`;
    if (!entities.find((e) => e.id === ipId)) {
      entities.push({
        id: ipId,
        type: 'IP_ADDRESS',
        label: `${ip.version} Address`,
        value: ip.address,
        metadata: ip.recordType,
      });
    }
    links.push({
      id: `link-${domain}-to-${ip.address}`,
      sourceId: `entity-dom-${domain}`,
      targetId: ipId,
      relationship: 'RESOLVES_TO',
      relationshipLabel: `Resolves to (${ip.recordType})`,
      description: `Domain ${domain} routes to network address ${ip.address}`,
    });
  }

  // Nameserver links
  for (const ns of nsRecords) {
    const nsId = `entity-ns-${ns.host}`;
    if (!entities.find((e) => e.id === nsId)) {
      entities.push({
        id: nsId,
        type: 'NAMESERVER',
        label: 'Nameserver',
        value: ns.host,
      });
    }
    links.push({
      id: `link-${domain}-to-ns-${ns.host}`,
      sourceId: `entity-dom-${domain}`,
      targetId: nsId,
      relationship: 'USES_NAMESERVER',
      relationshipLabel: 'Delegated to NS',
      description: `Zone authority for ${domain} is delegated to ${ns.host}`,
    });
  }

  // Mail server links
  for (const mx of mxRecords) {
    const mxId = `entity-mx-${mx.host}`;
    if (!entities.find((e) => e.id === mxId)) {
      entities.push({
        id: mxId,
        type: 'MAIL_SERVER',
        label: 'Mail Server',
        value: mx.host,
        metadata: `Priority ${mx.priority}`,
      });
    }
    links.push({
      id: `link-${domain}-to-mx-${mx.host}`,
      sourceId: `entity-dom-${domain}`,
      targetId: mxId,
      relationship: 'MAIL_ROUTES_TO',
      relationshipLabel: `Mail routes to (P${mx.priority})`,
      description: `Inbound mail for @${domain} routes to ${mx.host}`,
    });
  }

  // CNAME links
  for (const cname of cnameRecords) {
    const cnameId = `entity-cname-${cname.target}`;
    if (!entities.find((e) => e.id === cnameId)) {
      entities.push({
        id: cnameId,
        type: 'CNAME_TARGET',
        label: 'Canonical Target',
        value: cname.target,
      });
    }
    links.push({
      id: `link-${hostname}-to-cname-${cname.target}`,
      sourceId: `entity-dom-${domain}`,
      targetId: cnameId,
      relationship: 'ALIASES_TO',
      relationshipLabel: 'Aliases to CNAME',
      description: `Target ${hostname} is a canonical alias for ${cname.target}`,
    });
  }

  // Compute record types discovered count
  let typesDiscoveredCount = 0;
  if (aRecords.length > 0) typesDiscoveredCount++;
  if (aaaaRecords.length > 0) typesDiscoveredCount++;
  if (cnameRecords.length > 0) typesDiscoveredCount++;
  if (mxRecords.length > 0) typesDiscoveredCount++;
  if (nsRecords.length > 0) typesDiscoveredCount++;
  if (txtRecords.length > 0) typesDiscoveredCount++;

  const totalRecordsCount =
    aRecords.length +
    aaaaRecords.length +
    cnameRecords.length +
    mxRecords.length +
    nsRecords.length +
    txtRecords.length;

  let whoisResult: WhoisRecord | null = null;
  try {
    whoisResult = await whoisPromise;
  } catch (err: any) {
    whoisResult = {
      domain,
      lookupStatus: 'UNAVAILABLE',
      error: err?.message || String(err),
      queriedAt: new Date().toISOString(),
    };
  }

  // If registrar identified, add an infrastructure indicator and relationship entity
  if (whoisResult?.registrar) {
    const regDateStr = whoisResult.creationDate
      ? new Date(whoisResult.creationDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;
    const expDateStr = whoisResult.expirationDate
      ? new Date(whoisResult.expirationDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

    indicators.push({
      id: `ind-whois-reg-${domain}`,
      category: 'dns_provider',
      categoryLabel: 'Domain Registrar',
      name: whoisResult.registrar,
      confidence: 'HIGH',
      evidence: `Registrar: ${whoisResult.registrar}${whoisResult.registrarIanaId ? ` (IANA ID: ${whoisResult.registrarIanaId})` : ''}`,
      technicalDetail: [
        `Registrar: ${whoisResult.registrar}`,
        regDateStr ? `Registered: ${regDateStr}` : '',
        expDateStr ? `Expires: ${expDateStr}` : '',
        whoisResult.whoisServer ? `Registry Server: ${whoisResult.whoisServer}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
    });
  }

  const summaryStatus =
    totalRecordsCount > 0
      ? 'COMPLETE'
      : queryStatuses.A.status === 'lookup_failed'
      ? 'LOOKUP_FAILED'
      : 'NO_RECORDS';

  return {
    domain,
    hostname,
    queriedAt: new Date().toISOString(),
    summary: {
      ipv4Count: aRecords.length,
      ipv6Count: aaaaRecords.length,
      nameserverCount: nsRecords.length,
      mailServerCount: mxRecords.length,
      recordTypesDiscoveredCount: typesDiscoveredCount,
      totalRecordsCount,
      status: summaryStatus,
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
      links,
    },
    queryStatuses,
    whois: whoisResult,
    error: null,
  };
}
