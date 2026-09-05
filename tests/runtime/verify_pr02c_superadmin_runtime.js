const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function hasPermission(user, permission) {
  if (!user) return false;
  if (user.isActive === false || user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    return false;
  }

  const roleStr = String(user.role || '').toUpperCase();

  if (roleStr !== 'SUPER_ADMIN' && roleStr !== 'MASTER_OWNER') {
    if (user.agency && user.agency.status === 'SUSPENDED') {
      return false;
    }
  }

  const businessResources = ['candidate', 'job', 'interview', 'offer', 'compliance', 'finance', 'submission', 'partner'];
  const [targetResource] = permission.split('.');

  if (roleStr === 'SUPER_ADMIN') {
    if (businessResources.includes(targetResource.toLowerCase())) {
      return false;
    }
    if (permission === 'agency.manage' || permission === 'platform.admin' || permission === 'user.manage') {
      return true;
    }
  }

  if (roleStr === 'MASTER_OWNER' || roleStr === 'AGENCY_OWNER' || roleStr === 'AGENCY_FOUNDER') {
    return true;
  }

  const permissions = user.permissions
    ? user.permissions.map(p => (typeof p === 'string' ? p : `${p.resource}.${p.action}`))
    : [];

  if (permissions.includes('*')) return true;

  const [resource, action] = permission.split('.');
  return permissions.some(p => {
    if (p === '*' || p === permission) return true;
    const [pResource, pAction] = p.split('.');
    if (pResource === resource && (pAction === '*' || pAction === action)) return true;
    return false;
  });
}

