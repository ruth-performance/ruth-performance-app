import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail } from '@/lib/assessment-profile';
import { getLatestMovementAssessment } from '@/lib/assessments/movement';
import Navbar from '@/components/Navbar';
import MovementAssessment from './MovementAssessment';
import { MovementData } from '@/lib/movement-data';

export default async function MovementPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfileByEmail(user.email);

  // Check if athlete has required profile data
  if (!profile?.gender) {
    redirect('/profile?message=Please complete your profile first');
  }

  // Try to load existing movement data from Supabase
  let existingData: MovementData | undefined;
  try {
    const savedAssessment = await getLatestMovementAssessment(profile.id);
    if (savedAssessment?.raw_data) {
      existingData = savedAssessment.raw_data as MovementData;
    }
  } catch {
    // No existing data, that's fine
  }

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={profile.name || user.name} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MovementAssessment
          athlete={{
            email: user.email,
            name: profile.name || user.name || '',
            gender: profile.gender as 'male' | 'female' | undefined,
            weight: profile.weight_lbs,
            competitionTier: profile.competition_tier,
          }}
          existingData={existingData}
        />
      </main>
    </div>
  );
}
