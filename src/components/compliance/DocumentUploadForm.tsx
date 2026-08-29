'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MANDATORY_COMPLIANCE_CATEGORIES } from '@/lib/constants/compliance';
import {
  uploadCandidateDocumentAction,
  updateCandidateDocumentAction
} from '@/app/actions/compliance';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface CandidateOption {
  id: string;
  name: string;
  email: string;
}

interface Props {
  candidates: CandidateOption[];
  initialData?: {
    id: string;
    candidateId: string;
    documentCategory: string;
    fileName: string;
    fileUrl: string;
    expiryDate?: string;
    notes?: string;
  };
  isEdit?: boolean;
}

export function DocumentUploadForm({ candidates, initialData, isEdit = false }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [candidateId, setCandidateId] = useState(initialData?.candidateId || '');
  const [documentCategory, setDocumentCategory] = useState(initialData?.documentCategory || 'RESUME');
  const [fileName, setFileName] = useState(initialData?.fileName || '');
  const [fileUrl, setFileUrl] = useState(initialData?.fileUrl || '');
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate ? initialData.expiryDate.split('T')[0] : '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setFileUrl('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && !candidateId) {
      setError('Please select a candidate');
      return;
    }
    if (!fileName && !selectedFile) {
      setError('Please specify or upload a document file');
      return;
    }

    const formData = new FormData();
    formData.append('candidateId', candidateId);
    formData.append('documentCategory', documentCategory);
    formData.append('fileName', fileName || selectedFile?.name || 'document.pdf');
    if (selectedFile) {
      formData.append('file', selectedFile);
      formData.append('fileSize', selectedFile.size.toString());
    } else {
      formData.append('fileSize', '204800');
    }
    if (fileUrl) formData.append('fileUrl', fileUrl);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    if (notes) formData.append('notes', notes);

    startTransition(async () => {
      let res;
      if (isEdit && initialData?.id) {
        res = await updateCandidateDocumentAction(initialData.id, formData);
      } else {
        res = await uploadCandidateDocumentAction(formData);
      }

      if (res.success) {
        router.push('/compliance');
        router.refresh();
      } else {
        setError(res.error || 'Failed to save document');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 font-sans">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate Selection */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
            Select Candidate <span className="text-rose-500">*</span>
          </label>
          <select
            disabled={isEdit}
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
            required
          >
            <option value="">-- Choose Candidate --</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        {/* Document Category */}
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
            Document Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={documentCategory}
            onChange={(e) => setDocumentCategory(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            required
          >
            {MANDATORY_COMPLIANCE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl p-6 text-center transition-all bg-amber-50/40">
        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl w-12 h-12 mx-auto flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-black text-slate-900 mb-1">
          {fileName ? `Selected File: ${fileName}` : 'Click to select document or drop file here'}
        </p>
        <p className="text-xs text-slate-500 font-semibold mb-4">Supports PDF, PNG, JPG, DOCX up to 25MB</p>
        <input
          type="file"
          id="file-input"
          onChange={handleSimulatedFileUpload}
          className="hidden"
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-xs font-extrabold text-slate-800 rounded-xl transition-all shadow-xs"
        >
          Browse Local Document
        </label>
      </div>

      {/* File Name & File URL override */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
            File Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="e.g. Aarav_Sharma_Aadhaar_Card.pdf"
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">Document Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Recruiter Notes */}
      <div>
        <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">Verification & Recruiter Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add background notes or verification instructions..."
          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-extrabold transition flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
          {isPending ? 'Saving...' : isEdit ? 'Update Document' : 'Upload Document'}
        </button>
      </div>
    </form>
  );
}
