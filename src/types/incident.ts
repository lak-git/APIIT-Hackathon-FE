export type IncidentType = 'Flood' | 'Landslide' | 'Road Block' | 'Power Line Down';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: 1 | 2 | 3 | 4 | 5;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description: string;
  imageUrl?: string;
  status: 'Active' | 'Dispatched' | 'Resolved' | 'Responding';
  isRead: boolean;
  reportedBy: string;
}
