/**
 * RecruitOS Global System Configuration Flags
 *
 * TESTING_MODE:
 *   - Set to `true` during client testing & QA verification phases.
 *   - Forces every application entry / refresh to go through:
 *     Splash Screen (2-3s) ➔ Login Page ➔ Manual User Login Click ➔ Recruiter Cockpit (/cockpit).
 *
 *   - Set to `false` for production deployment:
 *     Restores persistent session auto-login (Login once ➔ Persistent Session ➔ Auto-Dashboard).
 */
export const TESTING_MODE = false;
