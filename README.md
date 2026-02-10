# Notes API with Scalekit Authentication

NestJS API for Notes with **Scalekit JWT Authentication** - optimized for Next.js frontend and MCP server integration.

## Features

- 🔐 **JWT Bearer Token Authentication** using Scalekit
- 🏢 **Enterprise SSO Support** (SAML, OIDC)
- 🌐 **Multi-organization Support**
- 🔄 **Token Refresh Flow**
- 🎨 **Customizable Hosted Login**
- ⚡ **Next.js & MCP Server Ready**

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Scalekit credentials from [Scalekit Dashboard](https://app.scalekit.com):

```env
SCALEKIT_ENV_URL=https://yourtenant.scalekit.com
SCALEKIT_CLIENT_ID=skc_...
SCALEKIT_CLIENT_SECRET=sks_...
SCALEKIT_REDIRECT_URI=http://localhost:3000/auth/callback
SCALEKIT_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
FRONTEND_URL=http://localhost:3001
PORT=3000
```

### 3. Start Development Server

```bash
yarn start:dev
```

## Authentication Flow

### For Next.js Frontend

```typescript
// 1. Initiate login
const response = await fetch('http://localhost:3000/auth/login');
const { authorizationUrl } = await response.json();

// 2. Redirect user to Scalekit hosted login
window.location.href = authorizationUrl;

// 3. Handle callback (Scalekit redirects to /auth/callback)
// Your backend receives code and exchanges for tokens
// Response: { accessToken, refreshToken, idToken, user }

// 4. Store tokens in your frontend (localStorage or state management)
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// 5. Make authenticated requests
const notes = await fetch('http://localhost:3000/notes', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// 6. Refresh token when expired
const refreshResponse = await fetch('http://localhost:3000/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
```

### For MCP Server

```typescript
// MCP server can use the same JWT tokens
const accessToken = '<token-from-client>';

// Make authenticated requests
const response = await fetch('http://localhost:3000/notes', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

## API Endpoints

### Public Endpoints

#### `GET /auth/login`
Initiates Scalekit hosted login flow.

**Query Parameters:**
- `organization_id` (optional): Organization ID for SSO
- `connection_id` (optional): Specific SSO connection ID

**Response:**
```json
{
  "authorizationUrl": "https://yourtenant.scalekit.com/oauth/authorize?...",
  "state": "random-state-value",
  "message": "Redirect user to authorizationUrl to complete login"
}
```

#### `GET /auth/callback`
OAuth callback handler. Exchanges authorization code for JWT tokens.

**Query Parameters:**
- `code`: Authorization code from Scalekit
- `error` (optional): Error code if authentication failed

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "refresh_token_here",
  "idToken": "id_token_here",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "org_abc"
  }
}
```

#### `POST /auth/refresh`
Refreshes access token using refresh token.

**Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token",
  "idToken": "new_id_token",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "user": { ... }
}
```

### Protected Endpoints (Require `Authorization: Bearer <token>` header)

#### `GET /auth/profile`
Get current user profile.

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "organizationId": "org_abc"
}
```

#### `POST /auth/logout`
Get Scalekit logout URL.

**Body:**
```json
{
  "idToken": "id_token_here"
}
```

**Response:**
```json
{
  "logoutUrl": "https://yourtenant.scalekit.com/oauth/logout?...",
  "message": "Redirect user to logoutUrl to complete logout"
}
```

#### `POST /notes`
Create a new note.

**Body:**
```json
{
  "title": "My Note",
  "content": "Note content here"
}
```

#### `GET /notes`
List all notes for authenticated user.

#### `GET /notes/:id`
Get specific note.

#### `PATCH /notes/:id`
Update note.

**Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content"
}
```

## Testing

### Test Login Flow

```bash
# 1. Get authorization URL
curl http://localhost:3000/auth/login

# 2. Visit the authorizationUrl in browser and complete login
# You'll be redirected to /auth/callback with a code parameter

# 3. The callback endpoint returns tokens automatically
# Store the accessToken from the response
```

### Test Protected Endpoints

```bash
# Set your access token
export TOKEN="your_access_token_here"

# Get profile
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# Create note
curl -X POST http://localhost:3000/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Note","content":"Hello Scalekit!"}'

# List notes
curl http://localhost:3000/notes \
  -H "Authorization: Bearer $TOKEN"
```

### Test Token Refresh

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type": "application/json" \
  -d '{"refreshToken":"your_refresh_token"}'
```

## Development Commands

```bash
# Install dependencies
yarn install

# Start development server (with hot reload)
yarn start:dev

# Build for production
yarn build

# Start production server
yarn start:prod

# Run tests
yarn test

# Run e2e tests
yarn test:e2e

# Lint code
yarn lint

# Format code
yarn format
```

## Scalekit Dashboard Configuration

1. **Create Application**: Go to [Scalekit Dashboard](https://app.scalekit.com)
2. **Add Redirect URIs**:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://api.yourdomain.com/auth/callback`
3. **Get Credentials**: Copy Client ID and Client Secret
4. **Configure Branding**: Customize hosted login page
5. **Set Up SSO**: Add SAML/OIDC connections for organizations

## Migration from Auth0

This project was migrated from Auth0 to Scalekit.

### Key Changes:
- ✅ Bearer token authentication maintained
- ✅ JWT validation via Scalekit SDK
- ✅ Token refresh flow implemented
- ✅ Compatible with Next.js and MCP servers
- ✅ No cookie dependencies
- ✅ Stateless authentication

### Code Changes:
- `req.jwtPayload.sub` → `req.user.id`
- Auth0 JWT verification → Scalekit token validation
- Authorization header format unchanged: `Bearer <token>`

## Security Features

- ✅ JWT Bearer token authentication
- ✅ Token expiration and refresh
- ✅ Scalekit's secure token validation
- ✅ CORS configuration for frontend
- ✅ State parameter for CSRF protection
- ✅ Secure credential management

## Documentation

- [Scalekit Documentation](https://docs.scalekit.com)
- [Scalekit APIs](https://docs.scalekit.com/apis)
- [Full Stack Auth Guide](https://docs.scalekit.com/fsa)
- [SDK Documentation](https://docs.scalekit.com/dev-kit)
- [Next.js Integration](https://docs.scalekit.com/integrations/nextjs)

## Support

For issues or questions:
- Scalekit Support: support@scalekit.com
- Scalekit Dashboard: https://app.scalekit.com
- Documentation: https://docs.scalekit.com

---

Built with ❤️ using [NestJS](https://nestjs.com) and [Scalekit](https://scalekit.com)
