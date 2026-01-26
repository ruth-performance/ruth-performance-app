import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail, upsertAssessmentProfile, tryAutoLinkToCoachCommand } from '@/lib/assessment-profile';
import { saveConditioningAssessment, getLatestConditioningAssessment } from '@/lib/assessments/conditioning';
import { analyzeConditioning, parseTime } from '@/lib/conditioning-data';

// Google Sheets imports - kept for reference/rollback
// import { saveSheetData, ensureSheetHeaders, getSheetData } from '@/lib/sheets';
// const CONDITIONING_HEADERS = ['email', 'conditioningData', 'completedAt', 'updatedAt'];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { email, conditioningData, athleteData } = await request.json();

    // Ensure email matches authenticated user
    if (email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get athlete info for analysis
    const gender = athleteData?.gender || 'male';
    const weightLbs = athleteData?.weight || null;
    const heightInches = athleteData?.height || null;
    const competitionTier = athleteData?.competitionTier || 'open';

    // Get or create assessment profile in Supabase
    let profile = await getProfileByEmail(email);
    if (!profile) {
      profile = await upsertAssessmentProfile({
        email: email,
        gender: gender,
        weight_lbs: weightLbs,
        height_inches: heightInches,
        competition_tier: competitionTier,
      });
      // Try to auto-link to Coach Command if the athlete exists there
      await tryAutoLinkToCoachCommand(profile.id, email);
    }

    // Analyze conditioning data to extract metrics
    const analysis = analyzeConditioning(conditioningData, gender, weightLbs, heightInches);

    // Save to Supabase
    const assessment = await saveConditioningAssessment({
      profileId: profile.id,

      // Echo Bike metrics
      echo10minCals: analysis.echo.cals ?? undefined,
      echoCalPerLb: analysis.echo.calPerLb ?? undefined,
      echoPowerRating: analysis.echo.powerRating ?? undefined,
      echoPowerPctElite: analysis.echo.powerPctOfElite ?? undefined,
      echoAssessment: analysis.echo.assessment || undefined,
      echoIsPriority: analysis.echo.priority,

      // Row metrics (times in seconds)
      row500mTime: parseTime(conditioningData.row500) ?? undefined,
      row1000mTime: parseTime(conditioningData.row1000) ?? undefined,
      row2000mTime: parseTime(conditioningData.row2000) ?? undefined,
      row5000mTime: parseTime(conditioningData.row5000) ?? undefined,
      rowCpWatts: analysis.row.cpWatts ?? undefined,
      rowCpPace: analysis.row.cpPace ?? undefined,

      // Run metrics (times in seconds)
      run400mTime: parseTime(conditioningData.run400) ?? undefined,
      runMileTime: parseTime(conditioningData.runMile) ?? undefined,
      run5kTime: parseTime(conditioningData.run5k) ?? undefined,
      run10kTime: parseTime(conditioningData.run10k) ?? undefined,
      runCvPace: analysis.run.cvPace ?? undefined,

      // Training zones
      rowZones: analysis.row.zones.length > 0 ? analysis.row.zones : undefined,
      runZones: analysis.run.zones.length > 0 ? analysis.run.zones : undefined,

      // Raw data for reference
      rawData: conditioningData,
    });

    // Google Sheets backup - commented out, can uncomment for dual-write during transition
    // await ensureSheetHeaders('conditioning', CONDITIONING_HEADERS);
    // await saveSheetData('conditioning', email, {
    //   conditioningData: JSON.stringify(conditioningData),
    //   completedAt: new Date().toISOString(),
    // });

    return NextResponse.json({ success: true, assessmentId: assessment.id });
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
    // Get profile from Supabase
    const profile = await getProfileByEmail(user.email);

    if (!profile) {
      return NextResponse.json({ conditioningData: null });
    }

    // Get latest conditioning assessment
    const assessment = await getLatestConditioningAssessment(profile.id);

    if (assessment && assessment.raw_data) {
      return NextResponse.json({
        conditioningData: assessment.raw_data,
        completedAt: assessment.created_at,
        assessmentId: assessment.id,
      });
    }

    // Fallback to Google Sheets if no Supabase data - for migration period
    // const data = await getSheetData('conditioning', user.email);
    // if (data && data.conditioningData) {
    //   return NextResponse.json({
    //     conditioningData: JSON.parse(data.conditioningData),
    //     completedAt: data.completedAt,
    //     updatedAt: data.updatedAt,
    //   });
    // }

    return NextResponse.json({ conditioningData: null });
  } catch (error) {
    console.error('Conditioning fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
