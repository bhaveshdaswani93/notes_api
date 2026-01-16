# Auth0 JWT Middleware for NestJS

This module provides middleware for verifying Auth0 JWT tokens in a NestJS application.

## Installation

The required dependencies are already installed. Make sure you have `jose` in your package.json.

## Environment Variables

Set the following environment variables:

- `AUTH0_DOMAIN`: Your Auth0 domain (e.g., `your-tenant.auth0.com`)
- `AUTH0_AUDIENCE`: Your Auth0 API audience

## Usage

### Using the Middleware

Import the factory functions and use them in your module's `configure` method or in `main.ts`.

#### In a Module

```typescript
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { createAuth0JwtMiddleware, createRequireScopeMiddleware } from './auth';

@Module({})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(createAuth0JwtMiddleware(process.env.AUTH0_DOMAIN!, process.env.AUTH0_AUDIENCE!))
      .forRoutes('protected/*')
      .apply(createRequireScopeMiddleware('read:notes'))
      .forRoutes('protected/notes');
  }
}
```

#### In main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createAuth0JwtMiddleware } from './auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/api/protected', createAuth0JwtMiddleware(process.env.AUTH0_DOMAIN!, process.env.AUTH0_AUDIENCE!));

  await app.listen(3000);
}
bootstrap();
```

### Accessing JWT Payload in Controllers

After applying the middleware, you can access the JWT payload in your controllers:

```typescript
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('protected')
export class ProtectedController {
  @Get()
  getProtected(@Req() req: Request) {
    const user = req.jwtPayload; // Access the JWT payload
    return { message: 'Protected route', user };
  }
}
```

## Middleware Classes

- `Auth0JwtMiddleware`: Verifies the JWT token and attaches payload to the request.
- `RequireScopeMiddleware`: Checks if the token has the required scope.

## Factories

- `createAuth0JwtMiddleware(auth0Domain, auth0Audience)`: Creates an instance of Auth0JwtMiddleware.
- `createRequireScopeMiddleware(scope)`: Creates an instance of RequireScopeMiddleware.