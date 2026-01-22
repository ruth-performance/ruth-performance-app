import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAthlete } from '@/lib/sheets';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export default async function GoalsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const athlete = await getAthlete(user.email);

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={athlete?.name || user.name} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-ruth-card border border-ruth-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-ruth flex items-center justify-center">
            <Construction className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Goals Assessment
          </h1>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            This module is coming soon. We're integrating the goals assessment into the unified platform.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-gradient-ruth text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Return to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
