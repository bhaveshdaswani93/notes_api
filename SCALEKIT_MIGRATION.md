# Scalekit Migration Guide

## Migration Summary

Successfully migrated from **Auth0** to **Scalekit JWT Authentication** with Bearer tokens - perfect for Next.js and MCP server integration.

### What Changed

#### 1. **Authentication Method**
- **Before**: Stateless JWT Bearer tokens via `Authorization` header (Auth0)
- **After**: Stateless JWT Bearer tokens via `Authorization` header (Scalekit)
- **Key Difference**: Scalekit provides hosted login, SSO, and multi-org support

#### 2. **Package Manager**
- Using **Yarn** for dependency management
- All commands use `yarn` instead of `npm`

#### 3. **Dependencies**
**Removed:**
- Auth0-specific JWT validation logic

**Added:**
- `@scalekit-sdk/node` - Scalekit Node.js SDK

**NOT needed:**
- `cookie-parser` - Using Bearer tokens, not cookies

#### 4. **Environment Variables**
**Removed:**
```env
AUTH0_DOMAIN
AUTH0_AUDIENCE
AUTH0_ISSUER
JWT_SECRET
```

**Added:**
```env
SCALEKIT_ENV_URL=https://yourtenant.scalekit.com
SCALEKIT_CLIENT_ID=skc_...
SCALEKIT_CLIENT_SECRET=sks_...
SCALEKIT_REDIRECT_URI=http://localhost:3000/auth/callback
SCALEKIT_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

#### 4. **File Changes**

**New Files:**
- `src/auth/scalekit.client.ts` - Singleton Scalekit client initialization
- `src/auth/scalekit-session.middleware.ts` - JWT Bearer token validation middleware (renamed from session-based)

**Modified Files:**
- `src/auth/types.ts` - Updated from JWT payload to Scalekit user interface
- `src/auth/auth.service.ts` - Complete rewrite for Scalekit OAuth flow with JWT tokens
- `src/auth/auth.controller.ts` - New endpoints: login, callback, refresh, profile, logout
- `src/auth/auth.module.ts` - Updated to use Scalekit JWT middleware
- `src/notes/notes.controller.ts` - Changed `req.jwtPayload.sub` → `req.user.id`
- `src/main.ts` - Updated CORS for Bearer token auth (removed cookie-parser)
- `.env.example` - Updated with Scalekit configuration
- `README.md` - Complete documentation rewrite with Next.js and MCP examples

**Files No Longer Used:**
- `src/auth/auth0-jwt.middleware.ts` - Replaced by scalekit-session.middleware.ts
- `src/auth/auth0-jwt.factory.ts` - No longer needed
- `src/auth/require-scope.middleware.ts` - Can be reimplemented for Scalekit if needed

### Architecture Changes

#### Before (Auth0)
```
Frontend → Auth0 Login → Get JWT → Store in frontend
                                          ↓
Client → API with Bearer Token → JWT Validation Middleware (JWKS)
                                          ↓
                                   Attach jwtPayload to request
```

#### After (Scalekit)
```
Frontend → /auth/login → Get authorization URL → Redirect to Scalekit
                                                         ↓
                                                  Scalekit Hosted Login
                                                         ↓
Frontend callback ← OAuth code ← Scalekit callback
         ↓
Exchange code at /auth/callback → Get JWT tokens → Store in frontend
         ↓
Client → API with Bearer Token → JWT Validation Middleware (Scalekit SDK)
                                          ↓
                                   Attach user to request
```

**Key Benefit**: Same Bearer token pattern, but with:
- Hosted login UI (no custom login page needed)
- Enterprise SSO built-in
- Multi-org support
- Token refresh handled by SDK

### Request Object Changes

**Before (Auth0):**
```typescript
req.jwtPayload = {
  sub: "user123",
  scope: "read:notes",
  ...
}
```

**After (Scalekit):**
```typescript
req.user = {
  id: "user123",
  email: "user@example.com",
  name: "John Doe",
  organizationId: "org_abc",
  ...
}
req.accessToken = "eyJhbGc..." // Available if needed
```

## Setup Instructions

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Scalekit Dashboard

1. Go to [Scalekit Dashboard](https://app.scalekit.com)
2. Create a new application or use existing one
3. Note your credentials:
   - Environment URL
   - Client ID
   - Client Secret

### 3. Configure Redirect URIs

In your Scalekit app settings, add these redirect URIs:
- **Development**: `http://localhost:3000/auth/callback`
- **Production**: `https://yourdomain.com/auth/callback`

### 4. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Scalekit credentials:
```env
SCALEKIT_ENV_URL=https://yourtenant.scalekit.com
SCALEKIT_CLIENT_ID=skc_...
SCALEKIT_CLIENT_SECRET=sks_...
SCALEKIT_REDIRECT_URI=http://localhost:3000/auth/callback
SCALEKIT_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
PORT=3000
FRONTEND_URL=http://localhost:3001
```

### 5. Start the Server

