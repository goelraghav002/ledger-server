import { IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateOrgDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  // simple slug check: lowercase letters, numbers, hyphen
  @Matches(/^[a-z0-9-]+$/, { message: 'slug may contain lowercase letters, numbers and hyphens only' })
  slug?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}