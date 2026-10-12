/** Identity exposed to the client. Never includes the password hash. */
export interface AuthUser {
  id: string;
  login: string;
}
