import { NextRequest, NextResponse } from 'next/server';
import { parseResumeBuffer } from '@/lib/parser';
import { updateSession } from '@/lib/supabase/middleware';
import { getResolvedAgencyId } from '@/lib/agency/resolver';

export async function POST(request: NextRequest) {
  try {
    let user: any = null;
    try {
      const sessionResult = await updateSession(request);
      user = sessionResult?.user || null;
    } catch (e) {
      console.warn('Supabase session fetch bypassed in parse route:', e);
    }

    const agencyId = await getResolvedAgencyId(request, user);
    const userId = user?.id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No resume file uploaded.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name;
    const mimeType = file.type || 'application/pdf';

    const parseResult = await parseResumeBuffer(
      buffer,
      mimeType,
      fileName,
      agencyId,
      userId
    );

    console.log('RAW_TEXT_DEBUG:', JSON.stringify(parseResult.rawText));

    return NextResponse.json({
      success: true,
      agencyId,
      fileName,
      mimeType,
      parsedCandidate: parseResult.parsedCandidate,
      duplicateMatch: parseResult.duplicateMatch,
      rawText: parseResult.rawText
    });
  } catch (error: any) {
    console.error('Resume Parse API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process resume file.' },
      { status: 500 }
    );
  }
}
