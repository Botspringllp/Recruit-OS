'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Briefcase, User, X, Loader2, ExternalLink } from 'lucide-react';
import { globalSearchAction, GlobalSearchResult } from '@/app/actions/search';

export const InlineGlobalSearch: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult>({ clients: [], jobs: [], candidates: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Search execution with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], jobs: [], candidates: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await globalSearchAction(query);
        setResults(res);
      } catch (err) {
        console.error('Inline search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResults = results.clients.length + results.jobs.length + results.candidates.length;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      {/* Direct Search Input Field */}
      <div className="relative w-full flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-indigo-600 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Search companies, job mandates, or candidates..."
          className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/15 transition-all shadow-2xs"
        />

        {loading ? (
          <Loader2 className="absolute right-3 h-4 w-4 text-indigo-600 animate-spin" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Floating Inline Dropdown Menu */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {loading && totalResults === 0 && (
            <div className="p-6 text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
              <span>Searching database...</span>
            </div>
          )}

          {!loading && totalResults === 0 && (
            <div className="p-6 text-center">
              <p className="text-xs font-extrabold text-slate-700">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-400 mt-1">Try searching for a company name, candidate, or job title.</p>
            </div>
          )}

          {/* Companies / Clients Section */}
          {results.clients.length > 0 && (
            <div className="p-2 border-b border-slate-100">
              <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-indigo-600" />
                <span>Companies ({results.clients.length})</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {results.clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleNavigate(`/jobs`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-950">
                          {client.name}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500">
                          {client.industry || 'Client Company'} {client.website ? `• ${client.website}` : ''}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Mandates Section */}
          {results.jobs.length > 0 && (
            <div className="p-2 border-b border-slate-100">
              <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 text-indigo-600" />
                <span>Job Mandates ({results.jobs.length})</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {results.jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleNavigate(`/jobs`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/80 cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-950">
                        {job.title}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        Client: <span className="font-bold text-slate-700">{job.companyName}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-900">
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidates Section */}
          {results.candidates.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3 w-3 text-indigo-600" />
                <span>Candidates ({results.candidates.length})</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {results.candidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => handleNavigate(`/candidates`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/80 cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-950">
                        {cand.name}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {cand.email} {cand.company ? `• ${cand.company}` : ''}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
