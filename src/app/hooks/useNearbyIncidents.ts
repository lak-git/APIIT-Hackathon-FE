import { useMemo } from 'react';
import { useGeolocation } from './useGeolocation';
import { calculateDistance } from '../utils/geo';
import type { Incident } from '../../types/incident';

export function useNearbyIncidents(incidents: Incident[]) {
  const { latitude, longitude } = useGeolocation();

  const nearbyIncidents = useMemo(() => {
    if (!latitude || !longitude) return [];

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    return incidents.filter((incident) => {
      // 1. Time filter (last 60 mins)
      const incidentTime = new Date(incident.timestamp);
      if (incidentTime < oneHourAgo) return false;

      // 2. Distance filter (within 1km)
      const dist = calculateDistance(
        latitude,
        longitude,
        incident.location.lat,
        incident.location.lng
      );
      
      console.log(`[Nearby] Incident ${incident.id}: Dist=${dist.toFixed(3)}km, Time=${incidentTime.toLocaleTimeString()}`);

      return dist <= 1.0; 
    });
  }, [incidents, latitude, longitude]);

  return nearbyIncidents;
}
