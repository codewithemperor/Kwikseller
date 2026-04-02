import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

interface LoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
    user: {
      id: string;
      email: string;
      role: 'BUYER' | 'VENDOR' | 'ADMIN' | 'RIDER';
      status: string;
      emailVerified: boolean;
      profile?: {
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
      };
    };
  };
  error?: string;
  code?: string;
  message?: string;
}

// POST - Login and create session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user-agent from request headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    
    // Call backend login API
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': userAgent,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Handle 403 Forbidden (Email not verified)
    if (response.status === 403) {
      const errorCode = data.code || (data.error?.code);
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        return NextResponse.json({
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          message: data.message || 'Email not verified. A verification code has been sent to your email.',
          email: data.email || email,
          requiresOTP: true,
        });
      }
    }

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || 'Login failed',
        },
        { status: response.status }
      );
    }

    // Return success with tokens and user
    // The client will call /api/session to create the session
    return NextResponse.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    );
  }
}
