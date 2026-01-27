import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { upsertAssessmentProfile } from '@/lib/assessment-profile';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = getSupabase();

    // Check if user already exists with a password
    const { data: existingUser } = await supabase
      .from('user_credentials')
      .select('email')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user credentials
    const { error: credentialsError } = await supabase
      .from('user_credentials')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      });

    if (credentialsError) {
      console.error('Error creating credentials:', credentialsError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create or update assessment profile
    await upsertAssessmentProfile({
      email: normalizedEmail,
      name: name.trim(),
    });

    // Create session token
    const sessionToken = createToken({
      email: normalizedEmail,
      name: name.trim(),
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
