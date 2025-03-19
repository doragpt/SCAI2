import { User } from '@shared/schema';

declare global {
  namespace Express {
    interface User {
      id: number;
      role: 'talent' | 'store';
      email: string;
      username: string;
      displayName: string;
      location: string;
      preferredLocations: string[];
    }
  }
}