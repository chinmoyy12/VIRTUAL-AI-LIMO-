import React, { useState } from 'react';
import {
  Image,
  Globe,
  Presentation,
  FileText,
  Video,
  PenTool,
  Code2,
  Sparkles,
  Download,
  RefreshCw,
} from 'lucide-react';
import { sounds } from '../services/soundEffects.ts';
import { useOmega } from '../context/OmegaContext.tsx';

type CreativeFormat =
  | 'Image'
  | 'Website'
  | 'Presentation'
  | 'Document'
  | 'Video'
  | 'Design'
  | 'Code';

interface FormatPreset {
  format: CreativeFormat;
  icon: React.FC<{ className?: string }>;
  defaultPrompt: string;
  previewTitle: string;
  previewSubtitle: string;
}

const FORMATS: FormatPreset[] = [
  {
    format: 'Image',
    icon: Image,
    defaultPrompt:
      'Minimalist architectural keynote poster with deep obsidian geometry and Swiss typography',
    previewTitle: 'SYNAPSE 2026',
    previewSubtitle: 'Architecture & Autonomous Systems Symposium · Kyoto Hall',
  },
  {
    format: 'Website',
    icon: Globe,
    defaultPrompt: 'Clean personal engineering portfolio with dark editorial layout and case studies',
    previewTitle: 'Chinmoy · Systems & AI',
    previewSubtitle: 'Interactive Web Application · React 19 + TypeScript',
  },
  {
    format: 'Presentation',
    icon: Presentation,
    defaultPrompt: '12-slide Q4 architecture review deck covering latency, safety gates, and roadmap',
    previewTitle: 'Q4 Systems Review',
    previewSubtitle: 'Slide 01 of 12 · Executive Summary & Benchmarks',
  },
  {
    format: 'Document',
    icon: FileText,
    defaultPrompt: 'Technical specification for OMEGA local tool execution and permission boundaries',
    previewTitle: 'OMEGA Security Spec',
    previewSubtitle: 'Technical Specification · 8 Pages',
  },
  {
    format: 'Video',
    icon: Video,
    defaultPrompt: '60-second product walkthrough motion storyboard with smooth transitions',
    previewTitle: 'Product Walkthrough',
    previewSubtitle: '60fps Motion Sequence · 00:45',
  },
  {
    format: 'Design',
    icon: PenTool,
    defaultPrompt: 'Desktop design system token sheet with typography scale and dark surface hierarchy',
    previewTitle: 'OMEGA Design System',
    previewSubtitle: 'Component & Token Sheet · v2.4',
  },
  {
    format: 'Code',
    icon: Code2,
    defaultPrompt: 'TypeScript task state machine with automatic retry and schema validation',
    previewTitle: 'TaskEngine.ts',
    previewSubtitle: 'Verified TypeScript Module · 100% Test Coverage',
  },
];

export const CreativeStudioView: React.FC = () => {
  const { logActivity, addFile, showToast } = useOmega();
  const [selectedFormat, setSelectedFormat] = useState<CreativeFormat>('Image');
  const [prompt, setPrompt] = useState(FORMATS[0].defaultPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variationIndex, setVariationIndex] = useState(1);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const currentPreset =
    FORMATS.find((f) => f.format === selectedFormat) || FORMATS[0];

  const handleSelectFormat = (preset: FormatPreset) => {
    sounds.playClick(760);
    setSelectedFormat(preset.format);
    setPrompt(preset.defaultPrompt);
    setExportNotice(null);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setExportNotice(null);
    sounds.playPulse();
    setTimeout(() => {
      setIsGenerating(false);
      setVariationIndex((v) => (v % 4) + 1);
      sounds.playSuccess();
      logActivity({
        type: 'tool_call',
        title: `Generated ${selectedFormat} in Creative Studio`,
        details: prompt,
        severity: 'success',
      });
      showToast(`Generated ${selectedFormat}`, `Variation 0${(variationIndex % 4) + 1} ready`, 'success');
    }, 800);
  };

  const handleExport = () => {
    sounds.playSuccess();
    const ext =
      selectedFormat === 'Code'
        ? '.tsx'
        : selectedFormat === 'Presentation' || selectedFormat === 'Document'
        ? '.pdf'
        : '.svg';
    const fileName = `${currentPreset.previewTitle.replace(/[^a-zA-Z0-9_-]+/g, '_')}_v0${variationIndex}${ext}`;
    addFile({
      name: fileName,
      folder: 'Documents',
      type: ext === '.tsx' ? 'code' : ext === '.pdf' ? 'pdf' : 'doc',
      size: '1.4 MB',
      modified: 'Just now',
      summary: `Exported ${selectedFormat} asset from Creative Studio: "${prompt}"`,
      contentPreview: `${currentPreset.previewTitle} — ${currentPreset.previewSubtitle}`,
    });
    const msg = `Exported ${fileName} to ~/Documents`;
    setExportNotice(msg);
    showToast('Asset exported to Files', msg, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-10">
      {/* 19 — Top: "Create something" + Clean Format Selector */}
      <section className="flex flex-col gap-5">
        <div>
          <h1 className="text-display">Create something</h1>
          <p className="text-meta mt-1">
            Choose a medium and describe what you want OMEGA to build.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {FORMATS.map((item) => {
            const Icon = item.icon;
            const active = selectedFormat === item.format;
            return (
              <button
                key={item.format}
                type="button"
                onClick={() => handleSelectFormat(item)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-[#4ADE80] text-[#061109] font-semibold'
                    : 'bg-[#101412] text-[#9BA39D] border border-white/[0.06] hover:text-[#EEF2EF] hover:border-white/[0.12]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.format}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Focused Canvas / Workspace */}
      <section className="rounded-2xl bg-[#101412] border border-white/[0.06] overflow-hidden flex flex-col">
        {/* Canvas Preview Area */}
        <div className="min-h-[380px] bg-[#0B0E0C] p-8 sm:p-14 flex flex-col items-center justify-center text-center relative border-b border-white/[0.06]">
          <div className="max-w-lg w-full rounded-2xl bg-[#111613] border border-white/[0.07] p-8 sm:p-10 shadow-2xl flex flex-col items-center gap-5">
            <span className="text-[11px] font-mono-tabular uppercase tracking-widest text-[#4ADE80]">
              {selectedFormat.toUpperCase()} · VARIATION 0{variationIndex}
            </span>

            {/* Minimal Geometric Vector Emblem */}
            <div className="w-24 h-24 rounded-full border border-[#4ADE80]/35 flex items-center justify-center relative my-2">
              <div className="w-14 h-14 rotate-45 border border-[#4ADE80]/50 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#EEF2EF] tracking-tight">
                {currentPreset.previewTitle}
              </h2>
              <p className="text-xs text-[#9BA39D] mt-1">{currentPreset.previewSubtitle}</p>
            </div>

            <p className="text-xs text-[#636B65] max-w-sm leading-relaxed line-clamp-2">
              “{prompt}”
            </p>
          </div>
        </div>

        {/* Prompt Refinement & Actions */}
        <form onSubmit={handleGenerate} className="p-4 sm:p-5 flex flex-col gap-3">
          {exportNotice && (
            <div className="px-3.5 py-2 rounded-lg bg-[#151F19] border border-[#4ADE80]/25 text-xs text-[#4ADE80]">
              {exportNotice}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe the ${selectedFormat.toLowerCase()} you want to create…`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151A17] border border-white/[0.07] text-sm text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50"
            />

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="btn-primary !py-2.5 !px-4"
              >
                {isGenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isGenerating ? 'Creating…' : 'Generate'}</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                className="btn-secondary !py-2.5 !px-3.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};
