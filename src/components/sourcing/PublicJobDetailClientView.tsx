'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Sparkles,
  Upload,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { submitCandidateApplicationAction } from '@/app/actions/sourcingActions';

interface PublicJobDetailClientViewProps {
  job: any;
}

export function PublicJobDetailClientView({ job }: PublicJobDetailClientViewProps) {
  const [submitting, setSubmitting] = useState(false);
  const [appliedResult, setAppliedResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentCompany: '',
    totalExperienceYears: 3,
    currentCtc: 12,
    expectedCtc: 18,
    noticePeriodDays: 30,
    skillsText: 'React, TypeScript, Node.js',
    resumeFileName: 'Candidate_Resume.pdf',
    resumeTextContent: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        resumeFileName: file.name
      }));

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          resumeTextContent: text || ''
        }));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const res = await submitCandidateApplicationAction({
      jobId: job.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      currentCompany: formData.currentCompany,
      totalExperienceYears: Number(formData.totalExperienceYears),
      currentCtc: Number(formData.currentCtc),
      expectedCtc: Number(formData.expectedCtc),
      noticePeriodDays: Number(formData.noticePeriodDays),
      skillsText: formData.skillsText,
      resumeFileName: formData.resumeFileName,
      resumeTextContent: formData.resumeTextContent
    });

    setSubmitting(false);

    if (res.success) {
      setAppliedResult(res);
    } else {
      setErrorMessage(res.error || 'Failed to submit application.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white pb-20">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Careers Directory
          </Link>

          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure Candidate Application
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Description & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block">
                {job.client?.companyName || 'Enterprise Client'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {job.title}
              </h1>
            </div>

            {/* Quick Details Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Location</span>
                <span className="text-xs font-bold text-slate-200 mt-0.5 block truncate">
                  {job.workLocation || 'Hybrid / Remote'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Experience</span>
                <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                  2+ Years Required
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Max Package</span>
                <span className="text-xs font-bold text-brand-300 mt-0.5 block">
                  ₹{job.maxCtcLpa ? Number(job.maxCtcLpa) : '25'} LPA
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Employment</span>
                <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                  Full Time
                </span>
              </div>
            </div>

            {/* Job Overview */}
            <div className="space-y-4 pt-4 border-t border-slate-800/80">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Role Overview & Responsibilities</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We are looking for a highly skilled software engineer to lead critical product features, build scalable architecture, and collaborate closely with cross-functional team members.
              </p>
            </div>

            {/* Skills Required */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Node.js', 'System Design', 'PostgreSQL', 'API Development'].map((sk) => (
                  <span key={sk} className="px-3 py-1 bg-slate-900 text-brand-300 border border-slate-800 rounded-lg text-xs font-semibold">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits & Perks */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Perks & Benefits</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Competitive Compensation & ESOPs</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Health Insurance & Family Coverage</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Hybrid / Flexible Work Setup</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Annual Learning Budget</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Application Form */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-brand-500/30 bg-slate-900/90 shadow-2xl sticky top-24">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" /> Apply for this Role
            </h2>
            <p className="text-xs text-slate-400 mt-1">Submit your details for instant AI profile screening.</p>

            {appliedResult ? (
              <div className="mt-6 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">Application Submitted!</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Your profile has been received and parsed successfully.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-left space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Automated AI Match Score:</span>
                    <span className="font-bold text-brand-300 text-sm">{appliedResult.matchScore}%</span>
                  </div>
                  {appliedResult.isDuplicate && (
                    <span className="text-[10px] text-amber-400 block italic">
                      Note: Profile matched existing candidate record.
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setAppliedResult(null)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition"
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
                {errorMessage && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Jane"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="jane.doe@example.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Total Exp (Years)</label>
                    <input
                      type="number"
                      name="totalExperienceYears"
                      value={formData.totalExperienceYears}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Notice (Days)</label>
                    <input
                      type="number"
                      name="noticePeriodDays"
                      value={formData.noticePeriodDays}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Current CTC (LPA)</label>
                    <input
                      type="number"
                      name="currentCtc"
                      value={formData.currentCtc}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Expected CTC (LPA)</label>
                    <input
                      type="number"
                      name="expectedCtc"
                      value={formData.expectedCtc}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Key Skills (Comma separated)</label>
                  <input
                    type="text"
                    name="skillsText"
                    value={formData.skillsText}
                    onChange={handleInputChange}
                    placeholder="React, Node.js, SQL"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Resume Upload Box */}
                <div>
                  <label className="block text-slate-400 mb-1">Upload Resume (PDF/DOCX/TXT) *</label>
                  <div className="border border-dashed border-slate-700 bg-slate-950/60 rounded-xl p-3 text-center space-y-2 relative">
                    <Upload className="h-5 w-5 text-brand-400 mx-auto" />
                    <span className="text-[11px] text-slate-300 block truncate">
                      {formData.resumeFileName}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold rounded-xl text-xs hover:brightness-110 transition flex items-center justify-center gap-2 shadow-glow-brand"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Parsing Resume & Submitting...
                    </>
                  ) : (
                    'Submit Candidate Application'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
