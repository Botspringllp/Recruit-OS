'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  MapPin,
  X,
  ExternalLink,
  Loader2,
  Zap,
  Save,
  Layers,
  Award
} from 'lucide-react';
import { createCandidateAction } from '@/app/actions/candidates';
import { ParsedCandidate, DuplicateCandidateMatch } from '@/lib/parser/types';

function SinglePageCandidateIntake() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume File States
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);

  // Parsing Telemetry States
  const [isParsing, setIsParsing] = useState(false);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [parsingCompleted, setParsingCompleted] = useState(false);

  // Error & Duplicate Detection States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateCandidateMatch | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Form Fields State (Editable by Recruiter)
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    currentCompany: string;
    currentDesignation: string;
    totalExperienceYears: string;
    currentLocation: string;
    source: string;
    noticePeriodDays?: string;
    currentCtcLpa?: string;
    expectedCtcLpa?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    skills?: string[];
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentCompany: '',
    currentDesignation: '',
    totalExperienceYears: '',
    currentLocation: '',
    source: 'DIRECT_INTAKE',
    noticePeriodDays: '',
    currentCtcLpa: '',
    expectedCtcLpa: '',
    linkedinUrl: '',
    githubUrl: '',
    skills: []
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Handle File Selection
  const handleFileSelect = (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx') && !name.endsWith('.doc')) {
      setErrorMsg('Invalid file format. Please upload a PDF (.pdf) or Word (.docx) document.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit.');
      return;
    }

    setErrorMsg(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Run AI Resume Parsing Pipeline
  const startParsing = async () => {
    if (!file) {
      setErrorMsg('Please select or drag & drop a resume file first.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    setParsingProgress(15);
    setProgressText('1. Extracting Resume Text...');

    try {
      const dataPayload = new FormData();
      dataPayload.append('file', file);

      const progressTimer = setInterval(() => {
        setParsingProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          if (prev === 15) {
            setProgressText('2. Running Regex Extraction...');
            return 35;
          }
          if (prev === 35) {
            setProgressText('3. Running AI Analysis...');
            return 60;
          }
          if (prev === 60) {
            setProgressText('4. Checking Duplicates...');
            return 80;
          }
          return prev + 5;
        });
      }, 350);

      const res = await fetch('/api/candidates/import/parse', {
        method: 'POST',
        body: dataPayload
      });

      clearInterval(progressTimer);

      const contentType = res.headers.get('content-type') || '';
      let resultData: any = {};

      if (contentType.includes('application/json')) {
        resultData = await res.json();
      } else {
        const rawText = await res.text();
        console.error('Non-JSON response received from parse endpoint:', rawText);
        throw new Error(`Server returned status ${res.status}. Could not process resume file.`);
      }

      if (!res.ok) {
        throw new Error(resultData.error || `Resume parsing failed with status ${res.status}`);
      }

      setParsingProgress(100);
      setProgressText('5. Preparing Candidate Profile...');

      const parsed: ParsedCandidate = resultData.parsedCandidate;
      setDuplicateMatch(resultData.duplicateMatch);

      // Auto-Populate Form Fields below
      setFormData(prev => ({
        ...prev,
        firstName: parsed.firstName || prev.firstName,
        lastName: parsed.lastName || prev.lastName,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
        currentCompany: parsed.currentCompany || prev.currentCompany,
        currentDesignation: parsed.currentDesignation || prev.currentDesignation,
        totalExperienceYears: parsed.totalExperienceYears !== undefined && parsed.totalExperienceYears !== null ? String(parsed.totalExperienceYears) : prev.totalExperienceYears,
        currentLocation: parsed.currentLocation || prev.currentLocation,
        noticePeriodDays: parsed.noticePeriodDays !== undefined && parsed.noticePeriodDays !== null ? String(parsed.noticePeriodDays) : prev.noticePeriodDays,
        currentCtcLpa: parsed.currentCtcLpa !== undefined && parsed.currentCtcLpa !== null ? String(parsed.currentCtcLpa) : prev.currentCtcLpa,
        expectedCtcLpa: parsed.expectedCtcLpa !== undefined && parsed.expectedCtcLpa !== null ? String(parsed.expectedCtcLpa) : prev.expectedCtcLpa,
        linkedinUrl: parsed.linkedinUrl || prev.linkedinUrl,
        githubUrl: parsed.githubUrl || prev.githubUrl,
        skills: parsed.skills || prev.skills || []
      }));

      setIsParsing(false);
      setParsingCompleted(true);

      if (resultData.duplicateMatch) {
        setShowDuplicateModal(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during resume parsing.');
      setIsParsing(false);
    }
  };

  const handleSkillAdd = () => {
    if (newSkillInput.trim()) {
      const currentSkills = formData.skills || [];
      if (!currentSkills.includes(newSkillInput.trim())) {
        setFormData(prev => ({ ...prev, skills: [...(prev.skills || []), newSkillInput.trim()] }));
      }
      setNewSkillInput('');
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(s => s !== skillToRemove)
    }));
  };

  // Submit Candidate Record (Manual or Auto-Parsed)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFormErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First Name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last Name is required';
    if (!formData.email.trim()) errors.email = 'Email Address is required';
    if (!formData.phone.trim()) errors.phone = 'Phone Number is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (file && fileBase64) {
        // Submit via resume import confirm API route
        const confirmRes = await fetch('/api/candidates/import/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateData: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              currentCompany: formData.currentCompany || undefined,
              currentDesignation: formData.currentDesignation || undefined,
              totalExperienceYears: formData.totalExperienceYears ? parseFloat(formData.totalExperienceYears) : undefined,
              currentLocation: formData.currentLocation || undefined,
              source: formData.source || 'DIRECT_INTAKE',
              noticePeriodDays: formData.noticePeriodDays ? parseInt(formData.noticePeriodDays) : undefined,
              currentCtcLpa: formData.currentCtcLpa ? parseFloat(formData.currentCtcLpa) : undefined,
              expectedCtcLpa: formData.expectedCtcLpa ? parseFloat(formData.expectedCtcLpa) : undefined,
              linkedinUrl: formData.linkedinUrl || undefined,
              githubUrl: formData.githubUrl || undefined,
              skills: formData.skills || []
            },
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            fileBase64
          })
        });

        const contentType = confirmRes.headers.get('content-type') || '';
        let confirmData: any = {};

        if (contentType.includes('application/json')) {
          confirmData = await confirmRes.json();
        } else {
          const rawText = await confirmRes.text();
          console.error('Non-JSON response received from confirm endpoint:', rawText);
          throw new Error(`Server returned status ${confirmRes.status}. Failed to save candidate record.`);
        }

        if (!confirmRes.ok) {
          throw new Error(confirmData.error || `Saving candidate failed with status ${confirmRes.status}`);
        }

        router.push('/candidates');
        router.refresh();
      } else {
        // Direct manual submission via FormData & Server Action
        const actionData = new FormData();
        actionData.append('firstName', formData.firstName);
        actionData.append('lastName', formData.lastName);
        actionData.append('email', formData.email);
        actionData.append('phone', formData.phone);
        if (formData.currentCompany) actionData.append('currentCompany', formData.currentCompany);
        if (formData.currentDesignation) actionData.append('currentDesignation', formData.currentDesignation);
        if (formData.totalExperienceYears) actionData.append('totalExperienceYears', formData.totalExperienceYears);
        if (formData.currentLocation) actionData.append('currentLocation', formData.currentLocation);
        actionData.append('source', formData.source);

        const actionResult = await createCandidateAction(null, actionData);

        if (actionResult.success) {
          router.push('/candidates');
          router.refresh();
        } else {
          if (actionResult.error) setErrorMsg(actionResult.error);
          if (actionResult.errors) setFormErrors(actionResult.errors);
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save candidate record.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserPlus className="h-6 w-6 text-amber-500" />
            Add New Candidate
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Upload resume for automated parsing or fill details manually.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/candidates')}
          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Repository
        </button>
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <X className="h-4 w-4 text-rose-400 hover:text-rose-600" />
          </button>
        </div>
      )}

      {/* MAIN SINGLE INTAKE CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        
        {/* SECTION 1: EMBEDDED RESUME UPLOAD AREA */}
        <div className="space-y-4">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/20 rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center space-y-3"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-xs">
              <UploadCloud className="h-5 w-5 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Click or Drag & Drop Candidate Resume (PDF / DOCX)
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Select a candidate resume file, then click the Auto-Parse button to auto-fill the details.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {file ? `Change File (${file.name})` : 'Select File'}
              </button>

              <button
                type="button"
                onClick={startParsing}
                disabled={isParsing}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isParsing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <Zap className="h-4 w-4 fill-slate-950 stroke-none" />
                )}
                <span>Auto-Parse Resume</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-bold pt-1">
              Supported formats: PDF, DOCX | Max file size: 10MB
            </p>
          </div>

          {/* FILE & PARSING TELEMETRY */}
          {file && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-800">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{file.name}</h4>
                  <p className="text-[11px] font-bold text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                  </p>
                </div>
              </div>

              {parsingCompleted && (
                <span className="px-3 py-1 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Auto-Populated Below
                </span>
              )}
            </div>
          )}

          {/* PARSING PROGRESS BAR */}
          {isParsing && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-xs font-extrabold">
                <span className="text-slate-900 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  Parsing Stage: <span className="text-amber-600 font-black">{progressText}</span>
                </span>
                <span className="text-amber-600 font-black">{parsingProgress}%</span>
              </div>

              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-300">
                <div
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${parsingProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-5 gap-1 text-[9px] font-extrabold text-slate-500 text-center">
                <span className={parsingProgress >= 15 ? 'text-amber-600 font-black' : ''}>1. Text</span>
                <span className={parsingProgress >= 35 ? 'text-amber-600 font-black' : ''}>2. Regex</span>
                <span className={parsingProgress >= 60 ? 'text-amber-600 font-black' : ''}>3. AI</span>
                <span className={parsingProgress >= 80 ? 'text-amber-600 font-black' : ''}>4. Duplicates</span>
                <span className={parsingProgress >= 100 ? 'text-amber-600 font-black' : ''}>5. Profile</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: CANDIDATE DATA FORM (MATCHING REFERENCE UI) */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            {/* FIRST NAME */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-600" />
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => handleInputChange('firstName', e.target.value)}
                placeholder="e.g. Rahul"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              {formErrors.firstName && <p className="text-[11px] font-bold text-rose-500">{formErrors.firstName}</p>}
            </div>

            {/* LAST NAME */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-600" />
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                placeholder="e.g. Sharma"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              {formErrors.lastName && <p className="text-[11px] font-bold text-rose-500">{formErrors.lastName}</p>}
            </div>

            {/* EMAIL ADDRESS */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-amber-600" />
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="e.g. rahul.sharma@example.com"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              {formErrors.email && <p className="text-[11px] font-bold text-rose-500">{formErrors.email}</p>}
            </div>

            {/* PHONE NUMBER */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-amber-600" />
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="e.g. +919876543210"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              {formErrors.phone && <p className="text-[11px] font-bold text-rose-500">{formErrors.phone}</p>}
            </div>

            {/* CURRENT COMPANY */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-amber-600" />
                Current Company
              </label>
              <input
                type="text"
                value={formData.currentCompany}
                onChange={e => handleInputChange('currentCompany', e.target.value)}
                placeholder="e.g. TechCorp Solutions"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            {/* DESIGNATION / ROLE */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-amber-600" />
                Designation / Role
              </label>
              <input
                type="text"
                value={formData.currentDesignation}
                onChange={e => handleInputChange('currentDesignation', e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            {/* TOTAL EXPERIENCE */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                Total Experience (Years)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.totalExperienceYears}
                onChange={e => handleInputChange('totalExperienceYears', e.target.value)}
                placeholder="e.g. 5.5"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            {/* LOCATION */}
            <div className="space-y-1.5">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                Location
              </label>
              <input
                type="text"
                value={formData.currentLocation}
                onChange={e => handleInputChange('currentLocation', e.target.value)}
                placeholder="e.g. Bengaluru, India"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            {/* CANDIDATE SOURCE */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-600" />
                Candidate Source
              </label>
              <select
                value={formData.source}
                onChange={e => handleInputChange('source', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
              >
                <option value="DIRECT_INTAKE">Direct Intake</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="PORTAL_JOB_BOARD">Portal Job Board</option>
                <option value="REFERRAL">Referral</option>
                <option value="AGENCY_PARTNER">Agency Partner</option>
              </select>
            </div>

            {/* SKILLS TAXONOMY TAGS */}
            {(formData.skills && formData.skills.length > 0) || parsingCompleted ? (
              <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100">
                <label className="text-slate-900 font-extrabold uppercase tracking-wider text-[11px] block">
                  Extracted Skills & Competencies
                </label>

                <div className="flex flex-wrap gap-2 p-3 bg-amber-50/40 border border-amber-200 rounded-xl min-h-[46px] items-center">
                  {formData.skills?.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-950 text-xs font-extrabold flex items-center gap-1.5"
                    >
                      <span>{skill}</span>
                      <button type="button" onClick={() => handleSkillRemove(skill)}>
                        <X className="h-3.5 w-3.5 text-amber-800 hover:text-rose-600" />
                      </button>
                    </span>
                  ))}
                  {(!formData.skills || formData.skills.length === 0) && (
                    <span className="text-xs text-slate-400 font-semibold italic">No skills added yet.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add skill tag (e.g. Next.js, System Design)"
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
                    className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleSkillAdd}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
            ) : null}

          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push('/candidates')}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-400/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 stroke-[2.5]" />
                  Save Candidate Record
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* DUPLICATE WARNING MODAL */}
      {showDuplicateModal && duplicateMatch && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border-2 border-amber-400 p-6 sm:p-8 space-y-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Potential Duplicate Candidate Found
                </h3>
                <p className="text-xs font-bold text-amber-800">
                  An existing candidate matches on{' '}
                  <span className="underline uppercase tracking-wide">{duplicateMatch.matchedOn}</span>.
                </p>
              </div>
            </div>

            <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 space-y-2 text-xs font-bold text-slate-800">
              <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
                <span className="text-slate-900 font-black">
                  {duplicateMatch.firstName} {duplicateMatch.lastName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-black">
                  {duplicateMatch.ownershipStatus}
                </span>
              </div>
              <p className="text-slate-600 font-semibold">ID: {duplicateMatch.id}</p>
              <p className="text-slate-600 font-semibold">Email: {duplicateMatch.email}</p>
              <p className="text-slate-600 font-semibold">Phone: {duplicateMatch.phone}</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/candidates/${duplicateMatch.id}`)}
                className="px-4 py-2.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                Open Existing Candidate
              </button>

              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl transition shadow-xs cursor-pointer"
              >
                Continue Import
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setFile(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCandidatePage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-500 font-bold flex items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        <span>Loading Single Screen Candidate Intake...</span>
      </div>
    }>
      <SinglePageCandidateIntake />
    </Suspense>
  );
}
