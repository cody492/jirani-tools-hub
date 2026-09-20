import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Maximize2, Minimize2, Printer, Check, Copy } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(type || 'privacy');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync tab when opened with specific type
  React.useEffect(() => {
    if (type) setActiveTab(type);
  }, [type]);

  if (!type) return null;

  const handleCopy = () => {
    const textToCopy = activeTab === 'privacy' ? PRIVACY_TEXT : TERMS_TEXT;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full bg-[#0c101c] border border-[#1e283d] rounded-xl shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
          isFullscreen
            ? 'h-[96vh] max-w-[96vw]'
            : 'max-h-[90vh] max-w-3xl'
        }`}
      >
        {/* Modal Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3.5 border-b border-[#1b253b] bg-[#101626] gap-3">
          {/* Document Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0a0e18] border border-[#1c2438]">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                activeTab === 'privacy'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Privacy Policy</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                activeTab === 'terms'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Terms of Service</span>
            </button>
          </div>

          {/* Controls: Copy, Print, Maximize, Close */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#202b42] bg-[#141b2e] text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors"
              title="Copy plain text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#202b42] bg-[#141b2e] text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded border border-[#202b42] bg-[#141b2e] text-slate-400 hover:text-slate-200 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded border border-[#202b42] bg-[#141b2e] text-slate-400 hover:text-rose-300 hover:border-rose-900 transition-colors ml-1"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm font-sans text-slate-300 leading-relaxed custom-scrollbar">
          {activeTab === 'privacy' ? (
            <div className="space-y-6">
              <div className="border-b border-[#1b253b] pb-4">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
                  <span>WEB FORENSICS • OFFICIAL PLATFORM DISCLOSURES</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
                  Privacy Policy &amp; Google User Data Disclosures
                </h1>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  Effective Date: September 20, 2026 • Platform Version 1.0
                </p>
              </div>

              <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-cyan-200 space-y-1.5">
                <div className="font-mono font-bold text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Google User Data Limited Use Compliance</span>
                </div>
                <p className="text-xs text-cyan-100/90 leading-relaxed">
                  WEB FORENSICS adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements. We never sell personal identity information, we never transmit account credentials to advertising brokers, and we never utilize user authentication records to train general AI or machine learning models.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  1. Information We Collect
                </h2>
                <p className="text-slate-400">
                  WEB FORENSICS is a defensive intelligence and public website telemetry platform. We collect only the minimal data points essential for authentication, security verification, and rate-limiting:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                  <li>
                    <strong className="text-slate-200">Account Credentials (Google Sign-In &amp; Firebase Auth):</strong> When authenticating, we receive your verified primary email address, public display name, avatar image URL, and a cryptographically generated Firebase User Identifier (UID). We request only basic identity scopes (<code>openid</code>, <code>email</code>, <code>profile</code>).
                  </li>
                  <li>
                    <strong className="text-slate-200">User-Provided Metadata:</strong> Optional birth age declarations supplied during account registration for age-verification compliance.
                  </li>
                  <li>
                    <strong className="text-slate-200">Investigation Target History:</strong> Public domain names or URLs submitted for infrastructure analysis (e.g. DNS lookups, TLS certificate analysis, HTTP header inspection). This history is saved to your private dashboard archive.
                  </li>
                  <li>
                    <strong className="text-slate-200">System Telemetry &amp; Access Logs:</strong> Request timestamps and client IP addresses strictly utilized to enforce defensive rate limits and prevent denial-of-service abuse.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  2. Defensive OSINT Scope
                </h2>
                <p className="text-slate-400">
                  WEB FORENSICS executes passive probes against publicly accessible internet infrastructure (such as authoritative DNS nameservers, TLS handshakes, HTTP response status codes, and ICANN WHOIS registries). We do NOT access private accounts, internal enterprise networks, or confidential communications.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  3. Storage, Encryption &amp; Security
                </h2>
                <p className="text-slate-400">
                  All account records and investigation dossiers are encrypted in transit via Transport Layer Security (TLS 1.3) and encrypted at rest utilizing AES-256 standards within Google Cloud Firestore database infrastructure. Granular Firestore Security Rules ensure zero cross-investigator access: User A can never read or query User B&apos;s saved data.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  4. User Rights (GDPR &amp; CCPA Compliance)
                </h2>
                <p className="text-slate-400">
                  Users maintain full sovereign rights over their data, including the Right of Access, Right to Rectification, and the Right to Erasure (Right to be Forgotten). You may request immediate deletion of your account and all associated target histories at any time.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  5. Platform Administrator &amp; Data Deletion Requests
                </h2>
                <div className="p-4 rounded bg-[#0f1422] border border-[#1e273d] text-xs font-mono text-slate-300 space-y-1">
                  <p className="text-cyan-400 font-bold">PLATFORM GOVERNANCE CONTACT:</p>
                  <p><span className="text-slate-500">Platform:</span> WEB FORENSICS</p>
                  <p><span className="text-slate-500">Administrator:</span> Cody Dracula</p>
                  <p><span className="text-slate-500">Contact Email:</span> <span className="text-cyan-300">codydracula035@gmail.com</span></p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    For inquiries or deletion requests, email with the subject line &quot;Data Deletion Request&quot; from your registered account email.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-[#1b253b] pb-4">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
                  <span>WEB FORENSICS • TERMS OF SERVICE &amp; ACCEPTABLE USE</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
                  Terms of Service &amp; Operational Charter
                </h1>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  Effective Date: September 20, 2026 • Platform Version 1.0
                </p>
              </div>

              <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-cyan-200 space-y-1.5">
                <div className="font-mono font-bold text-xs uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Authorized Defensive Use Only</span>
                </div>
                <p className="text-xs text-cyan-100/90 leading-relaxed">
                  WEB FORENSICS is an educational, diagnostic, and defensive Open Source Intelligence (OSINT) platform. By accessing or authenticating into the workspace, you covenant to utilize its reconnaissance tools strictly for legitimate research, lawful security investigations, and educational diagnostics.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  1. Acceptable Use Policy
                </h2>
                <p className="text-slate-400">
                  Users agree to strictly refrain from the following prohibited activities:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                  <li>
                    <strong className="text-slate-200">No Attack Traffic or Denial of Service:</strong> The platform may not be weaponized to launch, coordinate, or amplify distributed denial of service (DDoS) attacks against any network.
                  </li>
                  <li>
                    <strong className="text-slate-200">No Rate Limit Circumvention:</strong> Attempting to tamper with client IP addresses or bypass defensive hourly rate limits is strictly forbidden.
                  </li>
                  <li>
                    <strong className="text-slate-200">No Unauthorized Privilege Escalation:</strong> Attempting to compromise administrative controls, access verification endpoints without authorization, or extract other users&apos; investigations is prohibited.
                  </li>
                  <li>
                    <strong className="text-slate-200">No Automated Scraping Abuse:</strong> Generating automated scripted floods that degrade platform stability will result in immediate IP banning.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  2. Accuracy of Telemetry &amp; Disclaimer of Warranties
                </h2>
                <p className="text-slate-400">
                  All telemetry records, technology fingerprints, DNS record sets, TLS certificates, and WHOIS entries are acquired from public authoritative registries and provided on an <strong className="text-slate-200">&quot;AS-IS&quot;</strong> and <strong className="text-slate-200">&quot;AS-AVAILABLE&quot;</strong> basis. WEB FORENSICS makes no warranties regarding the absolute infallibility or persistent availability of third-party DNS or registrar endpoints.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  3. User Account Security
                </h2>
                <p className="text-slate-400">
                  You are solely responsible for maintaining the confidentiality of your credentials. Any activities initiated under your authenticated Google account or email session are your responsibility. WEB FORENSICS reserves the right to terminate accounts that violate security guidelines.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  4. Limitation of Liability
                </h2>
                <p className="text-slate-400">
                  In no event shall WEB FORENSICS, its architects, or administrators be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use this platform.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-slate-100 border-b border-[#1a2337] pb-1.5">
                  5. Contact &amp; Governance
                </h2>
                <div className="p-4 rounded bg-[#0f1422] border border-[#1e273d] text-xs font-mono text-slate-300 space-y-1">
                  <p className="text-cyan-400 font-bold">LEGAL &amp; OPERATIONAL INQUIRIES:</p>
                  <p><span className="text-slate-500">Platform:</span> WEB FORENSICS</p>
                  <p><span className="text-slate-500">Lead Administrator:</span> Cody Dracula</p>
                  <p><span className="text-slate-500">Email:</span> <span className="text-cyan-300">codydracula035@gmail.com</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 py-3 border-t border-[#1b253b] bg-[#0c101c] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Document Verified • Encrypted Session</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold transition-colors shadow-sm"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};

const PRIVACY_TEXT = `WEB FORENSICS — PRIVACY POLICY
Effective Date: September 20, 2026 • Version 1.0

Google User Data Limited Use:
WEB FORENSICS adheres to the Google API Services User Data Policy, including Limited Use requirements. We never sell personal identity information or transmit account credentials to advertising brokers.

1. Information We Collect:
- Account Credentials: Basic Google profile (email, name, avatar) & Firebase UID.
- User Metadata: Declared birth age for verification.
- Target History: Public website domains submitted for DNS, TLS, and HTTP inspection.
- System Telemetry: IP addresses logged strictly for rate-limiting.

2. Defensive OSINT Scope:
WEB FORENSICS inspects exclusively publicly accessible internet records (DNS, WHOIS, TLS, HTTP).

3. Storage & Security:
Data encrypted in transit (TLS 1.3) and at rest (AES-256) in Google Cloud Firestore.

4. Contact & Deletion:
Platform Administrator: Cody Dracula (codydracula035@gmail.com)
`;

const TERMS_TEXT = `WEB FORENSICS — TERMS OF SERVICE
Effective Date: September 20, 2026 • Version 1.0

1. Acceptable Use:
WEB FORENSICS is a defensive OSINT platform for educational, research, and defensive diagnostics.
Strictly prohibited: DoS/DDoS attacks, rate limit circumvention, unauthorized administrative access, and abusive automated scraping.

2. Telemetry Disclaimer:
Data is provided on an "AS-IS" and "AS-AVAILABLE" basis from public internet registries.

3. Contact:
Platform Administrator: Cody Dracula (codydracula035@gmail.com)
`;
