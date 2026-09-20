import { TechnologyCategory } from '../types';

export interface SignatureHeaderIndicator {
  name: string;
  valueRegex?: RegExp;
  interpretation: string;
  weight: number;
}

export interface SignatureHtmlIndicator {
  regex: RegExp;
  interpretation: string;
  weight: number;
}

export interface SignatureScriptIndicator {
  pattern: RegExp;
  interpretation: string;
  weight: number;
}

export interface SignatureStylesheetIndicator {
  pattern: RegExp;
  interpretation: string;
  weight: number;
}

export interface SignatureMetaIndicator {
  nameOrPropRegex: RegExp;
  contentRegex?: RegExp;
  interpretation: string;
  weight: number;
}

export interface SignatureCookieIndicator {
  nameRegex: RegExp;
  interpretation: string;
  weight: number;
}

export interface SignatureDomMarkerIndicator {
  marker: string;
  interpretation: string;
  weight: number;
}

export interface SignatureInfrastructureIndicator {
  nsMatch?: RegExp;
  cnameMatch?: RegExp;
  cdnMatch?: string;
  serverHeader?: RegExp;
  interpretation: string;
  weight: number;
}

export interface VersionPattern {
  source: 'meta' | 'script' | 'header' | 'html' | 'link';
  regex: RegExp;
  groupIndex: number;
  reliability: 'EXACT' | 'MAJOR_MINOR';
}

export interface TechnologySignature {
  id: string;
  name: string;
  slug: string;
  category: TechnologyCategory;
  categoryLabel: string;
  description: string;
  website: string;
  indicators: {
    headers?: SignatureHeaderIndicator[];
    html?: SignatureHtmlIndicator[];
    scripts?: SignatureScriptIndicator[];
    stylesheets?: SignatureStylesheetIndicator[];
    meta?: SignatureMetaIndicator[];
    cookies?: SignatureCookieIndicator[];
    domMarkers?: SignatureDomMarkerIndicator[];
    infrastructure?: SignatureInfrastructureIndicator[];
  };
  versionPatterns?: VersionPattern[];
  conflictsWith?: string[]; // IDs of technologies that conflict conceptually (e.g., competing CMS or SSR frameworks)
}