```bash
yarn start:dev
```

## Testing the Migration

### 1. Test Login Flow (API)

```bash
# Get authorization URL
curl http://localhost:3000/auth/login

# Response:
{
  "authorizationUrl": "https://yourtenant.scalekit.com/oauth/authorize?...",
  "state": "..."
}
```

### 2. Complete Login in Browser

1. Copy the `authorizationUrl` from above
2. Paste in browser
3. Complete login on Scalekit hosted page
4. You'll be redirected to `/auth/callback?code=...`
5. The callback returns JWT tokens

### 3. Use the Access Token

```bash
# Exchange code for tokens
curl "http://localhost:3000/auth/callback?code=<code_from_redirect>"

# Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "ref_...",
  "idToken": "eyJhbGc...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {...}
}

# Use access token in API calls
TOKEN="<accessToken_from_above>"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/auth/profile

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Hello"}' \
  http://localhost:3000/notes
```

### 4. Test Token Refresh

```bash
# When access token expires, refresh it
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<your_refresh_token>"}'
```

## Security Features

### ✅ Implemented

1. **JWT Bearer Token Authentication**
   - Stateless authentication
   - Standard Authorization header
   - Works with any HTTP client

2. **Token Validation**
   - Scalekit SDK validates tokens
   - Automatic signature verification
   - Issuer and audience validation

3. **State Parameter (CSRF Protection)**
   - Generated by Scalekit SDK
   - Prevents CSRF attacks during OAuth flow

4. **Token Refresh**
   - Refresh tokens for long-lived sessions
   - Automatic token refresh endpoint
   - Secure refresh token storage

5. **Middleware Protection**
   - All routes protected except public endpoints
   - Unauthorized requests rejected immediately
   - Bearer token required for protected endpoints

### 🔒 Best Practices

1. **Production Configuration**
   ```env
   NODE_ENV=production
   SCALEKIT_ENV_URL=https://yourprod.scalekit.com
   SCALEKIT_REDIRECT_URI=https://yourdomain.com/auth/callback
   SCALEKIT_POST_LOGOUT_REDIRECT_URI=https://yourdomain.com
   FRONTEND_URL=https://yourfrontend.com
   ```

2. **CORS Configuration**
   Update [main.ts](src/main.ts) with your frontend domains:
   ```typescript
   app.enableCors({
     origin: [
       process.env.FRONTEND_URL,
       'https://yourfrontend.com',
     ],
     credentials: true,
   });
   ```

3. **Token Storage (Frontend)**
   - **Access Token**: Store in memory (React state, Zustand, etc.)
   - **Refresh Token**: httpOnly cookie or secure storage
   - **Never** store tokens in localStorage in production (XSS risk)

## Frontend Integration Examples

### Next.js App Router

```typescript
// app/lib/scalekit.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function initiateLogin(organizationId?: string) {
  const url = new URL(`${API_URL}/auth/login`);
  if (organizationId) {
    url.searchParams.set('organization_id', organizationId);
  }
  
  const res = await fetch(url.toString());
  const { authorizationUrl } = await res.json();
  
  // Redirect to Scalekit
  window.location.href = authorizationUrl;
}

export async function handleCallback(code: string) {
  const res = await fetch(`${API_URL}/auth/callback?code=${code}`);
  const data = await res.json();
  
  if (res.ok) {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  }
  
  throw new Error(data.message || 'Authentication failed');
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  const data = await res.json();
  return data;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const accessToken = getAccessToken(); // Get from your state management
  
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  // Handle token expiration
  if (res.status === 401) {
    const refreshToken = getRefreshToken();
    const newTokens = await refreshAccessToken(refreshToken);
    setAccessToken(newTokens.accessToken);
    
    // Retry request with new token
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${newTokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }
  
  return res;
}

// app/auth/callback/page.tsx
'use client';

export default function CallbackPage() {
  const router = useRouter();
  
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    
    if (code) {
      handleCallback(code)
        .then(({ accessToken, refreshToken, user }) => {
          // Store tokens in your state management
          setTokens({ accessToken, refreshToken });
          setUser(user);
          
          router.push('/dashboard');
        })
        .catch((error) => {
          console.error('Authentication failed:', error);
          router.push('/login');
        });
    }
  }, []);
  
  return <div>Completing authentication...</div>;
}

// app/notes/page.tsx
export default async function NotesPage() {
  const notes = await apiRequest('/notes').then(r => r.json());
  
  return (
    <div>
      {notes.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  );
}
```

### MCP Server Integration

