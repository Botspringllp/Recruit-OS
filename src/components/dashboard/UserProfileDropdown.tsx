'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Shield, ChevronDown, KeyRound } from 'lucide-react';
import { UserContextType } from '@/types/dashboard';

interface UserProfileDropdownProps {
  user: UserContextType;
  onLogout?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'AGENCY_FOUNDER':
        return { label: 'Agency Founder', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'FINANCE_ADMIN':
        return { label: 'Finance Admin', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'CLIENT_HR':
        return { label: 'Client HR', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'PARTNER_RECRUITER':
        return { label: 'Partner Recruiter', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
      default:
        return { label: 'Recruiter', color: 'bg-blue-100 text-blue-800 border-blue-300' };
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
          <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
            {user.email}
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

            {user.role === 'AGENCY_FOUNDER' && (
              <a
                href="#agency-settings"
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
              onClick={onLogout || (() => console.log('Logout executed'))}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
