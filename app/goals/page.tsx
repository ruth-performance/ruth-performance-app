import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail } from '@/lib/assessment-profile';
import { getLatestGoalsAssessment } from '@/lib/assessments/goals';
import Navbar from '@/components/Navbar';
import GoalsAssessment from './GoalsAssessment';
import { GoalsData } from '@/lib/goals-data';

export default async function GoalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get profile from Supabase
  const profile = await getProfileByEmail(user.email);

  // If no profile, redirect to profile page
  if (!profile) {
    redirect('/profile');
  }

  // Get existing goals assessment data
  let existingData: GoalsData | undefined;
  try {
    const assessment = await getLatestGoalsAssessment(profile.id);
    if (assessment?.raw_data) {
      existingData = assessment.raw_data as unknown as GoalsData;
    }
  } catch {
    // No existing data
  }

  const athlete = {
    email: user.email,
    name: profile.name || user.name || 'Athlete',
  };

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={athlete.name} />
      <main>
        <GoalsAssessment athlete={athlete} existingData={existingData} />
      </main>
    </div>
  );
}
