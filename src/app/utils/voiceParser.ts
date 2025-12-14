import type { IncidentReport } from '../utils/storage';

type IncidentType = IncidentReport['type'];
type Severity = IncidentReport['severity'];

/**
 * Detects incident type from voice transcript using keyword matching
 */
export function detectIncidentType(transcript: string): IncidentType | null {
    const lower = transcript.toLowerCase();

    // Check for flood-related keywords
    if (
        lower.includes('flood') ||
        lower.includes('flooding') ||
        lower.includes('water level') ||
        lower.includes('submerged') ||
        lower.includes('water rising')
    ) {
        return 'Flood';
    }

    // Check for landslide-related keywords
    if (
        lower.includes('landslide') ||
        lower.includes('mudslide') ||
        lower.includes('land slide') ||
        lower.includes('mud slide') ||
        lower.includes('earth slip') ||
        lower.includes('soil erosion')
    ) {
        return 'Landslide';
    }

    // Check for road block-related keywords
    if (
        lower.includes('road block') ||
        lower.includes('roadblock') ||
        lower.includes('road blocked') ||
        lower.includes('road closure') ||
        lower.includes('blocked road') ||
        lower.includes('debris on road') ||
        lower.includes('tree fallen') ||
        lower.includes('fallen tree')
    ) {
        return 'Road Block';
    }

    // Check for power line-related keywords
    if (
        lower.includes('power line') ||
        lower.includes('powerline') ||
        lower.includes('power down') ||
        lower.includes('electric') ||
        lower.includes('electricity') ||
        lower.includes('blackout') ||
        lower.includes('no power') ||
        lower.includes('wire down') ||
        lower.includes('downed wire')
    ) {
        return 'Power Line Down';
    }

    return null;
}

/**
 * Detects severity level from voice transcript using keyword matching
 */
export function detectSeverity(transcript: string): Severity | null {
    const lower = transcript.toLowerCase();

    // Critical (5) - Highest urgency
    if (
        lower.includes('critical') ||
        lower.includes('emergency') ||
        lower.includes('life threatening') ||
        lower.includes('life-threatening') ||
        lower.includes('severe') ||
        lower.includes('extremely dangerous') ||
        lower.includes('people trapped') ||
        lower.includes('deaths') ||
        lower.includes('fatalities') ||
        lower.includes('dying')
    ) {
        return 5;
    }

    // High (4)
    if (
        lower.includes('high') ||
        lower.includes('serious') ||
        lower.includes('dangerous') ||
        lower.includes('major') ||
        lower.includes('urgent') ||
        lower.includes('injuries') ||
        lower.includes('injured') ||
        lower.includes('hurt')
    ) {
        return 4;
    }

    // Fair (3) - Medium
    if (
        lower.includes('moderate') ||
        lower.includes('medium') ||
        lower.includes('fair') ||
        lower.includes('significant')
    ) {
        return 3;
    }

    // Low (2)
    if (
        lower.includes('low') ||
        lower.includes('small') ||
        lower.includes('limited')
    ) {
        return 2;
    }

    // Minor (1)
    if (
        lower.includes('minor') ||
        lower.includes('minimal') ||
        lower.includes('slight') ||
        lower.includes('not serious') ||
        lower.includes('no danger')
    ) {
        return 1;
    }

    return null;
}

/**
 * Parse the full transcript and return detected values
 */
export function parseVoiceTranscript(transcript: string): {
    incidentType: IncidentType | null;
    severity: Severity | null;
} {
    return {
        incidentType: detectIncidentType(transcript),
        severity: detectSeverity(transcript),
    };
}
