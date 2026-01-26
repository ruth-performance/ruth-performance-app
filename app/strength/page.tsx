import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail } from '@/lib/assessment-profile';
import { getLatestStrengthAssessment } from '@/lib/assessments/strength';
import Navbar from '@/components/Navbar';
import StrengthAssessment from './StrengthAssessment';
import { StrengthData } from '@/lib/strength-data';

export default async function StrengthPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfileByEmail(user.email);

  // Check if athlete has required profile data (gender and weight needed for strength calculations)
  if (!profile?.gender || !profile?.weight_lbs) {
    redirect('/profile?message=Please complete your profile first (gender and weight required)');
  }

  // Try to load existing strength data from Supabase
  let existingData: StrengthData | undefined;
  try {
    const savedAssessment = await getLatestStrengthAssessment(profile.id);
    if (savedAssessment?.raw_data) {
      existingData = savedAssessment.raw_data as StrengthData;
    }
  } catch {
    // No existing data, that's fine
  }

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={profile.name || user.name} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StrengthAssessment
          athlete={{
            email: user.email,
            name: profile.name || user.name || '',
            gender: profile.gender as 'male' | 'female',
            weight: profile.weight_lbs,
            height: profile.height_inches,
            competitionTier: profile.competition_tier,
          }}
          existingData={existingData}
        />
      </main>
    </div>
  );
}
