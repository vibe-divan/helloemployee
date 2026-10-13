/** Server-side session record. `userId` is the authenticated principal. */
export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}
