import { IsOptional, IsString } from 'class-validator';
import { IsE164 } from '../../common/validators/is-e164.decorator';

export class RequestOtpDto {
  @IsE164()
  phone!: string;

  @IsOptional()
  @IsString()
  deviceToken?: string;
}