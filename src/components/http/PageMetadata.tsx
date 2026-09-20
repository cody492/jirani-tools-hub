import React from 'react';
import { FileText, Code, Globe, Hash, AlignLeft, Compass, Info } from 'lucide-react';
import { PageMetadata as PageMetadataType, HttpFinding } from '../../types';

interface PageMetadataProps {
  metadata: PageMetadataType | null;
  documentType: HttpFinding['documentType'];
  contentType: string;
}

export const PageMetadata: React.FC<PageMetadataProps> = ({
  metadata,
  documentType,
  contentType,
}) => {
  const isHtml = documentType === 'HTML';

  return (
    <div className="rounded-lg border border-[#1b2333] bg-[#0c0f17] p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#182030]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            PAGE METADATA & DOCUMENT INTELLIGENCE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 font-bold uppercase">
            {documentType}
          </span>
        </div>
      </div>

      {/* Document Properties Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded bg-[#0f131e] border border-[#1a2333]">
          <div className="text-[10px] uppercase text-slate-400">Document Type</div>
          <div className="text-sm font-semibold text-slate-100 mt-0.5 flex items-center gap-1.5 truncate">
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>{documentType}</span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-[#0f131e] border border-[#1a2333]">
          <div className="text-[10px] uppercase text-slate-400">Language (Lang)</div>
          <div className="text-sm font-semibold text-slate-100 mt-0.5 flex items-center gap-1.5 truncate">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{metadata?.language || 'NOT SPECIFIED'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-[#0f131e] border border-[#1a2333]">
          <div className="text-[10px] uppercase text-slate-400">Character Encoding</div>
          <div className="text-sm font-semibold text-slate-100 mt-0.5 flex items-center gap-1.5 truncate">
            <Hash className="w-3.5 h-3.5 text-indigo-400" />
            <span>{metadata?.charset || 'NOT SPECIFIED'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-[#0f131e] border border-[#1a2333]">
          <div className="text-[10px] uppercase text-slate-400">MIME Content-Type</div>
          <div className="text-xs font-semibold text-slate-300 mt-1 truncate" title={contentType}>
            {contentType}
          </div>
        </div>
      </div>

      {/* Extracted Metadata Fields (for HTML Documents) */}
      {isHtml ? (
        <div className="space-y-2.5 text-xs">
          {/* Page Title */}
          <div className="p-3 rounded bg-[#0e121b] border border-[#1c2436] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>DOCUMENT TITLE (&lt;title&gt;)</span>
              <span className="text-[10px] text-slate-400">
                {metadata?.title ? `${metadata.title.length} chars` : 'ABSENT'}
              </span>
            </div>
            <div className="font-semibold text-slate-100 text-xs sm:text-sm font-sans break-words">
              {metadata?.title ? (
                metadata.title
              ) : (
                <span className="text-slate-400 italic">No &lt;title&gt; tag found in document head</span>
              )}
            </div>
          </div>

          {/* Meta Description */}
          <div className="p-3 rounded bg-[#0e121b] border border-[#1c2436] space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>META DESCRIPTION</span>
              <span className="text-[10px] text-slate-400">
                {metadata?.description ? `${metadata.description.length} chars` : 'ABSENT'}
              </span>
            </div>
            <div className="text-slate-300 text-xs font-sans leading-relaxed break-words">
              {metadata?.description ? (
                metadata.description
              ) : (
                <span className="text-slate-400 italic">No meta description specified</span>
              )}
            </div>
          </div>

          {/* Canonical URL & Generator row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded bg-[#0e121b] border border-[#1c2436] space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                <span>CANONICAL URL</span>
              </div>
              <div className="text-xs text-slate-300 truncate" title={metadata?.canonicalUrl || ''}>
                {metadata?.canonicalUrl ? (
                  metadata.canonicalUrl
                ) : (
                  <span className="text-slate-400 italic">Not declared</span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#0e121b] border border-[#1c2436] space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <AlignLeft className="w-3 h-3 text-indigo-400" />
                <span>GENERATOR / CMS META</span>
              </div>
              <div className="text-xs text-slate-300 truncate">
                {metadata?.generator ? (
                  metadata.generator
                ) : (
                  <span className="text-slate-400 italic">None exposed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded bg-[#0f121a] border border-[#1a2130] text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-slate-300 font-semibold">
              Non-HTML Document Response ({documentType})
            </div>
            <p className="text-[11px] leading-relaxed">
              Target endpoint returned raw payload formatted as {documentType} rather than an HTML DOM tree. HTML document metadata (title, meta description, canonical tags) is not present in non-HTML representations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