export const TECHNOLOGY_SIGNATURES: TechnologySignature[] = [
  // ==========================================
  // 1. FRONTEND FRAMEWORKS
  // ==========================================
  {
    id: 'nextjs',
    name: 'Next.js',
    slug: 'nextjs',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'The React framework for the Web with hybrid static & server rendering.',
    website: 'https://nextjs.org',
    indicators: {
      headers: [
        {
          name: 'x-powered-by',
          valueRegex: /Next\.js/i,
          interpretation: 'Explicit X-Powered-By response header announces Next.js runtime.',
          weight: 50,
        },
      ],
      domMarkers: [
        {
          marker: 'id="__next"',
          interpretation: 'Found canonical Next.js root DOM wrapper element (#__next).',
          weight: 50,
        },
      ],
      scripts: [
        {
          pattern: /\/_next\/static\//i,
          interpretation: 'Script URL pattern matches Next.js compiled static asset distribution path (/_next/static/).',
          weight: 45,
        },
        {
          pattern: /\/_next\/data\//i,
          interpretation: 'Dynamic client route data fetching endpoint pattern (/_next/data/).',
          weight: 45,
        },
      ],
      html: [
        {
          regex: /<script id="__NEXT_DATA__"/i,
          interpretation: 'Next.js embedded hydration script tag (__NEXT_DATA__) located in document body.',
          weight: 55,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'html',
        regex: /"buildId":"([^"]+)"/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
    conflictsWith: ['nuxtjs', 'remix', 'astro'],
  },
  {
    id: 'react',
    name: 'React',
    slug: 'react',
    category: 'frontend_framework',
    categoryLabel: 'JavaScript Framework',
    description: 'A declarative, component-based JavaScript library and UI runtime engine.',
    website: 'https://react.dev',
    indicators: {
      domMarkers: [
        {
          marker: 'data-reactroot',
          interpretation: 'React server-side rendering root marker (data-reactroot) detected on DOM container.',
          weight: 55,
        },
        {
          marker: 'data-reactid',
          interpretation: 'React client component ID marker (data-reactid) observed on DOM elements.',
          weight: 50,
        },
        {
          marker: 'data-react-helmet',
          interpretation: 'React Helmet metadata injector attributes found on document tags.',
          weight: 40,
        },
        {
          marker: 'framework:react',
          interpretation: 'React synthetic event system or fiber node properties identified in active DOM.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /data-reactroot|data-reactid/i,
          interpretation: 'Document contains React hydration/rendering boundary attributes.',
          weight: 50,
        },
        {
          regex: /data-react-helmet/i,
          interpretation: 'React Helmet metadata injector attributes found on document tags.',
          weight: 40,
        },
        {
          regex: /_reactListening|__reactFiber|__reactEvents|__reactInternalInstance|_reactProps/i,
          interpretation: 'React synthetic event listener or Fiber node internals present in page code.',
          weight: 50,
        },
        {
          regex: /ReactDOM\.(?:createRoot|render|hydrate)|createRoot\(/i,
          interpretation: 'ReactDOM mounting and hydration entry point call identified.',
          weight: 45,
        },
        {
          regex: /__REACT_DEVTOOLS_GLOBAL_HOOK__|window\.__REACT_CONTEXT__/i,
          interpretation: 'React DevTools global hook integration marker observed.',
          weight: 45,
        },
      ],
      scripts: [
        {
          pattern: /react(?:\.production(?:\.min)?)?\.js/i,
          interpretation: 'Direct React production runtime script bundle referenced.',
          weight: 50,
        },
        {
          pattern: /react-dom(?:\.production(?:\.min)?)?\.js/i,
          interpretation: 'React DOM rendering package bundle script located.',
          weight: 50,
        },
        {
          pattern: /react@[0-9.]+|react-dom@[0-9.]+/i,
          interpretation: 'CDN script package references versioned React distribution.',
          weight: 50,
        },
        {
          pattern: /\/chunks\/(?:framework|react|main)-[a-f0-9]+\.js/i,
          interpretation: 'Framework chunk bundle signature packaging React core runtime.',
          weight: 40,
        },
        {
          pattern: /react-router/i,
          interpretation: 'React Router declarative navigation bundle observed.',
          weight: 40,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /react(?:@|-)([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
      {
        source: 'html',
        regex: /react\/([\d.]+)\/(?:umd\/)?react/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'vuejs',
    name: 'Vue.js',
    slug: 'vuejs',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'An approachable, performant and versatile framework for building web user interfaces.',
    website: 'https://vuejs.org',
    indicators: {
      domMarkers: [
        {
          marker: 'data-v-* (Vue scoped)',
          interpretation: 'Scoped CSS template attribute data-v-[hash] observed on DOM nodes.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /data-v-[a-f0-9]{6,}/i,
          interpretation: 'Observable Vue single-file component scoped attribute hash.',
          weight: 45,
        },
        {
          regex: /__vue__/i,
          interpretation: 'Vue DOM instance mount property detected in HTML script structure.',
          weight: 45,
        },
      ],
      scripts: [
        {
          pattern: /vue(?:\.runtime)?(?:\.esm)?(?:\.min)?\.js/i,
          interpretation: 'Public Vue JavaScript runtime referenced in document script element.',
          weight: 45,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /vue(?:@|-)([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
    conflictsWith: ['react', 'angular'],
  },
  {
    id: 'nuxtjs',
    name: 'Nuxt.js',
    slug: 'nuxtjs',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'The intuitive Vue framework for creating full-stack web applications and websites.',
    website: 'https://nuxt.com',
    indicators: {
      headers: [
        {
          name: 'x-powered-by',
          valueRegex: /Nuxt/i,
          interpretation: 'Header x-powered-by reports Nuxt server execution.',
          weight: 50,
        },
      ],
      domMarkers: [
        {
          marker: 'id="__nuxt"',
          interpretation: 'Nuxt canonical entry element (#__nuxt) identified.',
          weight: 50,
        },
      ],
      scripts: [
        {
          pattern: /\/_nuxt\//i,
          interpretation: 'Nuxt build directory resource path (/_nuxt/) referenced in script tags.',
          weight: 45,
        },
      ],
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Nuxt/i,
          interpretation: 'Meta generator tag declares Nuxt.',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'meta',
        regex: /Nuxt(?:\s+v?)([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
    conflictsWith: ['nextjs'],
  },
  {
    id: 'angular',
    name: 'Angular',
    slug: 'angular',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'A platform and framework for building single-page client applications using TypeScript.',
    website: 'https://angular.dev',
    indicators: {
      domMarkers: [
        {
          marker: 'ng-version',
          interpretation: 'ng-version attribute detected on application root element.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /ng-version=["']([^"']+)["']/i,
          interpretation: 'Explicit ng-version attribute declares Angular application bootstrap.',
          weight: 55,
        },
        {
          regex: /<app-root[\s>]/i,
          interpretation: 'Default Angular application root selector tag (<app-root>) found in markup.',
          weight: 40,
        },
      ],
      scripts: [
        {
          pattern: /@angular\/core/i,
          interpretation: 'Angular core distribution script bundle referenced in resources.',
          weight: 40,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'html',
        regex: /ng-version=["']([^"']+)["']/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
    conflictsWith: ['react', 'vuejs'],
  },
  {
    id: 'svelte',
    name: 'Svelte',
    slug: 'svelte',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'A cybernetically enhanced web framework that compiles components into efficient vanilla JS.',
    website: 'https://svelte.dev',
    indicators: {
      domMarkers: [
        {
          marker: 'svelte-* class',
          interpretation: 'Scoped CSS class signature svelte-[hash] detected on elements.',
          weight: 45,
        },
      ],
      html: [
        {
          regex: /class=["'][^"']*svelte-[a-z0-9]+/i,
          interpretation: 'Svelte compiler-generated scoped CSS class prefix present in DOM markup.',
          weight: 45,
        },
      ],
      scripts: [
        {
          pattern: /\/_app\/immutable\//i,
          interpretation: 'SvelteKit immutable chunk directory route structure (/_app/immutable/).',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /svelte(?:@|-)([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'astro',
    name: 'Astro',
    slug: 'astro',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'The web framework for content-driven websites with zero-JS by default.',
    website: 'https://astro.build',
    indicators: {
      domMarkers: [
        {
          marker: 'astro-island',
          interpretation: 'Astro interactive hydration component wrapper (<astro-island>) present.',
          weight: 55,
        },
      ],
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Astro/i,
          interpretation: 'Meta generator explicitly announces Astro build engine.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /data-astro-cid-[a-z0-9]+/i,
          interpretation: 'Astro scoped component identifier attribute (data-astro-cid-*) observed.',
          weight: 45,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'meta',
        regex: /Astro(?:\s+v?)([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'remix',
    name: 'Remix',
    slug: 'remix',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'A full stack web framework focused on web standards and modern UX.',
    website: 'https://remix.run',
    indicators: {
      html: [
        {
          regex: /window\.__remixContext/i,
          interpretation: 'Remix client hydration payload context (window.__remixContext) embedded in HTML.',
          weight: 55,
        },
        {
          regex: /window\.__remixRouteModules/i,
          interpretation: 'Remix route module registry object defined on window.',
          weight: 50,
        },
      ],
      scripts: [
        {
          pattern: /\/build\/entry\.client/i,
          interpretation: 'Standard Remix build output client entry bundle path.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'alpinejs',
    name: 'Alpine.js',
    slug: 'alpinejs',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'A rugged, minimal tool for composing behavior directly in your HTML markup.',
    website: 'https://alpinejs.dev',
    indicators: {
      html: [
        {
          regex: /x-data=["'][^"']*["']/i,
          interpretation: 'Alpine directive x-data component initialization observed in HTML tags.',
          weight: 45,
        },
        {
          regex: /x-init=["'][^"']*["']/i,
          interpretation: 'Alpine directive x-init lifecycle hook present on DOM nodes.',
          weight: 40,
        },
      ],
      scripts: [
        {
          pattern: /alpine(?:\.min)?\.js/i,
          interpretation: 'Alpine.js JavaScript runtime script included in document.',
          weight: 45,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /alpinejs@([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'htmx',
    name: 'htmx',
    slug: 'htmx',
    category: 'frontend_framework',
    categoryLabel: 'Frontend Framework',
    description: 'High power tools for HTML - access AJAX, WebSockets and Server Sent Events directly in HTML.',
    website: 'https://htmx.org',
    indicators: {
      html: [
        {
          regex: /hx-get=["'][^"']*["']/i,
          interpretation: 'htmx AJAX query attribute (hx-get) observed in HTML markup.',
          weight: 45,
        },
        {
          regex: /hx-post=["'][^"']*["']/i,
          interpretation: 'htmx AJAX mutation attribute (hx-post) observed in HTML markup.',
          weight: 45,
        },
        {
          regex: /hx-target=["'][^"']*["']/i,
          interpretation: 'htmx DOM swap target directive (hx-target) found.',
          weight: 40,
        },
      ],
      scripts: [
        {
          pattern: /htmx(?:\.min)?\.js/i,
          interpretation: 'htmx core JavaScript distribution script tag observed.',
          weight: 45,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /htmx\.org@([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },

  // ==========================================
  // 2. CONTENT MANAGEMENT SYSTEMS (CMS)
  // ==========================================
  {
    id: 'wordpress',
    name: 'WordPress',
    slug: 'wordpress',
    category: 'cms',
    categoryLabel: 'Content Management (CMS)',
    description: 'Open source publishing platform powering a large share of the web.',
    website: 'https://wordpress.org',
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /WordPress/i,
          interpretation: 'Meta generator tag explicitly identifies WordPress core installation.',
          weight: 55,
        },
      ],
      headers: [
        {
          name: 'x-pingback',
          valueRegex: /xmlrpc\.php/i,
          interpretation: 'Response header X-Pingback points to WordPress XML-RPC endpoint.',
          weight: 50,
        },
        {
          name: 'link',
          valueRegex: /wp-json/i,
          interpretation: 'Link header advertises WordPress REST API endpoint (/wp-json/).',
          weight: 40,
        },
      ],
      domMarkers: [
        {
          marker: 'wp-content/themes',
          interpretation: 'Theme assets served from canonical wp-content/themes hierarchy.',
          weight: 45,
        },
        {
          marker: 'wp-content/plugins',
          interpretation: 'Plugin assets served from canonical wp-content/plugins hierarchy.',
          weight: 45,
        },
        {
          marker: 'wp-includes',
          interpretation: 'WordPress core JavaScript/CSS served from /wp-includes/.',
          weight: 45,
        },
      ],
      html: [
        {
          regex: /wp-content\/themes/i,
          interpretation: 'HTML document references stylesheets or media inside /wp-content/themes/.',
          weight: 40,
        },
        {
          regex: /wp-content\/plugins/i,
          interpretation: 'HTML document references scripts inside /wp-content/plugins/.',
          weight: 40,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'meta',
        regex: /WordPress\s+([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
      {
        source: 'script',
        regex: /ver=([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'MAJOR_MINOR',
      },
    ],
    conflictsWith: ['shopify', 'webflow', 'drupal', 'joomla'],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    slug: 'shopify',
    category: 'cms',
    categoryLabel: 'Content Management (CMS)',
    description: 'Hosted multi-channel commerce platform and storefront engine.',
    website: 'https://shopify.com',
    indicators: {
      headers: [
        {
          name: 'x-shopid',
          interpretation: 'Proprietary X-ShopId header present in server response.',
          weight: 55,
        },
        {
          name: 'x-shopify-stage',
          interpretation: 'Response header indicates Shopify edge cluster routing stage.',
          weight: 50,
        },
      ],
      domMarkers: [
        {
          marker: 'cdn.shopify.com',
          interpretation: 'Page resources loaded directly from Shopify global edge CDN.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /cdn\.shopify\.com/i,
          interpretation: 'Observable references to cdn.shopify.com in page stylesheets or media.',
          weight: 45,
        },
        {
          regex: /Shopify\.theme/i,
          interpretation: 'Shopify theme runtime configuration object detected in document scope.',
          weight: 50,
        },
      ],
    },
    conflictsWith: ['wordpress', 'webflow'],
  },
  {
    id: 'webflow',
    name: 'Webflow',
    slug: 'webflow',
    category: 'cms',
    categoryLabel: 'Content Management (CMS)',
    description: 'Visual web design platform, CMS, and hosting service.',
    website: 'https://webflow.com',
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Webflow/i,
          interpretation: 'Meta generator tag explicitly identifies Webflow site export or hosting.',
          weight: 55,
        },
      ],
      domMarkers: [
        {
          marker: 'data-wf-page/site (Webflow)',
          interpretation: 'Found Webflow tracking attributes data-wf-page or data-wf-site.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /assets\.webflow\.com/i,
          interpretation: 'Observable asset resources linked to assets.webflow.com CDN.',
          weight: 45,
        },
      ],
    },
    conflictsWith: ['wordpress', 'shopify'],
  },
  {
    id: 'drupal',
    name: 'Drupal',
    slug: 'drupal',
    category: 'cms',
    categoryLabel: 'Content Management (CMS)',
    description: 'Enterprise open source digital experience and content management framework.',
    website: 'https://drupal.org',
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Drupal/i,
          interpretation: 'Meta generator tag identifies Drupal content engine.',
          weight: 55,
        },
      ],
      headers: [
        {
          name: 'x-generator',
          valueRegex: /Drupal/i,
          interpretation: 'Response header X-Generator reports Drupal.',
          weight: 55,
        },
        {
          name: 'x-drupal-cache',
          interpretation: 'Response header X-Drupal-Cache discloses Drupal caching subsystem.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /Drupal\.settings/i,
          interpretation: 'Drupal global settings JS dictionary object identified in HTML.',
          weight: 45,
        },
        {
          regex: /sites\/default\/files/i,
          interpretation: 'Canonical Drupal file storage directory path observed in media links.',
          weight: 35,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'meta',
        regex: /Drupal\s+([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
    conflictsWith: ['wordpress', 'joomla'],
  },
  {
    id: 'joomla',
    name: 'Joomla!',
    slug: 'joomla',
    category: 'cms',
    categoryLabel: 'Content Management (CMS)',
    description: 'Open source content management system for web publishing.',
    website: 'https://joomla.org',
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Joomla!/i,
          interpretation: 'Meta generator indicates Joomla! installation.',
          weight: 55,
        },
      ],
      headers: [
        {
          name: 'x-content-encoded-by',
          valueRegex: /Joomla!/i,
          interpretation: 'Response header reports Joomla encoding.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /\/media\/system\/js\/core\.js/i,
          interpretation: 'Standard Joomla core JavaScript utility script referenced.',
          weight: 45,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'meta',
        regex: /Joomla!\s+([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
    conflictsWith: ['wordpress', 'drupal'],
  },
  {
    id: 'ghost',
    name: 'Ghost',
    slug: 'ghost',
    category: 'cms',
    categoryLabel: 'Content Management (CMS)',
    description: 'Professional open source publishing platform built on Node.js.',
    website: 'https://ghost.org',
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Ghost/i,
          interpretation: 'Meta generator tag explicitly announces Ghost publishing engine.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /ghost-search|ghost-portal/i,
          interpretation: 'Ghost client-side search or membership portal markers found in HTML.',
          weight: 45,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'meta',
        regex: /Ghost\s+([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    slug: 'squarespace',
    category: 'cms',
    categoryLabel: 'Content Management (CMS)',
    description: 'All-in-one website building and hosting platform.',
    website: 'https://squarespace.com',
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Squarespace/i,
          interpretation: 'Meta generator tag declares Squarespace platform.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /static1\.squarespace\.com/i,
          interpretation: 'Resource assets linked to Squarespace asset CDN.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'wix',
    name: 'Wix',
    slug: 'wix',
    category: 'cms',
    categoryLabel: 'Content Management (CMS)',
    description: 'Cloud-based web development platform.',
    website: 'https://wix.com',
    indicators: {
      meta: [
        {
          nameOrPropRegex: /generator/i,
          contentRegex: /Wix\.com/i,
          interpretation: 'Meta generator declares Wix.com Website Builder.',
          weight: 55,
        },
      ],
      headers: [
        {
          name: 'x-wix-request-id',
          interpretation: 'Response header discloses Wix gateway request ID.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /static\.parastorage\.com/i,
          interpretation: 'Observable resource links to Wix Parastorage CDN infrastructure.',
          weight: 50,
        },
      ],
    },
  },

  // ==========================================
  // 3. JAVASCRIPT LIBRARIES
  // ==========================================
  {
    id: 'jquery',
    name: 'jQuery',
    slug: 'jquery',
    category: 'javascript_library',
    categoryLabel: 'JavaScript Libraries',
    description: 'Fast, small, and feature-rich JavaScript DOM manipulation library.',
    website: 'https://jquery.com',
    indicators: {
      scripts: [
        {
          pattern: /jquery(?:-([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: 'Observable script tag loads jQuery library distribution file.',
          weight: 50,
        },
        {
          pattern: /jquery@([0-9.]+)/i,
          interpretation: 'CDN package import pattern specifies jQuery dependency version.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /window\.jQuery|jQuery\.fn\.jquery/i,
          interpretation: 'Direct reference to jQuery global instance in document scripts.',
          weight: 40,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /jquery[/-]([0-9.]+)(?:\.min)?\.js/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
      {
        source: 'script',
        regex: /jquery@([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'lodash',
    name: 'Lodash',
    slug: 'lodash',
    category: 'javascript_library',
    categoryLabel: 'JavaScript Libraries',
    description: 'A modern JavaScript utility library delivering modularity and performance.',
    website: 'https://lodash.com',
    indicators: {
      scripts: [
        {
          pattern: /lodash(?:-([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: 'Script tag references Lodash utility distribution file.',
          weight: 50,
        },
        {
          pattern: /lodash@([0-9.]+)/i,
          interpretation: 'Package URL pattern specifies Lodash version.',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /lodash[/-]([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'axios',
    name: 'Axios',
    slug: 'axios',
    category: 'javascript_library',
    categoryLabel: 'JavaScript Libraries',
    description: 'Promise based HTTP client for the browser and node.js.',
    website: 'https://axios-http.com',
    indicators: {
      scripts: [
        {
          pattern: /axios(?:@([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: 'Observable script tag loads Axios HTTP client library.',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /axios@([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'momentjs',
    name: 'Moment.js',
    slug: 'momentjs',
    category: 'javascript_library',
    categoryLabel: 'JavaScript Libraries',
    description: 'Parse, validate, manipulate, and display dates and times in JavaScript.',
    website: 'https://momentjs.com',
    indicators: {
      scripts: [
        {
          pattern: /moment(?:-([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: 'Script resource loads Moment.js date handling library.',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /moment[/-]([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'swiper',
    name: 'Swiper',
    slug: 'swiper',
    category: 'javascript_library',
    categoryLabel: 'JavaScript Libraries',
    description: 'Modern mobile touch slider with hardware accelerated transitions.',
    website: 'https://swiperjs.com',
    indicators: {
      scripts: [
        {
          pattern: /swiper(?:-bundle)?(?:\.min)?\.js/i,
          interpretation: 'Observable Swiper slider script resource loaded.',
          weight: 45,
        },
      ],
      stylesheets: [
        {
          pattern: /swiper(?:-bundle)?(?:\.min)?\.css/i,
          interpretation: 'Swiper CSS stylesheet link referenced.',
          weight: 40,
        },
      ],
      html: [
        {
          regex: /class=["'][^"']*swiper-(?:container|wrapper|slide)/i,
          interpretation: 'Swiper slider markup classes detected in HTML elements.',
          weight: 40,
        },
      ],
    },
  },
  {
    id: 'd3',
    name: 'D3.js',
    slug: 'd3',
    category: 'javascript_library',
    categoryLabel: 'JavaScript Libraries',
    description: 'JavaScript library for bespoke data visualization and document manipulation.',
    website: 'https://d3js.org',
    indicators: {
      scripts: [
        {
          pattern: /d3(?:\.v([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: 'Script resource loads D3.js visualization library.',
          weight: 50,
        },
        {
          pattern: /d3@([0-9.]+)/i,
          interpretation: 'Package URL references D3 versioned distribution.',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'script',
        regex: /d3(?:\.v|@)([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },

  // ==========================================
  // 4. CSS / UI TECHNOLOGIES
  // ==========================================
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    slug: 'tailwindcss',
    category: 'css_ui',
    categoryLabel: 'CSS Framework',
    description: 'A utility-first CSS framework packed with classes that can be composed directly in markup.',
    website: 'https://tailwindcss.com',
    indicators: {
      domMarkers: [
        {
          marker: 'tailwindcss-custom-properties',
          interpretation: 'Tailwind CSS engine custom properties (--tw-*) detected in document styles.',
          weight: 60,
        },
      ],
      scripts: [
        {
          pattern: /cdn\.tailwindcss\.com/i,
          interpretation: 'Tailwind Play CDN standalone script referenced in document head.',
          weight: 60,
        },
        {
          pattern: /tailwindcss/i,
          interpretation: 'Script URL references Tailwind CSS library.',
          weight: 45,
        },
      ],
      stylesheets: [
        {
          pattern: /tailwind(?:\.min)?\.css/i,
          interpretation: 'External stylesheet URL named tailwind.css observed.',
          weight: 55,
        },
        {
          pattern: /tailwindcss/i,
          interpretation: 'Stylesheet URL references Tailwind CSS.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /--tw-(?:ring|shadow|border|translate|rotate|skew|scale|space|text|bg|gradient|blur)/i,
          interpretation: 'Tailwind CSS custom variable properties (--tw-*) present in embedded style blocks or markup.',
          weight: 60,
        },
        {
          regex: /\/\*! tailwindcss v([0-9.]+)/i,
          interpretation: 'Compiled stylesheet header with Tailwind CSS version signature detected.',
          weight: 65,
        },
        {
          regex: /class=["'][^"']*(?:(?:flex|grid|inline-flex)\s+(?:items-|justify-|gap-|space-[xy]-)|(?:p|m)[xytb]?-[0-9]+\s+(?:flex|grid|w-|text-)|(?:text|bg)-(?:gray|slate|zinc|neutral|stone|blue|red|green|emerald|indigo|amber|purple|pink|rose|yellow)-[0-9]{2,3}|(?:hover|focus|sm|md|lg|xl|dark):[a-z0-9-]+)/i,
          interpretation: 'Distinctive multi-class Tailwind utility composition pattern observed in DOM elements.',
          weight: 40,
        },
        {
          regex: /class=["'][^"']*(?:grid-cols-[1-9]|max-w-(?:xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)|rounded-(?:sm|md|lg|xl|2xl|3xl|full)|shadow-(?:sm|md|lg|xl|2xl|inner))/i,
          interpretation: 'Tailwind specific scale tokens (max-w-*, grid-cols-*, rounded-*) present in class attributes.',
          weight: 35,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'html',
        regex: /\/\*! tailwindcss v([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
      {
        source: 'link',
        regex: /tailwindcss[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
      {
        source: 'script',
        regex: /tailwindcss[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    slug: 'bootstrap',
    category: 'css_ui',
    categoryLabel: 'CSS Framework',
    description: 'Responsive frontend component library for building modern responsive web apps.',
    website: 'https://getbootstrap.com',
    indicators: {
      domMarkers: [
        {
          marker: 'bootstrap-custom-properties',
          interpretation: 'Bootstrap CSS custom variable properties (--bs-*) detected in document.',
          weight: 55,
        },
        {
          marker: 'bootstrap-classes',
          interpretation: 'Bootstrap standard responsive layout and navigation classes detected.',
          weight: 45,
        },
      ],
      stylesheets: [
        {
          pattern: /bootstrap(?:-([0-9.]+))?(?:\.min)?\.css/i,
          interpretation: 'Stylesheet link references Bootstrap CSS distribution.',
          weight: 50,
        },
        {
          pattern: /bootstrap@([0-9.]+)/i,
          interpretation: 'CDN stylesheet import specifies Bootstrap version.',
          weight: 50,
        },
      ],
      scripts: [
        {
          pattern: /bootstrap(?:\.bundle)?(?:-([0-9.]+))?(?:\.min)?\.js/i,
          interpretation: 'Script tag references Bootstrap JavaScript bundle.',
          weight: 45,
        },
      ],
      html: [
        {
          regex: /--bs-(?:primary|secondary|success|info|warning|danger|light|dark|body|gutter|font)/i,
          interpretation: 'Bootstrap CSS custom variables (--bs-*) present in stylesheets or markup.',
          weight: 55,
        },
        {
          regex: /data-bs-(?:toggle|target|dismiss|slide|ride)=/i,
          interpretation: 'Bootstrap 5 data-bs-* JavaScript interactive attributes detected on elements.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:container-fluid|navbar-brand|col-(?:sm|md|lg)-[0-9]|btn-(?:primary|secondary|outline)|form-control)/i,
          interpretation: 'Standard Bootstrap grid and button utility class composition detected in HTML markup.',
          weight: 40,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'html',
        regex: /\/\*! Bootstrap v([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
      {
        source: 'link',
        regex: /bootstrap[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
      {
        source: 'script',
        regex: /bootstrap[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'material_ui',
    name: 'Material UI (MUI)',
    slug: 'material-ui',
    category: 'css_ui',
    categoryLabel: 'UI Component Library',
    description: 'React component library implementing Google Material Design guidelines.',
    website: 'https://mui.com',
    indicators: {
      html: [
        {
          regex: /class=["'][^"']*MuiButton-root/i,
          interpretation: 'Observable MuiButton-root component styling class marker present.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*MuiTypography-root/i,
          interpretation: 'Observable MuiTypography-root typography class marker present.',
          weight: 45,
        },
        {
          regex: /class=["'][^"']*MuiBox-root/i,
          interpretation: 'Observable MuiBox-root layout component class present.',
          weight: 45,
        },
        {
          regex: /class=["'][^"']*MuiGrid-root/i,
          interpretation: 'Observable MuiGrid-root layout component class present.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'chakra_ui',
    name: 'Chakra UI',
    slug: 'chakra-ui',
    category: 'css_ui',
    categoryLabel: 'UI Component Library',
    description: 'Simple, modular and accessible component library that gives building blocks for React applications.',
    website: 'https://chakra-ui.com',
    indicators: {
      html: [
        {
          regex: /class=["'][^"']*(?:chakra-button|chakra-stack|chakra-portal|chakra-container)/i,
          interpretation: 'Chakra UI component class markers observed in DOM elements.',
          weight: 55,
        },
        {
          regex: /--chakra-(?:colors|space|fontSizes|radii)/i,
          interpretation: 'Chakra UI theme CSS custom properties (--chakra-*) detected in document.',
          weight: 60,
        },
      ],
    },
  },
  {
    id: 'ant_design',
    name: 'Ant Design',
    slug: 'ant-design',
    category: 'css_ui',
    categoryLabel: 'UI Component Library',
    description: 'An enterprise-class UI design language and React UI library.',
    website: 'https://ant.design',
    indicators: {
      stylesheets: [
        {
          pattern: /antd(?:\.min)?\.css/i,
          interpretation: 'Stylesheet link references Ant Design CSS package.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /class=["'][^"']*(?:ant-btn|ant-layout|ant-menu|ant-row|ant-col|ant-form)/i,
          interpretation: 'Ant Design prefix classes (ant-*) observed in HTML markup.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'shadcn_ui',
    name: 'Shadcn UI / Radix UI',
    slug: 'shadcn-ui',
    category: 'css_ui',
    categoryLabel: 'UI Component Library',
    description: 'Accessible, unstyled UI primitives paired with Tailwind CSS styling.',
    website: 'https://ui.shadcn.com',
    indicators: {
      html: [
        {
          regex: /data-radix-[a-z-]+/i,
          interpretation: 'Radix UI primitive element attributes (data-radix-*) detected in DOM markup.',
          weight: 55,
        },
        {
          regex: /data-state=["'](?:open|closed|checked|unchecked|active)["'][^>]*data-orientation=/i,
          interpretation: 'Radix UI state and orientation interactive attributes present on components.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'styled_components',
    name: 'Styled Components',
    slug: 'styled-components',
    category: 'css_ui',
    categoryLabel: 'CSS-in-JS',
    description: 'Visual primitives for the component age, allowing actual CSS in JavaScript code.',
    website: 'https://styled-components.com',
    indicators: {
      html: [
        {
          regex: /data-styled(?:-version)?=["']/i,
          interpretation: 'Styled Components runtime style injector attribute (data-styled) detected in DOM.',
          weight: 60,
        },
        {
          regex: /class=["'][^"']*\bsc-[a-zA-Z0-9]+-[0-9]+\b/i,
          interpretation: 'Styled Components generated class hash pattern (sc-*) observed on elements.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'fontawesome',
    name: 'Font Awesome',
    slug: 'fontawesome',
    category: 'css_ui',
    categoryLabel: 'Icon Toolkit',
    description: 'The web iconic font and vector icon toolkit.',
    website: 'https://fontawesome.com',
    indicators: {
      stylesheets: [
        {
          pattern: /font-awesome(?:\.min)?\.css/i,
          interpretation: 'Stylesheet link specifies Font Awesome CSS.',
          weight: 50,
        },
        {
          pattern: /fontawesome(?:\.min)?\.css/i,
          interpretation: 'External stylesheet URL contains fontawesome.',
          weight: 50,
        },
      ],
      scripts: [
        {
          pattern: /fontawesome(?:\.min)?\.js/i,
          interpretation: 'Script tag references Font Awesome SVG JavaScript bundle.',
          weight: 45,
        },
      ],
      html: [
        {
          regex: /class=["'][^"']*(?:fa-solid|fa-regular|fa-brands|fas\s+fa-|far\s+fa-|fab\s+fa-)/i,
          interpretation: 'Font Awesome icon class markup observed in inline tags.',
          weight: 40,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'link',
        regex: /font-awesome[/-@]([0-9.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'bulma',
    name: 'Bulma',
    slug: 'bulma',
    category: 'css_ui',
    categoryLabel: 'CSS Framework',
    description: 'Free, open source CSS framework based on Flexbox.',
    website: 'https://bulma.io',
    indicators: {
      stylesheets: [
        {
          pattern: /bulma(?:\.min)?\.css/i,
          interpretation: 'Stylesheet link references Bulma CSS framework.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /class=["'][^"']*(?:is-primary|navbar-item|hero-body|columns\s+is-multiline)/i,
          interpretation: 'Bulma class nomenclature observed in DOM elements.',
          weight: 40,
        },
      ],
    },
  },
  {
    id: 'foundation',
    name: 'Foundation',
    slug: 'foundation',
    category: 'css_ui',
    categoryLabel: 'CSS Framework',
    description: 'Advanced responsive front-end framework for any device, medium, and accessibility level.',
    website: 'https://get.foundation',
    indicators: {
      stylesheets: [
        {
          pattern: /foundation(?:\.min)?\.css/i,
          interpretation: 'Stylesheet link references Foundation CSS distribution.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /class=["'][^"']*(?:top-bar|grid-x|cell\s+(?:small|medium|large)-[0-9])/i,
          interpretation: 'Foundation XY Grid and top-bar navigation class composition detected in HTML.',
          weight: 45,
        },
      ],
    },
  },

  // ==========================================
  // 5. ANALYTICS
  // ==========================================
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    slug: 'google-analytics',
    category: 'analytics',
    categoryLabel: 'Analytics',
    description: 'Digital analytics platform providing detailed audience insights and event tracking.',
    website: 'https://analytics.google.com',
    indicators: {
      scripts: [
        {
          pattern: /googletagmanager\.com\/gtag\/js\?id=(?:G-|UA-)/i,
          interpretation: 'Script tag loads Google Global Site Tag (gtag.js) tracking client.',
          weight: 55,
        },
        {
          pattern: /google-analytics\.com\/analytics\.js/i,
          interpretation: 'Script loads legacy Universal Analytics library (analytics.js).',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /gtag\('config',\s*['"](G-[A-Z0-9]+|UA-[0-9]+-[0-9]+)['"]\)/i,
          interpretation: 'Inline tracking script initiates Google Analytics measurement configuration.',
          weight: 50,
        },
        {
          regex: /ga\('create',\s*['"](UA-[0-9]+-[0-9]+)['"]/i,
          interpretation: 'Universal Analytics tracker creation observed in document script.',
          weight: 50,
        },
      ],
      cookies: [
        {
          nameRegex: /^_ga(?:_[A-Z0-9]+)?$/i,
          interpretation: 'Standard Google Analytics client session cookie (_ga) set by host.',
          weight: 40,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'html',
        regex: /gtag\('config',\s*['"](G-[A-Z0-9]+)['"]\)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'google_tag_manager',
    name: 'Google Tag Manager',
    slug: 'google-tag-manager',
    category: 'analytics',
    categoryLabel: 'Analytics',
    description: 'Tag management system that allows updating measurement codes and tracking tags.',
    website: 'https://tagmanager.google.com',
    indicators: {
      scripts: [
        {
          pattern: /googletagmanager\.com\/gtm\.js\?id=GTM-[A-Z0-9]+/i,
          interpretation: 'Script loads Google Tag Manager container bundle (GTM-*).',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /gtm\.start/i,
          interpretation: 'GTM dataLayer initialization snippet observed in document body.',
          weight: 45,
        },
        {
          regex: /googletagmanager\.com\/ns\.html\?id=(GTM-[A-Z0-9]+)/i,
          interpretation: 'GTM noscript fallback iframe container located in HTML markup.',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'html',
        regex: /id=(GTM-[A-Z0-9]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel',
    slug: 'meta-pixel',
    category: 'analytics',
    categoryLabel: 'Analytics',
    description: 'Conversion tracking pixel for Meta (Facebook & Instagram) ad campaigns.',
    website: 'https://business.facebook.com',
    indicators: {
      scripts: [
        {
          pattern: /connect\.facebook\.net\/(?:[a-zA-Z_]+)\/fbevents\.js/i,
          interpretation: 'Script tag loads Meta Pixel event measurement library (fbevents.js).',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /fbq\('init',\s*['"]([0-9]+)['"]\)/i,
          interpretation: 'Inline script calls Meta Pixel initialization (fbq) with dataset ID.',
          weight: 50,
        },
      ],
      cookies: [
        {
          nameRegex: /^_fbp$/i,
          interpretation: 'Browser cookie _fbp set to identify Meta advertisement click attribution.',
          weight: 40,
        },
      ],
    },
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    slug: 'hotjar',
    category: 'analytics',
    categoryLabel: 'Analytics',
    description: 'Behavior analytics and user feedback service with session recordings and heatmaps.',
    website: 'https://hotjar.com',
    indicators: {
      scripts: [
        {
          pattern: /static\.hotjar\.com\/c\/hotjar-([0-9]+)\.js/i,
          interpretation: 'Script tag loads Hotjar tracking client package.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /_hjSettings/i,
          interpretation: 'Hotjar configuration object (_hjSettings) identified in document scope.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'plausible',
    name: 'Plausible Analytics',
    slug: 'plausible',
    category: 'analytics',
    categoryLabel: 'Analytics',
    description: 'Lightweight and open-source web analytics with no cookies and full GDPR compliance.',
    website: 'https://plausible.io',
    indicators: {
      scripts: [
        {
          pattern: /plausible\.io\/js\/(?:script|plausible)\.js/i,
          interpretation: 'Script loads Plausible lightweight privacy-friendly analytics tracker.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'segment',
    name: 'Segment',
    slug: 'segment',
    category: 'analytics',
    categoryLabel: 'Analytics',
    description: 'Customer data platform (CDP) routing telemetry events to multiple downstream services.',
    website: 'https://segment.com',
    indicators: {
      scripts: [
        {
          pattern: /cdn\.segment\.com\/analytics\.js/i,
          interpretation: 'Script tag loads Segment analytics.js tracking multiplexer.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /analytics\.load\(/i,
          interpretation: 'Segment initialization snippet analytics.load() present in page code.',
          weight: 45,
        },
      ],
    },
  },

  // ==========================================
  // 6. ADVERTISING
  // ==========================================
  {
    id: 'google_adsense',
    name: 'Google AdSense',
    slug: 'google-adsense',
    category: 'advertising',
    categoryLabel: 'Advertising',
    description: 'Programmatic advertising platform monetizing public websites through banner displays.',
    website: 'https://adsense.google.com',
    indicators: {
      scripts: [
        {
          pattern: /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i,
          interpretation: 'Script loads Google AdSense client runtime script (adsbygoogle.js).',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /class=["'][^"']*adsbygoogle/i,
          interpretation: 'HTML contains adsbygoogle class banner insertion slot.',
          weight: 45,
        },
        {
          regex: /data-ad-client=["']ca-pub-[0-9]+["']/i,
          interpretation: 'AdSense publisher account identifier (ca-pub-*) defined on ad element.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'amazon_advertising',
    name: 'Amazon Advertising',
    slug: 'amazon-advertising',
    category: 'advertising',
    categoryLabel: 'Advertising',
    description: 'Amazon Publisher Services header bidding and monetization platform.',
    website: 'https://advertising.amazon.com',
    indicators: {
      scripts: [
        {
          pattern: /c\.amazon-adsystem\.com\/aax2\/apstag\.js/i,
          interpretation: 'Script loads Amazon Publisher Services header bidding library (apstag.js).',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /apstag\.init/i,
          interpretation: 'Amazon apstag.init configuration present in document script.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'criteo',
    name: 'Criteo',
    slug: 'criteo',
    category: 'advertising',
    categoryLabel: 'Advertising',
    description: 'Commerce media platform providing personalized retargeting ad campaigns.',
    website: 'https://criteo.com',
    indicators: {
      scripts: [
        {
          pattern: /static\.criteo\.net\/js\/ld\/ld\.js/i,
          interpretation: 'Script loads Criteo event tag library (ld.js).',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'taboola',
    name: 'Taboola',
    slug: 'taboola',
    category: 'advertising',
    categoryLabel: 'Advertising',
    description: 'Content discovery and native advertising network platform.',
    website: 'https://taboola.com',
    indicators: {
      scripts: [
        {
          pattern: /cdn\.taboola\.com\/libtrc\//i,
          interpretation: 'Script loads Taboola native advertising discovery widget (libtrc).',
          weight: 55,
        },
      ],
    },
  },

  // ==========================================
  // 7. PAYMENT & CHECKOUT ACCEPTANCE
  // ==========================================
  {
    id: 'visa',
    name: 'Visa',
    slug: 'visa',
    category: 'payment',
    categoryLabel: 'Payment Acceptance (Card Network)',
    description: 'Visa global card payment network accepted by merchant for credit, debit, and prepaid checkout.',
    website: 'https://visa.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-card:visa',
          interpretation: 'Verified Visa card payment acceptance badge observed in document.',
          weight: 60,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?visa["']/i,
          interpretation: 'Accessible payment element explicitly designates Visa card acceptance.',
          weight: 55,
        },
        {
          regex: /alt=["'](?:pay with )?visa(?: payment| card| logo)?["']/i,
          interpretation: 'Payment badge image alt text specifies Visa card support.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--visa|icon-visa|icon--visa|fa-cc-visa|svg-icon-visa|badge--visa|payment-badge-visa)/i,
          interpretation: 'DOM markup includes distinctive Visa payment icon class identifier.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-visa|visa-icon|svg-visa|pi-visa)["']/i,
          interpretation: 'SVG or icon container element ID designates Visa payment method.',
          weight: 50,
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Visa<\/title>/i,
          interpretation: 'Inline vector graphics title explicitly identifies Visa payment method.',
          weight: 55,
        },
        {
          regex: /"paymentaccepted"[^}]*visa/i,
          interpretation: 'Schema.org structured metadata advertises Visa card acceptance.',
          weight: 60,
        },
        {
          regex: /"accepted_payment_methods"[^}]*visa/i,
          interpretation: 'Storefront payment gateway configuration specifies Visa card processing.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    slug: 'mastercard',
    category: 'payment',
    categoryLabel: 'Payment Acceptance (Card Network)',
    description: 'Mastercard global payment network accepted by merchant for credit, debit, and Maestro checkout.',
    website: 'https://mastercard.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-card:mastercard',
          interpretation: 'Verified Mastercard payment acceptance badge observed in document.',
          weight: 60,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?mastercard["']/i,
          interpretation: 'Accessible payment element explicitly designates Mastercard card acceptance.',
          weight: 55,
        },
        {
          regex: /alt=["'](?:pay with )?mastercard(?: payment| card| logo)?["']/i,
          interpretation: 'Payment badge image alt text specifies Mastercard card support.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--mastercard|icon-mastercard|icon--mastercard|fa-cc-mastercard|svg-icon-mastercard|badge--mastercard|payment-badge-mastercard)/i,
          interpretation: 'DOM markup includes distinctive Mastercard payment icon class identifier.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-mastercard|mastercard-icon|svg-mastercard|pi-master|pi-mastercard)["']/i,
          interpretation: 'SVG or icon container element ID designates Mastercard payment method.',
          weight: 50,
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Mastercard<\/title>/i,
          interpretation: 'Inline vector graphics title explicitly identifies Mastercard payment method.',
          weight: 55,
        },
        {
          regex: /"paymentaccepted"[^}]*mastercard/i,
          interpretation: 'Schema.org structured metadata advertises Mastercard card acceptance.',
          weight: 60,
        },
        {
          regex: /"accepted_payment_methods"[^}]*mastercard/i,
          interpretation: 'Storefront payment gateway configuration specifies Mastercard card processing.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'amex',
    name: 'American Express (Amex)',
    slug: 'american-express',
    category: 'payment',
    categoryLabel: 'Payment Acceptance (Card Network)',
    description: 'American Express credit and charge card payment network accepted by merchant.',
    website: 'https://americanexpress.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-card:amex',
          interpretation: 'Verified American Express payment acceptance badge observed in document.',
          weight: 60,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?(?:american express|amex)["']/i,
          interpretation: 'Accessible payment element explicitly designates American Express card acceptance.',
          weight: 55,
        },
        {
          regex: /alt=["'](?:pay with )?(?:american express|amex)(?: payment| card| logo)?["']/i,
          interpretation: 'Payment badge image alt text specifies American Express card support.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--american_express|payment-icon--amex|icon-amex|icon--amex|fa-cc-amex|svg-icon-amex|badge--amex)/i,
          interpretation: 'DOM markup includes distinctive American Express payment icon class identifier.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-american_express|icon-amex|amex-icon|svg-amex|pi-american_express|pi-amex)["']/i,
          interpretation: 'SVG or icon container element ID designates American Express payment method.',
          weight: 50,
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>(?:American Express|Amex)<\/title>/i,
          interpretation: 'Inline vector graphics title explicitly identifies American Express payment method.',
          weight: 55,
        },
        {
          regex: /"paymentaccepted"[^}]*(?:american express|amex)/i,
          interpretation: 'Schema.org structured metadata advertises American Express card acceptance.',
          weight: 60,
        },
      ],
    },
  },
  {
    id: 'discover',
    name: 'Discover',
    slug: 'discover',
    category: 'payment',
    categoryLabel: 'Payment Acceptance (Card Network)',
    description: 'Discover financial network card payment acceptance for online checkout.',
    website: 'https://discover.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-card:discover',
          interpretation: 'Verified Discover payment acceptance badge observed in document.',
          weight: 60,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?discover["']/i,
          interpretation: 'Accessible payment element explicitly designates Discover card acceptance.',
          weight: 55,
        },
        {
          regex: /alt=["'](?:pay with )?discover(?: card| logo)?["']/i,
          interpretation: 'Payment badge image alt text specifies Discover card support.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--discover|icon-discover|icon--discover|fa-cc-discover|svg-icon-discover)/i,
          interpretation: 'DOM markup includes distinctive Discover payment icon class identifier.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-discover|discover-icon|svg-discover|pi-discover)["']/i,
          interpretation: 'SVG or icon container element ID designates Discover payment method.',
          weight: 50,
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Discover<\/title>/i,
          interpretation: 'Inline vector graphics title explicitly identifies Discover payment method.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'diners_club',
    name: 'Diners Club',
    slug: 'diners-club',
    category: 'payment',
    categoryLabel: 'Payment Acceptance (Card Network)',
    description: 'Diners Club International charge card network acceptance.',
    website: 'https://dinersclub.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-card:diners_club',
          interpretation: 'Diners Club card acceptance marker detected.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?diners club["']/i,
          interpretation: 'Diners Club card acceptance designated in DOM.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--diners_club|icon-diners|fa-cc-diners-club)/i,
          interpretation: 'Diners Club icon class identifier observed.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-diners_club|pi-diners_club)["']/i,
          interpretation: 'Diners Club icon element ID observed.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'jcb',
    name: 'JCB',
    slug: 'jcb',
    category: 'payment',
    categoryLabel: 'Payment Acceptance (Card Network)',
    description: 'Japan Credit Bureau (JCB) international card payment network acceptance.',
    website: 'https://global.jcb/en/',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-card:jcb',
          interpretation: 'JCB card acceptance marker detected.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?jcb["']/i,
          interpretation: 'JCB card acceptance designated in DOM.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--jcb|icon-jcb|fa-cc-jcb)/i,
          interpretation: 'JCB icon class identifier observed.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-jcb|pi-jcb)["']/i,
          interpretation: 'JCB icon element ID observed.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'unionpay',
    name: 'UnionPay',
    slug: 'unionpay',
    category: 'payment',
    categoryLabel: 'Payment Acceptance (Card Network)',
    description: 'China UnionPay global bankcard payment network acceptance.',
    website: 'https://unionpayintl.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-card:unionpay',
          interpretation: 'UnionPay card acceptance marker detected.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?(?:unionpay|union pay)["']/i,
          interpretation: 'UnionPay card acceptance designated in DOM.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--unionpay|icon-unionpay)/i,
          interpretation: 'UnionPay icon class identifier observed.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-unionpay|pi-unionpay)["']/i,
          interpretation: 'UnionPay icon element ID observed.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'maestro',
    name: 'Maestro',
    slug: 'maestro',
    category: 'payment',
    categoryLabel: 'Payment Acceptance (Card Network)',
    description: 'Mastercard Maestro international debit card payment network acceptance.',
    website: 'https://mastercard.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-card:maestro',
          interpretation: 'Maestro debit card acceptance marker detected.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?maestro["']/i,
          interpretation: 'Maestro debit card acceptance designated in DOM.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--maestro|icon-maestro|fa-cc-maestro)/i,
          interpretation: 'Maestro icon class identifier observed.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-maestro|pi-maestro)["']/i,
          interpretation: 'Maestro icon element ID observed.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    slug: 'apple-pay',
    category: 'payment',
    categoryLabel: 'Digital Wallet & Payments',
    description: 'Apple Pay contactless mobile payment and one-touch digital wallet checkout.',
    website: 'https://apple.com/apple-pay/',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-wallet:apple_pay',
          interpretation: 'Verified Apple Pay digital wallet checkout element observed.',
          weight: 60,
        },
        {
          marker: 'apple-pay-button',
          interpretation: 'Apple Pay dedicated checkout button element found in DOM.',
          weight: 55,
        },
      ],
      scripts: [
        {
          pattern: /apple-pay-sdk\.js|applepay\.cdn-apple\.com|applepay/i,
          interpretation: 'Document loads Apple Pay JavaScript SDK client.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?apple pay["']/i,
          interpretation: 'Accessible payment element explicitly designates Apple Pay checkout.',
          weight: 55,
        },
        {
          regex: /alt=["'](?:pay with )?apple pay(?: logo)?["']/i,
          interpretation: 'Payment badge image alt text specifies Apple Pay.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:apple-pay-button|payment-icon--apple_pay|icon-apple-pay|fa-cc-apple-pay)/i,
          interpretation: 'DOM markup includes Apple Pay button or badge classes.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-apple_pay|apple-pay-button|pi-apple_pay)["']/i,
          interpretation: 'Icon container element ID designates Apple Pay.',
          weight: 50,
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Apple Pay<\/title>/i,
          interpretation: 'Vector graphics title designates Apple Pay.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    slug: 'google-pay',
    category: 'payment',
    categoryLabel: 'Digital Wallet & Payments',
    description: 'Google Pay online checkout and contactless wallet integration.',
    website: 'https://pay.google.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-wallet:google_pay',
          interpretation: 'Verified Google Pay digital wallet checkout element observed.',
          weight: 60,
        },
        {
          marker: 'google-pay-button',
          interpretation: 'Google Pay dedicated checkout button element found in DOM.',
          weight: 55,
        },
      ],
      scripts: [
        {
          pattern: /pay\.google\.com\/gp\/p\/js\/pay\.js/i,
          interpretation: 'Document loads Google Pay JavaScript SDK client.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?google pay["']/i,
          interpretation: 'Accessible payment element explicitly designates Google Pay checkout.',
          weight: 55,
        },
        {
          regex: /alt=["'](?:pay with )?google pay(?: logo)?["']/i,
          interpretation: 'Payment badge image alt text specifies Google Pay.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:google-pay-button|payment-icon--google_pay|icon-google-pay)/i,
          interpretation: 'DOM markup includes Google Pay button or badge classes.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-google_pay|google-pay-button|pi-google_pay)["']/i,
          interpretation: 'Icon container element ID designates Google Pay.',
          weight: 50,
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Google Pay<\/title>/i,
          interpretation: 'Vector graphics title designates Google Pay.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'shop_pay',
    name: 'Shop Pay',
    slug: 'shop-pay',
    category: 'payment',
    categoryLabel: 'Payment Platform',
    description: 'Shopify accelerated one-tap checkout and installment payment service.',
    website: 'https://shoppay.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-platform:shop_pay',
          interpretation: 'Verified Shop Pay accelerated checkout element observed in document.',
          weight: 60,
        },
        {
          marker: 'shopify-payment-button',
          interpretation: 'Shopify dynamic checkout button element found in DOM.',
          weight: 55,
        },
      ],
      scripts: [
        {
          pattern: /cdn\.shopify\.com\/shopifycloud\/shopify_pay\//i,
          interpretation: 'Document loads Shopify Pay accelerated checkout client script.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?(?:shop pay|shopify pay)["']/i,
          interpretation: 'Accessible payment element explicitly designates Shop Pay checkout.',
          weight: 55,
        },
        {
          regex: /alt=["'](?:pay with )?(?:shop pay|shopify pay)(?: logo)?["']/i,
          interpretation: 'Payment badge image alt text specifies Shop Pay.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:shopify-payment-button|payment-icon--shopify_pay|payment-icon--shop_pay|shop-pay-button)/i,
          interpretation: 'DOM markup includes Shop Pay button or badge classes.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-shopify_pay|icon-shop_pay|pi-shopify_pay)["']/i,
          interpretation: 'Icon container element ID designates Shop Pay.',
          weight: 50,
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>Shop Pay<\/title>/i,
          interpretation: 'Vector graphics title designates Shop Pay.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'amazon_pay',
    name: 'Amazon Pay',
    slug: 'amazon-pay',
    category: 'payment',
    categoryLabel: 'Digital Wallet & Payments',
    description: 'Online payment service using payment methods and address details stored in Amazon accounts.',
    website: 'https://pay.amazon.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-wallet:amazon_pay',
          interpretation: 'Amazon Pay checkout container detected in DOM.',
          weight: 55,
        },
      ],
      scripts: [
        {
          pattern: /static-na\.payments-amazon\.com|amazon\.com\/payments/i,
          interpretation: 'Amazon Pay client script loaded.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?amazon pay["']/i,
          interpretation: 'Amazon Pay element designated.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--amazon_payments|amazon-pay-button)/i,
          interpretation: 'Amazon Pay icon or button class detected.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'stripe',
    name: 'Stripe',
    slug: 'stripe',
    category: 'payment',
    categoryLabel: 'Payment Gateway & Processor',
    description: 'Financial infrastructure platform for payment processing and billing APIs.',
    website: 'https://stripe.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-gateway:stripe',
          interpretation: 'Stripe payment processor components or client tokens identified in DOM.',
          weight: 60,
        },
      ],
      scripts: [
        {
          pattern: /js\.stripe\.com\/v3\/?/i,
          interpretation: 'Script tag references Stripe.js v3 secure payment tokenization client.',
          weight: 60,
        },
        {
          pattern: /checkout\.stripe\.com/i,
          interpretation: 'Script or checkout link references Stripe Checkout.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /Stripe\(['"]pk_(?:live|test)_[a-zA-Z0-9]+['"]\)/i,
          interpretation: 'Inline script initializes Stripe Elements with a public API key (pk_*).',
          weight: 55,
        },
        {
          regex: /stripe\.elements\(|data-stripe|stripe-elements/i,
          interpretation: 'Stripe Elements secure payment field mounting code observed in document.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    slug: 'paypal',
    category: 'payment',
    categoryLabel: 'Payment Platform',
    description: 'Global digital payment, digital wallet, and merchant checkout platform.',
    website: 'https://paypal.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-gateway:paypal',
          interpretation: 'PayPal payment checkout buttons or container verified in DOM.',
          weight: 60,
        },
      ],
      scripts: [
        {
          pattern: /paypal\.com\/sdk\/js/i,
          interpretation: 'Script tag loads PayPal JavaScript SDK client package.',
          weight: 60,
        },
        {
          pattern: /paypalobjects\.com\/api\/checkout\.js/i,
          interpretation: 'Script loads PayPal legacy Checkout.js library.',
          weight: 50,
        },
      ],
      html: [
        {
          regex: /paypal\.Buttons\(/i,
          interpretation: 'PayPal smart payment buttons initialization observed in page code.',
          weight: 50,
        },
        {
          regex: /aria-label=["'](?:pay with )?paypal["']/i,
          interpretation: 'Accessible payment button explicitly designates PayPal checkout.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--paypal|icon-paypal|fa-cc-paypal)/i,
          interpretation: 'PayPal payment icon class identifier present.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-paypal|pi-paypal)["']/i,
          interpretation: 'PayPal payment badge element ID observed.',
          weight: 50,
        },
        {
          regex: /<svg[^>]*>\s*<title[^>]*>PayPal<\/title>/i,
          interpretation: 'Vector title explicitly specifies PayPal payment method.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'square',
    name: 'Square',
    slug: 'square',
    category: 'payment',
    categoryLabel: 'Payment Gateway & Processor',
    description: 'Commerce and point-of-sale payment gateway ecosystem.',
    website: 'https://squareup.com',
    indicators: {
      scripts: [
        {
          pattern: /web\.squarecdn\.com\/v1\/square\.js|squareup\.com/i,
          interpretation: 'Script tag loads Square Web Payments SDK.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /Square\.payments\(/i,
          interpretation: 'Square Web Payments SDK initialization call identified in script.',
          weight: 55,
        },
      ],
    },
  },
  {
    id: 'klarna',
    name: 'Klarna',
    slug: 'klarna',
    category: 'payment',
    categoryLabel: 'Buy Now Pay Later (BNPL)',
    description: 'Buy now, pay later (BNPL) and flexible installment payment provider.',
    website: 'https://klarna.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-bnpl:klarna',
          interpretation: 'Klarna installment payment widgets identified in DOM.',
          weight: 60,
        },
      ],
      scripts: [
        {
          pattern: /x\.klarnacdn\.net\/kp\/lib\/v1\/api\.js|klarna\.com/i,
          interpretation: 'Script tag loads Klarna Payments integration JavaScript library.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /aria-label=["'](?:pay with )?klarna["']/i,
          interpretation: 'Klarna installment payment option designated.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--klarna|klarna-badge)/i,
          interpretation: 'Klarna payment icon class observed in DOM.',
          weight: 50,
        },
        {
          regex: /id=["'](?:icon-klarna|pi-klarna)["']/i,
          interpretation: 'Klarna icon element ID observed.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'afterpay',
    name: 'Afterpay / Clearpay',
    slug: 'afterpay',
    category: 'payment',
    categoryLabel: 'Buy Now Pay Later (BNPL)',
    description: 'Installment payment solution allowing customers to split purchases into four interest-free payments.',
    website: 'https://afterpay.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-bnpl:afterpay',
          interpretation: 'Afterpay installment payment widget or badge identified.',
          weight: 60,
        },
      ],
      scripts: [
        {
          pattern: /static\.afterpay\.com|portal\.afterpay\.com/i,
          interpretation: 'Document loads Afterpay JavaScript SDK.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /afterpay-placement/i,
          interpretation: 'Afterpay widget placement tag detected in DOM.',
          weight: 50,
        },
        {
          regex: /aria-label=["'](?:pay with )?afterpay["']/i,
          interpretation: 'Afterpay payment method designated.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--afterpay|afterpay-badge)/i,
          interpretation: 'Afterpay icon class detected.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'affirm',
    name: 'Affirm',
    slug: 'affirm',
    category: 'payment',
    categoryLabel: 'Buy Now Pay Later (BNPL)',
    description: 'Flexible transparent installment payment plans and credit at checkout.',
    website: 'https://affirm.com',
    indicators: {
      domMarkers: [
        {
          marker: 'payment-bnpl:affirm',
          interpretation: 'Affirm installment payment widget or badge identified.',
          weight: 60,
        },
      ],
      scripts: [
        {
          pattern: /cdn1\.affirm\.com\/js\/v2\/affirm\.js/i,
          interpretation: 'Document loads Affirm JavaScript SDK.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /affirm-as-low-as/i,
          interpretation: 'Affirm pricing installment widget detected.',
          weight: 50,
        },
        {
          regex: /aria-label=["'](?:pay with )?affirm["']/i,
          interpretation: 'Affirm payment method designated.',
          weight: 50,
        },
        {
          regex: /class=["'][^"']*(?:payment-icon--affirm|affirm-badge)/i,
          interpretation: 'Affirm icon class detected.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'adyen',
    name: 'Adyen',
    slug: 'adyen',
    category: 'payment',
    categoryLabel: 'Payment Gateway & Processor',
    description: 'Global financial technology platform providing end-to-end payment processing.',
    website: 'https://adyen.com',
    indicators: {
      scripts: [
        {
          pattern: /checkoutshopper-(?:live|test)\.adyen\.com/i,
          interpretation: 'Adyen Checkout client SDK script loaded.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /AdyenCheckout|adyen-checkout/i,
          interpretation: 'Adyen Checkout component container found.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'braintree',
    name: 'Braintree',
    slug: 'braintree',
    category: 'payment',
    categoryLabel: 'Payment Gateway & Processor',
    description: 'PayPal service providing full-stack payment processing for global merchants.',
    website: 'https://braintreepayments.com',
    indicators: {
      scripts: [
        {
          pattern: /js\.braintreegateway\.com\/web\//i,
          interpretation: 'Braintree web client SDK loaded.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /braintree\.client\.create/i,
          interpretation: 'Braintree client initialization code found.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'authorizenet',
    name: 'Authorize.Net',
    slug: 'authorizenet',
    category: 'payment',
    categoryLabel: 'Payment Gateway & Processor',
    description: 'Visa solution providing credit card and electronic check payment processing.',
    website: 'https://authorize.net',
    indicators: {
      scripts: [
        {
          pattern: /js(?:test)?\.authorize\.net/i,
          interpretation: 'Authorize.Net Accept.js secure payment client script loaded.',
          weight: 55,
        },
      ],
      html: [
        {
          regex: /Accept\.dispatchData/i,
          interpretation: 'Authorize.Net Accept.js dispatch call found.',
          weight: 50,
        },
      ],
    },
  },

  // ==========================================
  // 8. CDN / EDGE
  // ==========================================
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    slug: 'cloudflare',
    category: 'cdn_edge',
    categoryLabel: 'CDN / Edge',
    description: 'Global content delivery network, DDoS mitigation, and edge compute platform.',
    website: 'https://cloudflare.com',
    indicators: {
      headers: [
        {
          name: 'server',
          valueRegex: /^cloudflare$/i,
          interpretation: 'HTTP Server response header identifies Cloudflare edge web server.',
          weight: 50,
        },
        {
          name: 'cf-ray',
          interpretation: 'Presence of cf-ray trace header identifies request routed through Cloudflare edge.',
          weight: 50,
        },
        {
          name: 'cf-cache-status',
          interpretation: 'Cloudflare edge caching header (cf-cache-status) present.',
          weight: 40,
        },
      ],
      infrastructure: [
        {
          nsMatch: /cloudflare\.com$/i,
          cdnMatch: 'Cloudflare',
          interpretation: 'Authoritative nameserver zone delegated to Cloudflare infrastructure.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'cloudfront',
    name: 'Amazon CloudFront',
    slug: 'cloudfront',
    category: 'cdn_edge',
    categoryLabel: 'CDN / Edge',
    description: 'Amazon Web Services global content delivery network service.',
    website: 'https://aws.amazon.com/cloudfront',
    indicators: {
      headers: [
        {
          name: 'via',
          valueRegex: /cloudfront\.net/i,
          interpretation: 'Via response header reports transit through CloudFront edge proxy.',
          weight: 50,
        },
        {
          name: 'x-amz-cf-id',
          interpretation: 'CloudFront routing transaction header (x-amz-cf-id) present in response.',
          weight: 55,
        },
        {
          name: 'x-amz-cf-pop',
          interpretation: 'CloudFront Point-of-Presence edge indicator (x-amz-cf-pop) observed.',
          weight: 50,
        },
      ],
      infrastructure: [
        {
          cnameMatch: /cloudfront\.net$/i,
          interpretation: 'Canonical domain alias (CNAME) points to CloudFront edge distribution.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'fastly',
    name: 'Fastly',
    slug: 'fastly',
    category: 'cdn_edge',
    categoryLabel: 'CDN / Edge',
    description: 'Edge cloud platform and programmable CDN providing content acceleration.',
    website: 'https://fastly.com',
    indicators: {
      headers: [
        {
          name: 'x-served-by',
          valueRegex: /cache-/i,
          interpretation: 'Header x-served-by indicates caching through Fastly edge cache node.',
          weight: 50,
        },
        {
          name: 'fastly-debug-digest',
          interpretation: 'Fastly cache debug digest header observed in response.',
          weight: 55,
        },
        {
          name: 'x-fastly-request-id',
          interpretation: 'Fastly internal request tracing header present in response headers.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'akamai',
    name: 'Akamai',
    slug: 'akamai',
    category: 'cdn_edge',
    categoryLabel: 'CDN / Edge',
    description: 'Global distributed edge platform providing cybersecurity and CDN services.',
    website: 'https://akamai.com',
    indicators: {
      headers: [
        {
          name: 'server',
          valueRegex: /AkamaiGHost/i,
          interpretation: 'Server header discloses Akamai Global Host (AkamaiGHost) edge layer.',
          weight: 50,
        },
        {
          name: 'x-akamai-transformed',
          interpretation: 'Akamai content transformation optimization header present.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'vercel_edge',
    name: 'Vercel Edge Network',
    slug: 'vercel-edge',
    category: 'cdn_edge',
    categoryLabel: 'CDN / Edge',
    description: 'Serverless deployment platform and edge delivery network for frontend frameworks.',
    website: 'https://vercel.com',
    indicators: {
      headers: [
        {
          name: 'x-vercel-id',
          interpretation: 'Response header x-vercel-id reveals routing through Vercel Edge.',
          weight: 55,
        },
        {
          name: 'x-vercel-cache',
          interpretation: 'Vercel edge cache status header present.',
          weight: 45,
        },
        {
          name: 'server',
          valueRegex: /^vercel$/i,
          interpretation: 'Server response header identifies Vercel server.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'netlify_edge',
    name: 'Netlify Edge',
    slug: 'netlify-edge',
    category: 'cdn_edge',
    categoryLabel: 'CDN / Edge',
    description: 'Cloud hosting and serverless backend services platform for web applications.',
    website: 'https://netlify.com',
    indicators: {
      headers: [
        {
          name: 'x-nf-request-id',
          interpretation: 'Response header x-nf-request-id discloses Netlify edge proxy trace.',
          weight: 55,
        },
        {
          name: 'server',
          valueRegex: /^Netlify$/i,
          interpretation: 'Server header announces Netlify web server.',
          weight: 45,
        },
      ],
    },
  },

  // ==========================================
  // 9. HOSTING / INFRASTRUCTURE
  // ==========================================
  {
    id: 'aws_hosting',
    name: 'Amazon Web Services (AWS)',
    slug: 'aws',
    category: 'hosting_cloud',
    categoryLabel: 'Hosting / Cloud',
    description: 'Comprehensive cloud computing platform providing compute, storage, and networking.',
    website: 'https://aws.amazon.com',
    indicators: {
      headers: [
        {
          name: 'x-amz-request-id',
          interpretation: 'Header x-amz-request-id indicates request handled by AWS infrastructure (e.g., S3 / API Gateway).',
          weight: 50,
        },
      ],
      infrastructure: [
        {
          nsMatch: /awsdns-[0-9]+/i,
          interpretation: 'Domain nameservers resolve to Amazon Route 53 authoritative nameservers.',
          weight: 50,
        },
        {
          cnameMatch: /amazonaws\.com$/i,
          interpretation: 'Target CNAME points directly to an AWS service endpoint (e.g., ELB, S3).',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'google_cloud',
    name: 'Google Cloud Platform (GCP)',
    slug: 'gcp',
    category: 'hosting_cloud',
    categoryLabel: 'Hosting / Cloud',
    description: 'Suite of cloud computing services running on the same infrastructure Google uses internally.',
    website: 'https://cloud.google.com',
    indicators: {
      headers: [
        {
          name: 'x-goog-generation',
          interpretation: 'Response header indicates object served from Google Cloud Storage bucket.',
          weight: 50,
        },
        {
          name: 'server',
          valueRegex: /gws|gvh/i,
          interpretation: 'Server header indicates Google Web Server internal infrastructure.',
          weight: 40,
        },
      ],
      infrastructure: [
        {
          nsMatch: /googledomains\.com|cloud-dns/i,
          interpretation: 'Authoritative DNS records managed by Google Cloud DNS.',
          weight: 45,
        },
      ],
    },
  },
  {
    id: 'github_pages',
    name: 'GitHub Pages',
    slug: 'github-pages',
    category: 'hosting_cloud',
    categoryLabel: 'Hosting / Cloud',
    description: 'Static site hosting service that takes HTML, CSS, and JavaScript files straight from a repository.',
    website: 'https://pages.github.com',
    indicators: {
      headers: [
        {
          name: 'server',
          valueRegex: /^github\.com$/i,
          interpretation: 'Response header Server identifies GitHub.com web server.',
          weight: 50,
        },
        {
          name: 'x-github-request-id',
          interpretation: 'Header x-github-request-id indicates GitHub Pages routing infrastructure.',
          weight: 50,
        },
      ],
      infrastructure: [
        {
          cnameMatch: /github\.io$/i,
          interpretation: 'Target CNAME record delegates directly to GitHub Pages (*.github.io).',
          weight: 55,
        },
      ],
    },
  },

  // ==========================================
  // 10. WEB SERVERS
  // ==========================================
  {
    id: 'nginx',
    name: 'Nginx',
    slug: 'nginx',
    category: 'web_server',
    categoryLabel: 'Web Server',
    description: 'High-performance HTTP server, reverse proxy, and generic TCP/UDP proxy server.',
    website: 'https://nginx.org',
    indicators: {
      headers: [
        {
          name: 'server',
          valueRegex: /^nginx(?:\/([\d.]+))?/i,
          interpretation: 'HTTP Server response header reports Nginx web server.',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'header',
        regex: /^nginx\/([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'apache',
    name: 'Apache HTTP Server',
    slug: 'apache',
    category: 'web_server',
    categoryLabel: 'Web Server',
    description: 'Open-source cross-platform HTTP web server software developed by Apache.',
    website: 'https://httpd.apache.org',
    indicators: {
      headers: [
        {
          name: 'server',
          valueRegex: /^apache(?:\/([\d.]+))?/i,
          interpretation: 'HTTP Server response header discloses Apache HTTP Server.',
          weight: 50,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'header',
        regex: /^Apache\/([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
  {
    id: 'litespeed',
    name: 'LiteSpeed',
    slug: 'litespeed',
    category: 'web_server',
    categoryLabel: 'Web Server',
    description: 'Proprietary lightweight web server software compatible with Apache features.',
    website: 'https://www.litespeedtech.com',
    indicators: {
      headers: [
        {
          name: 'server',
          valueRegex: /^litespeed/i,
          interpretation: 'HTTP Server header identifies LiteSpeed Web Server.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'caddy',
    name: 'Caddy',
    slug: 'caddy',
    category: 'web_server',
    categoryLabel: 'Web Server',
    description: 'Enterprise-ready, open source web server with automatic HTTPS written in Go.',
    website: 'https://caddyserver.com',
    indicators: {
      headers: [
        {
          name: 'server',
          valueRegex: /^caddy/i,
          interpretation: 'HTTP Server header identifies Caddy web server.',
          weight: 50,
        },
      ],
    },
  },
  {
    id: 'microsoft_iis',
    name: 'Microsoft IIS',
    slug: 'microsoft-iis',
    category: 'web_server',
    categoryLabel: 'Web Server',
    description: 'Extensible web server created by Microsoft for use with Windows Server.',
    website: 'https://www.iis.net',
    indicators: {
      headers: [
        {
          name: 'server',
          valueRegex: /^microsoft-iis(?:\/([\d.]+))?/i,
          interpretation: 'HTTP Server response header reports Microsoft-IIS web server.',
          weight: 50,
        },
        {
          name: 'x-powered-by',
          valueRegex: /ASP\.NET/i,
          interpretation: 'Header reports ASP.NET application runtime typically hosted on IIS.',
          weight: 40,
        },
      ],
    },
    versionPatterns: [
      {
        source: 'header',
        regex: /^Microsoft-IIS\/([\d.]+)/i,
        groupIndex: 1,
        reliability: 'EXACT',
      },
    ],
  },
];