```typescript
// mcp-server/src/notes-service.ts
import { McpServer } from '@modelcontextprotocol/sdk';

const API_URL = 'http://localhost:3000';
let accessToken = process.env.SCALEKIT_ACCESS_TOKEN;
let refreshToken = process.env.SCALEKIT_REFRESH_TOKEN;

async function refreshTokenIfNeeded() {
  // Implement token refresh logic
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  const data = await res.json();
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  let res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (res.status === 401) {
    await refreshTokenIfNeeded();
    
    // Retry with new token
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }
  
  return res;
}

// MCP Tools
server.tool('create-note', 'Create a new note', {
  title: { type: 'string', description: 'Note title' },
  content: { type: 'string', description: 'Note content' },
}, async ({ title, content }) => {
  const res = await apiCall('/notes', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
  
  return await res.json();
});

server.tool('list-notes', 'List all notes', {}, async () => {
  const res = await apiCall('/notes');
  return await res.json();
});
```

## Advanced Features

### Multi-Organization Support

```bash
# Login to specific organization
curl http://localhost:3000/auth/login?organization_id=org_abc
```

### SSO Login

```bash
# Login with specific SSO connection
curl http://localhost:3000/auth/login?connection_id=conn_saml_abc
```

### User Management

Use Scalekit SDK in your services:
```typescript
import { getScalekitClient } from './auth/scalekit.client';

const scalekitClient = getScalekitClient();

// List users in organization
const users = await scalekitClient.organization('org_abc').users.list();

// Get user details
const user = await scalekitClient.organization('org_abc').user('user123').get();
```

## Troubleshooting

### Issue: "No Authorization header found" error

**Solution:** Ensure you're sending the Bearer token in the Authorization header:
```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### Issue: "Token verification failed" error

**Solutions:**
1. Check token hasn't expired (tokens typically last 1 hour)
2. Use refresh token to get a new access token
3. Ensure `SCALEKIT_ENV_URL`, `CLIENT_ID`, and `CLIENT_SECRET` are correct
4. Verify you're using the correct Scalekit environment (dev/prod)

### Issue: Callback returns error

**Solutions:**
1. Verify `SCALEKIT_REDIRECT_URI` exactly matches Scalekit dashboard settings
2. Check environment variables are loaded correctly
3. Ensure user has permission to log in to the application

### Issue: Token refresh failing

**Solutions:**
1. Verify refresh token hasn't expired (typically 7-30 days)
2. Check Scalekit credentials are correct
3. Ensure refresh token is being stored and sent correctly

### Issue: CORS errors from frontend

**Solutions:**
1. Add your frontend URL to `FRONTEND_URL` env variable
2. Update CORS configuration in [main.ts](src/main.ts)
3. Ensure credentials: true is set in fetch options

## Migration Checklist

- [x] Install Scalekit SDK (`@scalekit-sdk/node`)
- [x] Update environment variables configuration
- [x] Create Scalekit client initialization
- [x] Implement auth controller (login/callback/refresh/logout)
- [x] Create JWT Bearer token validation middleware
- [x] Update auth module configuration
- [x] Update types for JWT-based auth
- [x] Update notes controller to use `req.user.id`
- [x] Update README with Scalekit documentation
- [x] Remove cookie-parser dependency (not needed for Bearer tokens)
- [ ] Configure Scalekit Dashboard
- [ ] Add redirect URIs to Scalekit app
- [ ] Set up environment variables with real credentials
- [ ] Test complete auth flow (login → callback → API calls)
- [ ] Implement frontend integration (Next.js/React)
- [ ] Test token refresh flow
- [ ] Customize hosted login page branding
- [ ] Set up organizations (if using SSO)
- [ ] Configure webhooks for user events
- [ ] Test in production environment

## Command Reference (Yarn) 

### Development
```bash
yarn install          # Install dependencies
yarn start:dev        # Start development server with hot reload
yarn build            # Build for production
yarn start:prod       # Start production server
yarn lint             # Lint code
yarn format           # Format code with Prettier
```

### Testing
```bash
yarn test             # Run unit tests
yarn test:watch       # Run tests in watch mode
yarn test:cov         # Run tests with coverage
yarn test:e2e         # Run end-to-end tests
```

## Next Steps

1. **Configure Scalekit Dashboard**
   - Create/configure your application
   - Add redirect URIs
   - Test with sample users

2. **Frontend Integration**
   - Update login button to call `/auth/login`
   - Redirect user to returned authorization URL
   - Handle callback redirect
   - Store session cookies automatically

3. **Customize Authentication**
   - Brand hosted login page
   - Configure social login providers
   - Set up enterprise SSO connections

4. **Implement Additional Features**
   - User profile management
   - Organization management
   - Role-based access control (RBAC)
   - Webhooks for user events

5. **Production Deployment**
   - Set up production environment variables
   - Configure production redirect URIs
   - Enable HTTPS
   - Test complete flow in production

## Resources

- **Scalekit Documentation**: https://docs.scalekit.com
- **Scalekit Dashboard**: https://app.scalekit.com
- **Scalekit APIs**: https://docs.scalekit.com/apis
- **SDK Documentation**: https://docs.scalekit.com/dev-kit
- **Support**: support@scalekit.com

---

**Migration completed successfully!** 🎉

Your application now uses Scalekit for secure, enterprise-grade authentication with support for hosted login, SSO, and multi-organization features.
