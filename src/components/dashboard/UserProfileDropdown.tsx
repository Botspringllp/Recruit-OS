'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Shield, ChevronDown, KeyRound } from 'lucide-react';
import { UserContextType } from '@/types/dashboard';
import { createClient } from '@/lib/supabase/client';

interface UserProfileDropdownProps {
  user: UserContextType;
  onLogout?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (onLogout) {
        onLogout();
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign Out Error:', err);
    } finally {
      window.location.href = '/login';
    }
  };

  const getRoleBadge = (role: string) => {
    const roleUpper = String(role || '').toUpperCase();
    switch (roleUpper) {
      case 'SUPER_ADMIN':
      case 'MASTER_OWNER':
        return { label: 'Role: SUPER_ADMIN', color: 'bg-amber-500 text-slate-950 border-amber-600 font-black' };
      case 'AGENCY_FOUNDER':
      case 'AGENCY_OWNER':
        return { label: 'Role: AGENCY_OWNER', color: 'bg-purple-100 text-purple-800 border-purple-300 font-extrabold' };
      case 'FINANCE_ADMIN':
      case 'FINANCE_MANAGER':
        return { label: 'Role: FINANCE_MANAGER', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold' };
      case 'COMPLIANCE_OFFICER':
        return { label: 'Role: COMPLIANCE_OFFICER', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold' };
      case 'INTERVIEW_COORDINATOR':
        return { label: 'Role: INTERVIEW_COORDINATOR', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-extrabold' };
      case 'CLIENT_HR':
        return { label: 'Role: CLIENT_HR', color: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold' };
      case 'PARTNER_RECRUITER':
        return { label: 'Role: PARTNER_RECRUITER', color: 'bg-cyan-100 text-cyan-800 border-cyan-300 font-extrabold' };
      default:
        return { label: `Role: ${roleUpper || 'RECRUITER'}`, color: 'bg-blue-100 text-blue-800 border-blue-300 font-extrabold' };
    }
  };

  const roleBadge = getRoleBadge(user.role);
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="user-profile-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-200 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-9 w-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-2xs">
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-900 leading-tight">
            {user.firstName} {user.lastName}
          </span>
          <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded mt-0.5 border ${roleBadge.color}`}>
            {roleBadge.label}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate mb-2">{user.email}</p>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <a
              href="#profile"
              className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <User className="h-4 w-4 text-slate-400" />
              <span>Profile Settings</span>
            </a>

            <a
              href="#security"
              className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <KeyRound className="h-4 w-4 text-slate-400" />
              <span>Security & MFA</span>
            </a>

            {(user.role === 'AGENCY_FOUNDER' || user.role === 'AGENCY_OWNER') && (
              <a
                href="/settings/users"
                className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
              >
                <Shield className="h-4 w-4 text-amber-600" />
                <span>Agency Settings</span>
              </a>
            )}
          </div>

          {/* Footer / Logout */}
          <div className="pt-1 mt-1 border-t border-slate-100 px-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
