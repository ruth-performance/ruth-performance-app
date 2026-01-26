import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail } from '@/lib/assessment-profile';
import Navbar from '@/components/Navbar';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfileByEmail(user.email);

  // Convert Supabase profile to the format ProfileForm expects
  const athlete = profile ? {
    email: profile.email,
    name: profile.name,
    gender: profile.gender,
    weight: profile.weight_lbs,
    height: profile.height_inches,
    competitionTier: profile.competition_tier,
  } : null;

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={athlete?.name || user.name} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Athlete Profile</h1>
          <p className="text-gray-400">
            Update your profile to get personalized benchmarks and recommendations.
          </p>
        </div>

        <ProfileForm athlete={athlete} email={user.email} />
      </main>
    </div>
  );
}
