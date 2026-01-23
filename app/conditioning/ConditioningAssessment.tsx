'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Bike, Ship, PersonStanding } from 'lucide-react';
import { 
  ConditioningData, 
  analyzeConditioning, 
  formatTime 
} from '@/lib/conditioning-data';
import { 
  TimeInput, 
  NumberInput, 
  MetricCard, 
  ZoneTable, 
  AssessmentBanner, 
  Card, 
  ToggleButtons,
  SectionHeader
} from './components/ui';

interface AthleteProfile {
  email: string;
  name: string;
  gender: 'male' | 'female';
  weight?: number;
  height?: number;
}

interface ConditioningAssessmentProps {
  athlete: AthleteProfile;
  existingData?: ConditioningData;
}

type View = 'input' | 'results';

export default function ConditioningAssessment({ athlete, existingData }: ConditioningAssessmentProps) {
  const [view, setView] = useState<View>('input');
  const [runPaceUnit, setRunPaceUnit] = useState<'mile' | 'km'>('mile');
  const [rowDisplayUnit, setRowDisplayUnit] = useState<'pace' | 'calhr'>('pace');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [data, setData] = useState<ConditioningData>(existingData || {
    echo10min: '',
    row500: '',
    row1000: '',
    row2000: '',
    row5000: '',
    run400: '',
    runMile: '',
    run5k: '',
    run10k: '',
  });

  // Auto-save to localStorage as backup
  useEffect(() => {
    localStorage.setItem('conditioning-assessment-draft', JSON.stringify(data));
  }, [data]);

  // Load from localStorage on mount if no existing data
  useEffect(() => {
    if (!existingData) {
      const saved = localStorage.getItem('conditioning-assessment-draft');
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  const handleChange = (field: keyof ConditioningData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate analysis
  const analysis = useMemo(() => {
    return analyzeConditioning(data, athlete.gender, athlete.weight || null, athlete.height || null);
  }, [data, athlete.gender, athlete.weight, athlete.height]);

  const hasEchoData = !!data.echo10min;
  const hasRowData = !!(data.row500 || data.row2000 || data.row5000);
  const hasRunData = !!(data.run400 || data.runMile || data.run5k);
  const hasAnyData = hasEchoData || hasRowData || hasRunData;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/conditioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: athlete.email,
          conditioningData: data,
        }),
      });

      if (res.ok) {
        localStorage.removeItem('conditioning-assessment-draft');
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

  // Success screen
  if (showSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Assessment Saved!</h1>
        <p className="text-gray-400 mb-8">
          Your conditioning assessment has been saved successfully.
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
          <h1 className="text-2xl font-bold text-white mb-1">Conditioning Assessment</h1>
          <p className="text-gray-400 text-sm">
            Enter your time trials to calculate training zones
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-black/30 rounded-lg p-1">
          <button
            onClick={() => setView('input')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'input' 
                ? 'bg-cyan-500/20 text-cyan-400' 
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
                ? 'bg-cyan-500/20 text-cyan-400' 
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
          {/* Echo Bike Section */}
          <Card>
            <SectionHeader 
              title="Echo Bike" 
              color="#ff6b6b"
              icon={<Bike className="w-4 h-4 text-red-400" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput
                label="10-Minute Max Cals"
                value={data.echo10min || ''}
                onChange={(v) => handleChange('echo10min', v)}
                placeholder="e.g., 180"
                unit="cals"
              />
              <div className="flex items-end">
                <div className="text-xs text-gray-500">
                  Your bodyweight: <span className="text-white font-medium">{athlete.weight || '--'} lbs</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Row Section */}
          <Card>
            <SectionHeader 
              title="Row" 
              color="#4ecdc4"
              icon={<Ship className="w-4 h-4 text-cyan-400" />}
            />
            <p className="text-xs text-gray-500 mb-4">
              Enter times in MM:SS format (e.g., 1:30 for 1 minute 30 seconds)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <TimeInput
                label="500m"
                value={data.row500 || ''}
                onChange={(v) => handleChange('row500', v)}
              />
              <TimeInput
                label="1,000m"
                value={data.row1000 || ''}
                onChange={(v) => handleChange('row1000', v)}
              />
              <TimeInput
                label="2,000m"
                value={data.row2000 || ''}
                onChange={(v) => handleChange('row2000', v)}
              />
              <TimeInput
                label="5,000m"
                value={data.row5000 || ''}
                onChange={(v) => handleChange('row5000', v)}
              />
            </div>
          </Card>

          {/* Run Section */}
          <Card>
            <SectionHeader 
              title="Run" 
              color="#eab308"
              icon={<PersonStanding className="w-4 h-4 text-yellow-400" />}
            />
            <p className="text-xs text-gray-500 mb-4">
              Enter times in MM:SS format
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <TimeInput
                label="400m"
                value={data.run400 || ''}
                onChange={(v) => handleChange('run400', v)}
              />
              <TimeInput
                label="Mile"
                value={data.runMile || ''}
                onChange={(v) => handleChange('runMile', v)}
              />
              <TimeInput
                label="5K"
                value={data.run5k || ''}
                onChange={(v) => handleChange('run5k', v)}
              />
              <TimeInput
                label="10K"
                value={data.run10k || ''}
                onChange={(v) => handleChange('run10k', v)}
              />
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setView('results')}
              disabled={!hasAnyData}
              className="flex-1 px-6 py-3 border border-white/20 rounded-xl text-white font-medium hover:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Analysis
            </button>
            <button
              onClick={handleSubmit}
              disabled={!hasAnyData || isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl text-gray-900 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* RESULTS VIEW */}
      {view === 'results' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Echo Power:Weight"
              value={analysis.echo.calPerLb?.toFixed(2) || '--'}
              unit="cal/lb"
              color="#ff6b6b"
            />
            <MetricCard
              label="Row CP"
              value={analysis.row.cpWatts?.toFixed(0) || '--'}
              unit={analysis.row.cpPace ? `watts (${formatTime(analysis.row.cpPace)}/500m)` : 'watts'}
              color="#4ecdc4"
            />
            <MetricCard
              label="Run CV Pace"
              value={analysis.run.cvPace ? formatTime(analysis.run.cvPace) : '--'}
              unit="per mile"
              color="#eab308"
            />
          </div>

          {/* Echo Assessment */}
          {analysis.echo.assessment && (
            <Card>
              <SectionHeader title="Echo Bike Analysis" color="#ff6b6b" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Raw Power</div>
                  <div className="text-xl font-bold text-white">
                    {analysis.echo.cals || '--'} <span className="text-sm text-gray-500">cals</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {analysis.echo.powerPctOfElite?.toFixed(0) || '--'}% of elite
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Power:Weight</div>
                  <div className="text-xl font-bold text-red-400">
                    {analysis.echo.calPerLb?.toFixed(2) || '--'} <span className="text-sm text-gray-500">cal/lb</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {analysis.echo.ratioPct?.toFixed(0) || '--'}% of elite ratio
                  </div>
                </div>
              </div>
              <AssessmentBanner 
                text={analysis.echo.assessment} 
                priority={analysis.echo.priority} 
              />
            </Card>
          )}

          {/* Row Training Zones */}
          {analysis.row.zones.length > 0 && (
            <div>
              <div className="flex justify-end mb-2">
                <ToggleButtons
                  options={[
                    { value: 'pace', label: 'PACE /500m' },
                    { value: 'calhr', label: 'CAL/HR' },
                  ]}
                  value={rowDisplayUnit}
                  onChange={(v) => setRowDisplayUnit(v as 'pace' | 'calhr')}
                  color="#4ecdc4"
                />
              </div>
              <ZoneTable
                zones={analysis.row.zones}
                title="Row Training Zones"
                paceLabel={rowDisplayUnit === 'calhr' ? 'CAL/HR' : 'PACE /500m'}
                color="#4ecdc4"
                isRow={true}
                rowDisplayUnit={rowDisplayUnit}
              />
            </div>
          )}

          {/* Run Training Zones */}
          {analysis.run.zones.length > 0 && (
            <div>
              <div className="flex justify-end mb-2">
                <ToggleButtons
                  options={[
                    { value: 'mile', label: '/MILE' },
                    { value: 'km', label: '/KM' },
                  ]}
                  value={runPaceUnit}
                  onChange={(v) => setRunPaceUnit(v as 'mile' | 'km')}
                  color="#eab308"
                />
              </div>
              <ZoneTable
                zones={analysis.run.zones}
                title={`Run Training Zones (per ${runPaceUnit})`}
                paceLabel={`PACE /${runPaceUnit.toUpperCase()}`}
                color="#eab308"
                isRun={true}
                paceUnit={runPaceUnit}
              />
            </div>
          )}

          {/* No Data Message */}
          {!hasAnyData && (
            <Card className="text-center py-8">
              <p className="text-gray-400">
                Enter your time trials in the Input tab to see your analysis.
              </p>
            </Card>
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
              disabled={!hasAnyData || isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl text-gray-900 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
