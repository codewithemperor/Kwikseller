import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@kwikseller/utils/session';

// POST - Logout
export async function POST() {
  try {
    const session = await getSession('marketplace');
    
    // Call backend logout if we have tokens
    const refreshToken = session.user?.refreshToken;
    const accessToken = session.user?.accessToken;
    
    if (refreshToken && accessToken) {
      const API_URL = process.env.API_URL || 'http://localhost:4000/api/v1';
      
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (e) {
        // Ignore backend logout errors, still destroy local session
        console.error('Backend logout error:', e);
      }
    }
    
    // Destroy local session
    await destroySession('marketplace');
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
