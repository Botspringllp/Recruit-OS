'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Search, MapPin, Building2, Clock, ChevronRight, Sparkles, Filter, ShieldCheck } from 'lucide-react';

interface PublicJobsClientViewProps {
  initialJobs: any[];
}

export function PublicJobsClientView({ initialJobs }: PublicJobsClientViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');

  const filteredJobs = initialJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation =
      selectedLocation === 'ALL' || (job.workLocation || '').toLowerCase().includes(selectedLocation.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Careers Portal Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-glow-brand font-bold text-lg">
              R
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                RecruitOS <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">Careers Portal</span>
              </span>
              <p className="text-xs text-slate-400">Discover premium career opportunities</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Enterprise Verified Opportunities
            </span>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="relative overflow-hidden pt-12 pb-10 border-b border-slate-900 bg-gradient-to-b from-brand-950/30 via-slate-950 to-slate-950">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-brand-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Direct Agency Sourcing & AI Resume Matching
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Find Your Next Career Mandate
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Explore active hiring requirements across top technology and enterprise leaders. Apply directly with instant AI resume evaluation.
          </p>

          {/* Search Filter Bar */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-2 shadow-2xl bg-slate-900/90">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Job title, skill, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0"
                />
              </div>

              <div className="w-full sm:w-auto h-px sm:h-8 sm:w-px bg-slate-800" />

              <div className="relative w-full sm:w-48">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 text-xs text-slate-300 focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900">All Locations</option>
                  <option value="Remote" className="bg-slate-900">Remote</option>
                  <option value="Bangalore" className="bg-slate-900">Bangalore</option>
                  <option value="Mumbai" className="bg-slate-900">Mumbai</option>
                  <option value="Delhi" className="bg-slate-900">Delhi NCR</option>
                  <option value="Hyderabad" className="bg-slate-900">Hyderabad</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Job Directory List */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-brand-400" /> Open Position Openings ({filteredJobs.length})
          </h2>
        </div>

        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-brand-500/50 hover:bg-slate-900/60 transition group flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider block">
                        {job.client?.companyName || 'Enterprise Client'}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition mt-1">
                        {job.title}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      Active Hiring
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" /> {job.workLocation || 'Hybrid / Remote'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" /> Full Time
                    </span>
                    {job.maxCtcLpa && (
                      <span className="text-brand-300 font-semibold">
                        Up to ₹{Number(job.maxCtcLpa)} LPA
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Posted recently
                  </span>

                  <Link
                    href={`/careers/${job.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 group-hover:shadow-glow-brand"
                  >
                    View Details & Apply <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
            <p className="text-sm text-slate-400 italic">No job openings found matching your filter criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
