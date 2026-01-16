import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
  JWTHeaderParameters,
} from 'jose';
import './types';

@Injectable()
export class Auth0JwtMiddleware implements NestMiddleware {
  private JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(
    private readonly auth0Domain: string,
    private readonly auth0Audience: string,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const auth0Domain = this.auth0Domain;
    const auth0Audience = this.auth0Audience;

    if (!auth0Domain || auth0Domain.length === 0) {
      throw new Error('JWT auth middleware requires auth0_domain');
    }
    if (!auth0Audience || auth0Audience.length === 0) {
      throw new Error('JWT auth middleware requires auth0_audience');
    }

    const credentials = req.headers.authorization;
    if (!credentials) {
      throw new UnauthorizedException(
        'No Authorization header included in request',
      );
    }

    const parts = credentials.split(/\s+/);
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid Authorization header structure');
    }

    if (parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Invalid authorization header (only Bearer tokens are supported)',
      );
    }

    if (!this.JWKS) {
      this.JWKS = createRemoteJWKSet(
        new URL(`https://${auth0Domain}/.well-known/jwks.json`),
      );
    }

    const token = parts[1];
    if (!token || token.length === 0) {
      throw new UnauthorizedException('No token included in request');
    }

    let payload: JWTPayload | null = null;
    let protectedHeader: JWTHeaderParameters | null = null;
    let cause: Error | null = null;
    try {
      const verified = await jwtVerify(token, this.JWKS, {
        audience: auth0Audience,
        issuer: `https://${auth0Domain}/`,
      });
      payload = verified.payload;
      protectedHeader = verified.protectedHeader;
    } catch (e) {
      cause = e as Error;
    }

    if (!payload) {
      if (cause instanceof Error && cause.constructor === Error) {
        throw cause;
      }
      throw new UnauthorizedException('Token verification failure');
    }

    // Attach to request
    req.jwtPayload = payload;
    req.jwtProtectedHeader = protectedHeader || undefined;

    next();
  }
}
