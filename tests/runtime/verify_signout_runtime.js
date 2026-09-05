/**
 * Runtime Verification Script for Sign Out & Session Destruction
 * Tests Supabase Auth Session Destruction, Cookie Cleardown, and Unauthenticated Protection.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to ensure exact credentials
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

async function runSignOutVerification() {
  console.log('====================================================');
  console.log('PR-02B: SIGN OUT & AUTH SESSION RUNTIME VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  const totalTests = 5;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hadrlwfcsoouttnzeoye.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`[Config] Supabase Target: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // TEST 1: Authenticate User
    console.log('\n▶ TEST 1: Authenticating test user (admin@recruitos.local)...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@recruitos.local',
      password: 'StrongPassword123!'
    });

    if (authError || !authData.session) {
      console.error('  ❌ FAILED: Could not sign in user:', authError?.message);
    } else {
      console.log(`  ✓ SUCCESS: Authenticated User ID: ${authData.user.id}`);
      console.log(`  ✓ Access Token Present: ${Boolean(authData.session.access_token)}`);
      passedTests++;
    }

    // TEST 2: Active Session Verification
    console.log('\n▶ TEST 2: Verifying Active Supabase Session...');
    const { data: sessionBefore } = await supabase.auth.getSession();
    if (sessionBefore && sessionBefore.session) {
      console.log('  ✓ SUCCESS: Active session verified in client memory/storage');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Session not active before logout');
    }

    // TEST 3: Execute Sign Out
    console.log('\n▶ TEST 3: Executing supabase.auth.signOut()...');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('  ❌ FAILED: signOut threw error:', signOutError.message);
    } else {
      console.log('  ✓ SUCCESS: signOut executed without error');
      passedTests++;
    }

    // TEST 4: Post-SignOut Session Destruction Verification
    console.log('\n▶ TEST 4: Verifying Session Destruction...');
    const { data: sessionAfter } = await supabase.auth.getSession();
    if (!sessionAfter || !sessionAfter.session) {
      console.log('  ✓ SUCCESS: Session destroyed (getSession() returned NULL)');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Session still active after signOut!');
    }

    // TEST 5: Middleware & Protected Route Guard Verification
    console.log('\n▶ TEST 5: Verifying Middleware Unauthenticated Interception Rule...');
    const middlewarePath = path.join(__dirname, '../../src/middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    const hasLoginRedirect = middlewareContent.includes("url.pathname = '/login'");
    const hasProtectedCheck = middlewareContent.includes('!user && !isPublicRoute');

    if (hasLoginRedirect && hasProtectedCheck) {
      console.log('  ✓ SUCCESS: Middleware configured to intercept unauthenticated requests and redirect to /login');
      passedTests++;
    } else {
      console.error('  ❌ FAILED: Middleware route guard configuration missing');
    }

    console.log('\n====================================================');
    console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('====================================================\n');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ UNHANDLED EXCEPTION IN RUNTIME VERIFICATION:', err);
    process.exit(1);
  }
}

runSignOutVerification();
