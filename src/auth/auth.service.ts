import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getScalekitClient } from './scalekit.client';
import { ScalekitUser } from './types';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  user: ScalekitUser;
}

@Injectable()
export class AuthService {
  constructor() {}

  /**
   * Generate authorization URL for Scalekit hosted login
   * @param organizationId Optional organization ID for SSO
   * @param connectionId Optional connection ID for specific SSO provider
   * @returns Authorization URL to redirect user to
   */
  async getAuthorizationUrl(
    organizationId?: string,
    connectionId?: string,
  ): Promise<{ url: string; state: string }> {
    const scalekitClient = getScalekitClient();
    const redirectUri = process.env.SCALEKIT_REDIRECT_URI;

    if (!redirectUri) {
      throw new InternalServerErrorException(
        'SCALEKIT_REDIRECT_URI not configured',
      );
    }

    const authorizationUrl = scalekitClient.getAuthorizationUrl(
      redirectUri,
      {
        organizationId,
        connectionId,
      },
    );

    // Extract state parameter from URL for CSRF protection
    const url = new URL(authorizationUrl);
    const state = url.searchParams.get('state') || '';

    return { url: authorizationUrl, state };
  }

  /**
   * Exchange authorization code for JWT tokens
   * @param code Authorization code from callback
   * @returns JWT tokens and user information
   */
  async handleCallback(code: string): Promise<AuthTokens> {
    const scalekitClient = getScalekitClient();
    const redirectUri = process.env.SCALEKIT_REDIRECT_URI;

    if (!redirectUri) {
      throw new InternalServerErrorException(
        'SCALEKIT_REDIRECT_URI not configured',
      );
    }

    try {
      // Exchange code for tokens
      const { user, accessToken, refreshToken, idToken, expiresIn } =
        await scalekitClient.authenticateWithCode(code, redirectUri);

      return {
        accessToken,
        refreshToken,
        idToken,
        expiresIn,
        user: user as ScalekitUser,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to authenticate with Scalekit: ${error.message}`,
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Refresh token
   * @returns New JWT tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const scalekitClient = getScalekitClient();
    const redirectUri = process.env.SCALEKIT_REDIRECT_URI;

    if (!redirectUri) {
      throw new InternalServerErrorException(
        'SCALEKIT_REDIRECT_URI not configured',
      );
    }

    try {
      // Use authenticateWithCode to refresh - Scalekit SDK handles refresh internally
      // For now, client should re-authenticate if token expires
      // Alternative: Store refresh token and use OAuth refresh token endpoint directly
      throw new InternalServerErrorException(
        'Token refresh not yet implemented. Please re-authenticate.',
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to refresh token: ${error.message}`,
      );
    }
  }

  /**
   * Get Scalekit logout URL
   * @returns Logout redirect URL
   */
  async getLogoutUrl(): Promise<string> {
    const scalekitClient = getScalekitClient();
    const postLogoutRedirectUri =
      process.env.SCALEKIT_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000';

    try {
      // Get logout URL from Scalekit
      const logoutUrl = scalekitClient.getLogoutUrl();
      return logoutUrl;
    } catch (error) {
      console.error('Error getting Scalekit logout URL:', error);
      return postLogoutRedirectUri;
    }
  }
}
