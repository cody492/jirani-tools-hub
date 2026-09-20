import { TargetMetadata } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  metadata?: TargetMetadata;
}

export function validateAndParseTarget(input: string): ValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      isValid: false,
      errorMessage: 'Target input cannot be empty. Please enter a valid URL or domain.',
    };
  }

  // Ensure no whitespace inside
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: 'Invalid target: contains whitespace characters.',
    };
  }

  // Prepend protocol if missing for URL parsing
  let normalizedUrlString = trimmed;
  let hasExplicitProtocol = false;

  if (/^https?:\/\//i.test(trimmed)) {
    hasExplicitProtocol = true;
    normalizedUrlString = trimmed;
  } else {
    // If it starts with other protocols, reject
    if (/^[a-zA-Z0-9_-]+:\/\//.test(trimmed)) {
      return {
        isValid: false,
        errorMessage: 'Unsupported protocol. Only HTTP and HTTPS public web targets are supported in V0.1.',
      };
    }
    normalizedUrlString = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(normalizedUrlString);
    const hostname = parsed.hostname;

    // Check basic valid domain structure (at least one dot or localhost, no invalid chars)
    // Domain regex for labels: valid characters, length check
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$|^localhost$/i;
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!domainRegex.test(hostname) && !ipRegex.test(hostname)) {
      return {
        isValid: false,
        errorMessage: 'Invalid domain format. Enter a valid hostname (e.g. "example.com" or "https://sub.domain.org").',
      };
    }

    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    const path = parsed.pathname === '' ? '/' : parsed.pathname;

    return {
      isValid: true,
      metadata: {
        rawInput: trimmed,
        normalizedUrl: parsed.href,
        domain: hostname.replace(/^www\./i, ''),
        hostname: hostname,
        protocol: parsed.protocol,
        port: port,
        path: path + (parsed.search || '') + (parsed.hash || ''),
        parsedAt: new Date().toISOString(),
      },
    };
  } catch {
    return {
      isValid: false,
      errorMessage: 'Could not parse target string into a valid URL or hostname.',
    };
  }
}
