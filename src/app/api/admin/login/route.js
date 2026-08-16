import { signAdminToken } from '../../../../lib/auth.js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      console.error('[Admin Login] ADMIN_PASSWORD environment variable is not set.');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    if (password === correctPassword) {
      // Set secure cookie
      const cookieStore = await cookies();
      cookieStore.set('admin_session', await signAdminToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Incorrect Master Password' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
