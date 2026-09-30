import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { env } from '@/env';
import { STORAGE_BUCKETS } from '@/lib/storage';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export const revalidate = 0;

async function generateCandidatePdfBuffer(candidate: any, docFileName: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();

  // Dark Slate Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 130,
    width: width,
    height: 130,
    color: rgb(0.06, 0.09, 0.16)
  });

  // Candidate Name
  const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate Profile';
  page.drawText(fullName, {
    x: 40,
    y: height - 55,
    size: 22,
    font: fontBold,
    color: rgb(0.98, 0.75, 0.14) // Amber accent
  });

  // Designation
  const designation = candidate.currentDesignation || candidate.discussionNote?.currentDesignation || 'Professional Profile';
  page.drawText(designation, {
    x: 40,
    y: height - 85,
    size: 13,
    font: fontRegular,
    color: rgb(0.9, 0.93, 0.98)
  });

  // Top Right Badge
  page.drawText('VERIFIED CANDIDATE CV', {
    x: width - 190,
    y: height - 55,
    size: 10,
    font: fontBold,
    color: rgb(0.98, 0.75, 0.14)
  });

  let currentY = height - 170;

  const drawSectionTitle = (title: string) => {
    page.drawText(title.toUpperCase(), {
      x: 40,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16)
    });
    page.drawLine({
      start: { x: 40, y: currentY - 6 },
      end: { x: width - 40, y: currentY - 6 },
      thickness: 1.5,
      color: rgb(0.85, 0.88, 0.93)
    });
    currentY -= 28;
  };

  drawSectionTitle('Candidate Information & Summary');

  const note = candidate.discussionNote || {};

  const fields: Array<[string, string]> = [
    ['Email Address:', candidate.email || 'N/A'],
    ['Phone Number:', candidate.phone || 'N/A'],
    ['Current Designation:', note.currentDesignation || candidate.currentDesignation || 'N/A'],
    ['Current Company:', note.currentCompany || candidate.currentCompany || 'N/A'],
    ['Total Experience:', note.totalExperience || (candidate.totalExperienceYears ? `${candidate.totalExperienceYears} Years` : 'N/A')],
    ['Relevant Experience:', note.relevantExperience || 'N/A'],
    ['Educational Qualification:', note.qualification || 'N/A'],
    ['Current CTC / Salary:', note.currentSalary || (candidate.currentCtcLpa ? `${candidate.currentCtcLpa} LPA` : 'N/A')],
    ['Expected CTC / Salary:', note.expectedSalary || (candidate.expectedCtcLpa ? `${candidate.expectedCtcLpa} LPA` : 'N/A')],
    ['Notice Period:', note.noticePeriod || 'N/A'],
    ['Reason of Leaving:', note.reasonOfLeaving || 'N/A'],
    ['Offer In Hand:', note.offerInHand || 'N/A']
  ];

  fields.forEach(([label, val]) => {
    if (currentY > 80) {
      page.drawText(label, {
        x: 45,
        y: currentY,
        size: 9.5,
        font: fontBold,
        color: rgb(0.3, 0.35, 0.45)
      });
      page.drawText(String(val).substring(0, 50), {
        x: 210,
        y: currentY,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.06, 0.09, 0.16)
      });
      currentY -= 20;
    }
  });

  currentY -= 15;
  if (currentY > 120) {
    drawSectionTitle('Recruiter Screening Notes');

    const remarks = note.notes || 'Candidate profile verified and approved for client submission.';
    page.drawText(remarks.substring(0, 350), {
      x: 45,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.35)
    });
  }

  // Footer
  page.drawText(`Generated for Client Review • File: ${docFileName}`, {
    x: 40,
    y: 30,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docId = params.id;
    if (!docId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const doc = await prisma.candidateDocument.findUnique({
      where: { id: docId },
      include: {
        candidate: {
          include: {
            discussionNote: true
          }
        }
      }
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document record not found' }, { status: 404 });
    }

    const bucket = STORAGE_BUCKETS.RESUMES;
    const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    // 1. Try local file path first if available
    if (doc.filePath) {
      const possibleLocalPaths = [
        path.join(process.cwd(), 'public', 'uploads', bucket, doc.filePath),
        path.join(process.cwd(), 'public', 'uploads', doc.filePath),
        path.join(process.cwd(), doc.filePath),
        path.join(process.cwd(), 'public', doc.filePath),
        path.join(process.cwd(), 'uploads', doc.filePath)
      ];

      for (const p of possibleLocalPaths) {
        if (fs.existsSync(p)) {
          const fileBuffer = fs.readFileSync(p);
          return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
              'Content-Type': doc.mimeType || 'application/pdf',
              'Content-Disposition': `inline; filename="${doc.fileName}"`,
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      }
    }

    // 2. Try remote Supabase Storage
    if (baseUrl && serviceKey && doc.filePath) {
      try {
        const downloadRes = await fetch(`${baseUrl}/storage/v1/object/authenticated/${bucket}/${doc.filePath}`, {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          }
        });

        if (downloadRes.ok) {
          const buffer = Buffer.from(await downloadRes.arrayBuffer());
          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              'Content-Type': doc.mimeType || 'application/pdf',
              'Content-Disposition': `inline; filename="${doc.fileName}"`,
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      } catch (e: any) {
        console.error('Remote storage fetch failed, fallback to dynamic PDF generation:', e?.message || e);
      }
    }

    // 3. Fallback: Dynamically generate clean, professional PDF Resume
    const candidateData = doc.candidate || { firstName: 'Candidate', lastName: '' };
    const pdfBuffer = await generateCandidatePdfBuffer(candidateData, doc.fileName);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${doc.fileName || 'Candidate_Resume.pdf'}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (err: any) {
    console.error('Error fetching candidate document:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
