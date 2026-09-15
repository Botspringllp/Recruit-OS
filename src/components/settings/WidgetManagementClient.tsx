'use client';

import React from 'react';
import { SettingsHeaderTabs } from '@/components/settings/SettingsHeaderTabs';
import {
  Globe,
  Download,
  ExternalLink,
  Lock,
  FileText,
  Sparkles
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
  const previewUrl = `${baseUrl}/widget-preview/${agency.id}`;
  const downloadUrl = `/api/widget/${agency.id}/download`;

  // SUPER ADMIN CONTROL CHECK
  if (agency.widgetEnabled === false) {
    return (
      <div className="space-y-6 pb-12 font-sans">
        <SettingsHeaderTabs />

        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-slate-400" />
            Widget Management
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
            Contact your platform Super Admin to enable <strong className="text-amber-400">Widget Access</strong> in your agency profile.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-900">
      {/* Navigation Tabs */}
      <SettingsHeaderTabs />

      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Globe className="h-6 w-6 text-amber-500" />
          Widget Management
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Collect hiring requirements directly from client website leads into your RecruitOS Intake Queue.
        </p>
      </div>

      {/* DARK BLUE WIDGET BOX */}
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

          {/* Download Button & Usage Instructions Note */}
          <div className="space-y-4 pt-2">
            <div>
              <a
                href={downloadUrl}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>Download Widget ZIP</span>
              </a>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-xs space-y-2 text-slate-300 max-w-3xl">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold">
                <FileText className="h-4 w-4" />
                <span>Widget Package Information & Deployment Guide</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                This downloadable ZIP package contains standalone <strong className="text-white font-mono">widget.html</strong>, <strong className="text-white font-mono">widget.css</strong>, and <strong className="text-white font-mono">widget.js</strong> files. You can easily integrate this lead intake form onto your agency's external website. All incoming client submissions automatically stream as live database records into your RecruitOS Intake Queue.
              </p>
              <p className="text-[11px] leading-relaxed text-amber-300 font-semibold pt-1 border-t border-slate-800/80">
                📌 Complete step-by-step installation instructions, website embedding options, and integration guidelines are detailed in the <strong className="text-white font-mono">README.md</strong> file inside the downloaded ZIP package.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
