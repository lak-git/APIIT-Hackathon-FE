import { useState, useEffect, useCallback } from 'react';
import { db, type IncidentReport } from '../../db/db';
import { supabase } from '../../supabaseClient';
import { syncPendingIncidents } from '../services/incidentSync';
import { INCIDENT_PERIODIC_SYNC_TAG, INCIDENT_SYNC_TAG, PERIODIC_SYNC_INTERVAL_MS } from '../../sw/syncTags';

const supportsServiceWorkers = typeof window !== 'undefined' && 'serviceWorker' in navigator;
const supportsBackgroundSync = supportsServiceWorkers && 'SyncManager' in window;

const shouldRegisterSync = (status: IncidentReport['status']) =>
    status === 'local' || status === 'pending' || status === 'failed';

const requestPeriodicPermission = async () => {
    try {
        if (!('permissions' in navigator) || typeof (navigator as any).permissions?.query !== 'function') {
            return true;
        }
        const result = await (navigator as any).permissions.query({ name: 'periodic-background-sync' });
        return result.state !== 'denied';
    } catch {
        return false;
    }
};

const registerPeriodicSync = async (registration: ServiceWorkerRegistration) => {
    const periodicSync = (registration as ServiceWorkerRegistration & {
        periodicSync?: {
            register(tag: string, config: { minInterval: number }): Promise<void>;
        };
    }).periodicSync;

    if (!periodicSync) {
        return;
    }

    const hasPermission = await requestPeriodicPermission();
    if (!hasPermission) {
        return;
    }

    try {
        const tags = await periodicSync.getTags?.();
        if (!tags || !tags.includes(INCIDENT_PERIODIC_SYNC_TAG)) {
            await periodicSync.register(INCIDENT_PERIODIC_SYNC_TAG, { minInterval: PERIODIC_SYNC_INTERVAL_MS });
        }
    } catch (error) {
        console.warn('[SyncManager] Unable to register periodic sync', error);
    }
};

export const useSyncManager = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncError, setSyncError] = useState<string | null>(null);

    const updatePendingCount = useCallback(async () => {
        try {
            const count = await db.reports.where('status').anyOf('local', 'pending', 'failed').count();
            setPendingCount(count);
        } catch (error) {
            console.error('[SyncManager] Failed to count pending items:', error);
        }
    }, []);

    const registerBackgroundSync = useCallback(async () => {
        if (!supportsBackgroundSync) {
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const syncManager = (registration as ServiceWorkerRegistration & { sync?: SyncManager }).sync;
            if (!syncManager) {
                return false;
            }

            await syncManager.register(INCIDENT_SYNC_TAG);
            await registerPeriodicSync(registration);
            return true;
        } catch (error) {
            console.warn('[SyncManager] Unable to register background sync', error);
            return false;
        }
    }, []);

    const sync = useCallback(
        async ({ force = false }: { force?: boolean } = {}) => {
            if (!navigator.onLine && !force) {
                await registerBackgroundSync();
                return;
            }

            if (isSyncing) {
                return;
            }

            setIsSyncing(true);
            setSyncError(null);

            try {
                await syncPendingIncidents({
                    supabase,
                    force,
                    onProgress: (event) => {
                        if (event.type === 'error') {
                            setSyncError(event.error);
                        }
                    },
                });
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    console.warn('[SyncManager] Sync aborted');
                } else {
                    setSyncError(error instanceof Error ? error.message : String(error));
                }
            } finally {
                setIsSyncing(false);
                await updatePendingCount();
            }
        },
        [isSyncing, registerBackgroundSync, updatePendingCount],
    );

    useEffect(() => {
        updatePendingCount();

        const handleOnline = () => {
            sync();
        };

        const handleVisibility = () => {
            if (!document.hidden) {
                sync();
            }
        };

        window.addEventListener('online', handleOnline);
        document.addEventListener('visibilitychange', handleVisibility);

        if (navigator.onLine) {
            sync();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [sync, updatePendingCount]);

    useEffect(() => {
        if (!supportsServiceWorkers) {
            return;
        }

        const handleMessage = (event: MessageEvent) => {
            const { type, error } = event.data || {};
            if (type === 'incident-sync-progress' || type === 'incident-sync-complete') {
                updatePendingCount();
            }
            if (type === 'incident-sync-error' && typeof error === 'string') {
                setSyncError(error);
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
        };
    }, [updatePendingCount]);

    useEffect(() => {
        const handleDexieChange = async () => {
            await updatePendingCount();
            if (navigator.onLine) {
                sync();
            } else {
                await registerBackgroundSync();
            }
        };

        const creatingHook = (_primaryKey: string, obj: IncidentReport) => {
            if (shouldRegisterSync(obj.status)) {
                handleDexieChange();
            }
        };

        const updatingHook = (mods: Partial<IncidentReport>, _primaryKey: string, obj: IncidentReport) => {
            const nextStatus = (mods.status as IncidentReport['status']) ?? obj.status;
            if (shouldRegisterSync(nextStatus)) {
                handleDexieChange();
            }
        };

        db.reports.hook('creating', creatingHook);
        db.reports.hook('updating', updatingHook);

        return () => {
            db.reports.hook('creating').unsubscribe(creatingHook);
            db.reports.hook('updating').unsubscribe(updatingHook);
        };
    }, [registerBackgroundSync, sync, updatePendingCount]);

    return { isSyncing, pendingCount, syncError, sync, registerBackgroundSync };
};
