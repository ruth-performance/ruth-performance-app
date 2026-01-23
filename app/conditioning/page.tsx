import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAthlete, getSheetData } from '@/lib/sheets';
import Navbar from '@/components/Navbar';
import ConditioningAssessment from './ConditioningAssessment';
import { ConditioningData } from '@/lib/conditioning-data';

export default async function ConditioningPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const athlete = await getAthlete(user.email);
  
  // Check if athlete has required profile data
  if (!athlete?.gender || !athlete?.weight) {
    redirect('/profile?message=Please complete your profile first (gender and weight required)');
  }

  // Try to load existing conditioning data
  let existingData: ConditioningData | undefined;
  try {
    const savedData = await getSheetData('conditioning', user.email);
    if (savedData && savedData.conditioningData) {
      existingData = JSON.parse(savedData.conditioningData);
    }
  } catch (err) {
    // No existing data, that's fine
  }

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={athlete?.name || user.name} />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConditioningAssessment 
          athlete={{
            email: user.email,
            name: athlete?.name || user.name || '',
            gender: athlete?.gender as 'male' | 'female',
            weight: athlete?.weight,
          }}
          existingData={existingData}
        />
      </main>
    </div>
  );
}
