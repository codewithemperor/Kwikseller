import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type PaystackInitializeInput = {
  email: string;
  amount: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

type PaystackInitializeResponse = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  raw: unknown;
};

@Injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private readonly config: ConfigService) {}

  async initializeTransaction(input: PaystackInitializeInput): Promise<PaystackInitializeResponse> {
    const secret = this.config.get<string>('payment.paystackSecret');
    if (!secret) {
      throw new BadRequestException('Paystack secret key is not configured');
    }

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        amount: Math.round(input.amount * 100),
        reference: input.reference,
        currency: 'NGN',
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.status || !payload?.data?.authorization_url) {
      throw new BadGatewayException({
        message: 'Paystack transaction initialization failed',
        gatewayStatus: response.status,
        gatewayResponse: payload,
      });
    }

    return {
      authorizationUrl: payload.data.authorization_url,
      accessCode: payload.data.access_code,
      reference: payload.data.reference,
      raw: payload,
    };
  }

  async verifyTransaction(reference: string) {
    const secret = this.config.get<string>('payment.paystackSecret');
    if (!secret) {
      throw new BadRequestException('Paystack secret key is not configured');
    }

    const response = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.status) {
      throw new BadGatewayException({
        message: 'Paystack transaction verification failed',
        gatewayStatus: response.status,
        gatewayResponse: payload,
      });
    }

    return payload;
  }
}
