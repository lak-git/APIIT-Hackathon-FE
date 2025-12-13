import { useMemo } from 'react';
import { useGeolocation } from './useGeolocation';
import { calculateDistance } from '../utils/geo';
import type { Incident } from '../../types/incident';

export function useNearbyIncidents(incidents: Incident[]) {
  const { latitude, longitude } = useGeolocation();

  const nearbyIncidents = useMemo(() => {
    console.log(`[Nearby] Current Loc: ${latitude}, ${longitude}. Incidents: ${incidents.length}`);

    if (!latitude || !longitude) {
      console.warn('[Nearby] No user location available.');
      return [];
    }

    const now = new Date();
    // Intentionally using a wider window (24 hours) for debugging if 1 hour is too strict
    const timeWindow = 24 * 60 * 60 * 1000; 
    const timeThreshold = new Date(now.getTime() - timeWindow);

    return incidents.filter((incident) => {
      // 1. Time filter
      const incidentTime = new Date(incident.timestamp);
      const isRecent = incidentTime >= timeThreshold;

      // 2. Distance filter
      const dist = calculateDistance(
        latitude,
        longitude,
        incident.location.lat,
        incident.location.lng
      );
      
      const isNearby = dist <= 2.0; // Increased to 50km for debugging

      console.log(`[Nearby] ID: ${incident.id} | Time: ${incidentTime.toLocaleTimeString()} (${isRecent ? 'OK' : 'OLD'}) | Dist: ${dist.toFixed(3)}km (${isNearby ? 'OK' : 'FAR'})`);

      return isRecent && isNearby;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 2); // Increased limit to 5
  }, [incidents, latitude, longitude]);

  return nearbyIncidents;
}
