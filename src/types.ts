export type AppState = 'idle' | 'validating' | 'scanning' | 'complete' | 'error';

export type NavTab = 'investigation' | 'history' | 'settings' | 'admin';

export type StageStatus = 'pending' | 'active' | 'completed' | 'failed' | 'skipped';

export interface ScanStage {
  id: string;
  name: string;
  sublabel: string;
  futureModule: string;
  durationMs: number;
  status: StageStatus;
  detailMessage?: string;
}

export interface TargetMetadata {
  rawInput: string;
  normalizedUrl: string;
  domain: string;
  hostname: string;
  protocol: string;
  port: string;
  path: string;
  parsedAt: string;
}

// === V0.2 HTTP Intelligence Models ===

export type HttpStatusCategory =
  | 'informational'
  | 'success'
  | 'redirection'
  | 'client_error'
  | 'server_error'
  | 'unknown';

export interface HttpStatusExplanation {
  code: number;
  phrase: string;
  category: HttpStatusCategory;
  fact: string;
  observation: string;
  interpretation: string;
}

export interface RedirectHop {
  hopNumber: number;
  url: string;
  statusCode: number;
  statusText: string;
  locationHeader?: string;
  responseTimeMs: number;
}

export interface PageMetadata {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  language: string | null;
  charset: string | null;
  viewport?: string | null;
  generator?: string | null;
  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
}

export interface HttpHeaderItem {
  name: string;
  value: string;
  category?: 'security' | 'caching' | 'server' | 'transport' | 'content' | 'other';
  isSecurityHeader?: boolean;
  technicalNote?: string;
}

export interface HttpInspectionError {
  code:
    | 'DNS_RESOLUTION_FAILED'
    | 'CONNECTION_TIMED_OUT'
    | 'CONNECTION_REFUSED'
    | 'CONNECTION_RESET'
    | 'TLS_SECURITY_ERROR'
    | 'BLOCKED_PRIVATE_IP'
    | 'HTTP_ERROR_RESPONSE'
    | 'CORS_RESTRICTION'
    | 'NETWORK_ERROR'
    | 'INVALID_TARGET';
  title: string;
  message: string;
  technicalDetail?: string;
  targetUrl: string;
}

export interface WebResourceMetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface WebResourceTelemetry {
  scripts: string[]; // List of <script src="..."> URLs
  inlineScriptSnippets: string[]; // Select inline script snippets for signatures
  stylesheets: string[]; // List of <link rel="stylesheet" href="..."> URLs
  metaTags: WebResourceMetaTag[];
  cookies: string[]; // Set-Cookie values
  domMarkers: string[]; // Specific identified markers (e.g., '#__next', 'data-reactroot')
  htmlSnippet?: string; // Leading sanitized HTML snippet (up to 64KB) for signature scanning
}

export interface HttpFinding {
  requestedUrl: string;
  finalUrl: string;
  method: string;
  protocol: string;
  statusCode: number;
  statusText: string;
  statusCategory: HttpStatusCategory;
  statusExplanation: HttpStatusExplanation;
  contentType: string;
  contentLength: number | null;
  contentLengthFormatted: string | null;
  responseTimeMs: number;
  redirects: RedirectHop[];
  redirectCount: number;
  hasRedirect: boolean;
  pageMetadata: PageMetadata | null;
  headers: HttpHeaderItem[];
  rawHeadersCount: number;
  documentType: 'HTML' | 'JSON' | 'XML' | 'Plain Text' | 'Binary / Media' | 'Other';
  webResources?: WebResourceTelemetry;
  analyzedAt: string;
  executionMode: 'SERVER_PROBE' | 'BROWSER_FALLBACK';
  error?: HttpInspectionError | null;
}

