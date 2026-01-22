import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAthlete } from '@/lib/sheets';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get full athlete data from sheets
  const athlete = await getAthlete(user.email);

  return NextResponse.json({
    email: user.email,
    name: user.name || athlete?.name,
    athlete,
  });
}
