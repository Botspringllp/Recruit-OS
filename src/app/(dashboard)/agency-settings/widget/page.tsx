import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/rbac';
import { prisma } from '@/lib/prisma';
import { WidgetManagementClient } from '@/components/settings/WidgetManagementClient';

export const dynamic = 'force-dynamic';

export default async function AgencyWidgetSettingsPage() {
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    redirect('/login');
  }

  const roleStr = String(dbUser.role || '').toUpperCase();
  const allowedRoles = ['MASTER_OWNER', 'AGENCY_OWNER', 'AGENCY_FOUNDER', 'SUPER_ADMIN'];

  if (!allowedRoles.includes(roleStr)) {
    redirect('/cockpit');
  }

  let agencyId = dbUser.agencyId || dbUser.agency?.id;

  let agency = null;
  if (agencyId) {
    agency = await (prisma.agency as any).findFirst({
      where: { id: agencyId, deletedAt: null },
      select: { id: true, name: true, createdAt: true, widgetEnabled: true }
    });
  }

  if (!agency && (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER')) {
    agency = await (prisma.agency as any).findFirst({
      where: { deletedAt: null },
      select: { id: true, name: true, createdAt: true, widgetEnabled: true }
    });
  }

  if (!agency) {
    redirect('/cockpit');
  }

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  return (
    <WidgetManagementClient
      agency={{
        id: agency.id,
        name: agency.name,
        createdAt: agency.createdAt,
        widgetEnabled: agency.widgetEnabled
      }}
      baseUrl={baseUrl}
    />
  );
}
