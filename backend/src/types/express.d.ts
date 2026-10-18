import type { SessionAdmin, SessionUser } from '../shared/types/auth';

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    admin?: SessionAdmin;
  }
}

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export {};
