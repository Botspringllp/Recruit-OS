'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MANDATORY_COMPLIANCE_CATEGORIES } from '@/lib/constants/compliance';
import {
  uploadCandidateDocumentAction,
  updateCandidateDocumentAction
} from '@/app/actions/compliance';

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
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Candidate <span className="text-rose-400">*</span>
          </label>
          <select
            disabled={isEdit}
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
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
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Document Category <span className="text-rose-400">*</span>
          </label>
          <select
            value={documentCategory}
            onChange={(e) => setDocumentCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
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
      <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-950/40">
        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-white mb-1">
          {fileName ? `Selected File: ${fileName}` : 'Click to select document or drop file here'}
        </p>
        <p className="text-xs text-slate-500 mb-4">Supports PDF, PNG, JPG, DOCX up to 25MB</p>
        <input
          type="file"
          id="file-input"
          onChange={handleSimulatedFileUpload}
          className="hidden"
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-colors"
        >
          Browse Local Document
        </label>
      </div>

      {/* File Name & File URL override */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            File Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="e.g. Aarav_Sharma_Aadhaar_Card.pdf"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Document Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Recruiter Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Verification & Recruiter Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add background notes or verification instructions..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
        >
          {isPending ? 'Saving...' : isEdit ? 'Update Document' : 'Upload Document'}
        </button>
      </div>
    </form>
  );
}
