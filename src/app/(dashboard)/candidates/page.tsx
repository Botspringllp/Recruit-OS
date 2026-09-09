import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { serializeDecimals } from '@/lib/serialize';
import { CandidateRepositoryTable } from '@/components/candidates/CandidateRepositoryTable';

export const revalidate = 0;

interface CandidatesPageProps {
  searchParams?: {
    q?: string;
    page?: string;
  };
}

export default async function CandidatesPage({ searchParams }: CandidatesPageProps) {
  const query = (searchParams?.q || '').trim();
  const currentPage = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  const dbUser = await getCurrentUser();
  if (!dbUser) {
    redirect('/login');
  }

  const agencyId = dbUser?.agencyId;

  const whereClause: any = {
    agencyId,
    deletedAt: null
  };

  if (query) {
    whereClause.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { currentCompany: { contains: query, mode: 'insensitive' } },
      { currentDesignation: { contains: query, mode: 'insensitive' } }
    ];
  }

  const [totalCandidates, rawCandidateList] = await Promise.all([
    prisma.candidateRecord.count({ where: whereClause }).catch(() => 0),
    prisma.candidateRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        currentCompany: true,
        currentDesignation: true,
        totalExperienceYears: true,
        currentLocation: true,
        source: true,
        createdAt: true
      }
    }).catch(() => [])
  ]);

  const totalPages = Math.ceil(totalCandidates / pageSize) || 1;
  const candidateList = serializeDecimals(rawCandidateList);

  return (
    <CandidateRepositoryTable
      candidateList={candidateList as any}
      totalCandidates={totalCandidates}
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      skip={skip}
      query={query}
    />
  );
}
