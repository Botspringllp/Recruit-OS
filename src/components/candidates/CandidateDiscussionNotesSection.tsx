'use client';

import React, { useState } from 'react';
import {
  MessageSquareText,
  ChevronDown,
  Edit3,
  Check,
  X,
  Loader2,
  Briefcase,
  GraduationCap,
  Building2,
  DollarSign,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  Plus
} from 'lucide-react';
import { upsertCandidateDiscussionNoteAction } from '@/app/actions/candidateDiscussion';

export interface DiscussionNoteData {
  id?: string;
  readyToRelocate?: string | null;
  totalExperience?: string | null;
  relevantExperience?: string | null;
  currentDesignation?: string | null;
  qualification?: string | null;
  currentCompany?: string | null;
  currentSalary?: string | null;
  expectedSalary?: string | null;
  noticePeriod?: string | null;
  reasonOfLeaving?: string | null;
  offerInHand?: string | null;
  offerDetails?: string | null;
  recruiterNotes?: string | null;
  updatedAt?: Date | string | null;
}

interface CandidateDiscussionNotesSectionProps {
  candidateId: string;
  initialNote?: DiscussionNoteData | null;
}

export function CandidateDiscussionNotesSection({
  candidateId,
  initialNote
}: CandidateDiscussionNotesSectionProps) {
  // Check if initialNote has any actual content
  const hasExistingContent = Boolean(
    initialNote &&
    (initialNote.readyToRelocate ||
      initialNote.totalExperience ||
      initialNote.relevantExperience ||
      initialNote.currentDesignation ||
      initialNote.qualification ||
      initialNote.currentCompany ||
      initialNote.currentSalary ||
      initialNote.expectedSalary ||
      initialNote.noticePeriod ||
      initialNote.reasonOfLeaving ||
      initialNote.offerInHand ||
      initialNote.offerDetails ||
      initialNote.recruiterNotes)
  );

  // Dropdown / Accordion state
  const [isOpen, setIsOpen] = useState(hasExistingContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Empty initial note object (NO pre-filled defaults)
  const emptyNote: DiscussionNoteData = {
    readyToRelocate: '',
    totalExperience: '',
    relevantExperience: '',
    currentDesignation: '',
    qualification: '',
    currentCompany: '',
    currentSalary: '',
    expectedSalary: '',
    noticePeriod: '',
    reasonOfLeaving: '',
    offerInHand: '',
    offerDetails: '',
    recruiterNotes: ''
  };

  const [noteData, setNoteData] = useState<DiscussionNoteData>(initialNote || emptyNote);
  const [formData, setFormData] = useState<DiscussionNoteData>(noteData);

  function handleToggleDropdown() {
    setIsOpen(prev => !prev);
  }

  function handleStartEdit() {
    setFormData(noteData);
    setErrorMessage(null);
    setSaveSuccessMsg(null);
    setIsOpen(true);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setFormData(noteData);
    setIsEditing(false);
    setErrorMessage(null);
  }

  function handleChange(field: keyof DiscussionNoteData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function appendRecruiterNoteTemplate(templateText: string) {
    setFormData(prev => ({
      ...prev,
      recruiterNotes: prev.recruiterNotes ? `${prev.recruiterNotes}\n${templateText}` : templateText
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    const payload = {
      readyToRelocate: formData.readyToRelocate || undefined,
      totalExperience: formData.totalExperience || undefined,
      relevantExperience: formData.relevantExperience || undefined,
      currentDesignation: formData.currentDesignation || undefined,
      qualification: formData.qualification || undefined,
      currentCompany: formData.currentCompany || undefined,
      currentSalary: formData.currentSalary || undefined,
      expectedSalary: formData.expectedSalary || undefined,
      noticePeriod: formData.noticePeriod || undefined,
      reasonOfLeaving: formData.reasonOfLeaving || undefined,
      offerInHand: formData.offerInHand || undefined,
      offerDetails: formData.offerDetails || undefined,
      recruiterNotes: formData.recruiterNotes || undefined,
    };

    const res = await upsertCandidateDiscussionNoteAction(candidateId, payload);
    setIsSaving(false);

    if (res.success && res.note) {
      setNoteData(res.note);
      setIsEditing(false);
      setSaveSuccessMsg('Candidate discussion notes saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to save candidate discussion notes');
    }
  }

  const isDataFilled = Boolean(
    noteData.readyToRelocate ||
    noteData.totalExperience ||
    noteData.relevantExperience ||
    noteData.currentDesignation ||
    noteData.qualification ||
    noteData.currentCompany ||
    noteData.currentSalary ||
    noteData.expectedSalary ||
    noteData.noticePeriod ||
    noteData.reasonOfLeaving ||
    noteData.offerInHand ||
    noteData.offerDetails ||
    noteData.recruiterNotes
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans transition-all">
      {/* DATALISTS FOR DROPDOWN OPTIONS + CUSTOM TYPING */}
      <datalist id="exp-options-list">
        <option value="0.5 Years" />
        <option value="1 Year" />
        <option value="2 Years" />
        <option value="3 Years" />
        <option value="4 Years" />
        <option value="5 Years" />
        <option value="6 Years" />
        <option value="7 Years" />
        <option value="8 Years" />
        <option value="10 Years" />
        <option value="12+ Years" />
      </datalist>

      <datalist id="rel-exp-options-list">
        <option value="0.5 Years" />
        <option value="1 Year" />
        <option value="2 Years" />
        <option value="3 Years" />
        <option value="4 Years" />
        <option value="5 Years" />
        <option value="6 Years" />
        <option value="8 Years" />
        <option value="10+ Years" />
      </datalist>

      <datalist id="designation-options-list">
        <option value="Software Engineer" />
        <option value="Senior Software Engineer" />
        <option value="Tech Lead" />
        <option value="Engineering Manager" />
        <option value="Frontend Developer" />
        <option value="Backend Developer" />
        <option value="Full Stack Engineer" />
        <option value="DevOps Engineer" />
        <option value="Product Manager" />
        <option value="QA Automation Engineer" />
        <option value="Data Engineer" />
        <option value="UI/UX Designer" />
        <option value="Business Analyst" />
      </datalist>

      <datalist id="degree-options-list">
        <option value="B.Tech / B.E." />
        <option value="M.Tech / M.E." />
        <option value="BCA" />
        <option value="MCA" />
        <option value="B.Sc Computer Science" />
        <option value="M.Sc Information Tech" />
        <option value="MBA" />
        <option value="Diploma in Engineering" />
      </datalist>

      <datalist id="salary-options-list">
        <option value="3 LPA" />
        <option value="5 LPA" />
        <option value="7 LPA" />
        <option value="10 LPA" />
        <option value="12 LPA" />
        <option value="15 LPA" />
        <option value="18 LPA" />
        <option value="20 LPA" />
        <option value="25 LPA" />
        <option value="30 LPA" />
        <option value="40+ LPA" />
      </datalist>

      <datalist id="notice-period-list">
        <option value="Immediate / 0 Days" />
        <option value="15 Days" />
        <option value="30 Days (1 Month)" />
        <option value="45 Days" />
        <option value="60 Days (2 Months)" />
        <option value="90 Days (3 Months)" />
        <option value="Serving Notice (LWD fixed)" />
      </datalist>

      <datalist id="leaving-reasons-list">
        <option value="Better Career Growth & Learning Opportunities" />
        <option value="Higher Compensation & CTC Hike" />
        <option value="Relocation / Personal Reasons" />
        <option value="Company Restructuring / Layoffs" />
        <option value="Project Completion / End of Contract" />
        <option value="Looking for Remote / Hybrid Work Culture" />
      </datalist>

      {/* ACCORDION HEADER BUTTON */}
      <div
        className="p-5 sm:p-6 bg-slate-50/80 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-4 cursor-pointer select-none border-b border-slate-200/60"
        onClick={handleToggleDropdown}
      >
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-black text-base text-slate-900 tracking-tight">
                Candidate Discussion Notes
              </h3>
              {isDataFilled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300">
                  Notes Logged
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700 border border-slate-300">
                  Empty / Pending
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Click to {isOpen ? 'collapse' : 'open dropdown'} & select or type candidate discussion details
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit();
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isDataFilled ? (
                <>
                  <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Edit Notes</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 text-amber-400" />
                  <span>Fill Notes</span>
                </>
              )}
            </button>
          )}

          <div className={`p-2 rounded-xl bg-white border border-slate-200 text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* DROPDOWN CONTENT */}
      {isOpen && (
        <div className="p-6 sm:p-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {saveSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-extrabold text-emerald-900 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-extrabold text-rose-900 flex items-center gap-2">
              <X className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* EDIT FORM */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                {/* 1. Ready To Relocate */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ready To Relocate
                  </label>
                  <select
                    value={formData.readyToRelocate || ''}
                    onChange={e => handleChange('readyToRelocate', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="">-- Choose Relocation Status --</option>
                    <option value="Yes">Yes (Ready to Relocate)</option>
                    <option value="No">No (Preferred Location Only)</option>
                    <option value="Open to Hybrid / Remote">Open to Hybrid / Remote</option>
                    <option value="Conditional">Conditional (Dependent on Package)</option>
                  </select>
                </div>

                {/* 2. Total Experience (Dropdown + Custom Type) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Experience
                  </label>
                  <input
                    type="text"
                    list="exp-options-list"
                    placeholder="Select dropdown or type e.g. 5.5 Years"
                    value={formData.totalExperience || ''}
                    onChange={e => handleChange('totalExperience', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  />
                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['1 Year', '3 Years', '5 Years', '8 Years', '10 Years'].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => handleChange('totalExperience', val)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 rounded-lg text-[10px] font-extrabold text-slate-600 transition"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Relevant Experience (Dropdown + Custom Type) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Relevant Experience
                  </label>
                  <input
                    type="text"
                    list="rel-exp-options-list"
                    placeholder="Select dropdown or type e.g. 4 Years"
                    value={formData.relevantExperience || ''}
                    onChange={e => handleChange('relevantExperience', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['1 Year', '2 Years', '4 Years', '6 Years', '8+ Years'].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => handleChange('relevantExperience', val)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 rounded-lg text-[10px] font-extrabold text-slate-600 transition"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Current Designation (Dropdown + Custom Type) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Designation
                  </label>
                  <input
                    type="text"
                    list="designation-options-list"
                    placeholder="Select or type designation..."
                    value={formData.currentDesignation || ''}
                    onChange={e => handleChange('currentDesignation', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* 5. Qualification / Degree (Custom Type + Suggestions) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Qualification / Degree
                  </label>
                  <input
                    type="text"
                    list="degree-options-list"
                    placeholder="Type qualification e.g. B.Tech CS"
                    value={formData.qualification || ''}
                    onChange={e => handleChange('qualification', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* 6. Current / Last Company */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current / Last Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Infosys / TCS / Startup"
                    value={formData.currentCompany || ''}
                    onChange={e => handleChange('currentCompany', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* 7. Current Salary (CTC) (Dropdown + Custom Type) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Salary (CTC)
                  </label>
                  <input
                    type="text"
                    list="salary-options-list"
                    placeholder="Select or type e.g. 12 LPA"
                    value={formData.currentSalary || ''}
                    onChange={e => handleChange('currentSalary', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['6 LPA', '10 LPA', '15 LPA', '20 LPA', '25 LPA'].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => handleChange('currentSalary', val)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 rounded-lg text-[10px] font-extrabold text-slate-600 transition"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Expected Salary (CTC) (Dropdown + Custom Type) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Expected Salary (CTC)
                  </label>
                  <input
                    type="text"
                    list="salary-options-list"
                    placeholder="Select or type e.g. 16 LPA"
                    value={formData.expectedSalary || ''}
                    onChange={e => handleChange('expectedSalary', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['8 LPA', '12 LPA', '18 LPA', '25 LPA', '30 LPA'].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => handleChange('expectedSalary', val)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 rounded-lg text-[10px] font-extrabold text-slate-600 transition"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 9. Notice Period (Dropdown + Custom Type) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notice Period
                  </label>
                  <input
                    type="text"
                    list="notice-period-list"
                    placeholder="Select or type e.g. 30 Days"
                    value={formData.noticePeriod || ''}
                    onChange={e => handleChange('noticePeriod', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Immediate', '15 Days', '30 Days', '60 Days', '90 Days'].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => handleChange('noticePeriod', val)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 rounded-lg text-[10px] font-extrabold text-slate-600 transition"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reason of Leaving & Offer In Hand Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* 10. Reason Of Leaving */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reason Of Leaving
                  </label>
                  <input
                    type="text"
                    list="leaving-reasons-list"
                    placeholder="Select dropdown or type reason..."
                    value={formData.reasonOfLeaving || ''}
                    onChange={e => handleChange('reasonOfLeaving', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition mb-2"
                  />
                  <textarea
                    rows={2}
                    placeholder="Additional details on reason for leaving..."
                    value={formData.reasonOfLeaving || ''}
                    onChange={e => handleChange('reasonOfLeaving', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition resize-y text-xs"
                  />
                </div>

                {/* 11 & 12. Offer In Hand & Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Offer In Hand?
                    </label>
                    <select
                      value={formData.offerInHand || ''}
                      onChange={e => handleChange('offerInHand', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                    >
                      <option value="">-- Select Offer Status --</option>
                      <option value="No">No (No active offers)</option>
                      <option value="Yes">Yes (Has competing offer)</option>
                      <option value="Multiple Offers">Multiple Active Offers</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Offer Details
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Offered 14.5 LPA by TechCorp, LWD 30th Sept"
                      value={formData.offerDetails || ''}
                      onChange={e => handleChange('offerDetails', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* 13. Recruiter Discussion Notes Textarea with Quick Action Templates */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Recruiter Discussion Notes & Screening Remarks
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => appendRecruiterNoteTemplate('Communication: Fluent & confident.')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold transition"
                    >
                      + Communication
                    </button>
                    <button
                      type="button"
                      onClick={() => appendRecruiterNoteTemplate('Technical Rating: 8/10.')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold transition"
                    >
                      + Rating
                    </button>
                    <button
                      type="button"
                      onClick={() => appendRecruiterNoteTemplate('Availability: Available for client interview immediately.')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-extrabold transition"
                    >
                      + Availability
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  placeholder="Enter detailed screening notes, technical feedback, communication rating, culture fit, availability for interviews..."
                  value={formData.recruiterNotes || ''}
                  onChange={e => handleChange('recruiterNotes', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition resize-y text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Notes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>Save Discussion Notes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* READ / DISPLAY MODE */
            <div className="space-y-6">
              {isDataFilled ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                    {/* Ready to Relocate */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Ready To Relocate</span>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className={`font-extrabold text-xs px-2.5 py-0.5 rounded-full border ${
                          noteData.readyToRelocate === 'Yes'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : noteData.readyToRelocate === 'No'
                            ? 'bg-rose-100 text-rose-950 border-rose-300'
                            : 'bg-amber-100 text-amber-950 border-amber-300'
                        }`}>
                          {noteData.readyToRelocate || 'Not Specified'}
                        </span>
                      </div>
                    </div>

                    {/* Total Experience */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Experience</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-black text-slate-900 text-sm">{noteData.totalExperience || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Relevant Experience */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Relevant Experience</span>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-black text-slate-900 text-sm">{noteData.relevantExperience || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Current Designation */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Designation</span>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs truncate">{noteData.currentDesignation || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Qualification */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Qualification</span>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs truncate">{noteData.qualification || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Current / Last Company */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current / Last Company</span>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs truncate">{noteData.currentCompany || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Current Salary */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current Salary (CTC)</span>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-black text-slate-900 text-sm">{noteData.currentSalary || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Expected Salary */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Expected Salary (CTC)</span>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="font-black text-amber-700 text-sm">{noteData.expectedSalary || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Notice Period */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Notice Period</span>
                      <span className="font-extrabold text-slate-900 block text-xs">{noteData.noticePeriod || 'Not Specified'}</span>
                    </div>

                    {/* Offer In Hand & Details */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Offer In Hand</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          noteData.offerInHand === 'Yes' || noteData.offerInHand === 'Multiple Offers'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}>
                          {noteData.offerInHand || 'No'}
                        </span>
                      </div>
                      <p className="font-medium text-slate-700 text-xs italic">
                        {noteData.offerDetails || 'No details provided.'}
                      </p>
                    </div>

                    {/* Reason of Leaving */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Reason Of Leaving</span>
                      <p className="font-medium text-slate-700 text-xs">
                        {noteData.reasonOfLeaving || 'No specific reason logged.'}
                      </p>
                    </div>
                  </div>

                  {/* Recruiter Remarks Box */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600" />
                      Recruiter Discussion Notes & Screening Remarks
                    </h4>
                    {noteData.recruiterNotes ? (
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap pt-1">
                        {noteData.recruiterNotes}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-slate-400 italic pt-1">
                        No screening remarks logged yet.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                /* EMPTY STATE CALL TO ACTION */
                <div className="py-8 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
                  <MessageSquareText className="h-8 w-8 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">No discussion notes logged yet</h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      Click below to open the form and select/type candidate details.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Fill Discussion Notes</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
