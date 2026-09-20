import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { inspectHttp } from './server/httpInspector';
import { inspectInfrastructure } from './server/infrastructureInspector';
import { inspectWhois } from './server/whoisInspector';
import { inspectTechnology } from './server/technologyDetector';
import { inspectSecurity } from './server/securityInspector';
import { getClientIp, getQuotaStatus, consumeQuota, resetQuota } from './server/rateLimiter';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: 'V0.6-RELATIONSHIP-GRAPH' });
  });

  // Quota status endpoint
  app.get('/api/quota', (req, res) => {
    const clientIp = getClientIp(req);
    const quota = getQuotaStatus(clientIp);
    res.setHeader('X-RateLimit-Limit', quota.limit);
    res.setHeader('X-RateLimit-Remaining', quota.remaining);
    res.setHeader('X-RateLimit-Reset', quota.resetTime);
    res.json(quota);
  });

  // Quota reset endpoint (for testing/development)
  app.post('/api/quota/reset', (req, res) => {
    const clientIp = getClientIp(req);
    const quota = resetQuota(clientIp);
    res.json({ message: 'Quota successfully reset for testing', quota });
  });

  // Rate limit enforcement middleware for all forensic inspection probes
  const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = getClientIp(req);
    const targetIdentifier = req.body.url || req.body.domain || req.body.hostname;
    const { allowed, quota } = consumeQuota(clientIp, targetIdentifier);

    res.setHeader('X-RateLimit-Limit', quota.limit);
    res.setHeader('X-RateLimit-Remaining', quota.remaining);
    res.setHeader('X-RateLimit-Reset', quota.resetTime);

    if (!allowed) {
      res.setHeader('Retry-After', quota.resetInSeconds);
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          title: 'Target Analysis Quota Exceeded',
          message: `Defensive rate limit active: You have reached the maximum allowed limit of ${quota.limit} investigations per hour. Please wait for your quota to reset.`,
          retryAfterSeconds: quota.resetInSeconds,
          resetTime: quota.resetTime,
          quota,
        },
      });
    }

    next();
  };

  // Dedicated V0.2 HTTP Inspection API
  app.post('/api/inspect-http', rateLimitMiddleware, async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TARGET',
          title: 'Missing Target URL',
          message: 'The URL parameter is required and must be a valid string.',
          targetUrl: '',
        },
      });
    }

    try {
      const result = await inspectHttp(url);
      return res.json(result);
    } catch (err: any) {
      if (err?.code) {
        // Formatted HttpInspectionError
        return res.status(422).json({ error: err });
      }

      return res.status(500).json({
        error: {
          code: 'NETWORK_ERROR',
          title: 'HTTP Inspection Failure',
          message: 'An unexpected internal error occurred during HTTP inspection.',
          technicalDetail: err?.message || String(err),
          targetUrl: url,
        },
      });
    }
  });

  // Dedicated V0.3 Infrastructure & DNS Inspection API
  app.post('/api/inspect-infrastructure', rateLimitMiddleware, async (req, res) => {
    const { domain, hostname, httpClues } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        error: {
          code: 'DNS_LOOKUP_FAILED',
          title: 'Missing Domain Identifier',
          message: 'The domain parameter is required for infrastructure analysis.',
          targetDomain: '',
        },
      });
    }

    try {
      const result = await inspectInfrastructure(domain, hostname, httpClues);
      return res.json(result);
    } catch (err: any) {
      if (err?.code) {
        return res.status(422).json({ error: err });
      }

      return res.status(500).json({
        error: {
          code: 'SERVICE_ERROR',
          title: 'Infrastructure Resolution Failure',
          message: 'An unexpected internal error occurred during infrastructure DNS inspection.',
          technicalDetail: err?.message || String(err),
          targetDomain: domain,
        },
      });
    }
  });

  // Dedicated WHOIS & Domain Registration Inspection API
  app.post('/api/inspect-whois', rateLimitMiddleware, async (req, res) => {
    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INPUTS_MISSING',
          title: 'Missing Domain Identifier',
          message: 'The domain parameter is required for WHOIS registration lookup.',
          targetDomain: '',
        },
      });
    }

    try {
      const result = await inspectWhois(domain);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        error: {
          code: 'WHOIS_LOOKUP_FAILED',
          title: 'WHOIS Resolution Failure',
          message: 'An unexpected internal error occurred during WHOIS registration inspection.',
          technicalDetail: err?.message || String(err),
          targetDomain: domain,
        },
      });
    }
  });

  // Dedicated V0.4 Technology Fingerprinting API
  app.post('/api/inspect-technology', rateLimitMiddleware, async (req, res) => {
    const { domain, hostname, httpFinding, infrastructureFinding } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INPUTS_MISSING',
          title: 'Missing Domain Parameter',
          message: 'The domain parameter is required for technology fingerprinting.',
          targetDomain: '',
        },
      });
    }

    try {
      const result = await inspectTechnology({
        domain,
        hostname,
        httpFinding,
        infrastructureFinding,
      });
      return res.json(result);
    } catch (err: any) {
      if (err?.code) {
        return res.status(422).json({ error: err });
      }

      return res.status(500).json({
        error: {
          code: 'DETECTION_ERROR',
          title: 'Technology Fingerprinting Failure',
          message: 'An unexpected internal error occurred while fingerprinting website technologies.',
          technicalDetail: err?.message || String(err),
          targetDomain: domain,
        },
      });
    }
  });

  // Dedicated V0.5 Security Observations API
  app.post('/api/inspect-security', rateLimitMiddleware, async (req, res) => {
    const { domain, hostname, targetUrl, httpFinding, infrastructureFinding, technologyReport } = req.body;

    if (!domain || typeof domain !== 'string' || !targetUrl) {
      return res.status(400).json({
        error: {
          code: 'INPUTS_MISSING',
          title: 'Missing Security Inspection Parameters',
          message: 'Domain and targetUrl parameters are required for security observation analysis.',
          targetUrl: targetUrl || '',
        },
      });
    }

    try {
      const result = await inspectSecurity({
        domain,
        hostname: hostname || domain,
        targetUrl,
        httpFinding,
        infrastructureFinding,
        technologyReport,
      });
      return res.json(result);
    } catch (err: any) {
      if (err?.code) {
        return res.status(422).json({ error: err });
      }

      return res.status(500).json({
        error: {
          code: 'ANALYSIS_FAILED',
          title: 'Security Analysis Failure',
          message: 'An unexpected internal error occurred while analyzing security configuration.',
          technicalDetail: err?.message || String(err),
          targetUrl,
        },
      });
    }
  });

  // Global API error handler (e.g. payload too large or invalid json)
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      return res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          title: 'Payload Limit Exceeded',
          message: 'The submitted request payload exceeded the maximum permitted size limit.',
          technicalDetail: err.message || 'Request entity too large',
        },
      });
    }
    next(err);
  });

  // Explicit routes for Privacy Policy & Terms of Service (for Google OAuth verification crawlers)
  app.get(['/privacy', '/privacy.html'], (req, res) => {
    const distPath = path.join(process.cwd(), 'dist', 'privacy.html');
    if (fs.existsSync(distPath)) return res.sendFile(distPath);
    res.sendFile(path.join(process.cwd(), 'public', 'privacy.html'));
  });

  app.get(['/terms', '/terms.html'], (req, res) => {
    const distPath = path.join(process.cwd(), 'dist', 'terms.html');
    if (fs.existsSync(distPath)) return res.sendFile(distPath);
    res.sendFile(path.join(process.cwd(), 'public', 'terms.html'));
  });

  // Vite dev middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WEB FORENSICS V0.2 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
