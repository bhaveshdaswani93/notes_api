import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { OAuthStrategy } from './oauth.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({ secret: jwtConstants.secret, signOptions: { expiresIn: '1h' } })],
  providers: [AuthService, JwtStrategy, OAuthStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
