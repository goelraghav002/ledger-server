import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('v1/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body('phone') phone: string) {
    return this.auth.requestOtp(phone);
  }

  @Post('verify-otp')
  async verify(@Body() body: { phone: string; otp: string; deviceToken?: string }) {
    return this.auth.verifyOtp(body.phone, body.otp, body.deviceToken);
  }
}