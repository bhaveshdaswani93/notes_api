import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import axios from 'axios';
import { UsersService } from '../users/users.service';

@Injectable()
export class OAuthStrategy extends PassportStrategy(OAuth2Strategy, 'mcp') {
  constructor(private usersService: UsersService) {
    super(
      {
        authorizationURL: process.env.OAUTH_AUTHORIZE_URL || 'https://example.com/oauth/authorize',
        tokenURL: process.env.OAUTH_TOKEN_URL || 'https://example.com/oauth/token',
        clientID: process.env.OAUTH_CLIENT_ID || '',
        clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
        callbackURL: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000/auth/mcp/callback',
      },
      async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
        // This callback is not used; Nest's validate is used instead.
        done(null, profile);
      },
    );
  }

  async userProfile(accessToken: string, done: Function) {
    try {
      const userInfoUrl = process.env.OAUTH_USERINFO_URL;
      if (!userInfoUrl) return done(null, {});
      const resp = await axios.get(userInfoUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      done(null, resp.data);
    } catch (err) {
      done(err as any);
    }
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // profile may be filled by userProfile
    const provider = 'mcp';
    const providerId = profile.id || profile.sub || profile.user_id || accessToken;
    const user = await this.usersService.findOrCreateFromOAuth(provider, providerId, profile || {});
    return user;
  }
}
