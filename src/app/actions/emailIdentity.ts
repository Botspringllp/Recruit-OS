'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

export async function updateAgencyEmailIdentityAction(formData: {
  senderName?: string;
  replyToEmail?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.agencyId) {
      return { success: false, error: 'Unauthorized session' };
    }

    const { senderName, replyToEmail } = formData;

    await (prisma as any).agency.update({
      where: { id: user.agencyId },
      data: {
        senderName: senderName ? senderName.trim() : null,
        replyToEmail: replyToEmail ? replyToEmail.trim() : null
      }
    });

    revalidatePath('/settings/email-logs');
    revalidatePath('/settings');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update agency email identity settings.' };
  }
}
