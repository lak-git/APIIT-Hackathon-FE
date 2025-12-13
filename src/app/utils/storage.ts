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
  setUser: (user: { id: string; email: string; name: string }) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): { id: string; email: string; name: string } | null => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  clearUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  clearAllData: () => {
    localStorage.clear();
  },
};
