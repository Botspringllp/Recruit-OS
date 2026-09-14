import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const { agencyId } = await params;

    if (!agencyId) {
      return NextResponse.json({ success: false, error: 'Agency ID is required' }, { status: 400 });
    }

    const agency = await (prisma.agency as any).findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, widgetEnabled: true }
    });

    if (!agency) {
      return NextResponse.json({ success: false, error: 'Agency not found' }, { status: 404 });
    }

    if (agency.widgetEnabled === false) {
      return NextResponse.json(
        { success: false, error: 'Widget download restricted. Widget Access is disabled by Super Admin.' },
        { status: 403 }
      );
    }

    // Determine target submission base URL dynamically from request header
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const submitUrl = `${baseUrl}/api/widget/${agency.id}/submit`;

    // 1. README.md
    const readmeContent = `# RecruitOS Requirement Capture Widget

Agency Name: ${agency.name}
Widget ID: ${agency.id}
Submit Endpoint: ${submitUrl}

## Deployment Instructions

1. Unzip this package.
2. Upload \`widget.html\`, \`widget.css\`, and \`widget.js\` to your web server.
3. Open \`widget.html\` in any web browser to test requirement submissions.
4. To embed into your existing website, insert an iframe pointing to \`widget.html\`:
   \`\`\`html
   <iframe src="https://yourwebsite.com/path/to/widget.html" width="100%" height="800" frameborder="0"></iframe>
   \`\`\`

Requirements submitted through this form will immediately appear in your RecruitOS Owner Intake Queue.
`;

    // 2. widget.html
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hiring Requirement Request - ${agency.name}</title>
  <link rel="stylesheet" href="widget.css">
</head>
<body>
  <div className="widget-container">
    <div className="widget-card" id="widgetCard">
      <div className="widget-header">
        <h2 className="widget-title">Hiring Requirement Request</h2>
        <p className="widget-subtitle">Submit your hiring requirements and our recruitment team will contact you.</p>
      </div>

      <form id="requirementForm" className="widget-form">
        <div className="form-grid">
          <div className="form-group font-mandatory">
            <label for="companyName">Company Name *</label>
            <input type="text" id="companyName" name="companyName" required placeholder="e.g. Acme Corporation">
          </div>

          <div className="form-group font-mandatory">
            <label for="contactPerson">Contact Person *</label>
            <input type="text" id="contactPerson" name="contactPerson" required placeholder="e.g. Sarah Jenkins">
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group font-mandatory">
            <label for="contactEmail">Business Email *</label>
            <input type="email" id="contactEmail" name="contactEmail" required placeholder="sarah@acme.com">
          </div>

          <div className="form-group font-mandatory">
            <label for="contactNumber">Phone Number *</label>
            <input type="tel" id="contactNumber" name="contactNumber" required placeholder="+1 (555) 000-0000">
          </div>
        </div>

        <div className="form-group font-mandatory">
          <label for="positionTitle">Position Title *</label>
          <input type="text" id="positionTitle" name="positionTitle" required placeholder="e.g. Lead Full Stack Engineer">
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label for="industryType">Industry Type</label>
            <input type="text" id="industryType" name="industryType" placeholder="e.g. Information Technology">
          </div>

          <div className="form-group">
            <label for="employmentType">Employment Type</label>
            <select id="employmentType" name="employmentType">
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label for="experienceRequired">Experience Required</label>
            <input type="text" id="experienceRequired" name="experienceRequired" placeholder="e.g. 5+ Years">
          </div>

          <div className="form-group">
            <label for="location">Job Location</label>
            <input type="text" id="location" name="location" placeholder="e.g. New York / Remote">
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label for="education">Education Requirement</label>
            <input type="text" id="education" name="education" placeholder="e.g. Bachelor's in CS">
          </div>

          <div className="form-group">
            <label for="priority">Priority</label>
            <select id="priority" name="priority">
              <option value="Medium" selected>Medium</option>
              <option value="Low">Low</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label for="skills">Key Skills</label>
          <input type="text" id="skills" name="skills" placeholder="e.g. React, Node.js, PostgreSQL">
        </div>

        <div className="form-group font-mandatory">
          <label for="jobDescription">Job Description *</label>
          <textarea id="jobDescription" name="jobDescription" rows="4" required placeholder="Paste or summarize key responsibilities and role specifications..."></textarea>
        </div>

        <div className="form-group">
          <label for="companyOverview">Company Overview</label>
          <textarea id="companyOverview" name="companyOverview" rows="2" placeholder="Brief company summary..."></textarea>
        </div>

        <div id="errorMessage" className="error-banner" style="display: none;"></div>

        <button type="submit" id="submitBtn" className="submit-button">
          <span>Submit Requirement</span>
        </button>
      </form>

      <div id="successCard" className="success-card" style="display: none;">
        <div className="success-icon">✓</div>
        <h3 className="success-title">Thank You</h3>
        <p className="success-message">Your hiring requirement has been received successfully.</p>
        <p className="success-submessage">Our recruitment team will review your request shortly.</p>
        <div className="reference-badge">
          <span>Reference ID: </span>
          <strong id="refId">REQ-XXXX</strong>
        </div>
        <button onclick="window.location.reload()" className="reset-button">Submit Another Requirement</button>
      </div>
    </div>
  </div>

  <script src="widget.js"></script>
