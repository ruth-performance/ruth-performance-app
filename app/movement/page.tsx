import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAthlete, getSheetData } from '@/lib/sheets';
import Navbar from '@/components/Navbar';
import MovementAssessment from './MovementAssessment';
import { MovementData } from '@/lib/movement-data';

export default async function MovementPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const athlete = await getAthlete(user.email);
  
  // Check if athlete has required profile data
  if (!athlete?.gender) {
    redirect('/profile?message=Please complete your profile first');
  }

  // Try to load existing movement data
  let existingData: MovementData | undefined;
  try {
    const savedData = await getSheetData('movement', user.email);
    if (savedData && savedData.movementData) {
      existingData = JSON.parse(savedData.movementData);
    }
  } catch (err) {
    // No existing data, that's fine
  }

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={athlete?.name || user.name} />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MovementAssessment 
          athlete={{
            email: user.email,
            name: athlete?.name || user.name || '',
            gender: athlete?.gender as 'male' | 'female' | undefined,
            weight: athlete?.weight,
            competitionTier: athlete?.competitionTier,
          }}
          existingData={existingData}
        />
      </main>
    </div>
  );
}
