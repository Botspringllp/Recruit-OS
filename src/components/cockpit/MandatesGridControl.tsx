'use client';

import React from 'react';
import { Search, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { MandateSummaryCard } from '@/types/cockpit';
import { MandateCard } from './MandateCard';

interface MandatesGridControlProps {
  mandates: MandateSummaryCard[];
  onViewMandate?: (id: string) => void;
  onAddCandidate?: (id: string) => void;
}

export const MandatesGridControl: React.FC<MandatesGridControlProps> = ({
  mandates,
  onViewMandate,
  onAddCandidate
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusTab, setStatusTab] = React.useState<'ALL' | 'OPEN' | 'ON_HOLD' | 'FILLED'>('OPEN');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  const filteredMandates = mandates.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusTab === 'ALL' || m.status === statusTab;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Control Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Active Mandates Board</span>
            <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-indigo-100 text-indigo-950 border border-indigo-300">
              {filteredMandates.length} Jobs
            </span>
          </h2>
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, client, or city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-500 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all duration-200"
            />
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-950'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-950'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'OPEN', label: 'Active Open' },
          { id: 'ALL', label: 'All Mandates' },
          { id: 'ON_HOLD', label: 'On Hold' },
          { id: 'FILLED', label: 'Filled / Completed' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              statusTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Rendering */}
      {filteredMandates.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">No Mandates Match Your Search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Try adjusting your search terms or filter tabs to view active client job mandates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMandates.map(mandate => (
            <MandateCard
              key={mandate.id}
              mandate={mandate}
              onViewMandate={onViewMandate}
              onAddCandidate={onAddCandidate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
