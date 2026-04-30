export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'accountmanager' | 'manager' | 'viewer';
  region: string;
  teamId: string;
}

// Re-export useAuth for convenient imports
export { useAuth } from './AuthProvider';
