export interface SSEClientConnection {
  userId: string;
  agencyId?: string | null;
  controller: ReadableStreamDefaultController;
}

class NotificationStreamManager {
  private connections: Map<string, Set<SSEClientConnection>> = new Map();

  /**
   * Registers an active SSE client stream.
   */
  public addConnection(userId: string, agencyId: string | null | undefined, controller: ReadableStreamDefaultController): SSEClientConnection {
    const conn: SSEClientConnection = { userId, agencyId, controller };
    
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(conn);

    return conn;
  }

  /**
   * Removes a closed or aborted client stream.
   */
  public removeConnection(userId: string, conn: SSEClientConnection) {
    const userConns = this.connections.get(userId);
    if (userConns) {
      userConns.delete(conn);
      if (userConns.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  /**
   * Sends SSE payload to a specific user across all their active device connections.
   */
  public sendToUser(userId: string, eventName: string, data: any) {
    const userConns = this.connections.get(userId);
    if (!userConns || userConns.size === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(payload);

    for (const conn of Array.from(userConns)) {
      try {
        conn.controller.enqueue(bytes);
      } catch (err) {
        // Stream closed or error, cleanup connection
        this.removeConnection(userId, conn);
      }
    }
  }

  /**
   * Broadcasts SSE payload to all users belonging to an agency.
   */
  public sendToAgency(agencyId: string, eventName: string, data: any) {
    for (const [userId, userConns] of this.connections.entries()) {
      for (const conn of Array.from(userConns)) {
        if (conn.agencyId === agencyId) {
          this.sendToUser(userId, eventName, data);
          break;
        }
      }
    }
  }
}

declare global {
  var __notificationStreamManager: NotificationStreamManager | undefined;
}

if (!globalThis.__notificationStreamManager) {
  globalThis.__notificationStreamManager = new NotificationStreamManager();
}

export const notificationStreamManager = globalThis.__notificationStreamManager;
