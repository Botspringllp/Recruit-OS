'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  Sparkles,
  Building2
} from 'lucide-react';
import { publishJobAction } from '@/app/actions/sourcingActions';

interface JobPublishingClientViewProps {
  job: any;
}

export function JobPublishingClientView({ job }: JobPublishingClientViewProps) {
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'CAREER_PORTAL',
    'LINKEDIN',
    'NAUKRI'
  ]);
  const [publishResult, setPublishResult] = useState<any>(null);

  const channelsList = [
    { id: 'CAREER_PORTAL', name: 'Internal Career Portal', icon: '🌐', color: 'border-brand-500/40 bg-brand-500/10' },
    { id: 'LINKEDIN', name: 'LinkedIn Jobs', icon: '💼', color: 'border-cyan-500/40 bg-cyan-500/10' },
    { id: 'NAUKRI', name: 'Naukri.com Sourcing', icon: '📄', color: 'border-amber-500/40 bg-amber-500/10' },
    { id: 'FOUNDIT', name: 'Foundit (Monster)', icon: '🔍', color: 'border-purple-500/40 bg-purple-500/10' },
    { id: 'INDEED', name: 'Indeed Job Board', icon: '🚀', color: 'border-emerald-500/40 bg-emerald-500/10' },
    { id: 'CUSTOM_URL', name: 'Custom Job URL', icon: '🔗', color: 'border-slate-700 bg-slate-800/60' }
  ];

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    setPublishing(true);
    const res = await publishJobAction({
      jobId: job.id,
      channels: selectedChannels as any
    });
    setPublishing(false);

    if (res.success) {
      setPublishResult(res);
    } else {
      alert(res.error || 'Failed to publish job mandate');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const existingLogs = job.distributionLogs || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Job Mandates
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="h-6 w-6 text-brand-400" />
            Job Publishing & Multi-Channel Distribution Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish mandate <strong>{job.title}</strong> across internal careers portal and external hiring boards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Channel Selection & Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-400" /> Select Sourcing Channels
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose the target job boards and career portals to publish this candidate mandate.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {channelsList.map((ch) => {
                const isSelected = selectedChannels.includes(ch.id);

                return (
                  <div
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? `${ch.color} text-white`
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{ch.icon}</span>
                      <span className="text-xs font-semibold">{ch.name}</span>
                    </div>

                    <div
                      className={`h-4 w-4 rounded-md border flex items-center justify-center text-[10px] ${
                        isSelected
                          ? 'border-brand-400 bg-brand-500 text-white'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedChannels.length} channels selected
              </span>

              <button
                onClick={handlePublish}
                disabled={publishing || selectedChannels.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-glow-brand disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publishing Job...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Publish Job Mandate
                  </>
                )}
              </button>
            </div>
          </div>

          {publishResult && (
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Job Mandate Successfully Published!</h4>
                  <p className="text-xs text-slate-300">Live career URL generated below.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs text-brand-300 truncate font-mono">
                  {publishResult.publicUrl}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyUrl(publishResult.publicUrl)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-200 transition flex items-center gap-1"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <a
                    href={publishResult.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs text-white transition flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Distribution Audit Logs */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Publication History Logs
            </h3>

            {existingLogs.length > 0 ? (
              <div className="space-y-3">
                {existingLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{log.channel}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Published: {new Date(log.publishedAt || log.createdAt).toLocaleDateString()}</span>
                      {log.externalJobUrl && (
                        <a
                          href={log.externalJobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-400 hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No distribution logs recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
