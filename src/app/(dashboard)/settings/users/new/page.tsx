'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Shield, AlertCircle, Loader2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { UserRole, UserStatus } from '@prisma/client';
import { createUserAction, getUsersAction } from '@/app/actions/users';
import { AVAILABLE_PERMISSIONS } from '@/lib/permissions';

export default function CreateUserPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.RECRUITER);
  const [status, setStatus] = useState<UserStatus>(UserStatus.ACTIVE);
  const [managerId, setManagerId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  const [agencyUsers, setAgencyUsers] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getUsersAction().then(res => {
      if (res.success && res.data?.users) {
        setAgencyUsers(res.data.users);
      }
    });
  }, []);

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const allPermissionsSelected = AVAILABLE_PERMISSIONS.length > 0 && selectedPermissions.length === AVAILABLE_PERMISSIONS.length;

  const handleGlobalSelectToggle = () => {
    if (allPermissionsSelected) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.key));
    }
  };

  const handleSelectAllGroup = (groupKeys: string[]) => {
    const allSelected = groupKeys.every(k => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(k => !groupKeys.includes(k)));
    } else {
      setSelectedPermissions(prev => Array.from(new Set([...prev, ...groupKeys])));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await createUserAction({
        firstName,
        lastName,
        email,
        password: password || undefined,
        role,
        status,
        managerId: managerId || null,
        permissions: selectedPermissions
      });

      if (res.success) {
        window.location.href = '/settings/users';
      } else {
        setErrorMessage(res.error || 'Failed to create user.');
      }
    });
  };

  // Group permissions by category
  const permissionGroups = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  return (
    <div className="bg-white min-h-screen p-6 sm:p-8 space-y-8 text-[#111827] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/settings/users"
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-[#F59E0B]" />
              Create New Team User
            </h1>
            <p className="text-xs font-semibold text-[#6B7280] mt-0.5">
              Add a new recruiter or team member to your agency workspace
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: User Profile */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-6">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider border-b border-[#E5E7EB] pb-3">
            1. Member Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] block">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#F59E0B] focus:bg-white focus:ring-2 focus:ring-[#F59E0B]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] block">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sharma"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#F59E0B] focus:bg-white focus:ring-2 focus:ring-[#F59E0B]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] block">
                Work Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="sarah@agency.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#F59E0B] focus:bg-white focus:ring-2 focus:ring-[#F59E0B]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] flex items-center justify-between">
                <span>Account Password</span>
                <span className="text-[10px] font-semibold text-[#6B7280]">Min 6 chars</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Assign login password for user"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#F59E0B] focus:bg-white focus:ring-2 focus:ring-[#F59E0B]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Role & Status */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-6">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider border-b border-[#E5E7EB] pb-3">
            2. Agency Role & Reporting
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Role Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] block">
                User Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#F59E0B] focus:bg-white transition-all"
              >
                <option value={UserRole.RECRUITER}>Recruiter</option>
                <option value={UserRole.AGENCY_OWNER}>Agency Owner</option>
                <option value={UserRole.FINANCE_MANAGER}>Finance Manager</option>
                <option value={UserRole.COMPLIANCE_OFFICER}>Compliance Officer</option>
                <option value={UserRole.INTERVIEW_COORDINATOR}>Interview Coordinator</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] block">
                Account Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as UserStatus)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#F59E0B] focus:bg-white transition-all"
              >
                <option value={UserStatus.ACTIVE}>ACTIVE</option>
                <option value={UserStatus.INVITED}>INVITED</option>
                <option value={UserStatus.INACTIVE}>INACTIVE</option>
                <option value={UserStatus.SUSPENDED}>SUSPENDED</option>
              </select>
            </div>

            {/* Manager Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827] block">
                Reporting Manager (Optional)
              </label>
              <select
                value={managerId}
                onChange={e => setManagerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#F59E0B] focus:bg-white transition-all"
              >
                <option value="">-- No Reporting Manager --</option>
                {agencyUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Permission Checklist (Collapsible Dropdown) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden transition-all">
          {/* Accordion Header */}
          <div
            onClick={() => setIsPermissionsOpen(!isPermissionsOpen)}
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
          >
            <div>
              <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#F59E0B]" />
                3. Feature Permission Assignments (Optional)
              </h2>
              <p className="text-xs font-semibold text-[#6B7280] mt-0.5">
                Default role permissions apply automatically. Click to expand and assign custom permissions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {selectedPermissions.length > 0 && (
                <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  {selectedPermissions.length} Selected
                </span>
              )}
              <button
                type="button"
                className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
                aria-label="Toggle Permissions Section"
              >
                {isPermissionsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Accordion Content */}
          {isPermissionsOpen && (
            <div className="p-6 pt-0 border-t border-[#E5E7EB] space-y-6">
              {/* Select All / Deselect All Toggle Bar */}
              <div className="flex items-center justify-end pt-4">
                <button
                  type="button"
                  onClick={handleGlobalSelectToggle}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-extrabold text-[#D97706] transition-colors"
                >
                  {allPermissionsSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(permissionGroups).map(([groupName, perms]) => {
                  const groupKeys = perms.map(p => p.key);
                  const allChecked = groupKeys.every(k => selectedPermissions.includes(k));

                  return (
                    <div key={groupName} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-[#E5E7EB]">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wide">
                          {groupName}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleSelectAllGroup(groupKeys)}
                          className="text-[11px] font-bold text-gray-500 hover:text-[#111827]"
                        >
                          {allChecked ? 'Deselect Group' : 'Select Group'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {perms.map(perm => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs font-extrabold cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                                  : 'bg-white border-[#E5E7EB] text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.key)}
                                className="h-4 w-4 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B]"
                              />
                              <span>{perm.label}</span>
                              <span className="text-[10px] font-semibold text-gray-400 font-mono ml-auto">
                                {perm.key}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/settings/users"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-extrabold rounded-xl transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-[#F59E0B]/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Creating User...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create User</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
