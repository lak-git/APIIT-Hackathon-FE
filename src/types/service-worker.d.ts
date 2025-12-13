export {};

declare global {
    interface SyncManager {
      register(tag: string): Promise<void>;
      getTags?: () => Promise<string[]>;
      unregister?: (tag: string) => Promise<void>;
    }

  interface PeriodicSyncManager {
    register(tag: string, options: { minInterval: number }): Promise<void>;
    getTags?: () => Promise<string[]>;
    unregister?: (tag: string) => Promise<void>;
  }

  interface SyncEvent extends ExtendableEvent {
    readonly tag: string;
  }

  interface PeriodicSyncEvent extends ExtendableEvent {
    readonly tag: string;
  }

  interface PermissionDescriptorMap {
    'periodic-background-sync'?: PermissionDescriptor;
  }

  interface ServiceWorkerRegistration {
    sync?: SyncManager;
    periodicSync?: PeriodicSyncManager;
  }
}
