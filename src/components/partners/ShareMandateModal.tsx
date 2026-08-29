'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, X, AlertCircle, CheckCircle2, Building, Briefcase, Percent } from 'lucide-react';
import { shareMandateAction } from '@/app/actions/partners';

interface ShareMandateModalProps {
  jobs: Array<{ id: string; title: string }>;
  partners: Array<{ id: string; name: string; defaultSplitPercentage: number | string }>;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareMandateModal({ jobs, partners, isOpen, onClose }: ShareMandateModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [splitVal, setSplitVal] = useState<number>(50);

  if (!isOpen) return null;

  function handlePartnerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedPartnerId(id);
    const p = partners.find(p => p.id === id);
    if (p) {
      setSplitVal(Number(p.defaultSplitPercentage));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await shareMandateAction(formData);

    setLoading(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      setError(res.error || 'Failed to share mandate');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Share2 className="h-4 w-4 text-purple-400" />
            Share Job Mandate with Co-Broker Partner
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Job Mandate */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Job Mandate *
            </label>
            <select
              name="jobId"
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="">Select a job mandate to share...</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          {/* Select Partner Agency or Name */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-400" /> Partner Agency *
            </label>
            {partners.length > 0 ? (
              <select
                name="partnerAgencyId"
                value={selectedPartnerId}
                onChange={handlePartnerChange}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
              >
                <option value="">Select a registered partner agency...</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({Number(p.defaultSplitPercentage)}% Split)</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="partnerAgencyName"
                required
                placeholder="Partner Agency Name"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
              />
            )}
          </div>

          {/* Revenue Split & Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-slate-400" /> Commission Split (%)
              </label>
              <input
                type="number"
                name="splitPercentage"
                min="0"
                max="100"
                value={splitVal}
                onChange={(e) => setSplitVal(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Valid Duration (Days)
              </label>
              <input
                type="number"
                name="expiresDays"
                defaultValue={30}
                min="1"
                max="365"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Sharing Instructions / Sourcing Notes
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Candidates must have notice period < 30 days. Contact recruiter directly before submission."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold hover:brightness-110 transition flex items-center gap-2 shadow-glow-purple disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? 'Sharing...' : 'Share Mandate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
