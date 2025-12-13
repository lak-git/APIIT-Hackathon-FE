export interface IncidentReport {
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

const STORAGE_KEYS = {
  REPORTS: 'field_responder_reports',
  USER: 'field_responder_user',
  AUTH_TOKEN: 'field_responder_auth',
};

export const storage = {
  // Auth
  setAuthToken: (token: string) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },
  
  getAuthToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },
  
  clearAuthToken: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },
  
  // User
  setUser: (user: { email: string; name: string }) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  getUser: (): { email: string; name: string } | null => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  
  clearUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  // Reports
  getReports: (): IncidentReport[] => {
    const reports = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return reports ? JSON.parse(reports) : [];
  },
  
  saveReport: (report: IncidentReport) => {
    const reports = storage.getReports();
    reports.push(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  },
  
  updateReport: (id: string, updates: Partial<IncidentReport>) => {
    const reports = storage.getReports();
    const index = reports.findIndex(r => r.id === id);
    if (index !== -1) {
      reports[index] = { ...reports[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    }
  },
  
  deleteReport: (id: string) => {
    const reports = storage.getReports();
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));
  },
  
  clearAllData: () => {
    localStorage.clear();
  },
};
