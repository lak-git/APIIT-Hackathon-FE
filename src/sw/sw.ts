/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { syncPendingIncidents } from "../app/services/incidentSync";
import { INCIDENT_PERIODIC_SYNC_TAG, INCIDENT_SYNC_TAG } from "./syncTags";
import { getWorkerSupabaseClient } from "./workerSupabaseClient";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<import("workbox-precaching").PrecacheEntry>;
};

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST ?? []);
cleanupOutdatedCaches();

const broadcastToClients = async (message: unknown) => {
  const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clientList.forEach((client) => client.postMessage(message));
};

const runIncidentSync = async (source: string) => {
  try {
    const supabase = getWorkerSupabaseClient();
    await syncPendingIncidents({
      supabase,
      force: true,
      onProgress: (event) => broadcastToClients({
        type: "incident-sync-progress",
        payload: event,
        meta: { source },
      }),
    });
    await broadcastToClients({ type: "incident-sync-complete", meta: { source } });
  } catch (error) {
    await broadcastToClients({
      type: "incident-sync-error",
      meta: { source },
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

self.addEventListener("sync", (event) => {
  const syncEvent = event as ExtendableEvent & { tag?: string };
  if (syncEvent.tag === INCIDENT_SYNC_TAG) {
    syncEvent.waitUntil?.(runIncidentSync("background-sync"));
  }
});

self.addEventListener("periodicsync", (event) => {
  const periodicEvent = event as ExtendableEvent & { tag?: string };
  if (periodicEvent.tag === INCIDENT_PERIODIC_SYNC_TAG) {
    periodicEvent.waitUntil?.(runIncidentSync("periodic-sync"));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "trigger-incident-sync") {
    event.waitUntil(runIncidentSync(event.data.meta?.source ?? "message"));
  }
});
