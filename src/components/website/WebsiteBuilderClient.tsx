'use client';

import React, { useState, useRef } from 'react';
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
  PowerOff,
  Upload,
  Trash2,
  Sparkles,
  Check
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

const COLOR_PRESETS = [
  {
    id: 'light-slate-amber',
    name: 'Clean Light Slate & Amber Gold',
    badge: 'Light Theme',
    primary: '#f59e0b',
    secondary: '#ffffff'
  },
  {
    id: 'corporate-navy-white',
    name: 'Corporate Navy & Pearl White',
    badge: 'Light Theme',
    primary: '#1e40af',
    secondary: '#f8fafc'
  },
  {
    id: 'emerald-mint-light',
    name: 'Emerald Teal & Mint Fresh',
    badge: 'Light Theme',
    primary: '#0d9488',
    secondary: '#f0fdf4'
  },
  {
    id: 'royal-lavender-light',
    name: 'Royal Indigo & Lavender Cream',
    badge: 'Light Theme',
    primary: '#4f46e5',
    secondary: '#faf5ff'
  },
  {
    id: 'warm-sunset-beige',
    name: 'Warm Sunset & Sand Beige',
    badge: 'Light Theme',
    primary: '#ea580c',
    secondary: '#fffbeb'
  },
  {
    id: 'cyber-cyan-obsidian',
    name: 'Cyber Cyan & Deep Obsidian',
    badge: 'Dark Theme',
    primary: '#06b6d4',
    secondary: '#030712'
  },
  {
    id: 'midnight-violet-slate',
    name: 'Midnight Violet & Dark Slate',
    badge: 'Dark Theme',
    primary: '#8b5cf6',
    secondary: '#0f172a'
  }
];

export const WebsiteBuilderClient: React.FC<WebsiteBuilderClientProps> = ({
  agency,
  initialConfig
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    secondaryColor: initialConfig?.secondaryColor || '#ffffff',
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
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showCustomColor, setShowCustomColor] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit check: 4MB max for initial file before compression
    const MAX_SIZE_BYTES = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setLogoError('Selected image file is too large (Max 4MB). Please select a smaller logo image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Compress and resize image using HTML Canvas
      const compressedBase64 = await compressAndScaleImage(file);
      setFormData(prev => ({ ...prev, logoUrl: compressedBase64 }));
    } catch (err: any) {
      setLogoError('Failed to process image file. Please try another logo file.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const compressAndScaleImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' || file.type === 'image/svg+xml' ? file.type : 'image/webp';
          const dataUrl = canvas.toDataURL(mimeType, 0.85);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    setLogoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    }));
    setShowCustomColor(false);
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
      const saveRes = await saveWebsiteConfigurationAction(agency.id, formData);
      if (!saveRes.success) {
        setError(saveRes.error || 'Failed to save website configuration.');
        setLoading(false);
        return;
      }

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
            Configure your agency website logo, content, light & dark theme combinations, services, and live job mandates.
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
        {/* SECTION 1: BRANDING & LOGO UPLOAD */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">1. Agency Identity & Logo Upload</h3>
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

          {/* LOGO IMAGE UPLOAD ONLY (NO DIRECT URL PASTING) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block font-black text-slate-900">Upload Agency Logo</label>

            {formData.logoUrl ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    <img src={formData.logoUrl} alt="Agency Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Logo Uploaded Successfully</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Auto-optimized for public website
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-extrabold text-xs transition-colors flex items-center gap-1 border border-rose-200 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Logo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50/50">
                  {isUploadingLogo ? (
                    <div className="py-2 space-y-2">
                      <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
                      <p className="font-extrabold text-slate-800 text-xs">Optimizing and Uploading Logo...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="font-extrabold text-slate-800 text-xs">
                        Click Below to Select & Upload Agency Logo
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        PNG, JPG, WEBP, or SVG
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload-file-input"
                      />

                      <label
                        htmlFor="logo-upload-file-input"
                        className="inline-block mt-3 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-xs"
                      >
                        Choose Logo Image File
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {logoError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{logoError}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: THEME STYLING & 7 LIGHT/DARK COLOR COMBINATIONS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Palette className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900">2. Theme Styling & Color Combinations</h3>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Choose your preferred website color combination (including Light and Dark background themes):
          </p>

          {/* 7 Color Palette Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COLOR_PRESETS.map(preset => {
              const isSelected =
                !showCustomColor &&
                formData.primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                formData.secondaryColor.toLowerCase() === preset.secondary.toLowerCase();

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectColorPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 text-xs truncate">{preset.name}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Badge & Color Swatches */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        preset.badge === 'Light Theme'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-900 text-slate-200'
                      }`}
                    >
                      {preset.badge}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-5 w-5 rounded-md border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: preset.primary }}
                        title={`Accent Color: ${preset.primary}`}
                      />
                      <div
                        className="h-5 w-5 rounded-md border border-slate-400 shadow-2xs"
                        style={{ backgroundColor: preset.secondary }}
                        title={`Background Color: ${preset.secondary}`}
                      />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Custom Color Option */}
            <button
              type="button"
              onClick={() => setShowCustomColor(true)}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                showCustomColor
                  ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-slate-900 text-xs">Custom Colors</span>
                {showCustomColor && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-amber-600 font-bold">Configure custom brand hex colors below</span>
            </button>
          </div>

          {/* CUSTOM COLOR PICKERS */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Color Hex Settings</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => {
                      setShowCustomColor(true);
                      handleChange(e);
                    }}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-1 shrink-0"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => {
                      setShowCustomColor(true);
                      handleChange(e);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={(e) => {
                      setShowCustomColor(true);
                      handleChange(e);
                    }}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-1 shrink-0"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={(e) => {
                      setShowCustomColor(true);
                      handleChange(e);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 font-bold text-xs"
                  />
                </div>
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