</body>
</html>
`;

    // 3. widget.css
    const cssContent = `/* RecruitOS Standalone Widget Styles */
* { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
body { background-color: #f8fafc; color: #0f172a; display: flex; justify-content: center; padding: 24px 16px; }
.widget-container { width: 100%; max-width: 680px; }
.widget-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
.widget-header { margin-bottom: 24px; text-align: center; }
.widget-title { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
.widget-subtitle { font-size: 13px; color: #64748b; margin-top: 6px; }
.widget-form { display: flex; flex-direction: column; gap: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12px; font-weight: 700; color: #334155; }
.form-group font-mandatory label { color: #0f172a; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 10px 14px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 12px;
  background-color: #ffffff; color: #0f172a; outline: none; transition: all 0.2s ease;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
.submit-button {
  background: #f59e0b; color: #0f172a; font-size: 14px; font-weight: 900; padding: 14px;
  border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s ease; margin-top: 8px;
}
.submit-button:hover { background: #d97706; }
.error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.success-card { text-align: center; padding: 32px 16px; }
.success-icon { width: 64px; height: 64px; background: #ecfdf5; color: #10b981; font-size: 32px; font-weight: 900; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; }
.success-title { font-size: 26px; font-weight: 900; color: #0f172a; }
.success-message { font-size: 14px; font-weight: 700; color: #334155; margin-top: 8px; }
.success-submessage { font-size: 12px; color: #64748b; margin-top: 4px; }
.reference-badge { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 30px; font-size: 13px; margin-top: 20px; }
.reference-badge strong { color: #d97706; font-weight: 900; }
.reset-button { margin-top: 24px; background: transparent; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 12px; font-size: 12px; font-weight: 700; cursor: pointer; color: #475569; }
.reset-button:hover { background: #f8fafc; color: #0f172a; }
`;

    // 4. widget.js
    const jsContent = `/* RecruitOS Widget Form Submission Handler */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("requirementForm");
  const submitBtn = document.getElementById("submitBtn");
  const errorBanner = document.getElementById("errorMessage");
  const successCard = document.getElementById("successCard");
  const refIdSpan = document.getElementById("refId");

  const SUBMIT_URL = "${submitUrl}";

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorBanner.style.display = "none";

    const formData = {
      companyName: document.getElementById("companyName").value.trim(),
      contactPerson: document.getElementById("contactPerson").value.trim(),
      contactEmail: document.getElementById("contactEmail").value.trim(),
      contactNumber: document.getElementById("contactNumber").value.trim(),
      positionTitle: document.getElementById("positionTitle").value.trim(),
      jobDescription: document.getElementById("jobDescription").value.trim(),
      industryType: document.getElementById("industryType").value.trim(),
      employmentType: document.getElementById("employmentType").value,
      experienceRequired: document.getElementById("experienceRequired").value.trim(),
      location: document.getElementById("location").value.trim(),
      education: document.getElementById("education").value.trim(),
      skills: document.getElementById("skills").value.trim(),
      companyOverview: document.getElementById("companyOverview").value.trim(),
      priority: document.getElementById("priority").value
    };

    if (!formData.companyName || !formData.contactPerson || !formData.contactEmail || !formData.contactNumber || !formData.positionTitle || !formData.jobDescription) {
      errorBanner.textContent = "Please fill in all mandatory fields marked with (*).";
      errorBanner.style.display = "block";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>Submitting...</span>";

    try {
      const response = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        form.style.display = "none";
        refIdSpan.textContent = result.referenceId || "REQ-SUCCESS";
        successCard.style.display = "block";
      } else {
        errorBanner.textContent = result.error || "Failed to submit requirement. Please try again.";
        errorBanner.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>Submit Requirement</span>";
      }
    } catch (err) {
      errorBanner.textContent = "Network error connecting to RecruitOS. Please try again.";
      errorBanner.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.innerHTML = "<span>Submit Requirement</span>";
    }
  });
});
`;

    const zip = new JSZip();
    zip.file('README.md', readmeContent);
    zip.file('widget.html', htmlContent);
    zip.file('widget.css', cssContent);
    zip.file('widget.js', jsContent);

    const zipBuffer = await zip.generateAsync({ type: 'uint8array' });

    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="recruitos-widget-${agency.id.slice(0, 8)}.zip"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('ZIP generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate Widget ZIP file.' },
      { status: 500 }
    );
  }
}
