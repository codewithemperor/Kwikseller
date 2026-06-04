import { IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';

// ─── Vendor DTOs ──────────────────────────────────────────────────────────────

export class PayoutRequestDto {
  @IsNumber()
  @Min(100) // minimum ₦100
  amount: number;

  @IsString()
  bankCode: string;

  @IsString()
  accountNumber: string;

  @IsString()
  accountName: string;
}

export class EscrowReleaseDto {
  // deliveryId comes from route param — no body needed
}

export class DisputeOpenDto {
  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  evidence?: string;
}

// ─── Admin DTOs ───────────────────────────────────────────────────────────────

export class DisputeResolutionDto {
  @IsEnum(['release_to_vendor', 'refund_to_customer', 'partial'])
  resolution: 'release_to_vendor' | 'refund_to_customer' | 'partial';

  @IsNumber()
  @Min(0)
  @IsOptional()
  vendorAmount?: number;

  @IsString()
  @IsOptional()
  refundReason?: string;
}

// ─── Query DTOs ────────────────────────────────────────────────────────────────

export class TransactionQueryDto {
  page?: number;
  limit?: number;
  type?: string;    // 'escrow_release' | 'withdrawal' | 'refund' | 'commission'
  status?: string;  // varies by type
}

export class WithdrawalQueryDto {
  page?: number;
  limit?: number;
  status?: string;  // 'PENDING' | 'PROCESSED' | 'FAILED'
}
