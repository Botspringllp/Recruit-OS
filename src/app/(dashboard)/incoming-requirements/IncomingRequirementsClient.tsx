'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  Search,
  Filter,
  Plus,
  UserCheck,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Clock,
  Briefcase,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Upload
} from 'lucide-react';
import {
  createIncomingRequirementAction,
  assignRecruiterToRequirementAction,
  acceptAndConvertRequirementAction,
  rejectRequirementAction,
  restoreRequirementAction,
  permanentlyDeleteRequirementAction
} from '@/app/actions/incomingRequirements';

interface Recruiter {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Requirement {
  id: string;
  positionTitle: string;
  companyName: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactNumber?: string | null;
  industryType?: string | null;
  employmentType?: string | null;
  experienceRequired?: string | null;
  location?: string | null;
  education?: string | null;
  skills?: string | null;
  jobDescription?: string | null;
  companyOverview?: string | null;
  pdfName?: string | null;
  pdfUrl?: string | null;
  source: string;
  priority: string;
  status: string;
  assignedRecruiterId?: string | null;
  assignedRecruiter?: Recruiter | null;
  convertedMandateId?: string | null;
  receivedDate: string;
  createdAt: string;
}

interface IncomingRequirementsClientProps {
  initialRequirements: Requirement[];
  initialKpis: {
    totalPending: number;
    newToday: number;
    accepted: number;
    rejected: number;
  };
  recruiters: Recruiter[];
  userRole: string;
}

export const IncomingRequirementsClient: React.FC<IncomingRequirementsClientProps> = ({
  initialRequirements,
  initialKpis,
  recruiters,
  userRole
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [requirements, setRequirements] = useState<Requirement[]>(initialRequirements);
  const [kpis, setKpis] = useState(initialKpis);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReqForAssign, setSelectedReqForAssign] = useState<Requirement | null>(null);
  const [assigningRecruiterId, setAssigningRecruiterId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    positionTitle: '',
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactNumber: '',
    industryType: '',
    employmentType: 'Full-time',
    experienceRequired: '',
    location: '',
    education: '',
    skills: '',
    jobDescription: '',
    companyOverview: '',
    source: 'Manual',
    priority: 'Medium',
    assignedRecruiterId: '',
    pdfName: '',
    pdfBase64: ''
  });

  // Toggle for Advanced Dropdown Options in Modal
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filtered List based on Status Filter
  const filteredRequirements = requirements.filter(req => {
    // If Status Filter is 'ALL', show active requirements (hide Rejected)
    if (statusFilter === 'ALL' && req.status === 'Rejected') return false;

    // If a specific status filter is selected, match it
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

    if (sourceFilter !== 'ALL' && req.source !== sourceFilter) return false;
    if (priorityFilter !== 'ALL' && req.priority !== priorityFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = req.positionTitle.toLowerCase().includes(q);
      const matchCompany = req.companyName.toLowerCase().includes(q);
      const matchContact = (req.contactPerson || '').toLowerCase().includes(q);
      return matchTitle || matchCompany || matchContact;
    }

    return true;
  });

  // Handle Form Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle File Upload in Modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit. Please upload a smaller document.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && !['pdf', 'doc', 'docx'].includes(ext)) {
      alert('Only .pdf, .doc, and .docx files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        pdfName: file.name,
        pdfBase64: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Submit Create Requirement
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!formData.positionTitle.trim()) {
      setActionError('Position Title is required.');
      return;
    }
    if (!formData.companyName.trim()) {
      setActionError('Company Name is required.');
      return;
    }
    if (!formData.contactPerson.trim()) {
      setActionError('Contact Person name is required.');
      return;
    }
    if (!formData.contactEmail.trim()) {
      setActionError('Contact Email is required.');
      return;
    }
    if (!formData.contactNumber.trim()) {
      setActionError('Contact Phone number is required.');
      return;
    }

