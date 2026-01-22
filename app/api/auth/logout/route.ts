import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(`${BASE_URL}/login`);
  response.cookies.delete('auth_token');
  return response;
}
