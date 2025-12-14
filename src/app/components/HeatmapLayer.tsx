import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapLayerProps {
    /** Array of [lat, lng, intensity] tuples */
    points: [number, number, number][];
    /** Radius of each point of the heatmap (default: 25) */
    radius?: number;
    /** Blur radius of each point (default: 15) */
    blur?: number;
    /** Maximum zoom level (default: 17) */
    maxZoom?: number;
    /** Maximum point intensity (default: 1.0) */
    max?: number;
    /** Minimum opacity (default: 0.05) */
    minOpacity?: number;
    /** Custom color gradient */
    gradient?: Record<number, string>;
}

/**
 * HeatmapLayer - A React wrapper for leaflet.heat that integrates with react-leaflet v5
 * 
 * Example usage:
 * ```tsx
 * <HeatmapLayer
 *   points={incidents.map(i => [i.location.lat, i.location.lng, i.severity / 5])}
 *   radius={30}
 *   blur={20}
 * />
 * ```
 */
export function HeatmapLayer({
    points,
    radius = 25,
    blur = 15,
    maxZoom = 17,
    max = 1.0,
    minOpacity = 0.05,
    gradient,
}: HeatmapLayerProps) {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length === 0) return;

        // Build options object
        const options: L.HeatLayerOptions = {
            radius,
            blur,
            maxZoom,
            max,
            minOpacity,
        };

        // Add custom gradient if provided
        if (gradient) {
            options.gradient = gradient;
        }

        // Create the heat layer
        const heatLayer = L.heatLayer(points, options);
        heatLayer.addTo(map);

        // Cleanup on unmount or when dependencies change
        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points, radius, blur, maxZoom, max, minOpacity, gradient]);

    // This component doesn't render any DOM elements
    return null;
}
