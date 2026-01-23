import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { saveSheetData, ensureSheetHeaders, getSheetData } from '@/lib/sheets';

const CONDITIONING_HEADERS = [
  'email',
  'conditioningData',
  'completedAt',
  'updatedAt',
];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { email, conditioningData } = await request.json();
    
    // Ensure email matches authenticated user
    if (email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Ensure headers exist
    await ensureSheetHeaders('conditioning', CONDITIONING_HEADERS);

    // Save conditioning data as JSON string
    const success = await saveSheetData('conditioning', email, {
      conditioningData: JSON.stringify(conditioningData),
      completedAt: new Date().toISOString(),
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to save conditioning data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Conditioning save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = await getSheetData('conditioning', user.email);
    
    if (data && data.conditioningData) {
      return NextResponse.json({
        conditioningData: JSON.parse(data.conditioningData),
        completedAt: data.completedAt,
        updatedAt: data.updatedAt,
      });
    }
    
    return NextResponse.json({ conditioningData: null });
  } catch (error) {
    console.error('Conditioning fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
