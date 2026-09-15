'use client';

import React, { useState } from 'react';
import { Building2, CheckCircle2, AlertCircle, Loader2, Send, Inbox, FileText, Upload, X } from 'lucide-react';

interface PublicWidgetFormProps {
  agencyId: string;
  agencyName: string;
}

export const PublicWidgetForm: React.FC<PublicWidgetFormProps> = ({ agencyId, agencyName }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactNumber: '',
    positionTitle: '',
    jobDescription: ''
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 10MB.');
      return;
    }

    setPdfFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setPdfFile(null);
    setPdfBase64(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side mandatory validation for Company & Contact info
    if (!formData.companyName.trim() || !formData.contactPerson.trim() || !formData.contactEmail.trim() || !formData.contactNumber.trim()) {
      setError('Please fill in all mandatory fields marked with (*).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        pdfName: pdfFile ? pdfFile.name : null,
        pdfBase64: pdfBase64 || null
      };

      const res = await fetch(`/api/widget/${agencyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmittedRef(data.referenceId || 'REQ-SUCCESS');
      } else {
        setError(data.error || 'Failed to submit requirement. Please try again.');
      }
    } catch (err: any) {
      setError('Network error connecting to RecruitOS. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      contactEmail: '',
      contactNumber: '',
      positionTitle: '',
      jobDescription: ''
    });
    setPdfFile(null);
    setPdfBase64(null);
    setSubmittedRef(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 font-sans">
      {/* Top Header Banner */}
      <div className="bg-slate-950 p-6 sm:p-8 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Inbox className="w-64 h-64 text-amber-400" />
        </div>

        <div className="relative z-10 text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Building2 className="h-3.5 w-3.5" />
            <span>{agencyName} Recruitment Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Hiring Requirement Request
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Submit your hiring requirements & company contact info to our recruitment team.
          </p>
        </div>
      </div>

      {/* Form Body or Success View */}
      <div className="p-6 sm:p-10">
        {submittedRef ? (
          /* SUCCESS PAGE */
          <div className="py-8 text-center space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Thank You</h2>
              <p className="text-sm font-bold text-slate-800">
                Your hiring requirement has been received successfully.
              </p>
              <p className="text-xs text-slate-500">
                Our recruitment team will review your request shortly.
              </p>
            </div>

            <div className="inline-block bg-slate-100 border border-slate-200 rounded-2xl px-6 py-3">
              <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Reference ID</span>
              <strong className="text-lg font-black text-amber-600 block mt-0.5">{submittedRef}</strong>
            </div>

            <div>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition-colors"
              >
                Submit Another Requirement
              </button>
            </div>
          </div>
        ) : (
          /* STREAMLINED REQUIREMENT FORM */
          <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-bold">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Company & Contact Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                1. Company & Contact Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-900 mb-1">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-900 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-900 mb-1">Business Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    placeholder="sarah@acme.com"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-900 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Requirement Upload & Optional Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                2. Requirement PDF & Role Brief
              </h3>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Position Title / Requirement Role (Optional)</label>
                <input
                  type="text"
                  name="positionTitle"
                  placeholder="e.g. Lead Full Stack Engineer (Optional)"
                  value={formData.positionTitle}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold"
                />
              </div>

              {/* Requirement PDF Upload Option */}
              <div>
                <label className="block font-black text-slate-900 mb-1">
                  Upload Requirement PDF / Document
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/20 p-5 rounded-2xl transition-all">
                  {pdfFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 block truncate max-w-[280px]">
                            {pdfFile.name}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {(pdfFile.size / 1024).toFixed(1)} KB • PDF Document Attached
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center py-4">
                      <Upload className="h-8 w-8 text-amber-500" />
                      <span className="text-xs font-black text-slate-900">
                        Click here to select & upload Requirement PDF
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Supports PDF, DOC, DOCX files up to 10MB
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Brief Description / Notes (Optional)</label>
                <textarea
                  name="jobDescription"
                  rows={3}
                  placeholder="Additional notes or role specifications (optional if PDF is attached)..."
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 resize-none font-sans"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Requirement</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