async function runSuperAdminVerification() {
  console.log('====================================================');
  console.log('PHASE PR-02C: PLATFORM SUPER ADMIN & AGENCY PROVISIONING VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  try {
    // TEST 1: Verify Database Enums & Super Admin User Creation
    totalTests++;
    console.log('▶ TEST 1: Database Enums & Super Admin User...');
    
    const primaryAgency = await prisma.agency.findFirst({
      where: { deletedAt: null }
    });

    if (!primaryAgency) {
      throw new Error('No agency found in database to attach test admin');
    }

    let superAdminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', deletedAt: null }
    });

    if (!superAdminUser) {
      superAdminUser = await prisma.user.create({
        data: {
          agencyId: primaryAgency.id,
          email: 'platform.admin@recruitos.local',
          passwordHash: '$sha256$testadminhash',
          firstName: 'Platform',
          lastName: 'SuperAdmin',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          isActive: true
        }
      });
    }

    console.log(`  ✓ SUCCESS: Super Admin user ready (ID: ${superAdminUser.id}, Email: ${superAdminUser.email})`);
    passedTests++;

    // TEST 2: Provision New Agency via Database API
    totalTests++;
    console.log('\n▶ TEST 2: Provision New Agency Tenant & Owner Account...');

    const testSubdomain = `test-agency-${Date.now()}`;
    const newAgency = await prisma.agency.create({
      data: {
        name: 'Quantum Staffing Inc',
        subdomain: testSubdomain,
        status: 'ACTIVE',
        subscriptionTier: 'ENTERPRISE'
      }
    });

    const newOwner = await prisma.user.create({
      data: {
        agencyId: newAgency.id,
        email: `owner.${testSubdomain}@quantum.local`,
        passwordHash: '$sha256$ownerpasshash',
        firstName: 'Quantum',
        lastName: 'Owner',
        role: 'AGENCY_OWNER',
        status: 'ACTIVE',
        isActive: true
      }
    });

    await prisma.agency.update({
      where: { id: newAgency.id },
      data: { ownerId: newOwner.id }
    });

    console.log(`  ✓ SUCCESS: Provisioned Agency '${newAgency.name}' (ID: ${newAgency.id}) and Owner '${newOwner.email}'`);
    passedTests++;

    // TEST 3: Agency Status Control (Suspend & Activate)
    totalTests++;
    console.log('\n▶ TEST 3: Agency Status Control (Suspend & Activate)...');

    // Suspend Agency
    const suspendedAgency = await prisma.agency.update({
      where: { id: newAgency.id },
      data: { status: 'SUSPENDED' }
    });
    if (suspendedAgency.status !== 'SUSPENDED') throw new Error('Failed to suspend agency');

    // Verify Data Remains Intact
    const ownerPostSuspend = await prisma.user.findUnique({ where: { id: newOwner.id } });
    if (!ownerPostSuspend) throw new Error('Data was deleted during suspension!');

    // Activate Agency
    const reactivatedAgency = await prisma.agency.update({
      where: { id: newAgency.id },
      data: { status: 'ACTIVE' }
    });
    if (reactivatedAgency.status !== 'ACTIVE') throw new Error('Failed to reactivate agency');

    console.log(`  ✓ SUCCESS: Agency state transitions (ACTIVE -> SUSPENDED -> ACTIVE) verified with zero data loss.`);
    passedTests++;

    // TEST 4: Security Rule — Super Admin Cannot Access Business Data
    totalTests++;
    console.log('\n▶ TEST 4: Security Rule — Super Admin Privacy Boundary...');

    const isSuperAdminCandidateAccessAllowed = hasPermission(superAdminUser, 'candidate.view');
    const isSuperAdminJobAccessAllowed = hasPermission(superAdminUser, 'job.view');
    const isSuperAdminFinanceAccessAllowed = hasPermission(superAdminUser, 'finance.view');
    const isSuperAdminAgencyManageAllowed = hasPermission(superAdminUser, 'agency.manage');

    if (isSuperAdminCandidateAccessAllowed || isSuperAdminJobAccessAllowed || isSuperAdminFinanceAccessAllowed) {
      throw new Error('SECURITY VIOLATION: Super Admin was granted permission to access agency tenant business data!');
    }
    if (!isSuperAdminAgencyManageAllowed) {
      throw new Error('Super Admin was denied agency.manage platform permission!');
    }

    console.log(`  ✓ SUCCESS: Super Admin boundary verified (Business Data Access: BLOCKED, Agency Manage Access: ALLOWED)`);
    passedTests++;

    // TEST 5: Suspended Agency Login/Permission Guard
    totalTests++;
    console.log('\n▶ TEST 5: Suspended Agency Access Guard...');

    const userInSuspendedAgency = {
      id: newOwner.id,
      agencyId: newAgency.id,
      email: newOwner.email,
      role: 'AGENCY_OWNER',
      status: 'ACTIVE',
      isActive: true,
      agency: { id: newAgency.id, status: 'SUSPENDED', name: newAgency.name }
    };

    const isSuspendedUserAccessAllowed = hasPermission(userInSuspendedAgency, 'candidate.view');
    if (isSuspendedUserAccessAllowed) {
      throw new Error('SECURITY VIOLATION: User belonging to a SUSPENDED agency was granted access!');
    }

    console.log(`  ✓ SUCCESS: Suspended agency access correctly BLOCKED for agency owner.`);
    passedTests++;

    // TEST 6: Owner User Management & Custom Permission Assignment
    totalTests++;
    console.log('\n▶ TEST 6: Agency Owner Custom Permission Assignment...');

    const recruiterInQuantum = await prisma.user.create({
      data: {
        agencyId: newAgency.id,
        email: `recruiter.${testSubdomain}@quantum.local`,
        passwordHash: '$sha256$recruiterhash',
        firstName: 'Sarah',
        lastName: 'Recruiter',
        role: 'RECRUITER',
        status: 'ACTIVE',
        isActive: true
      }
    });

    await prisma.userPermission.createMany({
      data: [
        { userId: recruiterInQuantum.id, resource: 'candidate', action: 'view' },
        { userId: recruiterInQuantum.id, resource: 'candidate', action: 'create' },
        { userId: recruiterInQuantum.id, resource: 'offer', action: 'approve' }
      ]
    });

    const userWithPerms = await prisma.user.findUnique({
      where: { id: recruiterInQuantum.id },
      include: {
        agency: { select: { id: true, name: true, status: true } },
        permissions: { select: { resource: true, action: true } }
      }
    });

    const isCandidateViewAllowed = hasPermission(userWithPerms, 'candidate.view');
    const isOfferApproveAllowed = hasPermission(userWithPerms, 'offer.approve');
    const isFinanceViewAllowed = hasPermission(userWithPerms, 'finance.view');

    if (!isCandidateViewAllowed || !isOfferApproveAllowed) {
      throw new Error('Assigned custom permissions were not recognized by RBAC!');
    }
    if (isFinanceViewAllowed) {
      throw new Error('Unassigned permission (finance.view) was incorrectly allowed for Recruiter!');
    }

    console.log(`  ✓ SUCCESS: Custom permissions assigned & verified (candidate.view: YES, offer.approve: YES, finance.view: NO).`);
    passedTests++;

    // Clean up temporary test data
    await prisma.userPermission.deleteMany({ where: { userId: recruiterInQuantum.id } });
    await prisma.user.delete({ where: { id: recruiterInQuantum.id } });
    await prisma.user.delete({ where: { id: newOwner.id } });
    await prisma.agency.delete({ where: { id: newAgency.id } });

    console.log('\n====================================================');
    console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSuperAdminVerification();
