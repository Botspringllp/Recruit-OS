'use client';

import React, { useState } from 'react';
import {
  Building2,
  Briefcase,
  MapPin,
  Globe,
  Mail,
  Phone,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Target,
  Eye
} from 'lucide-react';
import { PublicWidgetForm } from '@/components/widget/PublicWidgetForm';

interface JobMandate {
  id: string;
  positionTitle: string;
  companyName: string;
  location: string;
  experience: string;
  skills: string;
  createdAt: string | Date;
}

interface AgencyWebsiteTemplateProps {
  agency: {
    id: string;
    name: string;
    subdomain: string;
  };
  config: {
    agencyName: string;
    tagline?: string;
    logoUrl?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    aboutContent?: string;
    mission?: string;
    vision?: string;
    primaryColor?: string;
    secondaryColor?: string;
    contactEmail?: string;
    supportEmail?: string;
    phone?: string;
    address?: string;
    facebookUrl?: string;
    linkedinUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    selectedServices?: string[];
    selectedIndustries?: string[];
  };
  jobs?: JobMandate[];
  isPreview?: boolean;
}

function isLightColor(colorStr: string): boolean {
  if (!colorStr) return false;
  const hex = colorStr.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165;
}

export const AgencyWebsiteTemplate: React.FC<AgencyWebsiteTemplateProps> = ({
  agency,
  config,
  jobs = []
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'services' | 'jobs' | 'contact' | 'submit'>('home');
  const [jobSearch, setJobSearch] = useState('');

  const primaryColor = config.primaryColor || '#f59e0b';
  const secondaryColor = config.secondaryColor || '#ffffff';

  const isLight = isLightColor(secondaryColor);

  // Dynamic Theme Colors
  const textColor = isLight ? '#0f172a' : '#f8fafc';
  const mutedTextColor = isLight ? '#475569' : '#94a3b8';
  const headerBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(3, 7, 18, 0.95)';
  const headerBorder = isLight ? '#e2e8f0' : '#1e293b';
  const cardBg = isLight ? '#ffffff' : '#0f172a';
  const cardBorder = isLight ? '#e2e8f0' : '#1e293b';
  const innerSectionBg = isLight ? '#f8fafc' : '#030712';
  const footerBg = isLight ? '#0f172a' : '#030712';
  const footerTextColor = isLight ? '#f8fafc' : '#f8fafc';

  const filteredJobs = jobs.filter(j => {
    if (!jobSearch.trim()) return true;
    const q = jobSearch.toLowerCase();
    return (
      j.positionTitle.toLowerCase().includes(q) ||
      j.companyName.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      j.skills.toLowerCase().includes(q)
    );
  });

  const servicesList = config.selectedServices && config.selectedServices.length > 0
    ? config.selectedServices
    : ['Permanent Hiring', 'Contract Staffing', 'Executive Search', 'RPO'];

  const industriesList = config.selectedIndustries && config.selectedIndustries.length > 0
    ? config.selectedIndustries
    : ['Technology', 'Healthcare', 'Fintech', 'Manufacturing'];

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-200"
      style={{ backgroundColor: secondaryColor, color: textColor }}
    >
      {/* Navigation Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors"
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
      >
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
              <span className="text-lg font-black tracking-tight block" style={{ color: textColor }}>
                {config.agencyName}
              </span>
              {config.tagline && (
                <span className="text-[10px] font-bold block -mt-1" style={{ color: mutedTextColor }}>
                  {config.tagline}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('home')}
              className="transition-colors"
              style={{ color: activeTab === 'home' ? primaryColor : mutedTextColor }}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className="transition-colors"
              style={{ color: activeTab === 'about' ? primaryColor : mutedTextColor }}
            >
              About Us
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className="transition-colors"
              style={{ color: activeTab === 'services' ? primaryColor : mutedTextColor }}
            >
              Services & Industries
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className="transition-colors relative flex items-center gap-1.5"
              style={{ color: activeTab === 'jobs' ? primaryColor : mutedTextColor }}
            >
              <span>Open Jobs</span>
              {jobs.length > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full border text-[10px] font-black"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    borderColor: `${primaryColor}40`,
                    color: primaryColor
                  }}
                >
                  {jobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className="transition-colors"
              style={{ color: activeTab === 'contact' ? primaryColor : mutedTextColor }}
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
              <Briefcase className="h-4 w-4 text-slate-950" />
              <span>Submit Requirement</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      {activeTab === 'home' && (
        <section
          className="relative overflow-hidden py-24 sm:py-32 border-b transition-colors"
          style={{ backgroundColor: secondaryColor, borderColor: headerBorder }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              background: `radial-gradient(circle at top center, ${primaryColor}30, transparent 70%)`
            }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black shadow-xs"
              style={{
                backgroundColor: isLight ? '#ffffff' : '#090d16',
                borderColor: `${primaryColor}40`,
                color: primaryColor
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Official Talent & Hiring Partner</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight" style={{ color: textColor }}>
              {config.heroTitle || `Empowering Business Growth with Top Talent`}
            </h1>

            <p className="text-base sm:text-lg max-w-2xl mx-auto font-medium" style={{ color: mutedTextColor }}>
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
                <ArrowRight className="h-4 w-4 text-slate-950" />
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className="px-8 py-4 rounded-2xl font-extrabold text-sm border transition-all flex items-center gap-2 shadow-xs"
                style={{
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  color: textColor
                }}
              >
                <Briefcase className="h-4 w-4" style={{ color: primaryColor }} />
                <span>Explore Open Positions ({jobs.length})</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl border text-center space-y-1 shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <strong className="text-3xl font-black block" style={{ color: textColor }}>100%</strong>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: mutedTextColor }}>Vetted Candidates</span>
              </div>
              <div className="p-6 rounded-2xl border text-center space-y-1 shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <strong className="text-3xl font-black block" style={{ color: primaryColor }}>{jobs.length}+</strong>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: mutedTextColor }}>Active Mandates</span>
              </div>
              <div className="p-6 rounded-2xl border text-center space-y-1 shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <strong className="text-3xl font-black block" style={{ color: textColor }}>Fast SLA</strong>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: mutedTextColor }}>Turnaround Time</span>
              </div>
              <div className="p-6 rounded-2xl border text-center space-y-1 shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <strong className="text-3xl font-black block" style={{ color: primaryColor }}>Global</strong>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: mutedTextColor }}>Hiring Network</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: ABOUT US */}
      {(activeTab === 'home' || activeTab === 'about') && (
        <section className="py-20 border-b transition-colors" style={{ backgroundColor: secondaryColor, borderColor: headerBorder }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>About {config.agencyName}</h2>
              <h3 className="text-3xl font-black" style={{ color: textColor }}>Your Preferred Strategic Talent Acquisition Partner</h3>
            </div>

            <div className="p-8 sm:p-12 rounded-3xl border space-y-6 shadow-sm" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <p className="text-base leading-relaxed font-medium" style={{ color: mutedTextColor }}>
                {config.aboutContent ||
                  `${config.agencyName} is a premier recruitment consultancy specializing in executive search, contract staffing, and end-to-end talent acquisition services.`}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {config.mission && (
                  <div className="p-6 rounded-2xl border space-y-2" style={{ backgroundColor: innerSectionBg, borderColor: cardBorder }}>
                    <div className="flex items-center gap-2 font-black text-sm" style={{ color: primaryColor }}>
                      <Target className="h-5 w-5" />
                      <span>Our Mission</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium" style={{ color: mutedTextColor }}>
                      {config.mission}
                    </p>
                  </div>
                )}

                {config.vision && (
                  <div className="p-6 rounded-2xl border space-y-2" style={{ backgroundColor: innerSectionBg, borderColor: cardBorder }}>
                    <div className="flex items-center gap-2 font-black text-sm" style={{ color: primaryColor }}>
                      <Eye className="h-5 w-5" />
                      <span>Our Vision</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium" style={{ color: mutedTextColor }}>
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
        <section className="py-20 border-b transition-colors" style={{ backgroundColor: innerSectionBg, borderColor: headerBorder }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Services */}
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>Our Core Capabilities</h2>
                <h3 className="text-3xl font-black" style={{ color: textColor }}>Specialized Recruitment Services</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {servicesList.map((service, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border transition-all space-y-3 group shadow-xs hover:shadow-md"
                    style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl border flex items-center justify-center font-black"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        borderColor: `${primaryColor}30`,
                        color: primaryColor
                      }}
                    >
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <h4 className="text-base font-black transition-colors" style={{ color: textColor }}>
                      {service}
                    </h4>
                    <p className="text-xs font-medium" style={{ color: mutedTextColor }}>
                      Tailored recruitment workflows & talent matching for {service.toLowerCase()} mandates.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="space-y-8 pt-8 border-t" style={{ borderColor: headerBorder }}>
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>Domain Expertise</h2>
                <h3 className="text-3xl font-black" style={{ color: textColor }}>Industries We Serve</h3>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
                {industriesList.map((ind, idx) => (
                  <div
                    key={idx}
                    className="px-5 py-3 rounded-2xl border text-xs font-black flex items-center gap-2 shadow-xs"
                    style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                  >
                    <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} />
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: OPEN JOBS */}
      {(activeTab === 'home' || activeTab === 'jobs') && (
        <section className="py-20 border-b transition-colors" style={{ backgroundColor: secondaryColor, borderColor: headerBorder }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>Live Career Mandates</h2>
                <h3 className="text-3xl font-black mt-1" style={{ color: textColor }}>Explore Open Opportunities</h3>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, skill, location..."
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-bold"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    color: textColor
                  }}
                />
              </div>
            </div>

            {filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map(job => (
                  <div
                    key={job.id}
                    className="p-6 rounded-2xl border transition-all space-y-4 flex flex-col justify-between shadow-xs"
                    style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-base font-black transition-colors" style={{ color: textColor }}>
                          {job.positionTitle}
                        </h4>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black shrink-0">
                          Active Hiring
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold" style={{ color: mutedTextColor }}>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" style={{ color: mutedTextColor }} />
                          {job.companyName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" style={{ color: mutedTextColor }} />
                          {job.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" style={{ color: mutedTextColor }} />
                          {job.experience}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between gap-4" style={{ borderColor: headerBorder }}>
                      <div className="text-xs font-medium truncate" style={{ color: mutedTextColor }}>
                        <strong className="font-bold" style={{ color: textColor }}>Key Skills:</strong> {job.skills}
                      </div>

                      <button
                        onClick={() => setActiveTab('submit')}
                        className="px-4 py-2 rounded-xl border text-xs font-black transition-all shrink-0 hover:opacity-90"
                        style={{
                          backgroundColor: `${primaryColor}15`,
                          borderColor: `${primaryColor}40`,
                          color: primaryColor
                        }}
                      >
                        Apply / Submit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-3xl border text-center space-y-3 shadow-xs" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <Briefcase className="h-10 w-10 mx-auto opacity-50" style={{ color: mutedTextColor }} />
                <h4 className="text-base font-black" style={{ color: textColor }}>No Open Positions Listed</h4>
                <p className="text-xs max-w-md mx-auto" style={{ color: mutedTextColor }}>
                  {jobSearch
                    ? 'No job mandates match your search criteria. Try a different search term.'
                    : 'Currently there are no active public mandates listed. Please check back later or submit your hiring requirement.'}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION: SUBMIT REQUIREMENT */}
      {(activeTab === 'submit' || activeTab === 'home') && (
        <section className="py-20 border-b transition-colors" style={{ backgroundColor: innerSectionBg, borderColor: headerBorder }} id="submit-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>Client Requirement Intake</h2>
              <h3 className="text-3xl font-black" style={{ color: textColor }}>Submit Your Hiring Mandate</h3>
              <p className="text-xs" style={{ color: mutedTextColor }}>
                Direct submission to {config.agencyName} recruitment team queue.
              </p>
            </div>

            <div className="rounded-3xl overflow-hidden border shadow-md" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <PublicWidgetForm agencyId={agency.id} agencyName={config.agencyName} />
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="py-16 border-t transition-colors" style={{ backgroundColor: footerBg, color: footerTextColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-2">
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
                  <span className="text-lg font-black text-white block">{config.agencyName}</span>
                  {config.tagline && <span className="text-xs text-slate-400 font-bold block">{config.tagline}</span>}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-sm">
                {config.aboutContent || `Professional recruitment solutions provided by ${config.agencyName}.`}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Contact Information</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-300">
                {config.contactEmail && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                    <span>{config.contactEmail}</span>
                  </li>
                )}
                {config.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
                    <span>{config.phone}</span>
                  </li>
                )}
                {config.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                    <span>{config.address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Connect With Us</h4>
              <div className="flex items-center gap-3">
                {config.linkedinUrl && (
                  <a href={config.linkedinUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {config.facebookUrl && (
                  <a href={config.facebookUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {config.instagramUrl && (
                  <a href={config.instagramUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {config.twitterUrl && (
                  <a href={config.twitterUrl} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 text-center text-xs text-slate-400 font-bold flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} {config.agencyName}. All rights reserved.</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              Powered by <strong className="font-black" style={{ color: primaryColor }}>RecruitOS Platform</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
