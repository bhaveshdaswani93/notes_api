import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  HttpStatus,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/login
   * Initiates Scalekit hosted login flow
   * Query params:
   *   - organization_id: Optional organization ID for SSO
   *   - connection_id: Optional connection ID for specific SSO provider
   */
  @Get('login')
  async login(
    @Query('organization_id') organizationId?: string,
    @Query('connection_id') connectionId?: string,
  ) {
    const { url, state } = await this.authService.getAuthorizationUrl(
      organizationId,
      connectionId,
    );

    return {
      authorizationUrl: url,
      state,
      message: 'Redirect user to authorizationUrl to complete login',
    };
  }

  /**
   * GET /auth/callback
   * Handles OAuth callback from Scalekit
   * Exchanges authorization code for JWT tokens
   * Returns tokens in JSON response for client to store
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
  ) {
    // Handle OAuth errors
    if (error) {
      throw new BadRequestException({
        error,
        errorDescription: errorDescription || 'Authentication failed',
      });
    }

    // Validate code parameter
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    try {
      // Exchange code for tokens and get user info
      const tokens = await this.authService.handleCallback(code);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
        user: {
          id: tokens.user.id,
          email: tokens.user.email,
          name: tokens.user.name,
          organizationId: tokens.user.organizationId,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        error: 'authentication_failed',
        message: error.message || 'Failed to complete authentication',
      });
    }
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   * Body: { refreshToken: string }
   * Note: Token refresh is not yet fully implemented.
   * For now, users should re-authenticate when tokens expire.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const tokens = await this.authService.refreshTokens(refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
        user: {
          id: tokens.user.id,
          email: tokens.user.email,
          name: tokens.user.name,
          organizationId: tokens.user.organizationId,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        error: 'refresh_failed',
        message: error.message || 'Token refresh not implemented. Please re-authenticate.',
      });
    }
  }

  /**
   * GET /auth/profile
   * Returns current authenticated user's profile
   * Requires authentication (JWT middleware)
   */
  @Get('profile')
  profile(@Req() req: Request) {
    if (!req.user) {
      throw new BadRequestException('No user found in token');
    }

    return {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      username: req.user.username,
      organizationId: req.user.organizationId,
    };
  }

  /**
   * POST /auth/logout
   * Gets Scalekit logout URL
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    const logoutUrl = await this.authService.getLogoutUrl();

    return {
      logoutUrl,
      message: 'Redirect user to logoutUrl to complete logout',
    };
  }
}
