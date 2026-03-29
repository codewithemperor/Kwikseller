import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Software developer and entrepreneur' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserWithProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty({ enum: ['BUYER', 'VENDOR', 'ADMIN', 'RIDER'] })
  role: string;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING'] })
  status: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  profile: ProfileResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
