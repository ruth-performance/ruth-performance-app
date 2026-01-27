import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { getProfileByEmail } from '@/lib/assessment-profile';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    // Get user credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('user_credentials')
      .select('email, password_hash')
      .eq('email', normalizedEmail)
      .single();

    if (credentialsError || !credentials) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, credentials.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get profile to get the name
    const profile = await getProfileByEmail(normalizedEmail);
    const name = profile?.name || normalizedEmail.split('@')[0];

    // Create session token
    const sessionToken = createToken({
      email: normalizedEmail,
      name,
    });

    // Return success with session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
