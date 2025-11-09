import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  // send OTP - stubbed (in prod call SMS provider)
  async requestOtp(phone: string) {
    // create user if not exists
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({ data: { phone } });
    }
    // store OTP in-memory or DB (mock here). For dev: return true.
    // In prod, generate OTP and send via SMS provider.
    return { success: true };
  }

  // verify OTP - stub: any otp accepted in dev
  async verifyOtp(phone: string, otp: string, deviceToken?: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new Error('User not found');

    const payload = { sub: user.id, phone: user.phone };
    const token = this.jwt.sign(payload);
    // Optionally persist device
    if (deviceToken) {
      await this.prisma.device.create({
        data: { userId: user.id, token: deviceToken },
      });
    }
    return { accessToken: token, user };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}