export interface InvestigationRecord {
  id: string;
  target: TargetMetadata;
  startedAt: string;
  completedAt: string | null;
  status:
    | 'COMPLETED (REAL V0.5)'
    | 'COMPLETED (REAL V0.4)'
    | 'COMPLETED (REAL V0.3)'
    | 'COMPLETED (REAL V0.2)'
    | 'COMPLETED (V0.1 SIMULATED)'
    | 'ABORTED'
    | 'FAILED'
    | string;
  durationMs: number;
  engineVersion: string;
  httpIntelligence?: HttpFinding | null;
  infrastructureIntelligence?: InfrastructureFinding | null;
  technologyIntelligence?: TechnologyReport | null;
  securityIntelligence?: SecurityReport | null;
  error?:
    | HttpInspectionError
    | InfrastructureInspectionError
    | TechnologyInspectionError
    | SecurityInspectionError
    | null;
}

export interface ForensicModuleField {
  label: string;
  value: string;
  status: 'AWAITING MODULE' | 'NOT ANALYZED' | 'SPEC_DEFINED' | 'STANDBY';
  moduleTarget: string;
  technicalNote?: string;
}

// === V0.3 Infrastructure Intelligence Models ===

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT';

export type DnsLookupStatus =
  | 'success'
  | 'no_records_found'
  | 'lookup_unavailable'
  | 'lookup_failed';

export interface DnsARecord {
  type: 'A';
  address: string;
  ttl?: number;
}

export interface DnsAaaaRecord {
  type: 'AAAA';
  address: string;
  ttl?: number;
}

export interface DnsCnameRecord {
  type: 'CNAME';
  target: string;
  ttl?: number;
}

export interface DnsMxRecord {
  type: 'MX';
  host: string;
  priority: number;
  ttl?: number;
}

export interface DnsNsRecord {
  type: 'NS';
  host: string;
  ttl?: number;
}

export type TxtCategory = 'spf' | 'verification' | 'dmarc' | 'other';

export interface DnsTxtRecord {
  type: 'TXT';
  entries: string[];
  fullText: string;
  category: TxtCategory;
  categoryLabel: string;
  ttl?: number;
}

export interface DnsRecordItem {
  id: string;
  type: DnsRecordType;
  name: string;
  value: string;
  secondaryValue?: string;
  ttl?: number;
  raw: any;
}

export interface IpAddressObservation {
  address: string;
  version: 'IPv4' | 'IPv6';
  recordType: 'A' | 'AAAA';
  ttl?: number;
  fact: string;
  observation: string;
  interpretation: string;
}

export interface NameserverObservation {
  host: string;
  ttl?: number;
  fact: string;
  observation: string;
}

export interface MailServerObservation {
  host: string;
  priority: number;
  ttl?: number;
  fact: string;
  observation: string;
}

export interface CnameRelationship {
  source: string;
  target: string;
  ttl?: number;
  fact: string;
  observation: string;
}

export type IndicatorConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface InfrastructureIndicator {
  id: string;
  category: 'cdn' | 'dns_provider' | 'hosting' | 'cloud' | 'mail_security';
  categoryLabel: string;
  name: string;
  confidence: IndicatorConfidence;
  evidence: string;
  technicalDetail: string;
}

export interface InfrastructureSummaryData {
  ipv4Count: number;
  ipv6Count: number;
  nameserverCount: number;
  mailServerCount: number;
  recordTypesDiscoveredCount: number;
  totalRecordsCount: number;
  status: 'COMPLETE' | 'PARTIAL' | 'NO_RECORDS' | 'LOOKUP_FAILED' | 'LOOKUP_UNAVAILABLE';
}

export interface RelationshipEntity {
  id: string;
  type: 'DOMAIN' | 'IP_ADDRESS' | 'NAMESERVER' | 'MAIL_SERVER' | 'CNAME_TARGET';
  label: string;
  value: string;
  metadata?: string;
}

export interface RelationshipLink {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: 'RESOLVES_TO' | 'USES_NAMESERVER' | 'MAIL_ROUTES_TO' | 'ALIASES_TO';
  relationshipLabel: string;
  description: string;
}

export interface InfrastructureInspectionError {
  code:
    | 'DNS_LOOKUP_FAILED'
    | 'DNS_LOOKUP_UNAVAILABLE'
    | 'NO_RECORDS_FOUND'
    | 'PARTIAL_RESULTS'
    | 'TIMEOUT'
    | 'SERVICE_ERROR'
    | 'BLOCKED_PRIVATE_TARGET';
  title: string;
  message: string;
  technicalDetail?: string;
  targetDomain: string;
}

