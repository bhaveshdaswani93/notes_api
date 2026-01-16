import { JWTPayload, JWTHeaderParameters } from 'jose';

declare module 'express' {
  interface Request {
    jwtPayload?: JWTPayload;
    jwtProtectedHeader?: JWTHeaderParameters;
  }
}
