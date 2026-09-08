import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/rbac';

export default async function ForbiddenPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const roleStr = String(currentUser.role || '').toUpperCase();
    if (roleStr === 'SUPER_ADMIN' || roleStr === 'MASTER_OWNER') {
      redirect('/super-admin');
    } else {
      redirect('/cockpit');
    }
  } else {
    redirect('/login');
  }
}
