'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  Clock,
  Briefcase,
  MapPin,
  GraduationCap,
  Sparkles,
  CheckCircle,
  XCircle,
  UserCheck,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  X,
  History,
  Eye,
  Download,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  assignRecruiterToRequirementAction,
  acceptAndConvertRequirementAction,
  rejectRequirementAction,
  restoreRequirementAction,
  permanentlyDeleteRequirementAction
} from '@/app/actions/incomingRequirements';

interface RequirementDetailClientProps {
  initialRequirement: any;
  recruiters: any[];
  userRole: string;
}

export const RequirementDetailClient: React.FC<RequirementDetailClientProps> = ({
  initialRequirement,
  recruiters,
  userRole
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [requirement, setRequirement] = useState(initialRequirement);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState(requirement.assignedRecruiterId || '');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Extract PDF Name & Base64 Data if present
  const extractedPdfName =
    requirement.pdfName ||
    (requirement.companyOverview?.match(/📄 \[Attached Requirement PDF: (.*?)\]/)?.[1]) ||
    (requirement.jobDescription?.match(/Requirement PDF Attached: (.*)/)?.[1]) ||
    null;

  const pdfData = requirement.pdfUrl || null;

  // Save Recruiter Assignment
  const handleSaveAssignment = async () => {
    if (!selectedRecruiterId) return;

    setActionError(null);
    startTransition(async () => {
      const res = await assignRecruiterToRequirementAction(requirement.id, selectedRecruiterId);
      if (res.success) {
        setActionSuccess('Recruiter assigned successfully!');
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to assign recruiter.');
      }
    });
  };

  // Accept & Convert
  const handleAcceptAndConvert = async () => {
    if (!confirm(`Are you sure you want to Accept & Convert requirement "${requirement.positionTitle}" to an active Job Mandate?`)) return;

    setActionError(null);
    startTransition(async () => {
      const res = await acceptAndConvertRequirementAction(requirement.id, selectedRecruiterId);
      if (res.success && res.data?.mandateId) {
        setActionSuccess('Requirement accepted and converted into Job Mandate!');
        router.push(`/jobs`);
      } else {
        setActionError(res.error || 'Failed to convert requirement.');
      }
    });
  };

  // Reject Requirement
  const handleReject = async () => {
    const reason = prompt('Please enter a reason for rejecting this requirement (optional):');
    if (reason === null) return;

    setActionError(null);
    startTransition(async () => {
      const res = await rejectRequirementAction(requirement.id, reason);
      if (res.success) {
        setActionSuccess('Requirement marked as Rejected.');
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to reject requirement.');
      }
    });
  };

  // Restore Requirement
  const handleRestore = async () => {
    setActionError(null);
    startTransition(async () => {
      const res = await restoreRequirementAction(requirement.id);
      if (res.success) {
        setActionSuccess('Requirement restored back to Active Intake Queue!');
        router.push('/incoming-requirements');
      } else {
        setActionError(res.error || 'Failed to restore requirement.');
      }
    });
  };

  // Permanent Delete Requirement
  const handlePermanentDelete = async () => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE requirement "${requirement.positionTitle}"? This cannot be undone.`)) return;

    setActionError(null);
    startTransition(async () => {
      const res = await permanentlyDeleteRequirementAction(requirement.id);
      if (res.success) {
        setActionSuccess('Requirement permanently deleted.');
        router.push('/incoming-requirements');
      } else {
        setActionError(res.error || 'Failed to delete requirement.');
      }
    });
  };

  // Priority Badge
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-3 py-1 text-xs font-black uppercase rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">Urgent Priority</span>;
      case 'High':
        return <span className="px-3 py-1 text-xs font-black uppercase rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">High Priority</span>;
      case 'Medium':
        return <span className="px-3 py-1 text-xs font-black uppercase rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">Medium Priority</span>;
      default:
        return <span className="px-3 py-1 text-xs font-black uppercase rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20">Low Priority</span>;
    }
  };

  // Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Review':
        return <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Pending Review</span>;
      case 'Assigned':
        return <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Assigned</span>;
      case 'Accepted':
      case 'Converted':
        return <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Converted</span>;
      case 'Rejected':
        return <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      default:
        return <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-slate-100 text-slate-800 border border-slate-300">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <a
          href="/incoming-requirements"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Intake Queue</span>
        </a>

        <div className="flex items-center gap-2">
          {renderStatusBadge(requirement.status)}
          {renderPriorityBadge(requirement.priority)}
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Requirement Title Card */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            <Building2 className="h-4 w-4" />
            <span>{requirement.companyName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {requirement.positionTitle}
          </h1>
          <p className="text-xs text-slate-300 mt-2 flex items-center gap-3">
            <span>Source: <strong className="text-amber-300">{requirement.source}</strong></span>
            <span>•</span>
            <span>Received: <strong>{new Date(requirement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
          </p>
        </div>

        {/* Action Controls for Active Requirements */}
        {requirement.status !== 'Converted' && requirement.status !== 'Rejected' && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleAcceptAndConvert}
              disabled={isPending}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4.5 w-4.5 stroke-[2.5]" />}
              <span>Accept & Convert to Mandate</span>
            </button>

            <button
              onClick={handleReject}
              disabled={isPending}
              className="px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="h-4.5 w-4.5" />
              <span>Reject</span>
            </button>
          </div>
        )}

        {/* Action Controls for Rejected Requirements */}
        {requirement.status === 'Rejected' && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRestore}
              disabled={isPending}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4.5 w-4.5 stroke-[2.5]" />}
              <span>Restore Requirement</span>
            </button>

            <button
              onClick={handlePermanentDelete}
              disabled={isPending}
              className="px-4 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="h-4.5 w-4.5" />
              <span>Permanent Delete</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Client Information */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="h-4 w-4 text-amber-500" />
              <span>A. Client Contact Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Contact Person</span>
                <span className="font-extrabold text-slate-900 mt-1 block">
                  {requirement.contactPerson || 'Not Provided'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Contact Email</span>
                <span className="font-bold text-slate-900 mt-1 block truncate">
                  {requirement.contactEmail ? (
                    <a href={`mailto:${requirement.contactEmail}`} className="text-amber-600 hover:underline">
                      {requirement.contactEmail}
                    </a>
                  ) : 'Not Provided'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Contact Phone</span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {requirement.contactNumber || 'Not Provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Client Requirement PDF & Document */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                <span>Requirement Documents</span>
              </h2>

              {(pdfData || extractedPdfName) && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Document Attached</span>
                </span>
              )}
            </div>

            {/* Document Details & Actions */}
            {pdfData || extractedPdfName ? (
              <div className="space-y-4 max-w-full overflow-hidden">
                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {extractedPdfName || 'Requirement Document.pdf'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-bold mt-1">
                        <span>Upload Date: <strong>{new Date(requirement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                        {pdfData && (
                          <>
                            <span>•</span>
                            <span>Size: <strong>{pdfData.length > 1024 * 1024 ? `${(pdfData.length * 0.75 / (1024 * 1024)).toFixed(2)} MB` : `${(pdfData.length * 0.75 / 1024).toFixed(1)} KB`}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/api/requirements/${requirement.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View PDF</span>
                    </a>

                    <a
                      href={`/api/requirements/${requirement.id}/pdf?download=true`}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>

                {/* Embedded PDF Viewer */}
                {pdfData ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                    <iframe
                      src={`/api/requirements/${requirement.id}/pdf`}
                      title="Requirement Document Preview"
                      className="w-full h-[550px] border-0"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed">
                    <div className="flex items-center gap-2 text-amber-800 font-black">
                      <FileText className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>Document Attached: {extractedPdfName}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-bold">No PDF document attached with this requirement.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recruiter Assignment & Timeline */}
        <div className="space-y-6">
          {/* Section D: Assign Recruiter */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-500" />
              <span>D. Recruiter Assignment</span>
            </h2>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Select Agency Recruiter</label>
              <select
                value={selectedRecruiterId}
                onChange={e => setSelectedRecruiterId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Unassigned (Select Recruiter)</option>
                {recruiters.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.firstName} {r.lastName} ({r.email})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSaveAssignment}
                disabled={isPending || !selectedRecruiterId || selectedRecruiterId === requirement.assignedRecruiterId}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save Assignment</span>
              </button>
            </div>
          </div>

          {/* Section C: Metadata Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3 text-xs">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              <span>C. Metadata</span>
            </h2>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Source Intake</span>
                <span className="font-extrabold text-slate-900">{requirement.source}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Priority Level</span>
                <span className="font-extrabold text-slate-900">{requirement.priority}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Received Date</span>
                <span className="font-bold text-slate-700">
                  {new Date(requirement.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {requirement.acceptedDate && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Accepted Date</span>
                  <span className="font-bold text-emerald-700">
                    {new Date(requirement.acceptedDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section E: Requirement Timeline (Collapsible Accordion) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" />
                <span>E. Audit Timeline History</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all"
              >
                <span>{isTimelineOpen ? '▲ Hide Timeline' : '▼ View Full Timeline'}</span>
                {isTimelineOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {isTimelineOpen && (
              <div className="relative pl-6 space-y-6 pt-2 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {requirement.timelineEvents?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No timeline events recorded.</p>
                ) : (
                  requirement.timelineEvents.map((evt: any, idx: number) => (
                    <div key={evt.id || idx} className="relative group">
                      <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-white" />
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{evt.title}</h4>
                        {evt.description && <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{evt.description}</p>}
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">
                          {new Date(evt.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
