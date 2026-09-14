'use client';

import React, { useState } from 'react';
import { SettingsHeaderTabs } from '@/components/settings/SettingsHeaderTabs';
import {
  Globe,
  Download,
  ExternalLink,
  Code,
  Check,
  Copy,
  Lock,
  Inbox,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  FileCode,
  CheckCircle2
} from 'lucide-react';

interface WidgetManagementClientProps {
  agency: {
    id: string;
    name: string;
    createdAt: Date | string;
    widgetEnabled: boolean;
  };
  baseUrl: string;
}

export const WidgetManagementClient: React.FC<WidgetManagementClientProps> = ({ agency, baseUrl }) => {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const previewUrl = `${baseUrl}/widget-preview/${agency.id}`;
  const downloadUrl = `/api/widget/${agency.id}/download`;

  const embedCodeSnippet = `<iframe src="${previewUrl}" width="100%" height="800" frameborder="0" style="border: 0; overflow: hidden;" title="Hiring Requirement Request"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(agency.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  // SECTION 8: SUPER ADMIN CONTROL CHECK
  if (agency.widgetEnabled === false) {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <SettingsHeaderTabs />

        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-slate-400" />
            Website & Widget Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Requirement capture widget & client lead intake configuration
          </p>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl max-w-2xl border border-slate-800 space-y-5">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center">
            <Lock className="h-7 w-7" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/30">
              Access Restricted
            </span>
            <h2 className="text-xl font-black text-white mt-3">Widget Access Disabled</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
              Requirement Capture Widget access is disabled for <strong className="text-white">{agency.name}</strong>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-400 font-medium">
            Contact your platform Super Admin to enable <strong className="text-amber-400">Widget Access</strong> in your agency profile. Once enabled, previewing, ZIP downloading, and iframe embed options will be unlocked immediately.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 font-sans">
      <SettingsHeaderTabs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-amber-500" />
            Website & Widget Management
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Collect hiring requirements directly from client website leads into your RecruitOS Intake Queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-2xs transition-all"
          >
            <ExternalLink className="h-4 w-4 text-amber-600" />
            <span>Preview Widget</span>
          </a>

          <a
            href={downloadUrl}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
          >
            <Download className="h-4 w-4 stroke-[2.5]" />
            <span>Download Widget ZIP</span>
          </a>
        </div>
      </div>

      {/* SECTION 1: WIDGET STATUS CARD */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Globe className="w-80 h-80 text-amber-400" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider">
                Widget Access: ENABLED
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
                Agency Requirement Capture Widget
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Embedded website lead capture flow automatically linked to {agency.name}.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20 flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Test Live Form</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Widget Status</span>
              <span className="text-sm font-black text-emerald-400 mt-1 block flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Active & Operational
              </span>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Widget ID</span>
              <div className="flex items-center justify-between mt-1">
                <code className="text-xs font-mono font-bold text-amber-300 truncate max-w-[160px]">{agency.id}</code>
                <button onClick={handleCopyId} className="p-1 rounded text-slate-400 hover:text-white">
                  {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created Date</span>
              <span className="text-xs font-bold text-slate-200 mt-1.5 block">
                {new Date(agency.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 7: EMBED OPTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Website Embed Code</h3>
              <p className="text-xs text-slate-500">Insert this iframe element into any webpage to embed your Requirement Capture Form.</p>
            </div>
          </div>

          <button
            onClick={handleCopyEmbed}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copiedEmbed ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copiedEmbed ? 'Copied!' : 'Copy Embed Code'}</span>
          </button>
        </div>

        <div className="bg-slate-950 rounded-2xl p-4 text-amber-300 font-mono text-xs overflow-x-auto border border-slate-800 select-all">
          {embedCodeSnippet}
        </div>
      </div>

      {/* SECTION 6: ZIP DOWNLOAD DETAILS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Standalone ZIP Package</h3>
              <p className="text-xs text-slate-500">Download ready-to-deploy HTML/CSS/JS package for webmasters.</p>
            </div>
          </div>

          <a
            href={downloadUrl}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download ZIP</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="font-mono font-bold text-slate-900 block">1. README.md</span>
            <span className="text-[11px] text-slate-500 block mt-1">Deployment instructions & guide</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="font-mono font-bold text-slate-900 block">2. widget.html</span>
            <span className="text-[11px] text-slate-500 block mt-1">Standalone form markup</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="font-mono font-bold text-slate-900 block">3. widget.css</span>
            <span className="text-[11px] text-slate-500 block mt-1">Clean responsive styling</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="font-mono font-bold text-slate-900 block">4. widget.js</span>
            <span className="text-[11px] text-slate-500 block mt-1">Validation & API submission logic</span>
          </div>
        </div>
      </div>

      {/* SECTION 9: OWNER TEST WORKFLOW */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <span>Owner End-to-End Test Workflow</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-bold">
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 text-slate-800">
            <span className="text-amber-600 block text-[10px] uppercase font-black">Step 1</span>
            <span>Click "Preview Widget"</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 text-slate-800">
            <span className="text-amber-600 block text-[10px] uppercase font-black">Step 2</span>
            <span>Submit Test Requirement</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 text-slate-800">
            <span className="text-amber-600 block text-[10px] uppercase font-black">Step 3</span>
            <span>Open Intake Queue</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 text-slate-800">
            <span className="text-amber-600 block text-[10px] uppercase font-black">Step 4</span>
            <span>Assign Recruiter</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200 text-slate-800">
            <span className="text-amber-600 block text-[10px] uppercase font-black">Step 5</span>
            <span>Accept & Convert to Mandate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
