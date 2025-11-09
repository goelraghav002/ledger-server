import { IsE164 } from '../../common/validators/is-e164.decorator';
import { IsString, Matches, IsOptional } from 'class-validator';

export class VerifyOtpDto {
  @IsE164()
  phone!: string;

  // OTP: 4-8 digits (adjust to your policy). Use string to preserve leading zeros.
  @IsString()
  @Matches(/^\d{4,8}$/, { message: 'OTP must be 4-8 digits' })
  otp!: string;

  @IsOptional()
  @IsString()
  deviceToken?: string;
}