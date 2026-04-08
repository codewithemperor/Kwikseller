import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  ValidateIf,
  Matches,
} from "class-validator";

export enum UserRole {
  BUYER = "BUYER",
  VENDOR = "VENDOR",
  ADMIN = "ADMIN",
  RIDER = "RIDER",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber("NG")
  phone?: string;

  // Vendor-specific fields
  @ValidateIf((o) => o.role === UserRole.VENDOR)
  @IsString()
  storeName?: string;

  @ValidateIf((o) => o.role === UserRole.VENDOR)
  @IsString()
  storeCategory?: string;

  // Admin registration requires invite token
  @ValidateIf((o) => o.role === UserRole.ADMIN)
  @IsString()
  inviteToken?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class ResetPasswordDto {
  @IsString()
  otp: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  newPassword: string;
}

export class VerifyEmailDto {
  @IsString()
  otp: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class VerifyOTPDto {
  @IsString()
  otp: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  type?: "email-verification" | "password-reset" | "login-verification";
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  newPassword: string;
}

export class OAuthDto {
  @IsString()
  accessToken: string;

  @IsOptional()
  @IsEnum(["google", "facebook", "apple"])
  provider?: string;
}
