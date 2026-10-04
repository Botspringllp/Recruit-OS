import { EventEmitter } from 'events';

declare global {
  var __notificationEventBus: EventEmitter | undefined;
}

if (!globalThis.__notificationEventBus) {
  const bus = new EventEmitter();
  bus.setMaxListeners(200); // Allow high concurrent SSE connections
  globalThis.__notificationEventBus = bus;
}

export const notificationEventBus = globalThis.__notificationEventBus;
