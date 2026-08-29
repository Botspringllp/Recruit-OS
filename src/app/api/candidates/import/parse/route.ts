import { NextRequest, NextResponse } from 'next/server';
import { parseResumeBuffer } from '@/lib/parser';
import { updateSession } from '@/lib/supabase/middleware';

export async function POST(request: NextRequest) {
  try {
    const { user } = await updateSession(request);
    const agencyId = request.headers.get('x-agency-id') || user?.user_metadata?.agency_id || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
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
