# Nexus Console Authentication Setup

This document describes the authentication system for the Nexus Console.

## Overview

The authentication system uses a two-tier approach:
1. **API Key Authentication**: Static API key for initial authentication
2. **JWT Tokens**: Generated after API key validation for ongoing session management

This design allows for easy future enhancements to the authentication system while providing a simple starting point.

## Architecture

### Server Components

- **API Key Provider** (`nexus/server/src/auth/providers/api-key.provider.ts`): Validates static API keys
- **JWT Provider** (`nexus/server/src/auth/providers/jwt.provider.ts`): Generates and validates JWT tokens
- **Auth Service** (`nexus/server/src/services/auth.service.ts`): Coordinates authentication flow
- **Auth Controller** (`nexus/server/src/controllers/auth.controller.ts`): Exposes authentication endpoints

### Client Components

- **Auth Context** (`nexus/console/lib/auth-context.tsx`): React context for authentication state
- **Login Page** (`nexus/console/app/login/page.tsx`): User interface for authentication

## Configuration

### Server Environment Variables

The following environment variables are configured in `nexus/server/.env`:

```env
# Auth Configuration
JWT_SECRET=nexus-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h
CONSOLE_API_KEY=mvp-key

# Server Configuration
PORT=3000
```

**IMPORTANT**: Change these values in production!

### Default API Key

The default API key is: `mvp-key`

## API Endpoints

### POST /api/auth/token

Exchange an API key for a JWT token.

**Request:**
```json
{
  "apiToken": "mvp-key"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Authentication failed"
}
```

### POST /api/auth/verify

Verify a JWT token.

**Request:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "payload": {
    "sub": "nexus-console",
    "type": "console",
    "iat": 1234567890,
    "exp": 1234654290
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

## Testing the Authentication Flow

### 1. Start the Nexus Server

```bash
cd nexus/server
npm run dev
```

The server will start on http://localhost:3000

### 2. Test the Auth Endpoint (Optional)

You can test the endpoint directly using curl:

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiToken":"mvp-key"}'
```

You should receive a JWT token in the response.

### 3. Start the Console

In a new terminal:

```bash
cd nexus/console
npm run dev
```

The console will start on http://localhost:3002

### 4. Login to the Console

1. Open http://localhost:3002 in your browser
2. You should be redirected to the login page
3. Enter the API key: `mvp-key`
4. Click "Sign In"
5. You should be redirected to the dashboard

### 5. Verify Authentication

- The JWT token is stored in sessionStorage
- Check your browser's developer tools > Application > Session Storage
- You should see:
  - `nexusJwtToken`: Your JWT token
  - `nexusApiToken`: The API key you entered
  - `isAuthenticated`: "true"

## Authentication Flow Diagram

```
┌─────────┐                    ┌─────────────┐                    ┌──────────────┐
│         │  1. Enter API Key  │             │  2. POST /api/     │              │
│ Console │ ───────────────────>│ Auth Context│     auth/token     │ Nexus Server │
│  Login  │                    │             │ ──────────────────>│              │
│  Page   │                    │             │                    │              │
│         │                    │             │  3. Return JWT     │              │
│         │                    │             │<────────────────── │              │
│         │  4. Redirect to    │             │                    │              │
│         │    Dashboard       │             │                    │              │
│         │<─────────────────  │             │                    │              │
└─────────┘                    └─────────────┘                    └──────────────┘
                                      │
                                      │ 5. Store in sessionStorage:
                                      │    - JWT token
                                      │    - API token
                                      │    - isAuthenticated flag
                                      v
```

## Future Enhancements

The current system is designed to be easily extended:

1. **Database-backed API Keys**: Store API keys in the database with user associations
2. **Multiple Authentication Methods**: Add OAuth2, SAML, or other providers
3. **Token Refresh**: Implement refresh tokens for longer sessions
4. **Role-Based Access Control**: Add roles and permissions to JWT payload
5. **Token Blacklist**: Implement token revocation system
6. **Rate Limiting**: Add rate limiting to prevent brute force attacks
7. **Audit Logging**: Log all authentication attempts

## Security Considerations

- API keys and JWT secrets should be changed in production
- Use HTTPS in production
- JWT tokens expire after 24 hours by default
- Tokens are stored in sessionStorage (cleared when browser tab closes)
- Consider implementing refresh tokens for better UX
- Add rate limiting to prevent brute force attacks
- Implement proper CORS configuration for production

## Troubleshooting

### Server won't start

- Check that port 3000 is not already in use
- Ensure all dependencies are installed: `npm install`
- Check the `.env` file exists and is properly formatted

### Console won't connect to server

- Verify the server is running on http://localhost:3000
- Check the console's auth-context.tsx has the correct server URL
- Check browser console for CORS errors

### Authentication fails

- Verify you're using the correct API key from the `.env` file
- Check the server logs for error messages
- Use browser dev tools to inspect the network request/response

### JWT token invalid

- Token may have expired (24h default)
- JWT secret may have changed (requires new login)
- Check the server logs for JWT validation errors
