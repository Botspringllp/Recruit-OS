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

function addEnums(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const target = '// DOMAIN 1: IDENTITY & AGENCY CORE';
  if (!content.includes('enum InterviewType')) {
    content = content.replace(target, `${interviewEnums.trim()}\n\n${target}`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added enums to ${filePath}`);
  }
}

addEnums('schema.prisma');
addEnums('database/schema.prisma');
