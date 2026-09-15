import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Enable CORS for external website widget submissions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const { agencyId } = await params;

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'Agency ID parameter is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const agency = await (prisma.agency as any).findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, widgetEnabled: true, websiteBuilderEnabled: true }
    });

    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Target agency not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Allow submission if websiteBuilderEnabled is true OR widgetEnabled is true
    if (agency.widgetEnabled === false && agency.websiteBuilderEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'Requirement Capture is disabled for this agency.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();

    const {
      companyName,
      contactPerson,
      contactEmail,
      contactNumber,
      positionTitle,
      jobDescription,
      industryType,
      employmentType,
      experienceRequired,
      location,
      education,
      skills,
      companyOverview,
      priority,
      pdfName,
      pdfBase64
    } = body;

    // Mandatory Field Validation (Company & Contact Info)
    if (!companyName || !companyName.trim()) {
      return NextResponse.json({ success: false, error: 'Company Name is required.' }, { status: 400, headers: corsHeaders });
    }
    if (!contactPerson || !contactPerson.trim()) {
      return NextResponse.json({ success: false, error: 'Contact Person is required.' }, { status: 400, headers: corsHeaders });
    }
    if (!contactEmail || !contactEmail.trim()) {
      return NextResponse.json({ success: false, error: 'Business Email is required.' }, { status: 400, headers: corsHeaders });
    }
    if (!contactNumber || !contactNumber.trim()) {
      return NextResponse.json({ success: false, error: 'Phone Number is required.' }, { status: 400, headers: corsHeaders });
    }

    // Smart defaults for position title & description when optional/pdf-only
    const finalPositionTitle = positionTitle?.trim() || `Hiring Requirement (${companyName.trim()})`;
    const defaultDesc = pdfName
      ? `Requirement PDF Attached: ${pdfName}`
      : `Hiring requirement submitted by ${contactPerson.trim()} (${companyName.trim()}).`;
    const finalJobDescription = jobDescription?.trim() || defaultDesc;

    let finalCompanyOverview = companyOverview?.trim() || '';
    if (pdfName) {
      finalCompanyOverview = `${finalCompanyOverview}\n\n📄 [Attached Requirement PDF: ${pdfName}]`.trim();
    }

    // Create Incoming Requirement Record in Database
    const requirement = await (prisma as any).incomingRequirement.create({
      data: {
        agencyId,
        companyName: companyName.trim().slice(0, 255),
        contactPerson: contactPerson.trim().slice(0, 255),
        contactEmail: contactEmail.trim().slice(0, 255),
        contactNumber: contactNumber.trim().slice(0, 32),
        positionTitle: finalPositionTitle.slice(0, 255),
        jobDescription: finalJobDescription,
        pdfName: pdfName ? pdfName.slice(0, 255) : null,
        pdfUrl: pdfBase64 || null,
        industryType: industryType?.trim() ? industryType.trim().slice(0, 128) : null,
        employmentType: employmentType?.trim() ? employmentType.trim().slice(0, 64) : 'Full-time',
        experienceRequired: experienceRequired?.trim() ? experienceRequired.trim().slice(0, 64) : null,
        location: location?.trim() ? location.trim().slice(0, 255) : null,
        education: education?.trim() ? education.trim().slice(0, 255) : null,
        skills: skills?.trim() || null,
        companyOverview: finalCompanyOverview || null,
        priority: (priority || 'Medium').slice(0, 32),
        source: 'Website',
        status: 'Pending Review'
      }
    });

    // Create initial timeline audit event
    await (prisma as any).requirementTimelineEvent.create({
      data: {
        requirementId: requirement.id,
        title: 'Requirement Received',
        description: pdfName ? `Requirement Received via Website with PDF Attachment (${pdfName})` : 'Requirement Received via Website',
        actorName: 'Website Client'
      }
    });

    const referenceId = `REQ-${requirement.id.slice(0, 8).toUpperCase()}`;

    return NextResponse.json(
      {
        success: true,
        referenceId,
        requirementId: requirement.id,
        message: 'Requirement submitted successfully.'
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Widget submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error processing requirement submission.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
