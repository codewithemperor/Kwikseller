import { NextResponse } from 'next/server';
import { 
  getSession, 
  createSession, 
  destroySession, 
  type SessionUser 
} from '@kwikseller/utils/session';

// GET - Get current session
export async function GET() {
  try {
    const session = await getSession('marketplace');
    
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({
        success: true,
        data: {
          isLoggedIn: false,
          user: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isLoggedIn: true,
        user: session.user,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

// POST - Create session (login)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user, accessToken, refreshToken } = body;

    if (!user || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Missing user data or tokens' },
        { status: 400 }
      );
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      profile: user.profile,
      store: user.store,
      subscription: user.subscription,
      permissions: user.permissions,
      accessToken,
      refreshToken,
    };

    await createSession(sessionUser, 'marketplace');

    return NextResponse.json({
      success: true,
      data: {
        isLoggedIn: true,
        user: sessionUser,
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// DELETE - Destroy session (logout)
export async function DELETE() {
  try {
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
