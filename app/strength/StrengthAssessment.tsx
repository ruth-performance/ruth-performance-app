'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Dumbbell, Scale, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  StrengthData,
  analyzeStrength,
  LIFT_INFO,
  getAssessmentColor,
  getStatusColor,
  lbsToKg,
  kgToLbs,
} from '@/lib/strength-data';

interface AthleteProfile {
  email: string;
  name: string;
  gender: 'male' | 'female';
  weight: number;
  height?: number;
  competitionTier?: string;
}

interface StrengthAssessmentProps {
  athlete: AthleteProfile;
  existingData?: StrengthData;
}

type View = 'input' | 'results';
type Unit = 'lb' | 'kg';

export default function StrengthAssessment({ athlete, existingData }: StrengthAssessmentProps) {
  const [view, setView] = useState<View>('input');
  const [unit, setUnit] = useState<Unit>('lb');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [data, setData] = useState<StrengthData>(existingData || {
    backSquat: '',
    frontSquat: '',
    deadlift: '',
    clean: '',
    cleanAndJerk: '',
    snatch: '',
    strictPress: '',
    pushPress: '',
    benchPress: '',
  });

  // Auto-save to localStorage as backup
  useEffect(() => {
    localStorage.setItem('strength-assessment-draft', JSON.stringify(data));
  }, [data]);

  // Load from localStorage on mount if no existing data
  useEffect(() => {
    if (!existingData) {
      const saved = localStorage.getItem('strength-assessment-draft');
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch {
          // Invalid data, ignore
        }
      }
    }
  }, [existingData]);

  const handleChange = (field: keyof StrengthData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Convert display value based on unit
  const getDisplayValue = (lbValue: string): string => {
    if (!lbValue || unit === 'lb') return lbValue;
    const num = parseFloat(lbValue);
    if (isNaN(num)) return lbValue;
    return Math.round(lbsToKg(num)).toString();
  };

  // Convert input back to lbs for storage
  const handleInputChange = (field: keyof StrengthData, displayValue: string) => {
    if (unit === 'lb') {
      handleChange(field, displayValue);
    } else {
      const num = parseFloat(displayValue);
      if (isNaN(num) || displayValue === '') {
        handleChange(field, displayValue);
      } else {
        handleChange(field, Math.round(kgToLbs(num)).toString());
      }
    }
  };

  // Calculate analysis
  const analysis = useMemo(() => {
    return analyzeStrength(data, athlete.gender, athlete.weight, athlete.height);
  }, [data, athlete.gender, athlete.weight, athlete.height]);

  // Check if required fields are filled
  const hasRequiredFields = !!(data.backSquat && data.deadlift && data.clean && data.cleanAndJerk && data.snatch);
  const hasAnyData = Object.values(data).some(v => v && v.trim() !== '');

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: athlete.email,
          strengthData: data,
        }),
      });

      if (res.ok) {
        localStorage.removeItem('strength-assessment-draft');
        setShowSuccess(true);
      } else {
        alert('Failed to save assessment. Please try again.');
      }
    } catch {
      alert('Failed to save assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (showSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Assessment Saved!</h1>
        <p className="text-gray-400 mb-8">
          Your strength assessment has been saved successfully.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => {
              setShowSuccess(false);
              setView('results');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Strength Assessment</h1>
          <p className="text-gray-400 text-sm">
            Enter your 1RM lifts to analyze your strength profile
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-black/30 rounded-lg p-1">
          <button
            onClick={() => setView('input')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'input'
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Input
          </button>
          <button
            onClick={() => setView('results')}
            disabled={!hasAnyData}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'results'
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-gray-500 hover:text-gray-300 disabled:opacity-50'
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {/* INPUT VIEW */}
      {view === 'input' && (
        <div className="space-y-6">
          {/* Unit Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Weight: <span className="text-white font-medium">{athlete.weight} lbs</span>
              {athlete.height && (
                <span className="ml-3">
                  Height: <span className="text-white font-medium">{athlete.height}&quot;</span>
                </span>
              )}
            </div>
            <div className="flex bg-black/30 rounded-md p-0.5">
              <button
                onClick={() => setUnit('lb')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  unit === 'lb' ? 'bg-orange-500 text-black' : 'text-gray-500'
                }`}
              >
                LB
              </button>
              <button
                onClick={() => setUnit('kg')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  unit === 'kg' ? 'bg-orange-500 text-black' : 'text-gray-500'
                }`}
              >
                KG
              </button>
            </div>
          </div>

          {/* Primary Lifts */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-orange-400" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400">
                Core Lifts (Required)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(['backSquat', 'deadlift', 'clean', 'cleanAndJerk', 'snatch'] as const).map((lift) => (
                <div key={lift}>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {LIFT_INFO[lift].name}
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={getDisplayValue(data[lift] || '')}
                      onChange={(e) => handleInputChange(lift, e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-orange-500/50 transition-colors pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Lifts */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                Additional Lifts (Optional)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(['frontSquat', 'strictPress', 'pushPress', 'benchPress'] as const).map((lift) => (
                <div key={lift}>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    {LIFT_INFO[lift].name}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={getDisplayValue(data[lift] || '')}
                      onChange={(e) => handleInputChange(lift, e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-blue-500/50 transition-colors pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setView('results')}
              disabled={!hasRequiredFields}
              className="flex-1 px-6 py-3 border border-white/20 rounded-xl text-white font-medium hover:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Analysis
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasRequiredFields || isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>

          {!hasRequiredFields && hasAnyData && (
            <p className="text-xs text-gray-500 text-center">
              Fill in all required fields (Back Squat, Deadlift, Clean, C&J, Snatch) to continue
            </p>
          )}
        </div>
      )}

      {/* RESULTS VIEW */}
      {view === 'results' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Avg vs Elite</div>
              <div className="text-2xl font-bold" style={{ color: getAssessmentColor(
                analysis.summary.avgEliteRatio >= 95 ? 'elite' :
                analysis.summary.avgEliteRatio >= 80 ? 'strong' :
                analysis.summary.avgEliteRatio >= 65 ? 'developing' : 'priority'
              )}}>
                {analysis.summary.avgEliteRatio}%
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Squat:BW</div>
              <div className="text-2xl font-bold text-orange-400">
                {analysis.lifts.backSquat?.bwRatio?.toFixed(2) || '--'}x
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Strongest</div>
              <div className="text-lg font-bold text-green-400 truncate">
                {analysis.summary.strongestLift || '--'}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Weakest</div>
              <div className="text-lg font-bold text-red-400 truncate">
                {analysis.summary.weakestLift || '--'}
              </div>
            </div>
          </div>

          {/* Body Composition */}
          {analysis.bodyComp && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">Body Composition</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-400 text-sm">Current: </span>
                  <span className="text-white font-medium">{analysis.bodyComp.currentWeight} lbs</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Elite Range: </span>
                  <span className="text-white font-medium">
                    {analysis.bodyComp.idealWeightRange.min}-{analysis.bodyComp.idealWeightRange.max} lbs
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  analysis.bodyComp.status === 'ideal' ? 'bg-green-500/20 text-green-400' :
                  analysis.bodyComp.status === 'under' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {analysis.bodyComp.status === 'ideal' ? 'Optimal' :
                   analysis.bodyComp.status === 'under' ? 'Below Range' : 'Above Range'}
                </span>
              </div>
            </div>
          )}

          {/* Lifts Table */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <div className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">
              Lift Analysis
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">LIFT</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">1RM</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">BW RATIO</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">VS ELITE</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.lifts).map(([key, lift]) => {
                    if (!lift.value) return null;
                    const info = LIFT_INFO[key];
                    return (
                      <tr key={key} className="border-b border-white/5">
                        <td className="py-2.5 px-2">
                          <span className="text-white font-medium">{info.name}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-white font-mono">
                          {lift.value} lb
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-300 font-mono">
                          {lift.bwRatio?.toFixed(2)}x
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-semibold" style={{ color: getAssessmentColor(lift.assessment) }}>
                          {lift.eliteRatio}%
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className="px-2 py-1 rounded text-[10px] font-semibold uppercase"
                            style={{
                              backgroundColor: `${getAssessmentColor(lift.assessment)}20`,
                              color: getAssessmentColor(lift.assessment),
                            }}
                          >
                            {lift.assessment}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Power Transfer Ratios */}
          {analysis.ratios.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">
                Power Transfer Ratios
              </div>
              <div className="space-y-3">
                {analysis.ratios.map((ratio) => (
                  <div key={ratio.name} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div>
                      <div className="text-white font-medium text-sm">{ratio.name}</div>
                      <div className="text-xs text-gray-500">
                        Ideal: {ratio.ideal} (range: {ratio.min}-{ratio.max})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold" style={{ color: getStatusColor(ratio.status) }}>
                        {ratio.actual?.toFixed(2)}
                      </div>
                      <div className="text-[10px] uppercase font-semibold" style={{ color: getStatusColor(ratio.status) }}>
                        {ratio.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priorities */}
          {analysis.priorities.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                  Training Priorities
                </span>
              </div>
              <div className="space-y-3">
                {analysis.priorities.map((priority) => (
                  <div key={priority.lift} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                          {priority.rank}
                        </span>
                        <span className="text-white font-medium">{priority.liftName}</span>
                      </div>
                      <span className="text-red-400 font-mono text-sm">
                        {priority.gap}% gap
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 ml-7">{priority.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Data Message */}
          {!hasAnyData && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-8 text-center">
              <p className="text-gray-400">
                Enter your lift numbers in the Input tab to see your analysis.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setView('input')}
              className="flex-1 px-6 py-3 border border-white/20 rounded-xl text-white font-medium hover:border-white/40 transition-colors"
            >
              ← Edit Data
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasRequiredFields || isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
