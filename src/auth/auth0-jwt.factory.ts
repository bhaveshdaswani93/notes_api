import { Auth0JwtMiddleware } from './auth0-jwt.middleware';

export function createAuth0JwtMiddleware(
  auth0Domain: string,
  auth0Audience: string,
) {
  return new Auth0JwtMiddleware(auth0Domain, auth0Audience);
}
