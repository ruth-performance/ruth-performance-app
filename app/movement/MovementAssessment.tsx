'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { 
  MOVEMENTS, 
  MovementData, 
  Step,
  BasicMovementData,
  DBMovementData,
  BarbellMovementData,
} from '@/lib/movement-data';
import { ProgressBar, NavButtons, SubcategoryHeader, Toggle } from './components/ui';
import { BasicGymnasticsCard } from './components/BasicGymnasticsCard';
import { DBCard } from './components/DBCard';
import { BarbellCard } from './components/BarbellCard';
import { ReviewPage } from './components/ReviewPage';

interface AthleteProfile {
  email: string;
  name: string;
  gender?: 'male' | 'female';
  weight?: number;
  competitionTier?: string;
}

interface MovementAssessmentProps {
  athlete: AthleteProfile;
  existingData?: MovementData;
}

export default function MovementAssessment({ athlete, existingData }: MovementAssessmentProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('Basic CF');
  const [movementData, setMovementData] = useState<MovementData>(existingData || {});
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-save to localStorage as backup
  useEffect(() => {
    localStorage.setItem('movement-assessment-draft', JSON.stringify(movementData));
  }, [movementData]);

  // Load from localStorage on mount if no existing data
  useEffect(() => {
    if (!existingData) {
      const saved = localStorage.getItem('movement-assessment-draft');
      if (saved) {
        try {
          setMovementData(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  const handleMovementChange = (id: string, data: BasicMovementData | DBMovementData | BarbellMovementData) => {
    setMovementData(prev => ({ ...prev, [id]: data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: athlete.email,
          movementData,
        }),
      });

      if (res.ok) {
        localStorage.removeItem('movement-assessment-draft');
        setShowSuccess(true);
      } else {
        alert('Failed to save assessment. Please try again.');
      }
    } catch (err) {
      alert('Failed to save assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gender = athlete.gender || 'male';
  const competitionTier = athlete.competitionTier || 'Rx';

  // Success screen
  if (showSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Assessment Saved!</h1>
        <p className="text-gray-400 mb-8">
          Your movement assessment has been saved successfully.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl text-gray-900 font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => {
              setShowSuccess(false);
              setStep('Review');
            }}
            className="px-6 py-3 border border-white/20 rounded-xl text-white font-medium hover:border-white/40 transition-colors"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Movement Assessment</h1>
        <p className="text-gray-400 text-sm">
          Rate your proficiency across all movement categories
        </p>
      </div>

      {/* Progress */}
      <ProgressBar currentStep={step} />

      {/* Step Content */}
      {step === 'Basic CF' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-white">Basic CF</h2>
            <span 
              className="text-[11px] px-2 py-0.5 rounded"
              style={{ background: `${MOVEMENTS.BasicCF.color}20`, color: MOVEMENTS.BasicCF.color }}
            >
              {MOVEMENTS.BasicCF.label}
            </span>
          </div>
          
          {Object.entries(MOVEMENTS.BasicCF.subcategories).map(([subName, movements]) => (
            <div key={subName}>
              <SubcategoryHeader color={MOVEMENTS.BasicCF.color}>{subName}</SubcategoryHeader>
              {movements.map(m => (
                <BasicGymnasticsCard
                  key={m.id}
                  movement={m}
                  categoryColor={MOVEMENTS.BasicCF.color}
                  data={(movementData[m.id] as BasicMovementData) || {}}
                  onChange={handleMovementChange}
                />
              ))}
            </div>
          ))}

          <NavButtons
            onNext={() => setStep('Gymnastics')}
            nextLabel="Next: Gymnastics →"
          />
        </div>
      )}

      {step === 'Gymnastics' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-white">Gymnastics</h2>
            <span 
              className="text-[11px] px-2 py-0.5 rounded"
              style={{ background: `${MOVEMENTS.Gymnastics.color}20`, color: MOVEMENTS.Gymnastics.color }}
            >
              {MOVEMENTS.Gymnastics.label}
            </span>
          </div>
          
          {Object.entries(MOVEMENTS.Gymnastics.subcategories).map(([subName, movements]) => (
            <div key={subName}>
              <SubcategoryHeader color={MOVEMENTS.Gymnastics.color}>{subName}</SubcategoryHeader>
              {movements.map(m => (
                <BasicGymnasticsCard
                  key={m.id}
                  movement={m}
                  categoryColor={MOVEMENTS.Gymnastics.color}
                  data={(movementData[m.id] as BasicMovementData) || {}}
                  onChange={handleMovementChange}
                />
              ))}
            </div>
          ))}

          <NavButtons
            onBack={() => setStep('Basic CF')}
            onNext={() => setStep('Dumbbell')}
            nextLabel="Next: Dumbbell →"
          />
        </div>
      )}

      {step === 'Dumbbell' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Dumbbell</h2>
              <span 
                className="text-[11px] px-2 py-0.5 rounded"
                style={{ background: `${MOVEMENTS.DB.color}20`, color: MOVEMENTS.DB.color }}
              >
                {MOVEMENTS.DB.label}
              </span>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-400">
              Rate your proficiency at each loading zone based on your gender ({gender}).
              <br />
              <span className="text-emerald-400">Light:</span> {MOVEMENTS.DB.loadingZones![gender].light}# | 
              <span className="text-cyan-400"> Moderate:</span> {MOVEMENTS.DB.loadingZones![gender].moderate}# | 
              <span className="text-amber-400"> Heavy:</span> {MOVEMENTS.DB.loadingZones![gender].heavy}#
            </p>
          </div>
          
          {MOVEMENTS.DB.movements.map(m => (
            <DBCard
              key={m.id}
              movement={m}
              gender={gender}
              data={(movementData[m.id] as DBMovementData) || {}}
              onChange={handleMovementChange}
            />
          ))}

          <NavButtons
            onBack={() => setStep('Gymnastics')}
            onNext={() => setStep('Barbell')}
            nextLabel="Next: Barbell →"
          />
        </div>
      )}

      {step === 'Barbell' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Barbell</h2>
              <span 
                className="text-[11px] px-2 py-0.5 rounded"
                style={{ background: `${MOVEMENTS.Barbell.color}20`, color: MOVEMENTS.Barbell.color }}
              >
                {MOVEMENTS.Barbell.label}
              </span>
            </div>
            <Toggle
              options={[{ value: 'lbs', label: 'lbs' }, { value: 'kg', label: 'kg' }]}
              value={weightUnit}
              onChange={(v) => setWeightUnit(v as 'lbs' | 'kg')}
            />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-400">
              Drag the zone markers to set your personal loading thresholds, then rate your proficiency at each zone.
            </p>
          </div>
          
          {MOVEMENTS.Barbell.movements.map(m => (
            <BarbellCard
              key={m.id}
              movement={m}
              gender={gender}
              unit={weightUnit}
              data={(movementData[m.id] as BarbellMovementData) || {}}
              onChange={handleMovementChange}
            />
          ))}

          <NavButtons
            onBack={() => setStep('Dumbbell')}
            onNext={() => setStep('Review')}
            nextLabel="Review Assessment →"
          />
        </div>
      )}

      {step === 'Review' && (
        <ReviewPage
          movementData={movementData}
          competitionTier={competitionTier}
          onBack={() => setStep('Barbell')}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
