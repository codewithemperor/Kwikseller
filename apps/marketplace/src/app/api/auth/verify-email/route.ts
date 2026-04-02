import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

// POST - Verify email with OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Call backend verify-email API
    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || 'Verification failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
