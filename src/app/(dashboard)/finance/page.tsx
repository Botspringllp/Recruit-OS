import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { RevenueSummaryCards } from '@/components/finance/RevenueSummaryCards';
import { InvoiceStatusDropdown } from '@/components/finance/InvoiceStatusDropdown';
import { Receipt, Plus, Search, Filter, ArrowUpDown, Building, ExternalLink } from 'lucide-react';

export const revalidate = 0;

interface FinancePageProps {
  searchParams: {
    q?: string;
    status?: string;
    clientId?: string;
    sort?: string;
    page?: string;
  };
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const currentUser = await getCurrentUser();
  if (!hasPermission(currentUser, 'finance.view')) {
    logger.warn({
      event: 'ACCESS_DENIED_PAGE_REDIRECT',
      userId: currentUser?.id || 'ANONYMOUS',
      agencyId: currentUser?.agencyId || 'GLOBAL',
      page: '/finance',
      requiredPermission: 'finance.view'
    }, '🚫 [ACCESS_DENIED] Unauthorized page access redirected to /403');
    redirect('/403');
  }

  const agencyId = currentUser?.agencyId;

  const query = (searchParams.q || '').trim();
  const selectedStatus = (searchParams.status || '').trim();
  const selectedClient = (searchParams.clientId || '').trim();
  const sortBy = (searchParams.sort || 'newest').trim();
  const page = Math.max(1, parseInt(searchParams.page || '1', 10));
  const pageSize = 10;

