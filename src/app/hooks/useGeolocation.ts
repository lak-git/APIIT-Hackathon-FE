import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
    retry: () => void;
    isStale: boolean;
    timestamp: number | null;
}

const STORAGE_KEY = 'offline_gps_data';

const GEOLOCATION_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
};

export const useGeolocation = (): GeolocationState => {
    // Initialize state from local storage if available
    const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>(() => {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                const { latitude, longitude } = JSON.parse(cached);
                return { latitude, longitude };
            }
        } catch (e) {
            console.warn('Failed to parse cached location', e);
        }
        return { latitude: null, longitude: null };
    });

    const [extra, setExtra] = useState<{ isStale: boolean; timestamp: number | null }>(() => {
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                const { timestamp } = JSON.parse(cached);
                return { isStale: true, timestamp }; // Initially stale until live update comes in
            }
        } catch (e) {
            console.warn('Failed to parse cached timestamp', e);
        }
        return { isStale: false, timestamp: null };
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const watchId = useRef<number | null>(null);

    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Clear existing watch if any
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
        }

        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const timestamp = position.timestamp;

                // Update state with fresh data
                setCoordinates({ latitude, longitude });
                setExtra({ isStale: false, timestamp });
                setLoading(false);
                setError(null); // Clear any previous errors

                // Persist to local storage
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        latitude,
                        longitude,
                        timestamp
                    }));
                } catch (e) {
                    console.warn('Failed to save location to storage', e);
                }
            },
            (err) => {
                console.warn('Geolocation error:', err);

                // If we have data (from cache or previous update), keep showing it but maybe flag error?
                // The user wants "live location" but if it fails, fallback to stored.
                // We typically don't clear coordinates on error so the last known good location persists on screen.

                let errorMessage = 'An unknown error occurred';
                if (err.code === err.PERMISSION_DENIED) {
                    errorMessage = 'Location access denied. Please enable permissions.';
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    errorMessage = 'Location information is unavailable.';
                } else if (err.code === err.TIMEOUT) {
                    errorMessage = 'Location request timed out.';
                } else if (err.message) {
                    errorMessage = err.message;
                }

                setError(errorMessage);
                setLoading(false);

                // If we hit an error, the current data is effectively "stale" if it exists
                setExtra(prev => ({ ...prev, isStale: true }));
            },
            GEOLOCATION_OPTIONS
        );
    }, []);

    const stopWatching = useCallback(() => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    }, []);

    useEffect(() => {
        startWatching();

        const handleOnline = () => {
            // Restart watch when coming online might help if it got stuck? 
            // Usually watchPosition handles this, but forcing a restart ensures fresh options
            startWatching();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            stopWatching();
            window.removeEventListener('online', handleOnline);
        };
    }, [startWatching, stopWatching]);

    return { ...coordinates, loading, error, retry: startWatching, ...extra };
};
