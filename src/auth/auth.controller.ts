import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto) {
    try {
      return this.authService.requestOtp(dto.phone, dto.deviceToken);
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    try {
      return this.authService.verifyOtp(dto.phone, dto.otp, dto.deviceToken);
    } catch (error) {
      throw error;
    }
  }
}