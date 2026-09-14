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
  ArrowRight
} from 'lucide-react';
import {
  createIncomingRequirementAction,
  assignRecruiterToRequirementAction,
  acceptAndConvertRequirementAction,
  rejectRequirementAction
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
    assignedRecruiterId: ''
  });

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filtered List
  const filteredRequirements = requirements.filter(req => {
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

  // Submit Create Requirement
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!formData.positionTitle.trim() || !formData.companyName.trim()) {
      setActionError('Position Title and Company Name are required.');
      return;
    }

    startTransition(async () => {
      const res = await createIncomingRequirementAction(formData);
      if (res.success) {
        setActionSuccess('Incoming Requirement created successfully!');
        setIsCreateModalOpen(false);
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
          assignedRecruiterId: ''
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
              <Inbox className="h-3.5 w-3.5" />
              <span>Owner Intake Queue</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Incoming Requirements
            </h1>
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
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Pending Review</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{kpis.totalPending}</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">New Today</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">{kpis.newToday}</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Converted</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{kpis.accepted}</span>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-2xl p-4 border border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Rejected</span>
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
            <option value="ALL">All Statuses</option>
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
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Queue Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Position & Company</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Received Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Recruiter</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Inbox className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">No incoming requirements found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or click "+ Intake Requirement" to add a new request.</p>
                  </td>
                </tr>
              ) : (
                filteredRequirements.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Position & Company */}
                    <td className="py-4 px-4">
                      <a href={`/incoming-requirements/${req.id}`} className="font-extrabold text-slate-900 text-sm hover:text-amber-600 transition-colors block">
                        {req.positionTitle}
                      </a>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{req.companyName}</span>
                        {req.location && <span className="text-slate-400">• {req.location}</span>}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                        {req.source}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4">
                      {renderPriorityBadge(req.priority)}
                    </td>

                    {/* Received Date */}
                    <td className="py-4 px-4 text-slate-600 font-bold whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderStatusBadge(req.status)}
                    </td>

                    {/* Assigned Recruiter */}
                    <td className="py-4 px-4">
                      {req.assignedRecruiter ? (
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                          <span>{req.assignedRecruiter.firstName} {req.assignedRecruiter.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/incoming-requirements/${req.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                          title="View Requirement Details"
                        >
                          <Eye className="h-4 w-4" />
                        </a>

                        {req.status !== 'Converted' && req.status !== 'Rejected' && (
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

      {/* Modal 1: Intake Requirement Modal */}
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    placeholder="e.g. John Doe"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    placeholder="john@acme.com"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    name="contactNumber"
                    placeholder="+91 9876543210"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Source</label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold bg-white"
                  >
                    <option value="Manual">Manual Intake</option>
                    <option value="Website">Website Form</option>
                    <option value="Email">Email Request</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Referral">Client Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-bold bg-white"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="block font-bold text-slate-700 mb-1">Skills</label>
                  <input
                    type="text"
                    name="skills"
                    placeholder="e.g. React, Node.js, TypeScript"
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
