import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit3, Shield, Mail, Calendar, UserCheck, Users, Key } from 'lucide-react';
import { getUserByIdAction } from '@/app/actions/users';
import { AVAILABLE_PERMISSIONS } from '@/lib/permissions';
import { DisableUserButton } from '@/components/users/DisableUserButton';

export const revalidate = 0;

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = params;
  const result = await getUserByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;
  const isDisabled = user.status === 'INACTIVE' || user.status === 'SUSPENDED' || !user.isActive;

  // Map permissions to labels
  const permissionKeys = (user.permissions || []).map((p: any) => `${p.resource}.${p.action}`);

  return (
    <div className="bg-white min-h-screen p-6 sm:p-8 space-y-8 text-[#111827] max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/settings/users"
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold ${
                user.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : user.status === 'INVITED'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {user.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#6B7280] mt-1 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href={`/settings/users/${user.id}/edit`}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-[#D97706] border border-amber-300 font-extrabold text-xs rounded-xl transition-all flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit User</span>
          </Link>
          <DisableUserButton
            userId={user.id}
            userName={`${user.firstName} ${user.lastName}`}
            isAlreadyDisabled={isDisabled}
          />
        </div>
      </div>

      {/* Main Details Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Profile */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-5">
            <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider border-b border-[#E5E7EB] pb-3">
              Account Metadata
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[#6B7280] font-extrabold block">Assigned Role</span>
                <span className="font-extrabold text-[#111827] mt-0.5 inline-block px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                  {user.role.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <span className="text-[#6B7280] font-extrabold block">Reporting Manager</span>
                <span className="font-bold text-[#111827] mt-0.5 block">
                  {user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : 'None Assigned'}
                </span>
              </div>

              <div>
                <span className="text-[#6B7280] font-extrabold block">Last Login</span>
                <span className="font-bold text-[#111827] mt-0.5 block flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never logged in'}
                </span>
              </div>

              <div>
                <span className="text-[#6B7280] font-extrabold block">Account Created</span>
                <span className="font-bold text-[#111827] mt-0.5 block">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Reports Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
            <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <Users className="h-4 w-4 text-[#F59E0B]" />
              Direct Reports ({user.directReports?.length || 0})
            </h2>

            {user.directReports?.length === 0 ? (
              <p className="text-xs text-[#6B7280] font-semibold">No direct team members reporting to this user.</p>
            ) : (
              <div className="space-y-2">
                {user.directReports.map((report: any) => (
                  <Link
                    key={report.id}
                    href={`/settings/users/${report.id}`}
                    className="p-2.5 rounded-xl border border-[#E5E7EB] hover:bg-amber-50/50 flex items-center justify-between text-xs font-bold text-[#111827] transition-all"
                  >
                    <span>{report.firstName} {report.lastName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{report.role}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Granted Permissions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h2 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-2">
                <Key className="h-4 w-4 text-[#F59E0B]" />
                Assigned Feature Permissions ({permissionKeys.length})
              </h2>
            </div>

            {permissionKeys.length === 0 ? (
              <p className="text-xs text-[#6B7280] font-semibold py-4">
                No custom permissions assigned. User operates strictly on role defaults.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_PERMISSIONS.map(perm => {
                  const hasPerm = permissionKeys.includes(perm.key);
                  return (
                    <div
                      key={perm.key}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        hasPerm
                          ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                          : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block">{perm.label}</span>
                        <span className="text-[10px] font-mono font-semibold text-gray-500">{perm.key}</span>
                      </div>
                      {hasPerm ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-extrabold text-[10px]">
                          GRANTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-600 font-bold text-[10px]">
                          NONE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
