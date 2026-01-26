import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail } from '@/lib/assessment-profile';
import { getLatestMovementAssessment } from '@/lib/assessments/movement';
import { getLatestConditioningAssessment } from '@/lib/assessments/conditioning';
import { getLatestStrengthAssessment } from '@/lib/assessments/strength';
import Navbar from '@/components/Navbar';
import ModuleCard from '@/components/ModuleCard';
import {
  Move,
  Dumbbell,
  Zap,
  Target,
  Trophy,
  User,
  TrendingUp
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfileByEmail(user.email);

  // Convert Supabase profile to display format
  const athlete = profile ? {
    name: profile.name,
    gender: profile.gender,
    weight: profile.weight_lbs,
    height: profile.height_inches,
    competitionTier: profile.competition_tier,
  } : null;

  // Check which assessments are completed (only if profile exists)
  let movementComplete = false;
  let strengthComplete = false;
  let conditioningComplete = false;
  const fitnessComplete = false; // Not yet implemented
  const goalsComplete = false; // Not yet implemented

  if (profile) {
    const [movementData, strengthData, conditioningData] = await Promise.all([
      getLatestMovementAssessment(profile.id).catch(() => null),
      getLatestStrengthAssessment(profile.id).catch(() => null),
      getLatestConditioningAssessment(profile.id).catch(() => null),
    ]);

    movementComplete = !!movementData;
    strengthComplete = !!strengthData;
    conditioningComplete = !!conditioningData;
  }
  
  const completedCount = [movementComplete, strengthComplete, conditioningComplete, fitnessComplete, goalsComplete].filter(Boolean).length;

  const modules = [
    {
      title: 'Assess My Movement',
      description: 'Rate your confidence across Basic CF, Gymnastics, Dumbbell, and Barbell movements to identify skill gaps.',
      href: '/movement',
      icon: Move,
      accentColor: 'from-violet-500 to-purple-500',
      status: movementComplete ? 'completed' as const : 'not_started' as const,
    },
    {
      title: 'Assess My Strength',
      description: 'Compare your lifts to elite benchmarks, analyze power ratios, and discover training priorities.',
      href: '/strength',
      icon: Dumbbell,
      accentColor: 'from-orange-500 to-red-500',
      status: strengthComplete ? 'completed' as const : 'not_started' as const,
    },
    {
      title: 'Assess My Conditioning',
      description: 'Analyze your speed curves for Echo Bike, Rowing, and Running to find your critical power thresholds.',
      href: '/conditioning',
      icon: Zap,
      accentColor: 'from-cyan-500 to-emerald-500',
      status: conditioningComplete ? 'completed' as const : 'not_started' as const,
    },
    {
      title: 'Test My Fitness',
      description: 'Complete tiered testing from Open to Games level to identify limiters and athlete profile type.',
      href: '/fitness',
      icon: Trophy,
      accentColor: 'from-blue-500 to-indigo-500',
      status: fitnessComplete ? 'completed' as const : 'not_started' as const,
    },
    {
      title: 'Set My Goals',
      description: 'Align your training with your values, assess mental skills, and define meaningful outcome goals.',
      href: '/goals',
      icon: Target,
      accentColor: 'from-pink-500 to-rose-500',
      status: goalsComplete ? 'completed' as const : 'not_started' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-ruth-dark">
      <Navbar userName={athlete?.name || user.name} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-gradient">{athlete?.name || user.name || 'Athlete'}</span>
          </h1>
          <p className="text-gray-400">
            Complete your assessments to get a comprehensive view of your athletic profile.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-ruth-card border border-ruth-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Tier</p>
                <p className="text-white font-semibold capitalize">
                  {athlete?.competitionTier || 'Not Set'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-ruth-card border border-ruth-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Assessments</p>
                <p className="text-white font-semibold">{completedCount} / 5</p>
              </div>
            </div>
          </div>
          
          <div className="bg-ruth-card border border-ruth-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Weight</p>
                <p className="text-white font-semibold">
                  {athlete?.weight ? `${athlete.weight} lbs` : 'Not Set'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-ruth-card border border-ruth-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Gender</p>
                <p className="text-white font-semibold capitalize">
                  {athlete?.gender || 'Not Set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Assessment Modules</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard key={module.href} {...module} />
          ))}
        </div>

        {/* Profile Setup CTA */}
        {(!athlete?.weight || !athlete?.gender || !athlete?.competitionTier) && (
          <div className="mt-8 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-ruth-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-ruth flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Complete Your Profile</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Add your weight, height, and competition tier to get personalized benchmarks and recommendations.
                </p>
                <a
                  href="/profile"
                  className="inline-flex items-center px-4 py-2 bg-gradient-ruth text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Update Profile
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
