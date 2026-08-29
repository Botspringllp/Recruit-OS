const fs = require('fs');

const offerModel = `
model JobOfferAudit {
  id                    String    @id @default(dbgenerated("gen_random_uuid()")) @map("audit_id") @db.Uuid
  agencyId              String    @map("agency_id") @db.Uuid
  submissionId          String    @unique @map("submission_id") @db.Uuid
  offeredFixedCtc       Decimal?  @map("offered_fixed_ctc") @db.Decimal(12, 2)
  offeredVariableCtc    Decimal?  @default(0.00) @map("offered_variable_ctc") @db.Decimal(12, 2)
  totalOfferedCtc       Decimal?  @map("total_offered_ctc") @db.Decimal(12, 2)
  agreedFeePercentage   Decimal?  @map("agreed_fee_percentage") @db.Decimal(5, 2)
  calculatedPlacementFee Decimal? @map("calculated_placement_fee") @db.Decimal(12, 2)
  ctcVarianceFlag       Boolean?  @default(false) @map("ctc_variance_flag")
  signedOfferLetterUrl  String?   @map("signed_offer_letter_url") @db.VarChar(512)
  auditedByUserId       String?   @map("audited_by_user_id") @db.Uuid
  joiningDate           DateTime? @map("joining_date") @db.Timestamptz
  expiryDate            DateTime? @map("expiry_date") @db.Timestamptz
  noticeBuyout          Decimal?  @default(0.00) @map("notice_buyout") @db.Decimal(12, 2)
  status                String    @default("DRAFT") @map("status") @db.VarChar(32)
  notes                 String?   @map("notes")
  auditedAt             DateTime? @default(now()) @map("audited_at") @db.Timestamptz
  createdAt             DateTime  @default(now()) @map("created_at") @db.Timestamptz
  deletedAt             DateTime? @map("deleted_at") @db.Timestamptz

  agency        Agency              @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  submission    CandidateSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  auditedByUser User?               @relation(fields: [auditedByUserId], references: [id], onDelete: SetNull)
  invoice       InvoiceRecord?

  @@map("job_offer_audits")
}
`;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/model JobOfferAudit \{[\s\S]*?\n\}/g, offerModel.trim());
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated JobOfferAudit in ${filePath}`);
}

processFile('schema.prisma');
processFile('database/schema.prisma');
