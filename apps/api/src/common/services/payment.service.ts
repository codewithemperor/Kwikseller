import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PaymentInitialization {
  amount: number;
  email: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
}

export interface PaymentResult {
  authorizationUrl: string;
  reference: string;
}

export interface PaymentVerification {
  reference: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly configService: ConfigService) {}

  async initializePayment(
    data: PaymentInitialization,
    gateway: 'paystack' | 'flutterwave' = 'paystack',
  ): Promise<PaymentResult> {
    const reference = `kwik_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (gateway === 'paystack') {
      return this.initializePaystack(data, reference);
    }
    return this.initializeFlutterwave(data, reference);
  }

  private async initializePaystack(
    data: PaymentInitialization,
    reference: string,
  ): Promise<PaymentResult> {
    const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');

    if (!secretKey) {
      // Development mode - return mock URL
      return {
        authorizationUrl: `${this.configService.get('FRONTEND_URL')}/payment/mock?ref=${reference}`,
        reference,
      };
    }

    const response = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount * 100,
          email: data.email,
          reference,
          callback_url: data.callbackUrl || `${this.configService.get('APP_URL')}/payment/callback`,
          metadata: data.metadata,
        }),
      },
    );

    const result = (await response.json()) as {
      status: boolean;
      data: { authorization_url: string };
    };

    if (!result.status) {
      throw new Error('Failed to initialize payment');
    }

    return {
      authorizationUrl: result.data.authorization_url,
      reference,
    };
  }

  private async initializeFlutterwave(
    data: PaymentInitialization,
    reference: string,
  ): Promise<PaymentResult> {
    const secretKey = this.configService.get('FLUTTERWAVE_SECRET_KEY');

    if (!secretKey) {
      return {
        authorizationUrl: `${this.configService.get('FRONTEND_URL')}/payment/mock?ref=${reference}`,
        reference,
      };
    }

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: data.amount,
        currency: 'NGN',
        redirect_url: data.callbackUrl || `${this.configService.get('APP_URL')}/payment/callback`,
        customer: { email: data.email },
        meta: data.metadata,
      }),
    });

    const result = (await response.json()) as {
      status: string;
      data: { link: string };
    };

    if (result.status !== 'success') {
      throw new Error('Failed to initialize payment');
    }

    return {
      authorizationUrl: result.data.link,
      reference,
    };
  }

  async verifyPayment(
    reference: string,
    gateway: 'paystack' | 'flutterwave' = 'paystack',
  ): Promise<PaymentVerification> {
    if (gateway === 'paystack') {
      return this.verifyPaystackPayment(reference);
    }
    return this.verifyFlutterwavePayment(reference);
  }

  private async verifyPaystackPayment(
    reference: string,
  ): Promise<PaymentVerification> {
    const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');

    if (!secretKey) {
      // Development mock
      return { reference, status: 'success', amount: 0 };
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    const result = (await response.json()) as {
      status: boolean;
      data: { status: string; amount: number; metadata?: Record<string, unknown> };
    };

    return {
      reference,
      status: result.data?.status === 'success' ? 'success' : 'failed',
      amount: result.data?.amount ? result.data.amount / 100 : 0,
      metadata: result.data?.metadata,
    };
  }

  private async verifyFlutterwavePayment(
    reference: string,
  ): Promise<PaymentVerification> {
    const secretKey = this.configService.get('FLUTTERWAVE_SECRET_KEY');

    if (!secretKey) {
      return { reference, status: 'success', amount: 0 };
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${reference}/verify`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    const result = (await response.json()) as {
      status: string;
      data: { status: string; amount: number; meta?: Record<string, unknown> };
    };

    return {
      reference,
      status: result.data?.status === 'successful' ? 'success' : 'failed',
      amount: result.data?.amount || 0,
      metadata: result.data?.meta,
    };
  }
}
