'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  User
} from 'lucide-react';
import { updateAgencyAction } from '@/app/actions/agencies';

interface AgencyData {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  subscriptionTier: string;
  websiteUrl?: string | null;
  businessEmail?: string | null;
  supportEmail?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  companyDescription?: string | null;
  gstNumber?: string | null;
  cinNumber?: string | null;
  panNumber?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  createdAt?: Date | string;
}

interface OrganizationProfileClientProps {
  agency: AgencyData;
}

export const OrganizationProfileClient: React.FC<OrganizationProfileClientProps> = ({ agency }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: agency.name || '',
    websiteUrl: agency.websiteUrl || '',
    businessEmail: agency.businessEmail || '',
    supportEmail: agency.supportEmail || '',
    phone: agency.phone || '',
    alternatePhone: agency.alternatePhone || '',
    address: agency.address || '',
    city: agency.city || '',
    state: agency.state || '',
    country: agency.country || '',
    companyDescription: agency.companyDescription || '',
    gstNumber: agency.gstNumber || '',
    cinNumber: agency.cinNumber || '',
    panNumber: agency.panNumber || '',
    ownerName: agency.ownerName || '',
    ownerEmail: agency.ownerEmail || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await updateAgencyAction(agency.id, {
        name: formData.name,
        websiteUrl: formData.websiteUrl,
        businessEmail: formData.businessEmail,
        supportEmail: formData.supportEmail,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        companyDescription: formData.companyDescription,
        gstNumber: formData.gstNumber,
        cinNumber: formData.cinNumber,
        panNumber: formData.panNumber,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail
      });

      if (res.success) {
        setSuccessMessage('Organization profile updated successfully!');
        setIsEditing(false);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to update organization profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building className="h-6 w-6 text-amber-500" />
            Organization Profile
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Manage your recruitment agency details, contact information & statutory registration numbers
          </p>
        </div>

        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md ${
            isEditing
              ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
          }`}
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4" />
              <span>Cancel Editing</span>
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4" />
              <span>Edit Organization Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-3 text-xs font-bold text-rose-900">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* EDIT MODE FORM */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-amber-500" />
              Edit Organization Details
            </h2>
            <span className="text-xs text-slate-500 font-semibold">Fill out agency profile details below</span>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 border-b border-amber-100 pb-1">
              General Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Agency / Organization Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. Apex Recruitment Solutions"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Website URL</label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. https://apexrecruitment.com"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 border-b border-amber-100 pb-1">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Business Email</label>
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. contact@apexrecruitment.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Support Email</label>
                <input
                  type="email"
                  name="supportEmail"
                  value={formData.supportEmail}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. support@apexrecruitment.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Primary Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Alternate Phone Number</label>
                <input
                  type="text"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. +91 98765 43211"
                />
              </div>
            </div>
          </div>

          {/* Location & Address */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 border-b border-amber-100 pb-1">
              Address & Office Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-slate-700 font-extrabold">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="Building No., Street, Area"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. Mumbai"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. Maharashtra"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. India"
                />
              </div>
            </div>
          </div>

          {/* Statutory Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 border-b border-amber-100 pb-1">
              Statutory Registration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-mono font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">CIN Number</label>
                <input
                  type="text"
                  name="cinNumber"
                  value={formData.cinNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-mono font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. U74140MH2020PTC123456"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-mono font-bold text-slate-900 outline-none transition-all"
                  placeholder="e.g. ABCDE1234F"
                />
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 border-b border-amber-100 pb-1">
              Agency Founder / Primary Owner
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Owner Name</label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="Owner Full Name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-extrabold">Owner Email</label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-bold text-slate-900 outline-none transition-all"
                  placeholder="owner@agency.com"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-700 font-extrabold">Company Overview / Description</label>
            <textarea
              name="companyDescription"
              rows={3}
              value={formData.companyDescription}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl font-medium text-slate-900 outline-none transition-all"
              placeholder="Brief description of your recruitment agency..."
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Organization Profile'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* READ-ONLY DISPLAY MODE */
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Top Info Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Building className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{agency.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {agency.subdomain}.recruitos.in
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-950 border border-emerald-300">
                      {agency.status || 'ACTIVE'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-950 border border-amber-300">
                      {agency.subscriptionTier || 'ENTERPRISE'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
                <span className="text-slate-400 block text-[10px] uppercase font-black">Agency ID</span>
                <code className="font-mono text-slate-900 text-xs">{agency.id}</code>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-amber-500" />
                  Website & Digital Presence
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-500">Official Website</span>
                    <span className="font-bold text-slate-900">
                      {agency.websiteUrl ? (
                        <a href={agency.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">
                          {agency.websiteUrl}
                        </a>
                      ) : (
                        'Not Provided'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-500">Subdomain Portal</span>
                    <span className="font-bold text-slate-900 font-mono">{agency.subdomain}.recruitos.in</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-amber-500" />
                  Agency Founder / Owner
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-500">Owner Name</span>
                    <span className="font-bold text-slate-900">{agency.ownerName || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-500">Owner Email</span>
                    <span className="font-bold text-slate-900">{agency.ownerEmail || 'Not Provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-amber-500" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Business Email</span>
                  <span className="font-bold text-slate-900 block mt-1 truncate">{agency.businessEmail || 'Not Provided'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Support Email</span>
                  <span className="font-bold text-slate-900 block mt-1 truncate">{agency.supportEmail || 'Not Provided'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Primary Phone</span>
                  <span className="font-bold text-slate-900 block mt-1">{agency.phone || 'Not Provided'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Alternate Phone</span>
                  <span className="font-bold text-slate-900 block mt-1">{agency.alternatePhone || 'Not Provided'}</span>
                </div>
              </div>
            </div>

            {/* Office Location */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-500" />
                Office Location & Address
              </h3>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-3">
                  <span className="font-extrabold text-slate-500 block">Street Address</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{agency.address || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block">City</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{agency.city || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block">State</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{agency.state || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-500 block">Country</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{agency.country || 'Not Provided'}</span>
                </div>
              </div>
            </div>

            {/* Statutory Numbers */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-amber-500" />
                Statutory Registration Numbers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">GST Number</span>
                  <span className="font-mono font-extrabold text-slate-900 block mt-1">{agency.gstNumber || 'Not Registered'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">CIN Number</span>
                  <span className="font-mono font-extrabold text-slate-900 block mt-1">{agency.cinNumber || 'Not Registered'}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">PAN Number</span>
                  <span className="font-mono font-extrabold text-slate-900 block mt-1">{agency.panNumber || 'Not Registered'}</span>
                </div>
              </div>
            </div>

            {/* Company Overview Description */}
            {agency.companyDescription && (
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-black uppercase tracking-wider text-slate-400 block">Company Overview</span>
                <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  {agency.companyDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
