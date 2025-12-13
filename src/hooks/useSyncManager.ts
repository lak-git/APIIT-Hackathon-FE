import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/db';
import { supabase } from '../supabaseClient';
import type { EntityTable } from 'dexie';

// Define the interface locally since db.ts is being worked on by another dev
export interface LocalIncident {
    local_id?: number; // Primary key, auto-incremented by Dexie
    incident_type: string;
    severity: 1 | 2 | 3 | 4 | 5;
    latitude: number;
    longitude: number;
    description: string;
    syncStatus: 'pending' | 'synced';
    photoBlob?: Blob; // Using Blob type for the binary data
    image_url?: string;
    // Additional fields to match Supabase schema if needed, 
    // but these are the ones we sync.
}

// Extend the original db instance type locally
type ExtendedDexie = typeof db & {
    incidents: EntityTable<LocalIncident, 'local_id'>;
};

export const useSyncManager = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncError, setSyncError] = useState<string | null>(null);

    // Helper to get the typed db instance
    const getDb = () => db as unknown as ExtendedDexie;

    const updatePendingCount = useCallback(async () => {
        try {
            const count = await getDb().incidents.where('syncStatus').equals('pending').count();
            setPendingCount(count);
        } catch (error) {
            console.error("Failed to count pending items:", error);
        }
    }, []);

    const sync = useCallback(async () => {
        if (!navigator.onLine) {
            console.log("Offline, skipping sync.");
            return;
        }

        if (isSyncing) {
            console.log("Sync already in progress.");
            return;
        }

        setIsSyncing(true);
        setSyncError(null);

        try {
            const pendingIncidents = await getDb().incidents.where('syncStatus').equals('pending').toArray();

            if (pendingIncidents.length === 0) {
                setIsSyncing(false);
                return;
            }

            console.log(`Found ${pendingIncidents.length} pending incidents to sync.`);

            for (const incident of pendingIncidents) {
                if (!incident.local_id) continue;

                let finalImageUrl = incident.image_url;

                // 1. Image Handling
                if (incident.photoBlob) {
                    const fileName = `${incident.local_id}_${Date.now()}.jpg`;
                    const { data, error: uploadError } = await supabase.storage
                        .from('disaster-photos')
                        .upload(fileName, incident.photoBlob);

                    if (uploadError) {
                        console.error(`Failed to upload image for incident ${incident.local_id}:`, uploadError);
                        setSyncError(`Image upload failed: ${uploadError.message}`);
                        // We continue to the next item or retry? 
                        // Requirements say "The Sync Logic", implies we try to complete.
                        // If image fails, we probably shouldn't sync the record without it if it's required.
                        // For now, let's treat this as a blockers for this item.
                        continue;
                    }

                    if (data) {
                        const { data: publicUrlData } = supabase.storage
                            .from('disaster-photos')
                            .getPublicUrl(data.path);
                        finalImageUrl = publicUrlData.publicUrl;
                    }
                }

                // 2. Database Insert
                const payload = {
                    incident_type: incident.incident_type,
                    severity: incident.severity,
                    latitude: incident.latitude,
                    longitude: incident.longitude,
                    description: incident.description,
                    local_id: incident.local_id, // Important for tracking duplicates/idempotency if needed
                    image_url: finalImageUrl,
                    // Add other fields if necessary, ensuring they match Supabase schema
                    // e.g. status: 'Active' (default in DB?)
                };

                const { error: insertError } = await supabase
                    .from('incidents')
                    .insert([payload]);

                // 3. Duplicate Handling & Completion
                if (insertError) {
                    // Check for Unique Violation (23505)
                    if (insertError.code === '23505') {
                        console.log(`Incident ${incident.local_id} already exists (duplicate). Marking as synced.`);
                    } else {
                        console.error(`Failed to insert incident ${incident.local_id}:`, insertError);
                        setSyncError(`Insert failed: ${insertError.message}`);
                        continue; // Skip updating local state
                    }
                }

                // Success or Duplicate -> Update local Dexie record
                await getDb().incidents.update(incident.local_id, {
                    syncStatus: 'synced',
                    photoBlob: undefined, // Remove blob to save space
                    image_url: finalImageUrl // Persist the URL if we got one
                });
            }

            await updatePendingCount();

        } catch (err: any) {
            console.error("Critical sync error:", err);
            setSyncError(err.message || "Unknown sync error");
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, updatePendingCount]);

    useEffect(() => {
        // Initial count check
        updatePendingCount();

        const handleOnline = () => {
            console.log("Network online, attempting sync...");
            sync();
        };

        window.addEventListener('online', handleOnline);

        // Also try to sync on mount if online
        if (navigator.onLine) {
            sync();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [sync, updatePendingCount]);

    return { isSyncing, pendingCount, syncError };
};
