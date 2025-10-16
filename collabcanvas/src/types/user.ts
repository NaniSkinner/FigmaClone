export interface User {
  id: string;
  name: string;
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
