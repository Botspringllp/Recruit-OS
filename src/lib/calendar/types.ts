/**
 * =============================================================================
 * RECRUITOS FUTURE CALENDAR INTEGRATION ARCHITECTURE HOOKS (PHASE RC-01 READINESS)
 * =============================================================================
 * 
 * TODO [FUTURE CALENDAR SYNC]:
 * 1. Implement OAuth2 Refresh Token Vault for Google Workspace Calendar API (v3).
 * 2. Implement Microsoft Graph API v1.0 Calendar Sync Hook for MS Outlook 365.
 * 3. Support bi-directional slot sync for candidate interview scheduling.
 * 4. Implement webhook listener for calendar event updates/cancellations.
 */

export type CalendarProviderType = 'GOOGLE_WORKSPACE' | 'MICROSOFT_OUTLOOK' | 'APPLE_ICAL';

export interface CalendarAuthTokens {
  provider: CalendarProviderType;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
}

export interface CalendarEventPayload {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  locationOrLink?: string;
  attendees: Array<{
    name: string;
    email: string;
    role: 'ORGANIZER' | 'INTERVIEWER' | 'CANDIDATE';
  }>;
}

export interface CalendarSyncResult {
  success: boolean;
  externalEventId?: string;
  meetingUrl?: string;
  error?: string;
}

/**
 * Interface definition for future Calendar Sync Providers
 */
export interface ICalendarProvider {
  providerType: CalendarProviderType;
  /**
   * TODO: Authorize user session with OAuth2 endpoint
   */
  authorizeSession(userId: string): Promise<string>;

  /**
   * TODO: Create interview schedule event on user's primary calendar
   */
  createInterviewEvent(payload: CalendarEventPayload): Promise<CalendarSyncResult>;

  /**
   * TODO: Cancel or update existing interview event
   */
  updateInterviewEvent(eventId: string, payload: Partial<CalendarEventPayload>): Promise<CalendarSyncResult>;
}
