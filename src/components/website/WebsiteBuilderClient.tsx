'use client';

import React, { useState } from 'react';
import {
  Globe,
  Eye,
  Save,
  Rocket,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  Palette,
  FileText,
  Briefcase,
  Layers,
  Phone,
  Share2,
  ExternalLink,
  PowerOff
} from 'lucide-react';
import {
  saveWebsiteConfigurationAction,
  publishWebsiteAction,
  unpublishWebsiteAction
} from '@/app/actions/websiteBuilder';

interface WebsiteBuilderClientProps {
  agency: {
    id: string;
    name: string;
    subdomain: string;
    websiteBuilderEnabled: boolean;
  };
  initialConfig: any;
}

const ALL_SERVICES = [
  'Permanent Hiring',
  'Contract Staffing',
  'Executive Search',
  'Leadership Hiring',
  'Campus Hiring',
  'Bulk Hiring',
  'RPO',
  'Recruitment Process Outsourcing'
];

const ALL_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Fintech',
  'Manufacturing',
  'Telecom',
  'Education',
  'Retail',
  'BFSI',
  'Logistics'
];

export const WebsiteBuilderClient: React.FC<WebsiteBuilderClientProps> = ({
  agency,
  initialConfig
}) => {
  const [formData, setFormData] = useState({
    agencyName: initialConfig?.agencyName || agency.name || '',
    tagline: initialConfig?.tagline || '',
    logoUrl: initialConfig?.logoUrl || '',
    heroTitle: initialConfig?.heroTitle || '',
    heroSubtitle: initialConfig?.heroSubtitle || '',
    aboutContent: initialConfig?.aboutContent || '',
    mission: initialConfig?.mission || '',
    vision: initialConfig?.vision || '',
    primaryColor: initialConfig?.primaryColor || '#f59e0b',
    secondaryColor: initialConfig?.secondaryColor || '#0f172a',
    contactEmail: initialConfig?.contactEmail || '',
    supportEmail: initialConfig?.supportEmail || '',
    phone: initialConfig?.phone || '',
    address: initialConfig?.address || '',
    facebookUrl: initialConfig?.facebookUrl || '',
    linkedinUrl: initialConfig?.linkedinUrl || '',
    instagramUrl: initialConfig?.instagramUrl || '',
    twitterUrl: initialConfig?.twitterUrl || '',
    selectedServices: initialConfig?.selectedServices || ['Permanent Hiring', 'Executive Search'],
    selectedIndustries: initialConfig?.selectedIndustries || ['Technology', 'Healthcare']
  });

  const [status, setStatus] = useState<string>(initialConfig?.status || 'DRAFT');
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(initialConfig?.websiteUrl || `${agency.subdomain}.recruitos.site`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => {
      const exists = prev.selectedServices.includes(service);
      const updated = exists
        ? prev.selectedServices.filter((s: string) => s !== service)
        : [...prev.selectedServices, service];
      return { ...prev, selectedServices: updated };
    });
  };

  const toggleIndustry = (industry: string) => {
    setFormData(prev => {
      const exists = prev.selectedIndustries.includes(industry);
      const updated = exists
        ? prev.selectedIndustries.filter((i: string) => i !== industry)
        : [...prev.selectedIndustries, industry];
      return { ...prev, selectedIndustries: updated };
    });
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await saveWebsiteConfigurationAction(agency.id, formData);
      if (res.success) {
        setSuccess('Website configuration draft saved successfully.');
      } else {
        setError(res.error || 'Failed to save draft.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving draft.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Save draft first
      await saveWebsiteConfigurationAction(agency.id, formData);

      const res = await publishWebsiteAction(agency.id);
      if (res.success) {
        setStatus('PUBLISHED');
        setWebsiteUrl(res.data?.websiteUrl || `${agency.subdomain}.recruitos.site`);
        setSuccess('🎉 Congratulations! Your website is now live and published.');
      } else {
        setError(res.error || 'Failed to publish website.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing website.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish your website? It will no longer be visible to the public.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await unpublishWebsiteAction(agency.id);
      if (res.success) {
        setStatus('DRAFT');
        setSuccess('Website has been unpublished and reverted to DRAFT status.');
      } else {
        setError(res.error || 'Failed to unpublish website.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while unpublishing website.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    window.open(`/website-preview/${agency.id}`, '_blank');
  };

  const publicSiteLink = `/site/${agency.subdomain}`;

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Banner / Actions Bar */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-white">Agency Website Builder</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                status === 'PUBLISHED'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {status}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Configure your official agency website branding, content, services, and live job showcase.
          </p>

          {status === 'PUBLISHED' && (
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Globe className="h-4 w-4" />
              <span>Live Website URL: </span>
              <a
                href={publicSiteLink}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white flex items-center gap-1"
              >
                {websiteUrl || `${agency.subdomain}.recruitos.site`}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4 text-amber-400" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePreview}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs border border-slate-700 transition-all flex items-center gap-2"
          >
            <Eye className="h-4 w-4 text-amber-400" />
            <span>Preview Website</span>
          </button>

          {status === 'PUBLISHED' ? (
            <button
              onClick={handleUnpublish}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 font-extrabold text-xs border border-rose-700/50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <PowerOff className="h-4 w-4" />
              <span>Unpublish</span>
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              <span>Publish Website</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-medium">
        {/* SECTION 1: BRANDING */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">1. Branding & Identity</h3>
          </div>

          <div>
            <label className="block font-black text-slate-900 mb-1">Agency Name *</label>
            <input
              type="text"
              name="agencyName"
              value={formData.agencyName}
              onChange={handleChange}
              placeholder="e.g. Apex Recruitment Partners"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tagline</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="e.g. Empowering Business Growth with Top Talent"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Logo Image URL</label>
            <input
              type="text"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
            />
          </div>
        </div>

        {/* SECTION 2: THEME COLORS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Palette className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">2. Theme Styling</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-1"
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-1"
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-slate-900 font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: HOME PAGE HERO */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">3. Home Page Hero Content</h3>
          </div>

          <div>
            <label className="block font-black text-slate-900 mb-1">Hero Title *</label>
            <input
              type="text"
              name="heroTitle"
              value={formData.heroTitle}
              onChange={handleChange}
              placeholder="e.g. Empowering Business Growth with Top Talent"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hero Subtitle</label>
            <textarea
              name="heroSubtitle"
              rows={3}
              value={formData.heroSubtitle}
              onChange={handleChange}
              placeholder="We connect market-leading organizations with pre-screened, high-caliber professionals..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 resize-none font-sans"
            />
          </div>
        </div>

        {/* SECTION 4: ABOUT US */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">4. About Us Content</h3>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">About Agency Overview</label>
            <textarea
              name="aboutContent"
              rows={4}
              value={formData.aboutContent}
              onChange={handleChange}
              placeholder="Apex Recruitment Partners is a premier recruitment consultancy specializing in executive search..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 resize-none font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mission Statement</label>
              <textarea
                name="mission"
                rows={3}
                value={formData.mission}
                onChange={handleChange}
                placeholder="To empower companies with exceptional workforce talent..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 resize-none font-sans"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vision Statement</label>
              <textarea
                name="vision"
                rows={3}
                value={formData.vision}
                onChange={handleChange}
                placeholder="To be the most trusted, technology-driven recruitment agency partner globally..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 resize-none font-sans"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: SERVICES MULTI-SELECT */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Briefcase className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">5. Offered Services</h3>
          </div>

          <p className="text-xs text-slate-500">Select the recruitment services your agency offers:</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {ALL_SERVICES.map(service => {
              const active = formData.selectedServices.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {service} {active && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 6: INDUSTRIES MULTI-SELECT */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Layers className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">6. Target Industries</h3>
          </div>

          <p className="text-xs text-slate-500">Select the industries your recruitment team specializes in:</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {ALL_INDUSTRIES.map(industry => {
              const active = formData.selectedIndustries.includes(industry);
              return (
                <button
                  key={industry}
                  type="button"
                  onClick={() => toggleIndustry(industry)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {industry} {active && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 7: CONTACT DETAILS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Phone className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">7. Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="contact@agency.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                name="supportEmail"
                value={formData.supportEmail}
                onChange={handleChange}
                placeholder="support@agency.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Office Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Suite 500, Financial Center, New York"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
            />
          </div>
        </div>

        {/* SECTION 8: SOCIAL LINKS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Share2 className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">8. Social Media Profiles</h3>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">LinkedIn URL</label>
            <input
              type="text"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleChange}
              placeholder="https://linkedin.com/company/agency"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Facebook URL</label>
            <input
              type="text"
              name="facebookUrl"
              value={formData.facebookUrl}
              onChange={handleChange}
              placeholder="https://facebook.com/agency"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Instagram URL</label>
              <input
                type="text"
                name="instagramUrl"
                value={formData.instagramUrl}
                onChange={handleChange}
                placeholder="https://instagram.com/agency"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Twitter / X URL</label>
              <input
                type="text"
                name="twitterUrl"
                value={formData.twitterUrl}
                onChange={handleChange}
                placeholder="https://x.com/agency"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
