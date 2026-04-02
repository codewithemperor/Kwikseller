import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

// POST - Resend verification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Call backend resend-verification API
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || 'Failed to resend verification' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend verification' },
      { status: 500 }
    );
  }
}
