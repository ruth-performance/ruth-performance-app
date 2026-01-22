import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { saveSheetData, ensureSheetHeaders, getSheetData } from '@/lib/sheets';

// Ensure the movement sheet has proper headers
const MOVEMENT_HEADERS = [
  'email',
  'movementData',
  'completedAt',
  'updatedAt',
];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { email, movementData } = await request.json();
    
    // Ensure email matches authenticated user
    if (email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Ensure headers exist
    await ensureSheetHeaders('movement', MOVEMENT_HEADERS);

    // Save movement data as JSON string
    const success = await saveSheetData('movement', email, {
      movementData: JSON.stringify(movementData),
      completedAt: new Date().toISOString(),
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to save movement data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Movement save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = await getSheetData('movement', user.email);
    
    if (data && data.movementData) {
      return NextResponse.json({
        movementData: JSON.parse(data.movementData),
        completedAt: data.completedAt,
        updatedAt: data.updatedAt,
      });
    }
    
    return NextResponse.json({ movementData: null });
  } catch (error) {
    console.error('Movement fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
