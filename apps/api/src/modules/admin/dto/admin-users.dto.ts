import { AdminRole } from '@prisma/client';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminUserDto {
  @IsEnum(AdminRole)
  role: AdminRole;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAdminInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(AdminRole)
  role: AdminRole;

  @IsString()
  @MinLength(1)
  grantedBy: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
