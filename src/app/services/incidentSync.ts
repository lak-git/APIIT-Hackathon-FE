import type { SupabaseClient } from "@supabase/supabase-js";
import { db, type IncidentReport } from "../../db/db";

export const SYNCABLE_STATUSES = ["local", "pending", "failed"] as const;
const SYNCABLE_STATUS_SET = new Set<IncidentReport["status"]>(SYNCABLE_STATUSES);
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes cap to avoid runaway timers.

export type SyncProgressEvent =
  | { type: "synced"; id: string }
  | { type: "skipped"; id: string; reason: string }
  | { type: "error"; id: string; error: string };

export interface SyncOptions {
  supabase: SupabaseClient;
  now?: number;
  force?: boolean;
  signal?: AbortSignal;
  onProgress?: (event: SyncProgressEvent) => void;
}

const shouldSkipRetry = (report: IncidentReport, now: number, force: boolean) => {
  if (force) return false;
  if (!report.nextRetryAt) return false;
  const nextRetryTime = new Date(report.nextRetryAt).getTime();
  return Number.isFinite(nextRetryTime) && nextRetryTime > now;
};

const computeNextRetryAt = (retryCount: number) => {
  const expoDelay = BASE_RETRY_DELAY_MS * 2 ** Math.max(retryCount - 1, 0);
  const delay = Math.min(expoDelay, MAX_RETRY_DELAY_MS);
  return new Date(Date.now() + delay).toISOString();
};

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

export const reportNeedsSync = (report: IncidentReport) => SYNCABLE_STATUS_SET.has(report.status);

async function uploadImageIfNeeded(report: IncidentReport, supabase: SupabaseClient) {
  if (!report.photo || !report.photo.startsWith("data:")) {
    return report.photo;
  }

  const response = await fetch(report.photo);
  const blob = await response.blob();
  const extensionMatch = report.photo.match(/data:image\/(\w+);base64/);
  const fileExt = extensionMatch?.[1] ?? "jpg";
  const fileName = `${report.id}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage.from("disaster-photos").upload(fileName, blob);

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from("disaster-photos").getPublicUrl(data.path);
  return publicUrlData.publicUrl ?? null;
}

export async function syncPendingIncidents({
  supabase,
  now = Date.now(),
  force = false,
  signal,
  onProgress,
}: SyncOptions) {
  const pendingIncidents = await db.reports.where("status").anyOf(...SYNCABLE_STATUSES).toArray();
  const dueIncidents = pendingIncidents.filter((report) => !shouldSkipRetry(report, now, force));

  if (dueIncidents.length === 0) {
    return { attempted: 0, totalPending: pendingIncidents.length };
  }

  let completed = 0;

  for (const incident of dueIncidents) {
    if (signal?.aborted) {
      throw new DOMException("Sync aborted", "AbortError");
    }

    const updatedAttemptAt = new Date().toISOString();
    await db.reports.update(incident.id, {
      status: "pending",
      lastAttemptAt: updatedAttemptAt,
    });

    try {
      const finalImageUrl = await uploadImageIfNeeded(incident, supabase);

      const payload = {
        incident_type: incident.type,
        severity: incident.severity,
        latitude: incident.location.latitude,
        longitude: incident.location.longitude,
        local_id: incident.id,
        image_url: finalImageUrl,
        created_at: incident.createdAt,
        occurred_at: incident.timestamp,
      };

      const { error: insertError } = await supabase.from("incidents").insert([payload]);

      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }

      await db.reports.update(incident.id, {
        status: "synced",
        photo: finalImageUrl ?? incident.photo,
        retryCount: 0,
        nextRetryAt: null,
        lastAttemptAt: updatedAttemptAt,
      });

      completed += 1;
      onProgress?.({ type: "synced", id: incident.id });
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      const retryCount = (incident.retryCount ?? 0) + 1;
      await db.reports.update(incident.id, {
        status: "failed",
        retryCount,
        nextRetryAt: computeNextRetryAt(retryCount),
        lastAttemptAt: updatedAttemptAt,
      });

      onProgress?.({
        type: "error",
        id: incident.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { attempted: dueIncidents.length, completed, totalPending: pendingIncidents.length };
}
