// db.ts
import { Dexie, type EntityTable } from "dexie";

interface IncidentReport {
  id: string;
  type: 'Flood' | 'Landslide' | 'Road Block' | 'Power Line Down';
  severity: 1 | 2 | 3 | 4 | 5;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  photo?: string;
  status: 'local' | 'pending' | 'syncing' | 'synced' | 'failed';
  createdAt: string;
}

class FieldResponderDB extends Dexie {
  reports!: EntityTable<IncidentReport, "id">;

  constructor() {
    super("FieldResponderDB");
    this.version(1).stores({
      reports: "id, type, severity, status, timestamp, createdAt"
    });
  }
}

const db = new FieldResponderDB();

export type { IncidentReport };
export { db };
