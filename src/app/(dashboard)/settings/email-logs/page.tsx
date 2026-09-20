import { redirect } from 'next/navigation';

export default function EmailLogsRedirectPage() {
  redirect('/settings/email?tab=logs');
}
