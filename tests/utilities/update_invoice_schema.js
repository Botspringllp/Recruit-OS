const fs = require('fs');

const invoiceModel = `
model InvoiceRecord {
  id                 String    @id @default(dbgenerated("gen_random_uuid()")) @map("invoice_id") @db.Uuid
  agencyId           String    @map("agency_id") @db.Uuid
  clientId           String    @map("client_id") @db.Uuid
  auditId            String?   @unique @map("audit_id") @db.Uuid
  jobId              String?   @map("mandate_id") @db.Uuid
  submissionId       String?   @map("submission_id") @db.Uuid
  offerId            String?   @map("offer_id") @db.Uuid
  invoiceNumber      String    @map("invoice_number") @db.VarChar(64)
  baseFeeAmount      Decimal   @default(0.00) @map("base_fee_amount") @db.Decimal(12, 2)
  gstPercentage      Decimal   @default(18.00) @map("gst_percentage") @db.Decimal(5, 2)
  gstAmount          Decimal   @default(0.00) @map("gst_amount") @db.Decimal(12, 2)
  totalInvoiceAmount Decimal   @default(0.00) @map("total_invoice_amount") @db.Decimal(12, 2)
  amountReceived     Decimal   @default(0.00) @map("amount_received") @db.Decimal(12, 2)
  balanceDue         Decimal   @default(0.00) @map("balance_due") @db.Decimal(12, 2)
  currency           String    @default("INR") @db.VarChar(3)
  invoiceStatus      String    @default("DRAFT") @map("invoice_status") @db.VarChar(32)
  issuedDate         DateTime  @default(now()) @map("issued_date") @db.Timestamptz
  dueDate            DateTime  @map("due_date") @db.Timestamptz
  paidAt             DateTime? @map("paid_at") @db.Timestamptz
  notes              String?   @map("notes")
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt          DateTime? @map("deleted_at") @db.Timestamptz

  agency        Agency              @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  client        Client              @relation(fields: [clientId], references: [id], onDelete: Cascade)
  offerAudit    JobOfferAudit?      @relation(fields: [auditId], references: [id], onDelete: SetNull)
  financialLogs FinancialAuditLog[]

  @@unique([agencyId, invoiceNumber], name: "ux_invoice_number_tenant")
  @@index([agencyId, invoiceStatus, dueDate])
  @@map("invoice_records")
}
`;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/model InvoiceRecord \{[\s\S]*?\n\}/g, invoiceModel.trim());
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated InvoiceRecord in ${filePath}`);
}

processFile('schema.prisma');
processFile('database/schema.prisma');