export interface WhoisRecord {
  domain: string;
  registrar?: string;
  registrarIanaId?: string;
  creationDate?: string;
  expirationDate?: string;
  updatedDate?: string;
  status?: string[];
  nameservers?: string[];
  whoisServer?: string;
  dnssec?: string;
  ageDays?: number;
  daysUntilExpiration?: number;
  rawText?: string;
  lookupSource?: 'RDAP' | 'WHOIS' | 'FALLBACK';
  lookupStatus: 'SUCCESS' | 'NOT_FOUND' | 'UNAVAILABLE' | 'RESTRICTED';
  queriedAt: string;
  error?: string;
}

export interface InfrastructureFinding {
  domain: string;
  hostname: string;
  queriedAt: string;
  summary: InfrastructureSummaryData;
  aRecords: DnsARecord[];
  aaaaRecords: DnsAaaaRecord[];
  cnameRecords: DnsCnameRecord[];
  mxRecords: DnsMxRecord[];
  nsRecords: DnsNsRecord[];
  txtRecords: DnsTxtRecord[];
  allRecords: DnsRecordItem[];
  ipObservations: IpAddressObservation[];
  nameserverObservations: NameserverObservation[];
  mailServerObservations: MailServerObservation[];
  cnameRelationships: CnameRelationship[];
  indicators: InfrastructureIndicator[];
  relationships: {
    entities: RelationshipEntity[];
    links: RelationshipLink[];
  };
  queryStatuses: {
    A: { status: DnsLookupStatus; count: number; errorDetail?: string };
    AAAA: { status: DnsLookupStatus; count: number; errorDetail?: string };
    CNAME: { status: DnsLookupStatus; count: number; errorDetail?: string };
    MX: { status: DnsLookupStatus; count: number; errorDetail?: string };
    NS: { status: DnsLookupStatus; count: number; errorDetail?: string };
    TXT: { status: DnsLookupStatus; count: number; errorDetail?: string };
  };
  whois?: WhoisRecord | null;
  error?: InfrastructureInspectionError | null;
}

// === V0.4 Technology Fingerprinting Models ===

export type TechnologyCategory =
  | 'frontend_framework'
  | 'cms'
  | 'javascript_library'
  | 'css_ui'
  | 'analytics'
  | 'advertising'
  | 'payment'
  | 'cdn_edge'
  | 'hosting_cloud'
  | 'web_server';

export type TechnologyConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type TechnologyEvidenceType =
  | 'HEADER'
  | 'HTML'
  | 'SCRIPT'
  | 'LINK'
  | 'META'
  | 'COOKIE'
  | 'URL'
  | 'INFRASTRUCTURE';

export interface TechnologyEvidence {
  id: string;
  type: TechnologyEvidenceType;
  source: string;
  observed: string;
  interpretation: string;
  weight: number;
}

export interface ConflictingSignal {
  id: string;
  conflictType: string;
  technologies: string[];
  reason: string;
  recommendation: string;
}

export interface TechnologyFinding {
  id: string;
  name: string;
  slug: string;
  category: TechnologyCategory;
  categoryLabel: string;
  version: string | null;
  versionReliability?: 'EXACT' | 'MAJOR_MINOR' | 'ESTIMATED' | 'NOT_DETERMINED';
  confidence: TechnologyConfidence;
  confidenceScore: number; // 0 - 100
  description: string;
  website?: string;
  evidence: TechnologyEvidence[];
  evidenceSourcesCount: number;
  isConflicted?: boolean;
  conflictDetails?: string;
}

export interface TechnologySummaryData {
  totalDetected: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  categoriesCount: number;
  versionDetectedCount: number;
  conflictingSignalsCount: number;
  status: 'SUCCESS' | 'PARTIAL' | 'NO_TECHNOLOGIES_DETECTED' | 'UNAVAILABLE' | 'ERROR';
}

