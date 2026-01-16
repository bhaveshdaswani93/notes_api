import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from 'jose';
import './types';

@Injectable()
export class RequireScopeMiddleware implements NestMiddleware {
  constructor(private readonly scope: string) {}

  use(req: Request, res: Response, next: NextFunction) {
    const payload = req.jwtPayload as JWTPayload;
    if (!payload.scope) {
      throw new ForbiddenException(`Missing required scope: ${this.scope}`);
    }

    const scopes = Array.isArray(payload.scope)
      ? payload.scope
      : (payload.scope as string).split(' ');
    if (!scopes || !scopes.includes(this.scope)) {
      throw new ForbiddenException(`Missing required scope: ${this.scope}`);
    }

    next();
  }
}
