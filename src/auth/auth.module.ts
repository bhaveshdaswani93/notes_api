import { Module, MiddlewareConsumer } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { Auth0JwtMiddleware } from './auth0-jwt.middleware';
import { RequireScopeMiddleware } from './require-scope.middleware';

@Module({
  imports: [UsersModule],
  providers: [],
  controllers: [AuthController],
  exports: [],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    const auth0Middleware = new Auth0JwtMiddleware(
      process.env.AUTH0_DOMAIN || '',
      process.env.AUTH0_AUDIENCE || '',
    );
    consumer.apply(auth0Middleware.use.bind(auth0Middleware)).forRoutes('*');
  }
}
