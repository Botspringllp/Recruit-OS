import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { importParsedCandidate } from '@/lib/candidates/service';
import { updateSession } from '@/lib/supabase/middleware';
import { getResolvedAgencyId } from '@/lib/agency/resolver';
import { hasPermission, getCurrentUser } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    let user: any = null;
    try {
      const sessionResult = await updateSession(request);
      user = sessionResult?.user || null;
    } catch (e) {
      console.warn('Supabase session fetch bypassed in confirm route:', e);
    }

    if (!user) {
      user = await getCurrentUser();
    }

    if (!user || !hasPermission(user, 'candidate.create')) {
      logger.warn({
        event: 'ACCESS_DENIED',
        userId: user?.id || 'ANONYMOUS',
        agencyId: user?.agencyId || 'GLOBAL',
        resource: 'candidate',
        action: 'create'
      }, `🚫 [ACCESS_DENIED] API /api/candidates/import/confirm denied for user ${user?.email || 'Anonymous'}`);

      return NextResponse.json(
        { error: 'Access Denied: Permission candidate.create required.' },
        { status: 403 }
      );
    }

    const agencyId = await getResolvedAgencyId(request, user);
    const userId = user?.email || user?.id;

    const body = await request.json();
    const { candidateData, fileName, mimeType, fileBase64 } = body;

    if (!candidateData || !candidateData.email || !candidateData.phone) {
      return NextResponse.json(
        { error: 'Invalid candidate data payload. Email and Phone Number are required.' },
        { status: 400 }
      );
    }

    let fileBuffer: Buffer | undefined;
    if (fileBase64) {
      const base64Data = fileBase64.replace(/^data:.*?;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    }

    const result = await importParsedCandidate({
      agencyId,
      userId,
      candidateData,
      fileBuffer,
      fileName: fileName || 'uploaded_resume.pdf',
      mimeType: mimeType || 'application/pdf'
    });

    revalidatePath('/candidates');
    revalidatePath('/cockpit');

    return NextResponse.json({
      success: true,
      message: 'Candidate record created and resume linked successfully.',
      result
    });
  } catch (error: any) {
    console.error('Candidate Import Confirm API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create candidate record.' },
      { status: 500 }
    );
  }
}