    startTransition(async () => {
      const res = await createIncomingRequirementAction(formData);
      if (res.success) {
        setActionSuccess('Incoming Requirement created successfully!');
        setIsCreateModalOpen(false);
        setShowAdvancedFields(false);
        setFormData({
          positionTitle: '',
          companyName: '',
          contactPerson: '',
          contactEmail: '',
          contactNumber: '',
          industryType: '',
          employmentType: 'Full-time',
          experienceRequired: '',
          location: '',
          education: '',
          skills: '',
          jobDescription: '',
          companyOverview: '',
          source: 'Manual',
          priority: 'Medium',
          assignedRecruiterId: '',
          pdfName: '',
          pdfBase64: ''
        });
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to create requirement.');
      }
    });
  };

  // Assign Recruiter Action
  const handleAssignSubmit = async () => {
    if (!selectedReqForAssign || !assigningRecruiterId) return;

    setActionError(null);
    startTransition(async () => {
      const res = await assignRecruiterToRequirementAction(selectedReqForAssign.id, assigningRecruiterId);
      if (res.success) {
        setActionSuccess(`Recruiter assigned successfully!`);
        setSelectedReqForAssign(null);
        setAssigningRecruiterId('');
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to assign recruiter.');
      }
    });
  };

  // Accept & Convert Action
  const handleAcceptAndConvert = async (req: Requirement) => {
    if (!confirm(`Accept requirement "${req.positionTitle}" and convert to Job Mandate?`)) return;

    setActionError(null);
    startTransition(async () => {
      const res = await acceptAndConvertRequirementAction(req.id);
      if (res.success) {
        setActionSuccess(`Requirement accepted and converted to Job Mandate!`);
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to convert requirement.');
      }
    });
  };

  // Reject Action
  const handleReject = async (req: Requirement) => {
    const reason = prompt(`Reason for rejecting requirement "${req.positionTitle}" (optional):`);
    if (reason === null) return;

    setActionError(null);
    startTransition(async () => {
      const res = await rejectRequirementAction(req.id, reason);
      if (res.success) {
        setActionSuccess(`Requirement marked as Rejected.`);
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to reject requirement.');
      }
    });
  };

  // Restore Action
  const handleRestore = async (req: Requirement) => {
    setActionError(null);
    startTransition(async () => {
      const res = await restoreRequirementAction(req.id);
      if (res.success) {
        setActionSuccess(`Requirement restored back to Active Intake Queue!`);
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to restore requirement.');
      }
    });
  };

  // Permanent Delete Action
  const handlePermanentDelete = async (req: Requirement) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE requirement "${req.positionTitle}"? This cannot be undone.`)) return;

    setActionError(null);
    startTransition(async () => {
      const res = await permanentlyDeleteRequirementAction(req.id);
      if (res.success) {
        setActionSuccess(`Requirement permanently deleted from database.`);
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to delete requirement.');
      }
    });
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">Urgent</span>;
      case 'High':
        return <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">High</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20">Low</span>;
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Review':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Pending Review</span>;
      case 'Assigned':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Assigned</span>;
      case 'Accepted':
      case 'Converted':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Converted</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Notifications */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
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
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Inbox className="w-80 h-80 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.back()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 font-bold text-xs border border-slate-700 shrink-0"
                title="Go Back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Incoming Requirements
              </h1>
            </div>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Review raw client requests, assign recruiters, and convert verified requirements directly into active Job Mandates.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
          >
            <Plus className="h-5 w-5 stroke-[3]" />
            <span>Intake Requirement</span>
          </button>
        </div>

        {/* Live Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div
            onClick={() => setStatusFilter('Pending Review')}
            className="cursor-pointer bg-slate-800/60 hover:bg-slate-800 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50 transition-colors"
          >
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Pending Review</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{kpis.totalPending}</span>
          </div>

          <div
            onClick={() => setStatusFilter('ALL')}
            className="cursor-pointer bg-slate-800/60 hover:bg-slate-800 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50 transition-colors"
          >
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">New Today</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{kpis.newToday}</span>
          </div>

          <div
            onClick={() => setStatusFilter('Converted')}
            className="cursor-pointer bg-slate-800/60 hover:bg-slate-800 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50 transition-colors"
          >
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Converted</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{kpis.accepted}</span>
          </div>

          <div
            onClick={() => setStatusFilter('Rejected')}
            className={`cursor-pointer rounded-2xl p-4 border transition-all ${
              statusFilter === 'Rejected'
                ? 'bg-rose-500/20 border-rose-500/50 ring-2 ring-rose-500/30'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/50'
            }`}
          >
            <span className="text-xs font-bold text-rose-300 block uppercase tracking-wider">Rejected</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">{kpis.rejected}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by position title, company name, or contact person..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">All Active Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Assigned">Assigned</option>
            <option value="Converted">Converted</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">All Sources</option>
            <option value="Website">Website</option>
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Manual">Manual</option>
            <option value="Referral">Referral</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full md:w-36 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Main Requirements Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-900 text-sm">
              {statusFilter === 'Rejected' ? 'Rejected Requirements' : 'Incoming Requirements'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
              {filteredRequirements.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Position & Company</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6">Source / Date</th>
                <th className="py-3.5 px-6">Priority</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Assigned To</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    {statusFilter === 'Rejected'
                      ? 'No rejected requirements found.'
                      : 'No incoming requirements found matching your filters.'}
                  </td>
                </tr>
              ) : (
                filteredRequirements.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <a
                          href={`/incoming-requirements/${req.id}`}
                          className="font-extrabold text-slate-900 hover:text-amber-600 block text-sm transition-colors"
                        >
                          {req.positionTitle}
                        </a>
                        <span className="text-slate-500 font-semibold text-xs flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{req.companyName}</span>
                          {req.pdfName && (
                            <span className="ml-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                              📄 PDF
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">
                          {req.contactPerson || 'N/A'}
                        </span>
                        {req.contactEmail && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                            {req.contactEmail}
                          </span>
                        )}
                        {req.contactNumber && (
                          <span className="text-[11px] text-slate-400 font-semibold block">
                            {req.contactNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div>
                        <span className="font-bold text-slate-800 block">{req.source}</span>
                        <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                          {new Date(req.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">{renderPriorityBadge(req.priority)}</td>

                    <td className="py-4 px-6">{renderStatusBadge(req.status)}</td>

                    <td className="py-4 px-6">
                      {req.assignedRecruiter ? (
                        <span className="font-bold text-slate-900 text-xs">
                          {req.assignedRecruiter.firstName} {req.assignedRecruiter.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/incoming-requirements/${req.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Requirement Details"
                        >
                          <Eye className="h-4 w-4" />
                        </a>

                        {/* Actions for Rejected Status */}
                        {req.status === 'Rejected' ? (
                          <>
                            <button
                              onClick={() => handleRestore(req)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-extrabold text-[11px] border border-emerald-200 transition-all flex items-center gap-1"
                              title="Restore Requirement to Active Queue"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => handlePermanentDelete(req)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-[11px] border border-rose-200 transition-all flex items-center gap-1"
                              title="Permanently Delete Requirement from Database"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </>
                        ) : (
                          /* Actions for Active Status */
                          req.status !== 'Converted' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedReqForAssign(req);
                                  setAssigningRecruiterId(req.assignedRecruiterId || '');
                                }}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Assign Recruiter"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => handleAcceptAndConvert(req)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                                title="Accept & Convert to Mandate"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Accept</span>
                              </button>

                              <button
                                onClick={() => handleReject(req)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Reject Requirement"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Intake Manual Requirement Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Inbox className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Intake Manual Requirement</h3>
                  <p className="text-xs text-slate-500">Add raw client requirement to the Owner Intake Queue</p>
                </div>
              </div>

              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Row 1: Position Title & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Position Title *</label>
                  <input
                    type="text"
                    name="positionTitle"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={formData.positionTitle}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    placeholder="e.g. Acme Tech Solutions"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* Row 2: Contact Person, Contact Email, Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Contact Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    placeholder="john@acme.com"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    name="contactNumber"
                    required
                    placeholder="+91 9876543210"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Row 3: Source & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Source</label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold bg-white"
                  >
                    <option value="Manual">Manual Intake</option>
                    <option value="Website">Website Form</option>
                    <option value="Email">Email Request</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Referral">Client Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold bg-white"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>
              </div>

              {/* Row 4: PDF Document Upload Option */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-500" />
                  <span>Upload Requirement PDF / Document (Optional)</span>
                </label>

                {formData.pdfName ? (
                  <div className="p-3 rounded-xl bg-white border border-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="h-5 w-5 text-amber-500 shrink-0" />
                      <span className="font-extrabold text-slate-900 truncate text-xs">{formData.pdfName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pdfName: '', pdfBase64: '' }))}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-4 text-center transition-colors bg-white cursor-pointer group">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-6 w-6 text-slate-400 group-hover:text-amber-500 mx-auto mb-1 transition-colors" />
                    <span className="font-bold text-slate-700 block text-xs">Click or drag & drop requirement PDF</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">PDF, DOC, DOCX up to 10MB</span>
                  </div>
                )}
              </div>

              {/* Row 5: Collapsible Accordion Dropdown for Optional Specifications */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFields(prev => !prev)}
                  className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200/70 text-slate-800 font-extrabold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-500" />
                    <span>Additional Role Specifications (Optional)</span>
                  </span>
                  {showAdvancedFields ? <ChevronUp className="h-4 w-4 text-slate-600" /> : <ChevronDown className="h-4 w-4 text-slate-600" />}
                </button>

                {showAdvancedFields && (
                  <div className="p-4 bg-white space-y-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Assign Recruiter</label>
                        <select
                          name="assignedRecruiterId"
                          value={formData.assignedRecruiterId}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold bg-white"
                        >
                          <option value="">Unassigned (Review Later)</option>
                          {recruiters.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.firstName} {r.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Location</label>
                        <input
                          type="text"
                          name="location"
                          placeholder="e.g. Remote / Bangalore"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Experience</label>
                        <input
                          type="text"
                          name="experienceRequired"
                          placeholder="e.g. 3-5 Years"
                          value={formData.experienceRequired}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Key Skills</label>
                        <input
                          type="text"
                          name="skills"
                          placeholder="e.g. React, Node.js"
                          value={formData.skills}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Job Description</label>
                      <textarea
                        name="jobDescription"
                        rows={3}
                        placeholder="Paste client job details or notes here..."
                        value={formData.jobDescription}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-md shadow-amber-500/20"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Requirement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Quick Assign Recruiter Modal */}
      {selectedReqForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Assign Recruiter</h3>
              <button onClick={() => setSelectedReqForAssign(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select an active recruiter to assign requirement <span className="font-bold text-slate-900">"{selectedReqForAssign.positionTitle}"</span>:
            </p>

            <select
              value={assigningRecruiterId}
              onChange={e => setAssigningRecruiterId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
            >
              <option value="">Select Recruiter...</option>
              {recruiters.map(r => (
                <option key={r.id} value={r.id}>
                  {r.firstName} {r.lastName} ({r.email})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setSelectedReqForAssign(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>

              <button
                onClick={handleAssignSubmit}
                disabled={isPending || !assigningRecruiterId}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black flex items-center gap-1.5 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
