import { UserRole } from '../models/User';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
