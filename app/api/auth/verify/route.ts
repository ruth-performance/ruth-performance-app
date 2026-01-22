import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, createToken } from '@/lib/auth';
import { upsertAthlete } from '@/lib/sheets';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const name = searchParams.get('name') || '';

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/login?error=missing_token`);
  }

  const payload = verifyMagicLinkToken(token);
  
  if (!payload) {
    return NextResponse.redirect(`${BASE_URL}/login?error=invalid_token`);
  }

  // Create or update athlete in sheets
  await upsertAthlete({
    email: payload.email,
    name: name || payload.email.split('@')[0],
  });

  // Create session token
  const sessionToken = createToken({ 
    email: payload.email, 
    name: name || payload.email.split('@')[0] 
  });

  // Set cookie and redirect to dashboard
  const response = NextResponse.redirect(`${BASE_URL}/dashboard`);
  response.cookies.set('auth_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
