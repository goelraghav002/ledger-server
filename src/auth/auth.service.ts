import { Injectable, BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 300); // 5 minutes
const OTP_RESEND_COOLDOWN = Number(process.env.OTP_RESEND_COOLDOWN || 60); // 60 sec
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const NODE_ENV = process.env.NODE_ENV || 'production';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) { }

  private generateOtpCode() {
    // 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000);
    return String(code);
  }

  private async sendSmsStub(phone: string, otp: string) {
    // Replace with real SMS provider integration (Twilio, Gupshup, etc.)
    if (process.env.SMS_PROVIDER === 'log' || !process.env.SMS_PROVIDER) {
      console.log(`[OTP] Send to ${phone}: ${otp}`);
      return true;
    }
    // TODO: integrate provider here using env vars
    // await someSmsClient.send({ to: phone, body: `Your OTP is ${otp}` });
    return true;
  }

  /**
   * Request an OTP: generate, hash & store server-side, and send via SMS.
   * Rate-limited by OTP_RESEND_COOLDOWN.
  */
  async requestOtp(phone: string, deviceToken?: string) {
    try {
      if (!phone) throw new BadRequestException('phone required');

      // find latest otp record for phone
      const existing = await this.prisma.otp.findFirst({
        where: { phone },
        orderBy: { createdAt: 'desc' },
      });

      // cooldown check: don't resend if last sent within cooldown
      if (existing?.lastSentAt) {
        const secondsSince = (Date.now() - existing.lastSentAt.getTime()) / 1000;
        if (secondsSince < OTP_RESEND_COOLDOWN) {
          throw new HttpException(
            `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN - secondsSince)} seconds before requesting a new OTP`,
            429,
          );
        }
      }

      // generate OTP
      const otp = NODE_ENV === 'development' ? '123456' : this.generateOtpCode();
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(otp, salt);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);

      // upsert OTP record (create new record every request, could also update existing)
      await this.prisma.otp.create({
        data: {
          phone,
          codeHash: hash,
          attempts: 0,
          consumed: false,
          createdAt: now,
          lastSentAt: now,
          expiresAt,
        },
      });

      // persist device token (non-blocking)
      if (deviceToken) {
        try {
          await this.prisma.device.create({
            data: { userId: null as any, token: deviceToken }, // we don't know userId yet; optional
          });
        } catch (e) {
          // it's okay if device create fails (duplicate constraints etc.) — ignore in dev
        }
      }

      // send SMS (stubbed)
      await this.sendSmsStub(phone, otp);

      // Return success (do NOT return raw otp in prod)
      return { success: true, ttlSeconds: OTP_TTL_SECONDS, };
    } catch (error) {
      console.error('Error in requestOtp:', error);
      throw error;
    }
  }

  /**
   * Verify OTP and sign in or register the user.
   * - If user exists: sign in and return orgs list.
   * - If user not exists: create user, return empty orgs list and needsOrgCreation=true
   */
  async verifyOtp(phone: string, otp: string, deviceToken?: string) {
    if (!phone || !otp) throw new BadRequestException('phone and otp required');

    // get latest OTP for phone
    const otpRecord = await this.prisma.otp.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('No OTP requested for this phone');
    }

    if (otpRecord.consumed) {
      throw new UnauthorizedException('OTP already used');
    }

    // expired?
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired');
    }

    // too many attempts?
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpException('Too many incorrect attempts. Request a new OTP.', 429);
    }

    // compare
    const match = bcrypt.compareSync(otp, otpRecord.codeHash);
    if (!match) {
      // increment attempts
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } as any }, // use raw increment via update is supported
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // success — mark consumed
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { consumed: true },
    });

    // create user if missing
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({ data: { phone } });
    }

    // attach device if provided
    if (deviceToken) {
      // link device to user: create or update
      try {
        // if you use token uniqueness, adapt where clause; here we try to create
        await this.prisma.device.upsert({
          where: { token: deviceToken },
          update: { userId: user.id, lastSeenAt: new Date() },
          create: { token: deviceToken, userId: user.id, lastSeenAt: new Date() },
        });
      } catch (e) {
        // ignore device upsert errors for now
      }
    }

    // gather orgs for the user
    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId: user.id },
      include: { org: true, role: true },
    });

    const orgs = memberships.map((m) => ({ id: m.orgId, name: (m as any).org?.name, roleId: (m as any).roleId }));

    // sign JWT
    const payload = { sub: user.id, phone: user.phone };
    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      user: { id: user.id, phone: user.phone, name: user.name },
      orgs,
      needsOrgCreation: orgs.length === 0,
    };
  }

  /**
   * Validate a user by id (used by JwtStrategy).
   * Return the user object if found, otherwise null.
   */
  async validateUser(userId: string) {
    if (!userId) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });
    return user ?? null;
  }

  // convenience: issue token for a user (if needed)
  issueTokenForUser(userId: string, phone?: string) {
    return this.jwt.sign({ sub: userId, phone });
  }
}