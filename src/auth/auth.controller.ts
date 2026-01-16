import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import '../auth/types';

@Controller('auth')
export class AuthController {
  @Get('profile')
  profile(@Req() req: Request) {
    return req.jwtPayload;
  }
}
