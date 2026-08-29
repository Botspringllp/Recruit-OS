'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  X,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { ParsedCandidate, DuplicateCandidateMatch } from '@/lib/parser/types';

export default function ResumeImportPage() {
  const router = useRouter();

  // Workflow steps: 'upload' | 'parsing' | 'duplicate_warning' | 'review'
  const [step, setStep] = useState<'upload' | 'parsing' | 'duplicate_warning' | 'review'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extracted data state
  const [parsedCandidate, setParsedCandidate] = useState<ParsedCandidate | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateCandidateMatch | null>(null);

  // Form editable states for Review Screen
  const [editForm, setEditForm] = useState<Partial<ParsedCandidate>>({});
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx') && !name.endsWith('.doc')) {
      setErrorMsg('Invalid file format. Please upload a PDF (.pdf) or Word (.docx) document.');
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds 15MB limit.');
      return;
    }

    setErrorMsg(null);
    setFile(selectedFile);

    // Convert file to Base64 string for storage submission
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // 2. Start Parsing Engine
  const startParsing = async () => {
    if (!file) return;

    setStep('parsing');
    setErrorMsg(null);
    setParsingProgress(15);
    setProgressText('Extracting raw text from document (PDF / DOCX)...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate step progress for user feedback
      const progressTimer = setInterval(() => {
        setParsingProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          if (prev === 15) {
            setProgressText('Executing deterministic Regex extraction layer...');
            return 40;
          }
          if (prev === 40) {
            setProgressText('Executing Gemini AI LLM structured intelligence extraction...');
            return 65;
          }
          if (prev === 65) {
            setProgressText('Merging outputs & evaluating duplicate candidate records...');
            return 85;
          }
          return prev + 5;
        });
      }, 500);

      const res = await fetch('/api/candidates/import/parse', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Resume parsing failed.');
      }

      const data = await res.json();
      setParsingProgress(100);
      setProgressText('Parsing complete!');

      setParsedCandidate(data.parsedCandidate);
      setEditForm(data.parsedCandidate);
      setDuplicateMatch(data.duplicateMatch);

      // Route based on duplicate match
      if (data.duplicateMatch) {
        setStep('duplicate_warning');
      } else {
        setStep('review');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during resume parsing.');
      setStep('upload');
    }
  };

  // 3. Edit Form Field Helpers
  const handleSkillAdd = () => {
    if (newSkillInput.trim() && editForm.skills) {
      if (!editForm.skills.includes(newSkillInput.trim())) {
        setEditForm({
          ...editForm,
          skills: [...editForm.skills, newSkillInput.trim()]
        });
      }
      setNewSkillInput('');
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    if (editForm.skills) {
      setEditForm({
        ...editForm,
        skills: editForm.skills.filter(s => s !== skillToRemove)
      });
    }
  };

  // 4. Submit & Save Candidate
  const handleConfirmImport = async () => {
    if (!editForm.firstName || !editForm.email || !editForm.phone) {
      setErrorMsg('First Name, Email, and Phone Number are required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/candidates/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateData: editForm,
          fileName: file?.name || 'resume.pdf',
          mimeType: file?.type || 'application/pdf',
          fileBase64
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save candidate record.');
      }

      // Redirect to Candidate Repository
      router.push('/candidates');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete candidate import.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            AI Resume Parsing Engine
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Automated PDF & DOCX candidate extraction, multi-tenant duplicate detection, and review workflow.
          </p>
        </div>

        {step === 'review' && (
          <button
            onClick={() => setStep('upload')}
            className="px-4 py-2 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Upload Another Resume
          </button>
        )}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-extrabold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="h-4 w-4 text-rose-400 hover:text-rose-600" />
          </button>
        </div>
      )}

      {/* STEP 1: UPLOAD SCREEN */}
      {step === 'upload' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 rounded-2xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4"
          >
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <UploadCloud className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Drag and drop your candidate resume here
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Supports PDF (.pdf) and Word (.docx) documents up to 15MB
              </p>
            </div>

            <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Browse Resume File
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {file && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{file.name}</h4>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                  </p>
                </div>
              </div>

              <button
                onClick={startParsing}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all"
              >
                <span>Run AI Parsing Engine</span>
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PARSING PROGRESS STATE */}
      {step === 'parsing' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-6 shadow-sm animate-in fade-in duration-300">
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <Loader2 className="h-16 w-16 text-amber-500 animate-spin" />
            <Sparkles className="h-7 w-7 text-amber-600 absolute" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">
              AI Resume Parsing Engine in Progress
            </h2>
            <p className="text-xs font-bold text-amber-600 transition-all">{progressText}</p>
          </div>

          <div className="w-full max-w-md mx-auto bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 h-full rounded-full transition-all duration-300 shadow-glow-amber"
              style={{ width: `${parsingProgress}%` }}
            />
          </div>

          <p className="text-[11px] font-semibold text-slate-400">
            Extracting text ➔ Running Regex Rules ➔ Executing Gemini AI ➔ Checking Multi-Tenant Duplicates
          </p>
        </div>
      )}

      {/* STEP 3: DUPLICATE WARNING MODAL */}
      {step === 'duplicate_warning' && duplicateMatch && (
        <div className="bg-amber-50/80 rounded-3xl border-2 border-amber-400 p-8 space-y-6 shadow-xl animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shrink-0">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-amber-950">
                Potential Duplicate Candidate Found
              </h2>
              <p className="text-xs font-bold text-amber-800">
                An existing candidate record in your agency matches the extracted information on{' '}
                <span className="underline uppercase tracking-wide">{duplicateMatch.matchedOn}</span>.
              </p>
            </div>
          </div>

          {/* Existing Candidate Details Card */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {duplicateMatch.firstName} {duplicateMatch.lastName}
                </h4>
                <p className="text-[11px] font-mono text-slate-500">ID: {duplicateMatch.id}</p>
              </div>

              <span className="px-3 py-1 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800">
                Status: {duplicateMatch.ownershipStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-600" />
                <span>{duplicateMatch.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-600" />
                <span>{duplicateMatch.phone}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              onClick={() => router.push(`/candidates`)}
              className="px-5 py-3 rounded-xl bg-white border border-amber-300 text-amber-900 font-extrabold text-xs hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Candidate Repository</span>
            </button>

            <button
              onClick={() => setStep('review')}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue Import Anyway</span>
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW SCREEN */}
      {step === 'review' && editForm && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Review & Confirm Candidate Information
              </h2>
              <p className="text-xs font-bold text-slate-500">
                Verify and edit extracted candidate attributes before finalizing record creation.
              </p>
            </div>

            <span className="px-3 py-1 text-[11px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
              Parsed & Merged
            </span>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-600" /> First Name *
              </label>
              <input
                type="text"
                value={editForm.firstName || ''}
                onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-600" /> Last Name *
              </label>
              <input
                type="text"
                value={editForm.lastName || ''}
                onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-amber-600" /> Work Email * (Regex Extracted)
              </label>
              <input
                type="email"
                value={editForm.email || ''}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-amber-600" /> Phone Number * (Regex Extracted)
              </label>
              <input
                type="text"
                value={editForm.phone || ''}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Current Designation */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-amber-600" /> Current Designation
              </label>
              <input
                type="text"
                value={editForm.currentDesignation || ''}
                onChange={e => setEditForm({ ...editForm, currentDesignation: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Current Company */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-amber-600" /> Current Company
              </label>
              <input
                type="text"
                value={editForm.currentCompany || ''}
                onChange={e => setEditForm({ ...editForm, currentCompany: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Total Experience */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" /> Total Experience (Years)
              </label>
              <input
                type="number"
                step="0.5"
                value={editForm.totalExperienceYears ?? 0}
                onChange={e => setEditForm({ ...editForm, totalExperienceYears: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Notice Period */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" /> Notice Period (Days)
              </label>
              <input
                type="number"
                value={editForm.noticePeriodDays ?? 60}
                onChange={e => setEditForm({ ...editForm, noticePeriodDays: parseInt(e.target.value) || 60 })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Current CTC */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-amber-600" /> Current CTC (LPA)
              </label>
              <input
                type="number"
                step="0.5"
                value={editForm.currentCtcLpa ?? ''}
                onChange={e => setEditForm({ ...editForm, currentCtcLpa: parseFloat(e.target.value) || undefined })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Expected CTC */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-amber-600" /> Expected CTC (LPA)
              </label>
              <input
                type="number"
                step="0.5"
                value={editForm.expectedCtcLpa ?? ''}
                onChange={e => setEditForm({ ...editForm, expectedCtcLpa: parseFloat(e.target.value) || undefined })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Current Location */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-600" /> Current Location
              </label>
              <input
                type="text"
                value={editForm.currentLocation || ''}
                onChange={e => setEditForm({ ...editForm, currentLocation: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Primary Skills */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Primary Skills Taxonomy (AI Extracted)
              </label>
              
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] items-center">
                {editForm.skills?.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <span>{skill}</span>
                    <button type="button" onClick={() => handleSkillRemove(skill)}>
                      <X className="h-3.5 w-3.5 text-amber-700 hover:text-rose-600" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Next.js, System Design)"
                  value={newSkillInput}
                  onChange={e => setNewSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleSkillAdd}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>

          {/* Confirm & Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleConfirmImport}
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating Candidate Record...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Save Candidate Record</span>
                  <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
