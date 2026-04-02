import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';

// POST - Register new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, role, inviteToken, vehicleType, plateNumber } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Call backend register API
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        inviteToken,
        vehicleType,
        plateNumber,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || 'Registration failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register' },
      { status: 500 }
    );
  }
}