export interface TechnologyRelationship {
  domain: string;
  relationship: 'USES';
  technologyId: string;
  technologyName: string;
  category: TechnologyCategory;
  confidence: TechnologyConfidence;
}

export interface TechnologyInspectionError {
  code: 'PARSING_FAILED' | 'DETECTION_ERROR' | 'INPUTS_MISSING' | 'TIMEOUT';
  title: string;
  message: string;
  technicalDetail?: string;
  targetDomain?: string;
}

export interface TechnologyReport {
  domain: string;
  hostname: string;
  analyzedAt: string;
  summary: TechnologySummaryData;
  technologies: TechnologyFinding[];
  groupedByCategory: Record<TechnologyCategory, TechnologyFinding[]>;
  conflicts: ConflictingSignal[];
  relationships: TechnologyRelationship[];
  rawAnalyzedInputs: {
    headersCount: number;
    scriptsAnalyzed: number;
    metaTagsAnalyzed: number;
    linksAnalyzed: number;
    cookiesCount: number;
    infrastructureCluesCount: number;
  };
  error?: TechnologyInspectionError | null;
}

// === V0.5 Security Observations Models ===

export type SecurityObservationStatus =
  | 'PRESENT'
  | 'MISSING'
  | 'PARTIAL'
  | 'NOT_OBSERVABLE'
  | 'ERROR';

export type SecurityObservationSeverity = 'INFO' | 'REVIEW' | 'ATTENTION';

export type SecurityObservationCategory =
  | 'https_transport'
  | 'security_headers'
  | 'content_security_policy'
  | 'hsts'
  | 'cookie_security'
  | 'tls_cryptography'
  | 'permissions_policy'
  | 'clickjacking'
  | 'content_type';

export interface SecurityEvidence {
  source: string;
  observedKey?: string;
  observedValue?: string | null;
  technicalNote?: string;
}

export interface SecurityObservation {
  id: string;
  category: SecurityObservationCategory;
  title: string;
  status: SecurityObservationStatus;
  severity: SecurityObservationSeverity;
  observedValue: string | null;
  fact: string;
  context: string;
  assessment: string;
  recommendation?: string;
  evidence: SecurityEvidence;
  technologyContext?: string;
}

export interface CspDirectiveInfo {
  directive: string;
  values: string[];
}

export interface CspObservationDetail {
  present: boolean;
  status: SecurityObservationStatus;
  rawPolicy: string | null;
  directives: CspDirectiveInfo[];
  hasDefaultSrc: boolean;
  hasScriptSrc: boolean;
  hasStyleSrc: boolean;
  hasImgSrc: boolean;
  hasConnectSrc: boolean;
  hasFrameAncestors: boolean;
  hasObjectSrc: boolean;
  hasUpgradeInsecureRequests: boolean;
  allowsUnsafeInline: boolean;
  allowsUnsafeEval: boolean;
}

export interface HstsObservationDetail {
  present: boolean;
  status: SecurityObservationStatus;
  rawHeader: string | null;
  maxAge: number | null;
  maxAgeFormatted: string | null;
  includeSubDomains: boolean;
  preload: boolean;
  isPreloadEligible: boolean;
}

export interface FramingProtectionDetail {
  hasXFrameOptions: boolean;
  xFrameOptionsValue: string | null;
  hasCspFrameAncestors: boolean;
  cspFrameAncestorsValue: string | null;
  protectionObserved: boolean;
  summary: string;
}

export interface CookieSecurityItem {
  name: string;
  isSessionCookie: boolean;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'Strict' | 'Lax' | 'None' | 'Not Set' | string;
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: number;
}

export interface CookieSecuritySummary {
  totalCount: number;
  secureCount: number;
  httpOnlyCount: number;
  sameSiteCount: number;
  status: 'COOKIES_OBSERVED' | 'NO_COOKIES_OBSERVED' | 'COOKIE_ANALYSIS_UNAVAILABLE';
  note: string;
}

export interface TlsCertificateSubject {
  commonName?: string;
  organization?: string;
  country?: string;
}

