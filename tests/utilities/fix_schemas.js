const fs = require('fs');

const pipelineSlaLogBlock = `
model PipelineSlaLog {
  id                    String        @id @default(dbgenerated("gen_random_uuid()")) @map("sla_log_id") @db.Uuid
  agencyId              String        @map("agency_id") @db.Uuid
  submissionId          String        @map("submission_id") @db.Uuid
  previousStage         PipelineStage? @map("previous_stage")
  newStage              PipelineStage @map("new_stage")
  timeInStageHours      Decimal       @default(0.00) @map("time_in_stage_hours") @db.Decimal(6, 2)
  slaStatusAtTransition SlaStatus     @default(HEALTHY) @map("sla_status_at_transition")
  createdAt             DateTime      @default(now()) @map("created_at") @db.Timestamptz

  agency     Agency              @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  submission CandidateSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@map("pipeline_sla_logs")
}
`;

function fixSchemaFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove existing PipelineSlaLog if present
  content = content.replace(/model PipelineSlaLog \{[\s\S]*?\n\}/g, '');

  // Ensure CommunicationTemplate model is present
  if (!content.includes('model CommunicationTemplate')) {
    content = content.replace(
      '@@map("candidate_submissions")',
      `@@map("candidate_submissions")\n${pipelineSlaLogBlock}\nmodel CommunicationTemplate {\n  id              String      @id @default(dbgenerated("gen_random_uuid()")) @map("template_id") @db.Uuid\n  agencyId        String      @map("agency_id") @db.Uuid\n  channel         CommChannel\n  name            String      @db.VarChar(128)\n  subjectTemplate String?     @map("subject_template") @db.VarChar(255)\n  bodyTemplate    String      @map("body_template")\n  isApproved      Boolean     @default(true) @map("is_approved")\n  createdAt       DateTime    @default(now()) @map("created_at") @db.Timestamptz\n\n  agency Agency @relation(fields: [agencyId], references: [id], onDelete: Cascade)\n\n  @@map("communication_templates")\n}`
    );
  } else {
    content = content.replace(
      '@@map("candidate_submissions")',
      `@@map("candidate_submissions")\n${pipelineSlaLogBlock}`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ${filePath}`);
}

fixSchemaFile('schema.prisma');
fixSchemaFile('database/schema.prisma');
