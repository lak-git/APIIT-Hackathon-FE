import { useState, useEffect, useCallback } from 'react';
import { db } from '../../db/db';
import { supabase } from '../../supabaseClient';

export const useSyncManager = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncError, setSyncError] = useState<string | null>(null);

    const updatePendingCount = useCallback(async () => {
        try {
            const count = await db.reports
                .where('status')
                .anyOf('local', 'pending', 'failed')
                .count();
            setPendingCount(count);
        } catch (error) {
            console.error("Failed to count pending items:", error);
        }
    }, []);

    const sync = useCallback(async () => {
        // console.log("[SyncManager] Sync triggered");

        if (!navigator.onLine) {
            console.log("[SyncManager] Offline, skipping sync.");
            return;
        }

        if (isSyncing) {
            // console.log("[SyncManager] Sync already in progress.");
            return;
        }

        setIsSyncing(true);
        setSyncError(null);

        try {
            // console.log("[SyncManager] Querying Dexie for pending reports...");
            // Check for any report that needs syncing (local, pending, or failed from previous attempts)
            const pendingIncidents = await db.reports
                .where('status')
                .anyOf('local', 'pending', 'failed')
                .toArray();

            // console.log('[SyncManager] Pending incidents found:', pendingIncidents);

            if (pendingIncidents.length === 0) {
                // console.log("[SyncManager] No pending incidents found.");
                setIsSyncing(false);
                return;
            }

            // console.log(`[SyncManager] Found ${pendingIncidents.length} incidents to sync.`);

            for (const incident of pendingIncidents) {
                console.log(`[SyncManager] Processing incident ${incident.id}`, incident);
                let finalImageUrl = incident.photo;

                // 1. Image Handling
                if (incident.photo && incident.photo.startsWith('data:')) {
                    console.log(`[SyncManager] Uploading image for ${incident.id}...`);
                    try {
                        // Convert base64/data URL to Blob
                        const res = await fetch(incident.photo);
                        const blob = await res.blob();
                        const fileExt = incident.photo.match(/data:image\/(\w+);base64/)?.[1] || 'jpg';
                        const fileName = `${incident.id}_${Date.now()}.${fileExt}`;

                        const { data, error: uploadError } = await supabase.storage
                            .from('disaster-photos')
                            .upload(fileName, blob);

                        if (uploadError) {
                            console.error(`[SyncManager] Failed to upload image for incident ${incident.id}:`, uploadError);
                            setSyncError(`Image upload failed: ${uploadError.message}`);
                            // Skip this item if image upload is critical, or continue?
                            // Assuming we should retry later if upload fails.
                            continue;
                        }

                        console.log(`[SyncManager] Image uploaded successfully:`, data);

                        if (data) {
                            const { data: publicUrlData } = supabase.storage
                                .from('disaster-photos')
                                .getPublicUrl(data.path);
                            finalImageUrl = publicUrlData.publicUrl;
                            console.log(`[SyncManager] Public image URL:`, finalImageUrl);
                        }
                    } catch (e) {
                        console.error("[SyncManager] Error processing image:", e);
                        setSyncError("Error processing image");
                        continue;
                    }
                } else {
                    console.log(`[SyncManager] No base64 image found for ${incident.id}, skipping upload.`);
                }

                // 2. Database Insert
                // Mapping IncidentReport fields to Supabase incidents table
                const payload = {
                    incident_type: incident.type,
                    severity: incident.severity,
                    latitude: incident.location.latitude,
                    longitude: incident.location.longitude,
                    // description: undefined, // 'description' is not present in IncidentReport
                    local_id: incident.id, // Using string UUID from local DB
                    image_url: finalImageUrl,
                    // status: 'active', // Optional: set status for Supabase if needed
                    created_at: incident.createdAt,
                    occurred_at: incident.timestamp // Map local timestamp to occurred_at
                };

                console.log(`[SyncManager] Inserting payload to Supabase:`, payload);

                const { error: insertError } = await supabase
                    .from('incidents')
                    .insert([payload]);

                // 3. Duplicate Handling & Completion
                if (insertError) {
                    console.log(`[SyncManager] Insert result: Error`, insertError);
                    // Check for Unique Violation (23505)
                    if (insertError.code === '23505') {
                        console.log(`[SyncManager] Incident ${incident.id} already exists (duplicate). Marking as synced.`);
                    } else {
                        console.error(`[SyncManager] Failed to insert incident ${incident.id}:`, insertError);
                        setSyncError(`Insert failed: ${insertError.message}`);
                        continue;
                    }
                } else {
                    console.log(`[SyncManager] Insert successful for ${incident.id}`);
                }

                // Success or Duplicate -> Update local Dexie record
                console.log(`[SyncManager] Updating local DB status to 'synced' for ${incident.id}`);
                await db.reports.update(incident.id, {
                    status: 'synced',
                    photo: finalImageUrl // Update photo with URL to save space
                });
            }

            await updatePendingCount();

        } catch (err: any) {
            console.error("[SyncManager] Critical sync error:", err);
            setSyncError(err.message || "Unknown sync error");
        } finally {
            setIsSyncing(false);
            // console.log("[SyncManager] Sync process finished.");
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
