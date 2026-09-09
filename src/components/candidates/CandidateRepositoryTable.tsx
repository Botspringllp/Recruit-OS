'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Share2,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { DeleteCandidateButton } from '@/components/candidates/DeleteCandidateButton';

export interface CandidateItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentCompany: string | null;
  currentDesignation: string | null;
  totalExperienceYears: number | null;
  currentLocation: string | null;
  source: string;
  createdAt: Date | string;
}

interface CandidateRepositoryTableProps {
  candidateList: CandidateItem[];
  totalCandidates: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  skip: number;
  query: string;
}

export function CandidateRepositoryTable({
  candidateList,
  totalCandidates,
  currentPage,
  totalPages,
  skip,
  query
}: CandidateRepositoryTableProps) {
  // Candidate selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Check if all candidates on current page are selected
  const currentPageIds = candidateList.map(c => c.id);
  const isAllOnPageSelected =
    currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));

  // Toggle single candidate selection
  function handleToggleCandidate(candidateId: string) {
    setSelectedIds(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  }

  // Toggle Select All on current page
  function handleToggleSelectAll() {
    if (isAllOnPageSelected) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  }

  // Clear selection
  function handleClearSelection() {
    setSelectedIds([]);
  }

  // Handle "Share to Client" entry action
  function handleShareToClient() {
    setInfoMessage(
      `Share to Client initiated for ${selectedIds.length} selected candidate(s). Selection state active.`
    );
    setTimeout(() => setInfoMessage(null), 5000);
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header with Dual Entry Points */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-amber-500" />
            Candidate Repository
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Centralized talent pipeline & active candidate profiles ({totalCandidates} total candidates)
          </p>
        </div>

        {/* Action Button Container */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Requirement 2, 3, 4: Dynamic [ Share to Client (N) ] button immediately left of [ Add Candidate ] */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleShareToClient}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all animate-in fade-in cursor-pointer shrink-0"
            >
              <Share2 className="h-4 w-4 text-amber-400" />
              <span>Share to Client ({selectedIds.length})</span>
            </button>
          )}

          {/* Primary Entry Point: Add Candidate */}
          <Link
            href="/candidates/new"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add Candidate</span>
          </Link>
        </div>
      </div>

      {/* Info Notification Banner */}
      {infoMessage && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-extrabold text-amber-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{infoMessage}</span>
          </div>
          <button onClick={() => setInfoMessage(null)} className="text-amber-700 hover:text-amber-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}



      {/* Candidate List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <form method="GET" action="/candidates" className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-amber-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search name, email, phone, company..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
            />
          </form>
          <span className="text-xs font-bold text-slate-500">
            Showing {candidateList.length > 0 ? skip + 1 : 0}-{skip + candidateList.length} of {totalCandidates}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-700 font-extrabold">
              <tr>
                {/* Select All Checkbox Column */}
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllOnPageSelected}
                    onChange={handleToggleSelectAll}
                    title="Select all candidates on this page"
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-500"
                  />
                </th>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4">Current Role & Company</th>
                <th className="py-3.5 px-4">Experience</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {candidateList.length > 0 ? (
                candidateList.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-amber-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Row Selection Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleCandidate(c.id)}
                          className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-500"
                        />
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        <Link href={`/candidates/${c.id}`} className="hover:text-amber-600 transition-colors">
                          {c.firstName} {c.lastName}
                        </Link>
                        <div className="text-[10px] font-semibold text-slate-500">
                          {c.email} | {c.phone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {c.currentDesignation || 'Candidate'}
                        <div className="text-[10px] text-slate-500 font-semibold">
                          {c.currentCompany || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {c.totalExperienceYears ? `${Number(c.totalExperienceYears)} Yrs` : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700">{c.currentLocation || 'N/A'}</td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
                          {c.source}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/candidates/${c.id}`}
                            title="View candidate details"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 text-slate-700 hover:text-slate-950 transition-all duration-200"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/candidates/${c.id}/edit`}
                            title="Edit candidate profile"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 text-slate-700 hover:text-slate-950 transition-all duration-200"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>

                          <DeleteCandidateButton
                            candidateId={c.id}
                            candidateName={`${c.firstName} ${c.lastName}`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 font-bold">
                    No candidate records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">
              Page <span className="font-black text-slate-900">{currentPage}</span> of{' '}
              <span className="font-black text-slate-900">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/candidates?page=${currentPage - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl flex items-center gap-1 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              ) : (
                <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl flex items-center gap-1 cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </span>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={`/candidates?page=${currentPage + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded-xl flex items-center gap-1 transition-all duration-200"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl flex items-center gap-1 cursor-not-allowed">
                  Next <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
