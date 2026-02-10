// Scalekit User type
export interface ScalekitUser {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  organizationId?: string;
  [key: string]: any;
}

declare module 'express' {
  interface Request {
    user?: ScalekitUser;
    accessToken?: string;
  }
}
