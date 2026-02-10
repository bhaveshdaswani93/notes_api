import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getScalekitClient } from './scalekit.client';
import './types';

@Injectable()
export class ScalekitJwtMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'No Authorization header included in request',
      );
    }

    const parts = authHeader.split(/\s+/);
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid Authorization header structure');
    }

    if (parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Invalid authorization header (only Bearer tokens are supported)',
      );
    }

    const token = parts[1];
    if (!token || token.length === 0) {
      throw new UnauthorizedException('No token included in request');
    }

    const scalekitClient = getScalekitClient();

    try {
      // Validate the JWT access token with Scalekit
      const isValid = await scalekitClient.validateAccessToken(token);

      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired access token');
      }

      // Decode JWT payload to get user info (token is already validated)
      const payload = this.decodeJWT(token);

      // Attach user info to request
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        organizationId: payload.org_id,
        ...payload,
      };
      req.accessToken = token;

      next();
    } catch (error) {
      throw new UnauthorizedException(
        `Token verification failed: ${error.message || 'Invalid token'}`,
      );
    }
  }

  /**
   * Decode JWT payload (validation already done by validateAccessToken)
   */
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      // Base64url decode
      const decoded = Buffer.from(
        payload.replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString('utf-8');

      return JSON.parse(decoded);
    } catch (error) {
      throw new UnauthorizedException('Failed to decode JWT token');
    }
  }
}
