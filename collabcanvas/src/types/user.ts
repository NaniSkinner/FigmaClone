export interface User {
  id: string;
  name: string;
  email?: string; // Optional: only for non-anonymous users
  color: string;
  cursor?: { x: number; y: number };
  isAnonymous?: boolean;
  createdAt?: Date;
}

export interface UserPresence {
  userId: string;
  user: User;
  cursor: { x: number; y: number };
  lastSeen: Date;
  selectedObjectIds?: string[]; // Real-time selection tracking
}
