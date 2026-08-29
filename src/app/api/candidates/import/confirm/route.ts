import { NextRequest, NextResponse } from 'next/server';
import { importParsedCandidate } from '@/lib/candidates/service';
import { updateSession } from '@/lib/supabase/middleware';

export async function POST(request: NextRequest) {
  try {
    const { user } = await updateSession(request);
    const agencyId = request.headers.get('x-agency-id') || user?.user_metadata?.agency_id || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    const userId = user?.id;

    const body = await request.json();
    const { candidateData, fileName, mimeType, fileBase64 } = body;

    if (!candidateData || !candidateData.email || !candidateData.phone) {
      return NextResponse.json(
        { error: 'Invalid candidate data payload. First Name, Last Name, Email, and Phone are required.' },
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
