import React from 'react';
import Link from 'next/link';
import { Users, UserPlus, Shield, CheckCircle2, Mail, Ban, ArrowUpRight, Eye, Edit3 } from 'lucide-react';
import { getUsersAction } from '@/app/actions/users';
import { DisableUserButton } from '@/components/users/DisableUserButton';

export const revalidate = 0;

export default async function UserManagementPage() {
  const result = await getUsersAction();
  const users = result.data?.users || [];
  const kpis = result.data?.kpis || {
    totalUsers: 0,
    activeUsers: 0,
    invitedUsers: 0,
    disabledUsers: 0
  };

  return (
    <div className="bg-white min-h-screen p-6 sm:p-8 space-y-8 text-[#111827]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#F59E0B]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              User & Team Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[#6B7280] mt-1">
            Manage agency team members, role assignments, and feature permissions
          </p>
        </div>

        <Link
          href="/settings/users/new"
          className="px-4 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-[#F59E0B]/20 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create User</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-black text-[#111827] mt-1">{kpis.totalUsers}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F59E0B]">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">Active Users</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{kpis.activeUsers}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Invited Users */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">Invited Users</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1">{kpis.invitedUsers}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        {/* Disabled Users */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">Disabled Users</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{kpis.disabledUsers}</h3>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <Ban className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* User Listing Table Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden space-y-4">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#111827]">Team Members Directory</h2>
          <span className="text-xs font-bold text-[#6B7280] bg-gray-100 px-3 py-1 rounded-full">
            {users.length} {users.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-[#E5E7EB] text-[#6B7280] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7280] font-semibold">
                    No agency users found. Click "Create User" to add your first team member.
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const isDisabled = user.status === 'INACTIVE' || user.status === 'SUSPENDED' || !user.isActive;

                  return (
                    <tr key={user.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-4 sm:px-6 font-bold text-[#111827]">
                        <Link href={`/settings/users/${user.id}`} className="hover:text-[#F59E0B] transition-colors flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-amber-100 border border-amber-300 text-[#D97706] font-black flex items-center justify-center shrink-0 uppercase text-xs">
                            {user.firstName?.[0] || 'U'}
                          </div>
                          <span>{user.firstName} {user.lastName}</span>
                        </Link>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 font-semibold text-[#6B7280]">
                        {user.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-block ${
                          user.role === 'MASTER_OWNER'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : user.role === 'AGENCY_OWNER' || user.role === 'AGENCY_FOUNDER'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : user.role === 'FINANCE_MANAGER' || user.role === 'FINANCE_ADMIN'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : user.role === 'COMPLIANCE_OFFICER'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : user.role === 'INTERVIEW_COORDINATOR'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {user.role.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold inline-flex items-center gap-1 ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : user.status === 'INVITED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-emerald-500' : user.status === 'INVITED' ? 'bg-blue-500' : 'bg-rose-500'
                          }`} />
                          {user.status}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-4 font-medium text-[#6B7280]">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 font-medium text-[#6B7280]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/settings/users/${user.id}`}
                            className="p-1.5 text-gray-600 hover:text-[#111827] hover:bg-gray-100 rounded-lg transition-colors"
                            title="View User Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/settings/users/${user.id}/edit`}
                            className="p-1.5 text-gray-600 hover:text-[#F59E0B] hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <DisableUserButton
                            userId={user.id}
                            userName={`${user.firstName} ${user.lastName}`}
                            isAlreadyDisabled={isDisabled}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
