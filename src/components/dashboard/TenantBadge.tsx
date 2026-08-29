'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { TenantContextType } from '@/types/dashboard';

interface TenantBadgeProps {
  tenant: TenantContextType;
}

export const TenantBadge: React.FC<TenantBadgeProps> = ({ tenant }) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ENTERPRISE':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'GROWTH':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-300';
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all duration-200">
      <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-sm shadow-2xs">
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt={tenant.agencyName} className="h-5 w-5 object-contain" />
        ) : (
          <Building2 className="h-4 w-4 text-slate-950" />
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-900 tracking-tight truncate max-w-[140px] md:max-w-[180px]">
            {tenant.agencyName}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${getTierColor(tenant.subscriptionTier)}`}>
            {tenant.subscriptionTier}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px]">{tenant.subdomain}.recruitos.com</span>
        </div>
      </div>
    </div>
  );
};