  if (!agencyId) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Demo agency contextual record not found.
      </div>
    );
  }

  await prisma.invoiceRecord.updateMany({
    where: {
      agencyId,
      balanceDue: { gt: 0 },
      dueDate: { lt: new Date() },
      invoiceStatus: { notIn: ['OVERDUE', 'PAID', 'CANCELLED'] }
    },
    data: { invoiceStatus: 'OVERDUE' }
  }).catch((e) => console.error('Error running overdue engine:', e));

  const allInvoices = await prisma.invoiceRecord.findMany({
    where: { agencyId, invoiceStatus: { not: 'CANCELLED' } },
    select: {
      totalInvoiceAmount: true,
      amountReceived: true,
      balanceDue: true,
      invoiceStatus: true,
      dueDate: true
    }
  });

  const totalRevenue = allInvoices.reduce((acc, inv) => acc + parseFloat(inv.totalInvoiceAmount.toString()), 0);
  const outstandingReceivables = allInvoices.reduce((acc, inv) => acc + parseFloat(inv.balanceDue.toString()), 0);
  const totalReceived = allInvoices.reduce((acc, inv) => acc + parseFloat(inv.amountReceived.toString()), 0);
  const invoicesSentCount = allInvoices.filter((inv) => inv.invoiceStatus === 'SENT_TO_CLIENT' || inv.invoiceStatus === 'PARTIALLY_PAID').length;
  const invoicesPaidCount = allInvoices.filter((inv) => inv.invoiceStatus === 'PAID').length;
  const overdueCount = allInvoices.filter((inv) => inv.invoiceStatus === 'OVERDUE' || (inv.dueDate < new Date() && parseFloat(inv.balanceDue.toString()) > 0)).length;
  const collectionRate = totalRevenue > 0 ? (totalReceived / totalRevenue) * 100 : 0;

  const stats = {
    totalRevenue,
    outstandingReceivables,
    invoicesSentCount,
    invoicesPaidCount,
    overdueCount,
    collectionRate
  };

  const clients = await prisma.client.findMany({
    where: { agencyId },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' }
  });

  const where: any = { agencyId };

  if (selectedStatus) {
    where.invoiceStatus = selectedStatus;
  }

  if (selectedClient) {
    where.clientId = selectedClient;
  }

  if (query) {
    where.OR = [
      { invoiceNumber: { contains: query, mode: 'insensitive' } },
      { client: { companyName: { contains: query, mode: 'insensitive' } } },
      { notes: { contains: query, mode: 'insensitive' } }
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
  if (sortBy === 'highest') orderBy = { totalInvoiceAmount: 'desc' };
  if (sortBy === 'overdue') orderBy = { dueDate: 'asc' };

  const [totalCount, invoiceList] = await Promise.all([
    prisma.invoiceRecord.count({ where }),
    prisma.invoiceRecord.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: { select: { companyName: true } }
      }
    })
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-amber-500" />
            Finance & Placement Invoices
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Automated placement invoicing, payment tracking & revenue collection metrics
          </p>
        </div>

        <Link
          href="/finance/new"
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Generate Invoice
        </Link>
      </div>

      <RevenueSummaryCards stats={stats} />

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-amber-500" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by invoice #, client name, remarks..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <select
              name="status"
              defaultValue={selectedStatus}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="GENERATED">Generated</option>
              <option value="SENT_TO_CLIENT">Sent to Client</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="relative">
            <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <select
              name="clientId"
              defaultValue={selectedClient}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <select
              name="sort"
              defaultValue={sortBy}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Billed</option>
              <option value="overdue">Due Date First</option>
            </select>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="h-4 w-4 text-amber-500" />
            Client Invoices & Billing Ledgers ({totalCount})
          </h2>
          <span className="text-[11px] text-slate-500 font-bold">Page {page} of {totalPages || 1}</span>
        </div>

        {invoiceList.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {invoiceList.map((inv) => {
              const totalVal = parseFloat(inv.totalInvoiceAmount.toString());
              const receivedVal = parseFloat(inv.amountReceived.toString());
              const balanceVal = parseFloat(inv.balanceDue.toString());
              const isOverdue = inv.invoiceStatus === 'OVERDUE' || (inv.dueDate < new Date() && balanceVal > 0);

              return (
                <div
                  key={inv.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/finance/${inv.id}`}
                        className="font-extrabold text-sm text-slate-900 hover:text-amber-600 transition-colors"
                      >
                        {inv.invoiceNumber}
                      </Link>

                      <InvoiceStatusDropdown invoiceId={inv.id} currentStatus={inv.invoiceStatus} />
                    </div>

                    <div className="text-xs text-slate-500 font-semibold flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        Client: <span className="text-slate-900 font-extrabold">{inv.client.companyName}</span>
                      </span>
                      <span>
                        Issued: <span className="text-slate-800 font-bold">{new Date(inv.issuedDate).toLocaleDateString('en-IN')}</span>
                      </span>
                      <span>
                        Due Date:{' '}
                        <span className={isOverdue ? 'text-rose-600 font-extrabold' : 'text-slate-800 font-bold'}>
                          {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 text-xs">
                    <div className="text-right">
                      <div className="font-black text-slate-900 text-sm">
                        INR {totalVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                        Received: <span className="text-emerald-700 font-extrabold">₹{receivedVal.toLocaleString('en-IN')}</span> | Due:{' '}
                        <span className={balanceVal > 0 ? 'text-amber-800 font-extrabold' : 'text-slate-500'}>
                          ₹{balanceVal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/finance/${inv.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-amber-500 text-slate-800 hover:text-slate-950 font-extrabold rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5"
                    >
                      <span>View Billing</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs font-bold space-y-2">
            <p>No financial invoices found matching the current criteria.</p>
            <p className="text-[11px] text-slate-400 font-medium">
              Placement invoices are created automatically when an offer reaches JOINED status.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
            <Link
              href={`/finance?page=${page - 1}&q=${encodeURIComponent(query)}&status=${selectedStatus}&clientId=${selectedClient}&sort=${sortBy}`}
              className={`px-4 py-2 bg-white border border-slate-300 text-slate-800 rounded-xl font-extrabold transition-all duration-200 ${
                page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
              }`}
            >
              Previous
            </Link>

            <span className="text-slate-500">
              Page <span className="text-slate-900 font-black">{page}</span> of {totalPages}
            </span>

            <Link
              href={`/finance?page=${page + 1}&q=${encodeURIComponent(query)}&status=${selectedStatus}&clientId=${selectedClient}&sort=${sortBy}`}
              className={`px-4 py-2 bg-white border border-slate-300 text-slate-800 rounded-xl font-extrabold transition-all duration-200 ${
                page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-slate-50'
              }`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
