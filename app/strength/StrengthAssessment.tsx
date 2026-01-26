'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Dumbbell, Scale, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  StrengthData,
  analyzeStrength,
  LIFT_INFO,
  LIFT_LABELS,
  formatGap,
  getGapColor,
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
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Lifts Entered</div>
              <div className="text-2xl font-bold text-white">
                {analysis.summary.totalLiftsEntered}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">At Top-15</div>
              <div className="text-2xl font-bold text-green-400">
                {analysis.summary.liftsAtTop15} / {analysis.summary.totalLiftsEntered}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">At Top-5</div>
              <div className="text-2xl font-bold text-purple-400">
                {analysis.summary.liftsAtTop5} / {analysis.summary.totalLiftsEntered}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Squat:BW</div>
              <div className="text-2xl font-bold text-orange-400">
                {analysis.liftGaps.back_squat
                  ? (analysis.liftGaps.back_squat.actual / athlete.weight).toFixed(2)
                  : '--'}x
              </div>
            </div>
          </div>

          {/* Target Bodyweight */}
          {analysis.bodyComp && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">Target Bodyweight</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Current</div>
                  <div className="text-lg font-bold text-white">{analysis.bodyComp.currentWeight} lb</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Elite Range</div>
                  <div className="text-lg font-bold text-white">
                    {analysis.bodyComp.targetLow}-{analysis.bodyComp.targetHigh} lb
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Gap</div>
                  <div className={`text-lg font-bold ${
                    Math.abs(analysis.bodyComp.gap) <= 5 ? 'text-green-400' :
                    analysis.bodyComp.gap > 0 ? 'text-orange-400' : 'text-blue-400'
                  }`}>
                    {analysis.bodyComp.gap > 0 ? '+' : ''}{analysis.bodyComp.gap} lb
                  </div>
                </div>
              </div>
              <div className={`text-sm p-2 rounded ${
                Math.abs(analysis.bodyComp.gap) <= 5 ? 'bg-green-500/10 text-green-400' :
                analysis.bodyComp.gap > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {analysis.bodyComp.note}
              </div>
            </div>
          )}

          {/* Lift Standards Table */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <div className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-4">
              Lift Standards vs Elite
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">LIFT</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">ACTUAL</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">TOP-15</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">GAP</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">TOP-5</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">GAP</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(LIFT_LABELS).map(([key, label]) => {
                    const gap = analysis.liftGaps[key];
                    if (!gap) return null;
                    return (
                      <tr key={key} className="border-b border-white/5">
                        <td className="py-2.5 px-2">
                          <span className="text-white font-medium">{label}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-white font-mono">
                          {gap.actual} lb
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-400 font-mono">
                          {gap.top15} lb
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-semibold" style={{ color: getGapColor(gap.gapTop15) }}>
                          {formatGap(gap.gapTop15)}
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-400 font-mono">
                          {gap.top5} lb
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-semibold" style={{ color: getGapColor(gap.gapTop5, true) }}>
                          {formatGap(gap.gapTop5)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Power Transfer Ratios */}
          {analysis.powerRatios.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-4">
                Power Transfer Ratios
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">RATIO</th>
                      <th className="text-center py-2 px-2 text-gray-500 font-medium">YOURS</th>
                      <th className="text-center py-2 px-2 text-gray-500 font-medium">ELITE</th>
                      <th className="text-center py-2 px-2 text-gray-500 font-medium">DIFF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.powerRatios.map((ratio) => {
                      if (ratio.athleteRatio === null) return null;
                      return (
                        <tr key={ratio.key} className="border-b border-white/5">
                          <td className="py-2.5 px-2">
                            <span className="text-white font-medium">{ratio.name}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center text-white font-mono">
                            {(ratio.athleteRatio * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-2 text-center text-gray-400 font-mono">
                            {(ratio.eliteRatio * 100).toFixed(1)}%
                          </td>
                          <td className={`py-2.5 px-2 text-center font-mono font-semibold ${
                            ratio.isGood ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {ratio.difference !== null && ratio.difference >= 0 ? '+' : ''}
                            {ratio.difference !== null ? (ratio.difference * 100).toFixed(1) : '--'}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Training Priorities */}
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
                  <div
                    key={priority.liftKey}
                    className={`p-3 rounded-lg ${
                      priority.rank === 1
                        ? 'bg-orange-500/10 border-2 border-orange-500/50'
                        : 'bg-red-500/5 border border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                          priority.rank === 1 ? 'bg-orange-500' : 'bg-red-500'
                        }`}>
                          {priority.rank}
                        </span>
                        <span className="text-white font-medium">
                          {priority.lift}
                          {priority.gap15 > 0 && (
                            <span className="text-red-400 ml-2">+{Math.round(priority.gap15)} lb</span>
                          )}
                        </span>
                      </div>
                      {priority.ratioPenalty > 0 && (
                        <span className="text-xs text-purple-400">
                          Ratio: -{(priority.ratioPenalty / 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 ml-8">{priority.rationale}</p>
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
