'use client';

import React, { useState, useTransition } from 'react';
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Copy,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  UserCheck,
  Search,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { createOfferLetterAction } from '@/app/actions/offerActions';

interface OfferDashboardClientViewProps {
  initialData: {
    offers: any[];
    metrics: any;
  };
  submissions: any[];
}

export function OfferDashboardClientView({ initialData, submissions }: OfferDashboardClientViewProps) {
  const [offers, setOffers] = useState(initialData.offers || []);
  const [metrics, setMetrics] = useState(initialData.metrics || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Offer Builder Modal State
  const [showBuilder, setShowBuilder] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    candidateSubmissionId: '',
    title: '',
    offeredCTC: '',
    fixedSalary: '',
    variableSalary: '',
    joiningDate: '',
    workLocation: 'Hybrid',
    employmentType: 'FULL_TIME',
    bondPeriod: '',
    probationPeriod: '3 Months',
    noticePeriod: '60 Days',
    benefits: 'Comprehensive Medical Insurance, Performance Bonus',
    specialTerms: '',
    internalNotes: ''
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidateSubmissionId || !formData.title || !formData.offeredCTC || !formData.joiningDate) {
      setFeedback({ type: 'error', message: 'Please fill in all mandatory fields.' });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const ctcValue = parseFloat(formData.offeredCTC) * 100000;
      const fixedValue = formData.fixedSalary ? parseFloat(formData.fixedSalary) * 100000 : undefined;
      const variableValue = formData.variableSalary ? parseFloat(formData.variableSalary) * 100000 : undefined;

      const res = await createOfferLetterAction({
        candidateSubmissionId: formData.candidateSubmissionId,
        title: formData.title,
        offeredCTC: ctcValue,
        fixedSalary: fixedValue,
        variableSalary: variableValue,
        joiningDate: formData.joiningDate,
        workLocation: formData.workLocation,
        employmentType: formData.employmentType,
        bondPeriod: formData.bondPeriod,
        probationPeriod: formData.probationPeriod,
        noticePeriod: formData.noticePeriod,
        benefits: formData.benefits,
        specialTerms: formData.specialTerms,
        internalNotes: formData.internalNotes
      });

      if (res.success) {
        setShowBuilder(false);
        setFeedback({ type: 'success', message: 'Offer letter extended and email notification dispatched!' });
        window.location.reload();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to generate offer letter' });
      }
    });
  };

  const filteredOffers = offers.filter((o) => {
    const nameMatch = `${o.candidate.firstName} ${o.candidate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const jobMatch = o.job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const companyMatch = (o.job.companyName || o.client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || jobMatch || companyMatch;

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && o.status === statusFilter;
  });

  const copyOfferLink = (token: string) => {
    const url = `${window.location.origin}/offer/${token}`;
    navigator.clipboard.writeText(url);
    alert('Candidate public offer link copied to clipboard!');
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      
      {/* Page Title & CTAs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-indigo-600" /> Offer Management & Pipeline Engine
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Automated offer letter builder, candidate portal tracking, and instant SSE status updates.
          </p>
        </div>

        <button
          onClick={() => setShowBuilder(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="h-4 w-4" /> Create & Extend Offer
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Total Sent</span>
          <div className="text-2xl font-black text-slate-900">{metrics.totalSent || 0}</div>
          <span className="text-[10px] text-slate-500 font-bold">Extended Offers</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Accepted</span>
          <div className="text-2xl font-black text-emerald-600">{metrics.totalAccepted || 0}</div>
          <span className="text-[10px] text-emerald-600 font-bold">Offer Conversion</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Declined</span>
          <div className="text-2xl font-black text-rose-600">{metrics.totalDeclined || 0}</div>
          <span className="text-[10px] text-rose-500 font-bold">Rejections</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Clarifications</span>
          <div className="text-2xl font-black text-amber-600">{metrics.totalClarifications || 0}</div>
          <span className="text-[10px] text-amber-600 font-bold">Pending Queries</span>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Acceptance Rate</span>
          <div className="text-2xl font-black text-indigo-600">{metrics.acceptanceRate || 0}%</div>
          <span className="text-[10px] text-indigo-600 font-bold">Benchmark 85%+</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, job, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'CLARIFICATION_REQUESTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-2xl text-[11px] font-extrabold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-6">Position & Company</th>
                <th className="py-4 px-6">Offered CTC</th>
                <th className="py-4 px-6">Joining Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No offer records found. Click "Create & Extend Offer" to create your first offer letter.
                  </td>
                </tr>
              ) : (
                filteredOffers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-900">{o.candidate.firstName} {o.candidate.lastName}</div>
                      <div className="text-[11px] text-slate-400">{o.candidate.email || 'No Email'}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-extrabold text-slate-900">{o.job.title}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{o.job.companyName || o.client?.companyName || 'Hiring Client'}</div>
                    </td>

                    <td className="py-4 px-6 font-black text-emerald-600">
                      ₹{(Number(o.offeredCTC) / 100000).toFixed(2)} LPA
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-700">
                      {new Date(o.joiningDate).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          o.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : o.status === 'DECLINED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : o.status === 'CLARIFICATION_REQUESTED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyOfferLink(o.token)}
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                          title="Copy Candidate Offer Link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={`/offer/${o.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 hover:bg-slate-100 rounded-xl text-indigo-600 transition-colors"
                          title="Preview Candidate Portal"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Offer Builder Modal (PART B) */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Create & Extend Offer Letter</h3>
                <p className="text-xs text-slate-500 font-medium">Select a candidate submission and customize employment terms.</p>
              </div>
              <button onClick={() => setShowBuilder(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Submission Select */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-600">Select Shortlisted Candidate</label>
                <select
                  required
                  value={formData.candidateSubmissionId}
                  onChange={(e) => {
                    const sub = submissions.find((s) => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      candidateSubmissionId: e.target.value,
                      title: sub ? `Offer Letter - ${sub.job.title}` : formData.title
                    });
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Candidate Submission...</option>
                  {submissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.candidate.firstName} {s.candidate.lastName} - {s.job.title} ({s.job.companyName || 'Client'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600">Offer Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600">Offered Annual CTC (LPA in ₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 18.5"
                    value={formData.offeredCTC}
                    onChange={(e) => setFormData({ ...formData, offeredCTC: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600">Fixed Salary Component (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 16.0"
                    value={formData.fixedSalary}
                    onChange={(e) => setFormData({ ...formData, fixedSalary: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600">Variable Bonus Component (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.5"
                    value={formData.variableSalary}
                    onChange={(e) => setFormData({ ...formData, variableSalary: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600">Expected Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-600">Work Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore / Remote"
                    value={formData.workLocation}
                    onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-600">Benefits & Perks Package</label>
                <textarea
                  rows={2}
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Send className="h-4 w-4" /> Send Offer Letter Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
