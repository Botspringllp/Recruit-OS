'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Loader2, Sparkles, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { parseJobMandateAction } from '@/app/actions/mandates-upload';
import { createJobMandateAction } from '@/app/actions/jobs';
import { JobForm } from '@/components/jobs/JobForm';

interface ClientOption {
  id: string;
  companyName: string;
}

interface UploadJobMandateButtonProps {
  clients: ClientOption[];
}

export const UploadJobMandateButton: React.FC<UploadJobMandateButtonProps> = ({ clients }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleButtonClick = () => {
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (20 MB)
    const MAX_SIZE_MB = 20;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File size exceeds ${MAX_SIZE_MB} MB limit. Please select a smaller file.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Supported formats check
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const fileName = file.name.toLowerCase();
    if (!validExtensions.some(ext => fileName.endsWith(ext))) {
      setErrorMessage('Unsupported file format. Please upload a valid PDF (.pdf) or Word document (.docx, .doc).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setWarningMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await parseJobMandateAction(formData);
      setIsAnalyzing(false);

      if (res.success && res.data) {
        // Try matching extracted clientName with available clients list
        let matchedClientId = '';
        if (res.data.clientName) {
          const match = clients.find(c =>
            c.companyName.toLowerCase().includes(res.data!.clientName.toLowerCase()) ||
            res.data!.clientName.toLowerCase().includes(c.companyName.toLowerCase())
          );
          if (match) matchedClientId = match.id;
        }

        setExtractedData({
          title: res.data.title || '',
          clientId: matchedClientId,
          industry: res.data.industry || '',
          employmentType: res.data.employmentType || 'Full-Time',
          experience: res.data.experience || '',
          education: res.data.education || '',
          skills: res.data.skills || '',
          description: res.data.description || '',
          companyOverview: res.data.companyOverview || '',
          headcount: res.data.headcount || 1,
          minCtcLpa: res.data.minCtcLpa ? parseFloat(res.data.minCtcLpa) : null,
          maxCtcLpa: res.data.maxCtcLpa ? parseFloat(res.data.maxCtcLpa) : null,
          feePercentage: res.data.feePercentage ? parseFloat(res.data.feePercentage) : 8.33,
          status: 'OPEN'
        });

        if (res.confidence) setConfidence(res.confidence);
        if (res.warning) setWarningMessage(res.warning);

        setShowReviewModal(true);
      } else {
        setErrorMessage(res.error || 'Unable to extract mandate details. Please review manually.');
        // Open form anyway for manual review with whatever partial data
        setExtractedData({
          title: '',
          headcount: 1,
          feePercentage: 8.33,
          status: 'OPEN'
        });
        setWarningMessage('Unable to fully extract mandate details. Please review manually.');
        setShowReviewModal(true);
      }
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCloseModal = () => {
    setShowReviewModal(false);
    setExtractedData(null);
    setWarningMessage(null);
  };

  // Average confidence score calculation
  const confidenceValues = Object.values(confidence);
  const avgConfidence = confidenceValues.length > 0
    ? Math.round((confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length) * 100)
    : 85;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc"
        className="hidden"
      />

      {/* Button placed immediately to the left of Create Mandate */}
      <div className="flex flex-col items-end">
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isAnalyzing}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              <span>Analyzing Document...</span>
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4 text-amber-400" />
              <span>Upload Job Mandate</span>
            </>
          )}
        </button>

        {errorMessage && !showReviewModal && (
          <span className="text-[11px] font-bold text-rose-600 mt-1">{errorMessage}</span>
        )}
      </div>

      {/* Analyzing Progress Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">AI Job Mandate Analyzer</h3>
              <p className="text-xs text-slate-500 font-medium">
                Parsing document text and auto-extracting job title, budget, headcount & skills...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 text-xs font-extrabold text-amber-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing PDF / DOCX file (max 20MB)...</span>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Populated Form Review Modal */}
      {showReviewModal && extractedData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in duration-200 space-y-0">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-500 text-slate-950 rounded">
                    AI Auto-Filled
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Extraction Confidence: {avgConfidence}%
                  </span>
                </div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  Review & Save Job Mandate
                </h2>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning Banner if Partial Extraction */}
            {warningMessage && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3 text-amber-900 text-xs font-bold">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{warningMessage}</span>
              </div>
            )}

            {/* Content Body with Job Form */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <JobForm
                clients={clients}
                initialData={extractedData}
                action={async (prev, formData) => {
                  const res = await createJobMandateAction(prev, formData);
                  if (res.success) {
                    setShowReviewModal(false);
                    router.push('/jobs');
                    router.refresh();
                  }
                  return res;
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