export interface TlsObservationDetail {
  available: boolean;
  status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'SELF_SIGNED' | 'EXPIRED' | 'UNENCRYPTED_HTTP';
  protocol?: string;
  cipher?: string;
  subject?: TlsCertificateSubject;
  issuer?: TlsCertificateSubject;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  sanList?: string[];
  serialNumber?: string;
  fingerprint?: string;
  unavailabilityReason?: string;
}

export interface HttpsObservationDetail {
  httpsEnabled: boolean;
  httpUsed: boolean;
  redirectedFromHttpToHttps: boolean;
  finalProtocol: string;
  hstsObserved: boolean;
  summary: string;
}

export interface SecuritySummaryData {
  totalChecksPerformed: number;
  positiveObservationsCount: number; // INFO
  reviewItemsCount: number; // REVIEW
  attentionItemsCount: number; // ATTENTION
  unavailableChecksCount: number;
  httpsStatus: 'ENABLED' | 'NOT_OBSERVED' | 'REDIRECTED' | 'HTTP_ONLY';
  securityHeadersObservedCount: number;
  securityHeadersTotalChecked: number;
  cookieControlsStatus:
    | 'ALL_OBSERVED'
    | 'MOSTLY_OBSERVED'
    | 'PARTIALLY_OBSERVED'
    | 'NOT_OBSERVED'
    | 'NO_COOKIES'
    | 'UNAVAILABLE';
  tlsDetailsStatus: 'AVAILABLE' | 'EXPIRING_SOON' | 'EXPIRED' | 'NOT_AVAILABLE' | 'UNENCRYPTED';
}

export interface SecurityInspectionError {
  code: 'ANALYSIS_FAILED' | 'INPUTS_MISSING' | 'TIMEOUT' | 'TLS_PROBE_FAILED';
  title: string;
  message: string;
  technicalDetail?: string;
  targetUrl?: string;
}

export interface SecurityReport {
  domain: string;
  hostname: string;
  targetUrl: string;
  analyzedAt: string;
  summary: SecuritySummaryData;
  https: HttpsObservationDetail;
  csp: CspObservationDetail;
  hsts: HstsObservationDetail;
  framing: FramingProtectionDetail;
  cookies: {
    summary: CookieSecuritySummary;
    items: CookieSecurityItem[];
  };
  tls: TlsObservationDetail;
  observations: SecurityObservation[];
  rawAnalyzedHeaders: string[];
  error?: SecurityInspectionError | null;
}

// === V0.6 Relationship Graph Models ===

export type GraphNodeCategory =
  | 'TARGET'
  | 'IP_ADDRESS'
  | 'NAMESERVER'
  | 'MAIL_SERVER'
  | 'CNAME'
  | 'TECHNOLOGY'
  | 'SECURITY_OBSERVATION';

export type GraphRelationshipType =
  | 'RESOLVES_TO'
  | 'USES_NAMESERVER'
  | 'MAIL_ROUTES_TO'
  | 'ALIASES_TO'
  | 'USES'
  | 'OBSERVED'
  | 'SECURED_BY';

export type GraphConfidence = 'VERIFIED' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface GraphNodeData {
  id: string;
  label: string;
  sublabel?: string;
  category: GraphNodeCategory;
  categoryLabel: string;
  confidence?: GraphConfidence;
  sourceModule: string;
  metadata?: Record<string, any>;
  evidenceCount?: number;
  evidenceSnippets?: string[];
  targetNavModule?: string;
  isTarget?: boolean;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  relationship: GraphRelationshipType;
  relationshipLabel: string;
  evidence: string;
  confidence?: GraphConfidence;
  sourceModule: string;
}

export interface GraphSummaryData {
  totalNodes: number;
  totalEdges: number;
  categoriesCount: number;
  targetCount: number;
  ipCount: number;
  nameserverCount: number;
  mailServerCount: number;
  cnameCount: number;
  technologyCount: number;
  securityCount: number;
  status: 'POPULATED' | 'EMPTY' | 'BUILDING' | 'ERROR';
}

export interface RelationshipGraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  summary: GraphSummaryData;
  generatedAt: string;
}

