import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail } from '@/lib/assessment-profile';
import { getLatestConditioningAssessment } from '@/lib/assessments/conditioning';
import Navbar from '@/components/Navbar';
import ConditioningAssessment from './ConditioningAssessment';
import { ConditioningData } from '@/lib/conditioning-data';

export default async function ConditioningPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfileByEmail(user.email);

  // Check if athlete has required profile data
  if (!profile?.gender || !profile?.weight_lbs) {
    redirect('/profile?message=Please complete your profile first (gender and weight required)');
  }

  // Try to load existing conditioning data from Supabase
  let existingData: ConditioningData | undefined;
  try {
    const savedAssessment = await getLatestConditioningAssessment(profile.id);
    if (savedAssessment?.raw_data) {
      existingData = savedAssessment.raw_data as ConditioningData;
    }
  } catch {
    // No existing data, that's fine
  }

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={profile.name || user.name} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConditioningAssessment
          athlete={{
            email: user.email,
            name: profile.name || user.name || '',
            gender: profile.gender as 'male' | 'female',
            weight: profile.weight_lbs,
            height: profile.height_inches,
          }}
          existingData={existingData}
        />
      </main>
    </div>
  );
}
