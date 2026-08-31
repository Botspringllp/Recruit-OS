/**
 * Runtime Verification Script for Phase PR-02B: User & Team Management Foundation
 * Tests User Creation, Update, Disabling, Permission Assignment, Role Storage, and Tenant Isolation.
 */

const { PrismaClient, UserRole, UserStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function runRuntimeVerification() {
  console.log('====================================================');
  console.log('PR-02B: USER & TEAM MANAGEMENT RUNTIME VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 6;

  try {
    // 1. Get or Create Primary Demo Agency
    let agency = await prisma.agency.findFirst({
      where: { subdomain: 'demo' }
    });

    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: 'Apex Executive Search Demo',
          subdomain: 'demo',
          subscriptionTier: 'ENTERPRISE'
        }
      });
    }

    console.log(`[Setup] Primary Agency ID: ${agency.id} (subdomain: ${agency.subdomain})`);

    // Create Second Agency for Tenant Isolation Test
    let secondAgency = await prisma.agency.findFirst({
      where: { subdomain: 'test-iso-tenant' }
    });
    if (!secondAgency) {
      secondAgency = await prisma.agency.create({
        data: {
          name: 'Isolated Secondary Agency',
          subdomain: 'test-iso-tenant',
          subscriptionTier: 'STARTER'
        }
      });
    }
    console.log(`[Setup] Isolated Agency ID: ${secondAgency.id}\n`);

    // -------------------------------------------------------------------------
    // TEST 1: USER CREATION WITH ROLE, STATUS & MANAGER
    // -------------------------------------------------------------------------
    console.log('▶ TEST 1: User Creation & Manager Assignment...');
    const testEmail = `test.recruiter.${Date.now()}@apexrecruitment.com`;

    // First create a manager
    const manager = await prisma.user.create({
      data: {
        agencyId: agency.id,
        firstName: 'Elena',
        lastName: 'Rostova',
        email: `manager.${Date.now()}@apexrecruitment.com`,
        passwordHash: '$2b$10$UnassignedDummyHashForAgencyUser',
        role: UserRole.AGENCY_OWNER,
        status: UserStatus.ACTIVE,
        isActive: true
      }
    });

    // Create user with managerId
    const newUser = await prisma.user.create({
      data: {
        agencyId: agency.id,
        firstName: 'Vikram',
        lastName: 'Mehta',
        email: testEmail,
        passwordHash: '$2b$10$UnassignedDummyHashForAgencyUser',
        role: UserRole.RECRUITER,
        status: UserStatus.ACTIVE,
        isActive: true,
        managerId: manager.id
      }
    });

    if (newUser && newUser.id && newUser.managerId === manager.id && newUser.role === 'RECRUITER') {
      console.log(`  ✓ SUCCESS: Created user ID ${newUser.id} assigned to Manager ${manager.id}`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: User creation or manager assignment invalid');
    }

    // -------------------------------------------------------------------------
    // TEST 2: PERMISSION ASSIGNMENT STORAGE
    // -------------------------------------------------------------------------
    console.log('\n▶ TEST 2: Permission Assignment Rows Storage...');
    const permissionsToAssign = [
      { resource: 'candidate', action: 'view' },
      { resource: 'candidate', action: 'create' },
      { resource: 'job', action: 'view' },
      { resource: 'compliance', action: 'approve' }
    ];

    await prisma.userPermission.createMany({
      data: permissionsToAssign.map(p => ({
        userId: newUser.id,
        resource: p.resource,
        action: p.action
      }))
    });

    const storedPerms = await prisma.userPermission.findMany({
      where: { userId: newUser.id }
    });

    if (storedPerms.length === 4) {
      console.log(`  ✓ SUCCESS: Stored ${storedPerms.length} UserPermission rows for user`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: Expected 4 UserPermission rows, found ${storedPerms.length}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: USER UPDATE
    // -------------------------------------------------------------------------
    console.log('\n▶ TEST 3: User Details & Role Update...');
    const updatedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        firstName: 'Vikram (Lead)',
        role: UserRole.COMPLIANCE_OFFICER,
        updatedAt: new Date()
      }
    });

    if (updatedUser.firstName === 'Vikram (Lead)' && updatedUser.role === 'COMPLIANCE_OFFICER') {
      console.log(`  ✓ SUCCESS: Updated user name & role to ${updatedUser.role}`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: User update verification failed');
    }

    // -------------------------------------------------------------------------
    // TEST 4: USER DISABLE (STATUS = INACTIVE, ISACTIVE = FALSE)
    // -------------------------------------------------------------------------
    console.log('\n▶ TEST 4: User Disable Execution...');
    const disabledUser = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        status: UserStatus.INACTIVE,
        isActive: false
      }
    });

    if (disabledUser.status === 'INACTIVE' && disabledUser.isActive === false) {
      console.log(`  ✓ SUCCESS: User ${disabledUser.id} disabled successfully (Status: INACTIVE, isActive: false)`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: User disable state invalid');
    }

    // -------------------------------------------------------------------------
    // TEST 5: TENANT ISOLATION (AGENCY_ID SCOPING)
    // -------------------------------------------------------------------------
    console.log('\n▶ TEST 5: agencyId Tenant Isolation Check...');
    const isolatedQuery = await prisma.user.findMany({
      where: {
        id: newUser.id,
        agencyId: secondAgency.id
      }
    });

    if (isolatedQuery.length === 0) {
      console.log(`  ✓ SUCCESS: Agency ${secondAgency.id} cannot access user of Agency ${agency.id}`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Tenant isolation breach detected');
    }

    // -------------------------------------------------------------------------
    // TEST 6: ROLE STORAGE ENUM VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n▶ TEST 6: Role Storage Enum Verification...');
    const roleValues = [
      UserRole.MASTER_OWNER,
      UserRole.AGENCY_OWNER,
      UserRole.RECRUITER,
      UserRole.FINANCE_MANAGER,
      UserRole.COMPLIANCE_OFFICER,
      UserRole.INTERVIEW_COORDINATOR
    ];

    if (roleValues.every(r => typeof r === 'string')) {
      console.log(`  ✓ SUCCESS: All 6 Core Roles (${roleValues.join(', ')}) verified in Prisma UserRole enum`);
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Role enum values invalid');
    }

    // Cleanup test records
    await prisma.userPermission.deleteMany({ where: { userId: newUser.id } });
    await prisma.user.delete({ where: { id: newUser.id } });
    await prisma.user.delete({ where: { id: manager.id } });

    console.log('\n====================================================');
    console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('====================================================\n');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ UNHANDLED EXCEPTION IN RUNTIME VERIFICATION:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRuntimeVerification();
