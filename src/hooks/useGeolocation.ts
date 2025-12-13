import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
    retry: () => void;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
};

export const useGeolocation = (): GeolocationState => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
        latitude: null,
        longitude: null,
    });

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoordinates({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLoading(false);
            },
            (err) => {
                let errorMessage = 'An unknown error occurred';
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please enable permissions.';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable. You might be in a dead zone.';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'Location request timed out. Please try again.';
                        break;
                    default:
                        errorMessage = err.message || errorMessage;
                }
                setError(errorMessage);
                setLoading(false);
            },
            GEOLOCATION_OPTIONS
        );
    }, []);

    useEffect(() => {
        getLocation();
    }, [getLocation]);

    return { ...coordinates, loading, error, retry: getLocation };
};
