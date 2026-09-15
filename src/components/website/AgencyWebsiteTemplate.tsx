'use client';

import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  Layers,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Globe,
  Facebook,
  Linkedin,
  Instagram,
  Twitter,
  Search,
  ArrowRight,
  ShieldCheck,
  Target,
  Eye,
  Award,
  Users
} from 'lucide-react';
import { PublicWidgetForm } from '@/components/widget/PublicWidgetForm';

interface AgencyWebsiteTemplateProps {
  agency: {
    id: string;
    name: string;
    subdomain: string;
  };
  config: {
    agencyName: string;
    tagline?: string | null;
    logoUrl?: string | null;
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    aboutContent?: string | null;
    mission?: string | null;
    vision?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    contactEmail?: string | null;
    supportEmail?: string | null;
    phone?: string | null;
    address?: string | null;
    facebookUrl?: string | null;
    linkedinUrl?: string | null;
    instagramUrl?: string | null;
    twitterUrl?: string | null;
    selectedServices?: string[];
    selectedIndustries?: string[];
    status?: string;
  };
  jobs: Array<{
    id: string;
    positionTitle: string;
    companyName: string;
    location: string;
    experience: string;
    skills: string;
    salary?: string | null;
  }>;
  isPreview?: boolean;
}

export const AgencyWebsiteTemplate: React.FC<AgencyWebsiteTemplateProps> = ({
  agency,
  config,
  jobs,
  isPreview = false
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'services' | 'jobs' | 'submit' | 'contact'>('home');
  const [jobSearch, setJobSearch] = useState('');

  const primaryColor = config.primaryColor || '#f59e0b';
  const secondaryColor = config.secondaryColor || '#0f172a';

  const filteredJobs = jobs.filter(
    j =>
      j.positionTitle.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.skills.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.location.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const servicesList = config.selectedServices && config.selectedServices.length > 0
    ? config.selectedServices
    : ['Permanent Hiring', 'Contract Staffing', 'Executive Search', 'Leadership Hiring'];

  const industriesList = config.selectedIndustries && config.selectedIndustries.length > 0
    ? config.selectedIndustries
    : ['Technology', 'Healthcare', 'Fintech', 'Manufacturing'];

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Agency Name */}
          <div className="flex items-center gap-3">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.agencyName} className="h-10 w-auto rounded-lg object-contain" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                {config.agencyName.charAt(0)}
              </div>
            )}
            <div>
              <span className="text-lg font-black tracking-tight text-white block">
                {config.agencyName}
              </span>
              {config.tagline && (
                <span className="text-[10px] text-slate-400 font-bold block -mt-1">
                  {config.tagline}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('home')}
              className={`hover:text-amber-400 transition-colors ${activeTab === 'home' ? 'text-amber-400 font-black' : 'text-slate-300'}`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`hover:text-amber-400 transition-colors ${activeTab === 'about' ? 'text-amber-400 font-black' : 'text-slate-300'}`}
            >
              About Us
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`hover:text-amber-400 transition-colors ${activeTab === 'services' ? 'text-amber-400 font-black' : 'text-slate-300'}`}
            >
              Services & Industries
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`hover:text-amber-400 transition-colors relative ${activeTab === 'jobs' ? 'text-amber-400 font-black' : 'text-slate-300'}`}
            >
              Open Jobs
              {jobs.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                  {jobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`hover:text-amber-400 transition-colors ${activeTab === 'contact' ? 'text-amber-400 font-black' : 'text-slate-300'}`}
            >
              Contact Us
            </button>
          </nav>

          {/* Action CTA Button */}
          <div>
            <button
              onClick={() => setActiveTab('submit')}
              className="px-5 py-2.5 rounded-xl text-slate-950 font-black text-xs shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Briefcase className="h-4 w-4" />
              <span>Submit Requirement</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Always Visible on Home tab or top of site) */}
      {activeTab === 'home' && (
        <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32 border-b border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-slate-950 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-black shadow-md">
              <ShieldCheck className="h-4 w-4" />
              <span>Official Talent & Hiring Partner</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
              {config.heroTitle || `Empowering Business Growth with Top Talent`}
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-medium">
              {config.heroSubtitle ||
                `We connect market-leading organizations with pre-screened, high-caliber professionals. Partner with ${config.agencyName} for your hiring requirements.`}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setActiveTab('submit')}
                className="px-8 py-4 rounded-2xl text-slate-950 font-black text-sm shadow-xl transition-all hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Submit Hiring Requirement</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className="px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-sm border border-slate-700 transition-all flex items-center gap-2"
              >
                <Briefcase className="h-4 w-4 text-amber-400" />
                <span>Explore Open Positions ({jobs.length})</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <strong className="text-3xl font-black text-white block">100%</strong>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vetted Candidates</span>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <strong className="text-3xl font-black text-amber-400 block">{jobs.length}+</strong>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Mandates</span>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <strong className="text-3xl font-black text-white block">Fast SLA</strong>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Turnaround Time</span>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <strong className="text-3xl font-black text-amber-400 block">Global</strong>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hiring Network</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: ABOUT US */}
      {(activeTab === 'home' || activeTab === 'about') && (
        <section className="py-20 bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">About {config.agencyName}</h2>
              <h3 className="text-3xl font-black text-white">Your Preferred Strategic Talent Acquisition Partner</h3>
            </div>

            <div className="bg-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-800 space-y-6">
              <p className="text-slate-300 text-base leading-relaxed font-medium">
                {config.aboutContent ||
                  `${config.agencyName} is a premier recruitment consultancy specializing in executive search, contract staffing, and end-to-end talent acquisition services.`}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {config.mission && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                      <Target className="h-5 w-5" />
                      <span>Our Mission</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {config.mission}
                    </p>
                  </div>
                )}

                {config.vision && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                      <Eye className="h-5 w-5" />
                      <span>Our Vision</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {config.vision}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: SERVICES & INDUSTRIES */}
      {(activeTab === 'home' || activeTab === 'services') && (
        <section className="py-20 bg-slate-950 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Services */}
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Our Core Capabilities</h2>
                <h3 className="text-3xl font-black text-white">Specialized Recruitment Services</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {servicesList.map((service, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all space-y-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                      {service}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Tailored recruitment workflows & talent matching for {service.toLowerCase()} mandates.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="space-y-8 pt-8 border-t border-slate-800/80">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Domain Expertise</h2>
                <h3 className="text-3xl font-black text-white">Industries We Serve</h3>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
                {industriesList.map((ind, idx) => (
                  <div
                    key={idx}
                    className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-black flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: OPEN JOBS (Zero Mock Data) */}
      {(activeTab === 'home' || activeTab === 'jobs') && (
        <section className="py-20 bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Live Career Mandates</h2>
                <h3 className="text-3xl font-black text-white mt-1">Explore Open Opportunities</h3>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by title, skill, location..."
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map(job => (
                  <div
                    key={job.id}
                    className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-base font-black text-white hover:text-amber-400 transition-colors">
                          {job.positionTitle}
                        </h4>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black shrink-0">
                          Active Hiring
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          {job.companyName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          {job.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                          {job.experience}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-4">
                      <div className="text-xs text-slate-400 font-medium truncate">
                        <strong className="text-slate-300 font-bold">Key Skills:</strong> {job.skills}
                      </div>

                      <button
                        onClick={() => setActiveTab('submit')}
                        className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-black text-xs transition-all shrink-0"
                      >
                        Apply / Submit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-black text-white">No Open Positions Listed</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {jobSearch
                    ? 'No job mandates match your search criteria. Try a different search term.'
                    : 'Currently there are no active public mandates listed. Please check back later or submit your hiring requirement.'}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION: SUBMIT REQUIREMENT (REUSES WIDGET INTAKE) */}
      {(activeTab === 'submit' || activeTab === 'home') && (
        <section className="py-20 bg-slate-950 border-b border-slate-800" id="submit-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Client Requirement Intake</h2>
              <h3 className="text-3xl font-black text-white">Submit Your Hiring Mandate</h3>
              <p className="text-xs text-slate-400">
                Direct submission to {config.agencyName} recruitment team queue.
              </p>
            </div>

            {/* Embedded Live Public Widget Form Component */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
              <PublicWidgetForm agencyId={agency.id} agencyName={config.agencyName} />
            </div>
          </div>
        </section>
      )}

      {/* SECTION: CONTACT US & FOOTER */}
      <footer className="bg-slate-950 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Agency Info */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  {config.agencyName.charAt(0)}
                </div>
                <div>
                  <span className="text-lg font-black text-white block">{config.agencyName}</span>
                  {config.tagline && <span className="text-xs text-slate-400 font-bold block">{config.tagline}</span>}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-sm">
                {config.aboutContent || `Professional recruitment solutions provided by ${config.agencyName}.`}
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Contact Information</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-300">
                {config.contactEmail && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{config.contactEmail}</span>
                  </li>
                )}
                {config.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{config.phone}</span>
                  </li>
                )}
                {config.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{config.address}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Connect With Us</h4>
              <div className="flex items-center gap-3">
                {config.linkedinUrl && (
                  <a href={config.linkedinUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {config.facebookUrl && (
                  <a href={config.facebookUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {config.instagramUrl && (
                  <a href={config.instagramUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {config.twitterUrl && (
                  <a href={config.twitterUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500 font-bold flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} {config.agencyName}. All rights reserved.</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              Powered by <strong className="text-amber-400 font-black">RecruitOS Platform</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
