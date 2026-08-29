const fs = require('fs');

const interviewEnums = `
enum InterviewType {
  INTERNAL_SCREENING
  CLIENT_ROUND_1
  CLIENT_ROUND_2
  TECHNICAL_ASSESSMENT
  HR_ROUND
  FINAL_MANAGERIAL

  @@map("interview_type")
}

enum InterviewMode {
  GOOGLE_MEET
  MS_TEAMS
  ZOOM
  PHONE
  IN_PERSON

  @@map("interview_mode")
}
`;

const interviewModel = `
model InterviewSchedule {
  id                 String         @id @default(dbgenerated("gen_random_uuid()")) @map("interview_id") @db.Uuid
  agencyId           String         @map("agency_id") @db.Uuid
  submissionId       String         @map("submission_id") @db.Uuid
  roundType          InterviewType? @map("round_type")
  confirmedStartTime DateTime       @map("scheduled_at") @db.Timestamptz
  durationMinutes    Int            @default(45) @map("duration_minutes")
  mode               InterviewMode? @map("mode")
  meetingLink        String?        @map("meeting_link")
  notes              String?        @map("notes")
  status             String         @default("SCHEDULED") @map("status") @db.VarChar(32)
  outcome            String?        @map("outcome") @db.VarChar(32)
  createdAt          DateTime       @default(now()) @map("created_at") @db.Timestamptz

  agency            Agency                      @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  submission        CandidateSubmission         @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  prepLogs          CandidatePrepLog[]
  interviewFeedback CandidateInterviewFeedback[]

  @@map("interview_schedules")
}
`;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure DocCategory is complete
  const docCategoryFull = `enum DocCategory {
  RAW_RESUME
  SANITIZED_RESUME
  PORTFOLIO
  COMPLIANCE_ID
  RELIEVING_LETTER
  OFFER_LETTER

  @@map("doc_category")
}`;
  content = content.replace(/enum DocCategory \{[\s\S]*?@@map\("doc_category"\)\n\}/g, docCategoryFull);

  // Remove existing InterviewType / InterviewMode enums if present
  content = content.replace(/enum InterviewType \{[\s\S]*?\n\}/g, '');
  content = content.replace(/enum InterviewMode \{[\s\S]*?\n\}/g, '');

  // Add interviewEnums after DocCategory
  content = content.replace(docCategoryFull, `${docCategoryFull}\n${interviewEnums}`);

  // Replace model InterviewSchedule
  content = content.replace(/model InterviewSchedule \{[\s\S]*?\n\}/g, interviewModel.trim());

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

processFile('schema.prisma');
processFile('database/schema.prisma');
