'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Heart,
  Target,
  Compass,
  Mountain,
  Repeat,
  Brain,
  Trophy,
  Plus,
  X,
  Star
} from 'lucide-react';
import {
  BRENE_VALUES,
  VALUES_QUESTIONS,
  MENTAL_SKILLS,
  FREQUENCY_OPTIONS,
  GoalsData,
  GoalsAnalysis,
  OutcomeGoal,
  ProcessGoal,
  MentalSkillRatings,
  createEmptyGoalsData,
  analyzeGoals,
  getSkillName
} from '@/lib/goals-data';

interface AthleteProfile {
  email: string;
  name: string;
}

interface GoalsAssessmentProps {
  athlete: AthleteProfile;
  existingData?: GoalsData;
}

type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1-6 = input phases, 7 = review

const PHASE_INFO = [
  { num: 1, title: 'Values Discovery', icon: Heart, description: 'Discover your core values' },
  { num: 2, title: 'Outcome Goals', icon: Target, description: 'Define what you want to achieve' },
  { num: 3, title: 'Value Alignment', icon: Compass, description: 'Connect goals to values' },
  { num: 4, title: 'Goal Breakdown', icon: Mountain, description: 'Set benchmarks & identify obstacles' },
  { num: 5, title: 'Process Goals', icon: Repeat, description: 'Create daily habits' },
  { num: 6, title: 'Mental Skills', icon: Brain, description: 'Assess your mental game' },
  { num: 7, title: 'Review', icon: Trophy, description: 'Your complete goal map' },
];

export default function GoalsAssessment({ athlete, existingData }: GoalsAssessmentProps) {
  const [phase, setPhase] = useState<Phase>(1);
  const [data, setData] = useState<GoalsData>(existingData || createEmptyGoalsData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('goals-assessment-draft', JSON.stringify(data));
  }, [data]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!existingData) {
      const saved = localStorage.getItem('goals-assessment-draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Ensure all required fields exist
          setData({ ...createEmptyGoalsData(), ...parsed });
        } catch {
          // Invalid data, ignore
        }
      }
    }
  }, [existingData]);

  // Analyze data
  const analysis = useMemo(() => analyzeGoals(data), [data]);

  // Navigation
  const canGoNext = () => {
    switch (phase) {
      case 1:
        return data.selectedValues.length >= 2 && data.selectedValues.length <= 5;
      case 2:
        return data.outcomeGoals.length >= 1 && data.outcomeGoals.every(g => g.goal.trim());
      case 3:
        return data.outcomeGoals.every(g => (data.valueAlignment[g.id]?.length || 0) >= 1);
      case 4:
        return data.outcomeGoals.every(g =>
          (data.performanceGoals[g.id]?.length || 0) >= 1 &&
          (data.obstacles[g.id]?.length || 0) >= 1
        );
      case 5:
        return data.processGoals.length >= 1 && data.processGoals.every(p => p.action.trim());
      case 6:
        return Object.values(data.mentalSkillRatings).every(r => r > 0);
      default:
        return true;
    }
  };

  const goNext = () => {
    if (phase < 7 && canGoNext()) {
      setPhase((phase + 1) as Phase);
    }
  };

  const goBack = () => {
    if (phase > 1) {
      setPhase((phase - 1) as Phase);
    }
  };

  // Save handler
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: athlete.email,
          goalsData: data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      localStorage.removeItem('goals-assessment-draft');
      setShowSuccess(true);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Value toggle
  const toggleValue = (value: string) => {
    setData(prev => {
      const values = prev.selectedValues.includes(value)
        ? prev.selectedValues.filter(v => v !== value)
        : [...prev.selectedValues, value];
      return { ...prev, selectedValues: values };
    });
  };

  // Outcome goal handlers
  const addOutcomeGoal = () => {
    if (data.outcomeGoals.length >= 3) return;
    const newGoal: OutcomeGoal = {
      id: `goal-${Date.now()}`,
      goal: '',
      date: '',
      why: ''
    };
    setData(prev => ({
      ...prev,
      outcomeGoals: [...prev.outcomeGoals, newGoal],
      valueAlignment: { ...prev.valueAlignment, [newGoal.id]: [] },
      valueExplanations: { ...prev.valueExplanations, [newGoal.id]: '' },
      performanceGoals: { ...prev.performanceGoals, [newGoal.id]: [''] },
      obstacles: { ...prev.obstacles, [newGoal.id]: [''] },
    }));
  };

  const removeOutcomeGoal = (id: string) => {
    setData(prev => {
      const outcomeGoals = prev.outcomeGoals.filter(g => g.id !== id);
      const { [id]: _va, ...valueAlignment } = prev.valueAlignment;
      const { [id]: _ve, ...valueExplanations } = prev.valueExplanations;
      const { [id]: _pg, ...performanceGoals } = prev.performanceGoals;
      const { [id]: _ob, ...obstacles } = prev.obstacles;
      return { ...prev, outcomeGoals, valueAlignment, valueExplanations, performanceGoals, obstacles };
    });
  };

  const updateOutcomeGoal = (id: string, field: keyof OutcomeGoal, value: string) => {
    setData(prev => ({
      ...prev,
      outcomeGoals: prev.outcomeGoals.map(g =>
        g.id === id ? { ...g, [field]: value } : g
      )
    }));
  };

  // Process goal handlers
  const addProcessGoal = () => {
    const newGoal: ProcessGoal = {
      id: `process-${Date.now()}`,
      action: '',
      frequency: 'daily',
      when: '',
      obstacle: ''
    };
    setData(prev => ({
      ...prev,
      processGoals: [...prev.processGoals, newGoal]
    }));
  };

  const removeProcessGoal = (id: string) => {
    setData(prev => ({
      ...prev,
      processGoals: prev.processGoals.filter(g => g.id !== id)
    }));
  };

  const updateProcessGoal = (id: string, field: keyof ProcessGoal, value: string) => {
    setData(prev => ({
      ...prev,
      processGoals: prev.processGoals.map(g =>
        g.id === id ? { ...g, [field]: value } : g
      )
    }));
  };

  // Get all obstacles for dropdown
  const allObstacles = useMemo(() => {
    const obs: string[] = [];
    for (const goalId of Object.keys(data.obstacles)) {
      obs.push(...(data.obstacles[goalId] || []).filter(o => o.trim()));
    }
    return obs;
  }, [data.obstacles]);

  // Success screen
  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Goals Assessment Complete!</h1>
        <p className="text-gray-400 mb-2">Your athlete type:</p>
        <p className="text-2xl font-semibold text-gradient mb-4">{analysis.athleteType.name}</p>
        <p className="text-gray-300 mb-8 max-w-md mx-auto">{analysis.athleteType.description}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-6 py-3 bg-gradient-ruth text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white">Goals Assessment</h1>
        <p className="text-gray-400">Align your training with your values and mental strengths</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {PHASE_INFO.map((p, idx) => {
            const Icon = p.icon;
            const isActive = phase === p.num;
            const isComplete = phase > p.num;
            return (
              <div key={p.num} className="flex items-center">
                <button
                  onClick={() => p.num <= phase && setPhase(p.num as Phase)}
                  disabled={p.num > phase}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-ruth text-white'
                      : isComplete
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-ruth-card text-gray-500 border border-ruth-border'
                  } ${p.num <= phase ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                >
                  {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </button>
                {idx < PHASE_INFO.length - 1 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 mx-1 ${
                      phase > p.num ? 'bg-emerald-500' : 'bg-ruth-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Phase {phase}: {PHASE_INFO[phase - 1].title}
          </p>
        </div>
      </div>

      {/* Phase Content */}
      <div className="bg-ruth-card border border-ruth-border rounded-2xl p-6 mb-6">
        {phase === 1 && (
          <Phase1Values
            data={data}
            setData={setData}
            toggleValue={toggleValue}
          />
        )}
        {phase === 2 && (
          <Phase2OutcomeGoals
            data={data}
            addGoal={addOutcomeGoal}
            removeGoal={removeOutcomeGoal}
            updateGoal={updateOutcomeGoal}
          />
        )}
        {phase === 3 && (
          <Phase3ValueAlignment
            data={data}
            setData={setData}
          />
        )}
        {phase === 4 && (
          <Phase4Breakdown
            data={data}
            setData={setData}
          />
        )}
        {phase === 5 && (
          <Phase5ProcessGoals
            data={data}
            addGoal={addProcessGoal}
            removeGoal={removeProcessGoal}
            updateGoal={updateProcessGoal}
            allObstacles={allObstacles}
          />
        )}
        {phase === 6 && (
          <Phase6MentalSkills
            data={data}
            setData={setData}
          />
        )}
        {phase === 7 && (
          <Phase7Review
            data={data}
            analysis={analysis}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={goBack}
          disabled={phase === 1}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            phase === 1
              ? 'bg-ruth-card text-gray-500 cursor-not-allowed'
              : 'bg-ruth-card text-white hover:bg-ruth-border'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {phase < 7 ? (
          <button
            onClick={goNext}
            disabled={!canGoNext()}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              canGoNext()
                ? 'bg-gradient-ruth text-white hover:opacity-90'
                : 'bg-ruth-card text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Assessment'}
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Phase 1: Values Discovery
// ============================================================================

function Phase1Values({
  data,
  setData,
  toggleValue
}: {
  data: GoalsData;
  setData: React.Dispatch<React.SetStateAction<GoalsData>>;
  toggleValue: (value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Values Discovery</h2>
      <p className="text-gray-400 mb-6">
        Reflect on what drives you, then select 2-5 core values that resonate most.
      </p>

      {/* Reflection Questions */}
      <div className="space-y-6 mb-8">
        {VALUES_QUESTIONS.map((q) => (
          <div key={q.id}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {q.question}
            </label>
            <textarea
              value={data.valuesReflections[q.id as keyof typeof data.valuesReflections]}
              onChange={(e) =>
                setData(prev => ({
                  ...prev,
                  valuesReflections: { ...prev.valuesReflections, [q.id]: e.target.value }
                }))
              }
              placeholder={q.placeholder}
              rows={3}
              className="w-full px-4 py-3 bg-ruth-dark border border-ruth-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            />
          </div>
        ))}
      </div>

      {/* Values Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white">Select Your Core Values</h3>
          <span
            className={`text-sm ${
              data.selectedValues.length < 2
                ? 'text-amber-400'
                : data.selectedValues.length > 5
                ? 'text-red-400'
                : 'text-emerald-400'
            }`}
          >
            {data.selectedValues.length} / 2-5 selected
          </span>
        </div>

        {/* Selected values tags */}
        {data.selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-ruth-dark rounded-lg">
            {data.selectedValues.map((value) => (
              <span
                key={value}
                onClick={() => toggleValue(value)}
                className="px-3 py-1 bg-gradient-ruth text-white text-sm rounded-full cursor-pointer hover:opacity-80 flex items-center gap-1"
              >
                {value}
                <X className="w-3 h-3" />
              </span>
            ))}
          </div>
        )}

        {/* Values grid */}
        <div className="max-h-64 overflow-y-auto p-3 bg-ruth-dark rounded-lg">
          <div className="flex flex-wrap gap-2">
            {BRENE_VALUES.map((value) => {
              const isSelected = data.selectedValues.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleValue(value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    isSelected
                      ? 'bg-gradient-ruth text-white border-transparent'
                      : 'bg-transparent text-gray-300 border-ruth-border hover:border-gray-500'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {data.selectedValues.length > 5 && (
        <p className="text-red-400 text-sm mt-2">
          Please select no more than 5 values to keep focus.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Phase 2: Outcome Goals
// ============================================================================

function Phase2OutcomeGoals({
  data,
  addGoal,
  removeGoal,
  updateGoal
}: {
  data: GoalsData;
  addGoal: () => void;
  removeGoal: (id: string) => void;
  updateGoal: (id: string, field: keyof OutcomeGoal, value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Outcome Goals</h2>
      <p className="text-gray-400 mb-6">
        Define 1-3 major goals you want to achieve. Be specific about the outcome.
      </p>

      <div className="space-y-6">
        {data.outcomeGoals.map((goal, index) => (
          <div key={goal.id} className="p-4 bg-ruth-dark rounded-xl border border-ruth-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Goal {index + 1}</h3>
              {data.outcomeGoals.length > 1 && (
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What&apos;s the outcome you want?
                </label>
                <input
                  type="text"
                  value={goal.goal}
                  onChange={(e) => updateGoal(goal.id, 'goal', e.target.value)}
                  placeholder="e.g., Qualify for CrossFit Games"
                  className="w-full px-4 py-3 bg-ruth-card border border-ruth-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target date
                </label>
                <input
                  type="text"
                  value={goal.date}
                  onChange={(e) => updateGoal(goal.id, 'date', e.target.value)}
                  placeholder="e.g., October 2026"
                  className="w-full px-4 py-3 bg-ruth-card border border-ruth-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Why is this important to you?
                </label>
                <textarea
                  value={goal.why}
                  onChange={(e) => updateGoal(goal.id, 'why', e.target.value)}
                  placeholder="Describe your motivation..."
                  rows={3}
                  className="w-full px-4 py-3 bg-ruth-card border border-ruth-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.outcomeGoals.length < 3 && (
        <button
          onClick={addGoal}
          className="mt-4 w-full py-3 border-2 border-dashed border-ruth-border rounded-xl text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Another Goal
        </button>
      )}

      {data.outcomeGoals.length === 0 && (
        <button
          onClick={addGoal}
          className="mt-4 w-full py-4 bg-gradient-ruth text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Your First Goal
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Phase 3: Value Alignment
// ============================================================================

function Phase3ValueAlignment({
  data,
  setData
}: {
  data: GoalsData;
  setData: React.Dispatch<React.SetStateAction<GoalsData>>;
}) {
  const toggleValueForGoal = (goalId: string, value: string) => {
    setData(prev => {
      const current = prev.valueAlignment[goalId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return {
        ...prev,
        valueAlignment: { ...prev.valueAlignment, [goalId]: updated }
      };
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Value Alignment</h2>
      <p className="text-gray-400 mb-6">
        Connect each goal to your values. Which values does each goal serve?
      </p>

      <div className="space-y-8">
        {data.outcomeGoals.map((goal) => (
          <div key={goal.id} className="p-4 bg-ruth-dark rounded-xl border border-ruth-border">
            <h3 className="text-lg font-medium text-white mb-4">
              {goal.goal || 'Untitled Goal'}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Which values does this goal serve?
              </label>
              <div className="flex flex-wrap gap-2">
                {data.selectedValues.map((value) => {
                  const isSelected = (data.valueAlignment[goal.id] || []).includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleValueForGoal(goal.id, value)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        isSelected
                          ? 'bg-gradient-ruth text-white border-transparent'
                          : 'bg-transparent text-gray-300 border-ruth-border hover:border-gray-500'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Explain how this goal connects to these values
              </label>
              <textarea
                value={data.valueExplanations[goal.id] || ''}
                onChange={(e) =>
                  setData(prev => ({
                    ...prev,
                    valueExplanations: { ...prev.valueExplanations, [goal.id]: e.target.value }
                  }))
                }
                placeholder="Describe the connection..."
                rows={3}
                className="w-full px-4 py-3 bg-ruth-card border border-ruth-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Phase 4: Goal Breakdown
// ============================================================================

function Phase4Breakdown({
  data,
  setData
}: {
  data: GoalsData;
  setData: React.Dispatch<React.SetStateAction<GoalsData>>;
}) {
  const addBenchmark = (goalId: string) => {
    setData(prev => ({
      ...prev,
      performanceGoals: {
        ...prev.performanceGoals,
        [goalId]: [...(prev.performanceGoals[goalId] || []), '']
      }
    }));
  };

  const removeBenchmark = (goalId: string, index: number) => {
    setData(prev => ({
      ...prev,
      performanceGoals: {
        ...prev.performanceGoals,
        [goalId]: (prev.performanceGoals[goalId] || []).filter((_, i) => i !== index)
      }
    }));
  };

  const updateBenchmark = (goalId: string, index: number, value: string) => {
    setData(prev => ({
      ...prev,
      performanceGoals: {
        ...prev.performanceGoals,
        [goalId]: (prev.performanceGoals[goalId] || []).map((b, i) => (i === index ? value : b))
      }
    }));
  };

  const addObstacle = (goalId: string) => {
    setData(prev => ({
      ...prev,
      obstacles: {
        ...prev.obstacles,
        [goalId]: [...(prev.obstacles[goalId] || []), '']
      }
    }));
  };

  const removeObstacle = (goalId: string, index: number) => {
    setData(prev => ({
      ...prev,
      obstacles: {
        ...prev.obstacles,
        [goalId]: (prev.obstacles[goalId] || []).filter((_, i) => i !== index)
      }
    }));
  };

  const updateObstacle = (goalId: string, index: number, value: string) => {
    setData(prev => ({
      ...prev,
      obstacles: {
        ...prev.obstacles,
        [goalId]: (prev.obstacles[goalId] || []).map((o, i) => (i === index ? value : o))
      }
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Goal Breakdown</h2>
      <p className="text-gray-400 mb-6">
        Set measurable benchmarks and identify potential obstacles for each goal.
      </p>

      <div className="space-y-8">
        {data.outcomeGoals.map((goal) => (
          <div key={goal.id} className="p-4 bg-ruth-dark rounded-xl border border-ruth-border">
            <h3 className="text-lg font-medium text-white mb-4">
              {goal.goal || 'Untitled Goal'}
            </h3>

            {/* Performance Benchmarks */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <label className="text-sm font-medium text-gray-300">
                  Performance Benchmarks
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                What specific, measurable targets do you need to hit?
              </p>

              <div className="space-y-2">
                {(data.performanceGoals[goal.id] || []).map((benchmark, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={benchmark}
                      onChange={(e) => updateBenchmark(goal.id, idx, e.target.value)}
                      placeholder="e.g., Back squat 405lb"
                      className="flex-1 px-4 py-2 bg-ruth-card border border-emerald-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {(data.performanceGoals[goal.id] || []).length > 1 && (
                      <button
                        onClick={() => removeBenchmark(goal.id, idx)}
                        className="px-3 text-gray-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => addBenchmark(goal.id)}
                className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add benchmark
              </button>
            </div>

            {/* Obstacles */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <label className="text-sm font-medium text-gray-300">
                  Potential Obstacles
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                What could prevent you from achieving this goal?
              </p>

              <div className="space-y-2">
                {(data.obstacles[goal.id] || []).map((obstacle, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={obstacle}
                      onChange={(e) => updateObstacle(goal.id, idx, e.target.value)}
                      placeholder="e.g., Limited mobility"
                      className="flex-1 px-4 py-2 bg-ruth-card border border-amber-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {(data.obstacles[goal.id] || []).length > 1 && (
                      <button
                        onClick={() => removeObstacle(goal.id, idx)}
                        className="px-3 text-gray-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => addObstacle(goal.id)}
                className="mt-2 text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add obstacle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Phase 5: Process Goals (Habits)
// ============================================================================

function Phase5ProcessGoals({
  data,
  addGoal,
  removeGoal,
  updateGoal,
  allObstacles
}: {
  data: GoalsData;
  addGoal: () => void;
  removeGoal: (id: string) => void;
  updateGoal: (id: string, field: keyof ProcessGoal, value: string) => void;
  allObstacles: string[];
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Process Goals</h2>
      <p className="text-gray-400 mb-6">
        Create daily and weekly habits that address your obstacles and move you toward your goals.
      </p>

      <div className="space-y-6">
        {data.processGoals.map((habit, index) => (
          <div key={habit.id} className="p-4 bg-ruth-dark rounded-xl border border-ruth-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Habit {index + 1}</h3>
              {data.processGoals.length > 1 && (
                <button
                  onClick={() => removeGoal(habit.id)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What specific action will you take?
                </label>
                <input
                  type="text"
                  value={habit.action}
                  onChange={(e) => updateGoal(habit.id, 'action', e.target.value)}
                  placeholder="e.g., 10 minutes of mobility work"
                  className="w-full px-4 py-3 bg-ruth-card border border-ruth-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frequency
                </label>
                <div className="flex gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateGoal(habit.id, 'frequency', opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        habit.frequency === opt.value
                          ? 'bg-gradient-ruth text-white'
                          : 'bg-ruth-card text-gray-300 border border-ruth-border hover:border-gray-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  When will you do this?
                </label>
                <input
                  type="text"
                  value={habit.when}
                  onChange={(e) => updateGoal(habit.id, 'when', e.target.value)}
                  placeholder="e.g., Every morning before training"
                  className="w-full px-4 py-3 bg-ruth-card border border-ruth-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Which obstacle does this address?
                </label>
                <select
                  value={habit.obstacle}
                  onChange={(e) => updateGoal(habit.id, 'obstacle', e.target.value)}
                  className="w-full px-4 py-3 bg-ruth-card border border-ruth-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select an obstacle...</option>
                  {allObstacles.map((obs, idx) => (
                    <option key={idx} value={obs}>
                      {obs}
                    </option>
                  ))}
                  <option value="other">Other / General improvement</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addGoal}
        className="mt-4 w-full py-3 border-2 border-dashed border-ruth-border rounded-xl text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Another Habit
      </button>

      {data.processGoals.length === 0 && (
        <button
          onClick={addGoal}
          className="mt-4 w-full py-4 bg-gradient-ruth text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Your First Habit
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Phase 6: Mental Skills
// ============================================================================

function Phase6MentalSkills({
  data,
  setData
}: {
  data: GoalsData;
  setData: React.Dispatch<React.SetStateAction<GoalsData>>;
}) {
  const setRating = (skillId: string, rating: number) => {
    setData(prev => ({
      ...prev,
      mentalSkillRatings: {
        ...prev.mentalSkillRatings,
        [skillId]: rating
      }
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Mental Skills Assessment</h2>
      <p className="text-gray-400 mb-6">
        Rate yourself on each mental skill from 1 (needs work) to 5 (strong).
      </p>

      <div className="space-y-6">
        {MENTAL_SKILLS.map((skill) => {
          const rating = data.mentalSkillRatings[skill.id as keyof MentalSkillRatings] || 0;
          return (
            <div key={skill.id} className="p-4 bg-ruth-dark rounded-xl border border-ruth-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-white">{skill.name}</h3>
                  <p className="text-sm text-gray-400">{skill.description}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(skill.id, star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Phase 7: Review
// ============================================================================

function Phase7Review({
  data,
  analysis
}: {
  data: GoalsData;
  analysis: GoalsAnalysis;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Your Goal Map</h2>
      <p className="text-gray-400 mb-6">
        Review your complete goals assessment before saving.
      </p>

      {/* Athlete Type */}
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-xl mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-8 h-8 text-cyan-400" />
          <div>
            <p className="text-sm text-gray-400">Your Athlete Type</p>
            <h3 className="text-xl font-bold text-gradient">{analysis.athleteType.name}</h3>
          </div>
        </div>
        <p className="text-gray-300">{analysis.athleteType.description}</p>
      </div>

      {/* Core Values */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Core Values</h3>
        <div className="flex flex-wrap gap-2">
          {data.selectedValues.map((value) => (
            <span
              key={value}
              className="px-3 py-1.5 bg-gradient-ruth text-white text-sm rounded-full"
            >
              {value}
            </span>
          ))}
        </div>
      </div>

      {/* Outcome Goals */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Outcome Goals</h3>
        <div className="space-y-4">
          {data.outcomeGoals.map((goal) => (
            <div key={goal.id} className="p-4 bg-ruth-dark rounded-xl border border-ruth-border">
              <h4 className="font-medium text-white mb-2">{goal.goal}</h4>
              <p className="text-sm text-gray-400 mb-3">Target: {goal.date}</p>

              {/* Aligned values */}
              {(data.valueAlignment[goal.id]?.length || 0) > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Aligned with:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.valueAlignment[goal.id].map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs rounded"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benchmarks */}
              {(data.performanceGoals[goal.id]?.filter(b => b.trim()).length || 0) > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Benchmarks:</p>
                  <ul className="text-sm text-emerald-400 space-y-1">
                    {data.performanceGoals[goal.id].filter(b => b.trim()).map((b, i) => (
                      <li key={i}>- {b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Obstacles */}
              {(data.obstacles[goal.id]?.filter(o => o.trim()).length || 0) > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Obstacles:</p>
                  <ul className="text-sm text-amber-400 space-y-1">
                    {data.obstacles[goal.id].filter(o => o.trim()).map((o, i) => (
                      <li key={i}>- {o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Process Goals */}
      {data.processGoals.filter(p => p.action.trim()).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Daily Habits</h3>
          <div className="space-y-2">
            {data.processGoals.filter(p => p.action.trim()).map((habit) => (
              <div key={habit.id} className="p-3 bg-ruth-dark rounded-lg border border-ruth-border flex items-center justify-between">
                <div>
                  <p className="text-white">{habit.action}</p>
                  <p className="text-xs text-gray-500">
                    {FREQUENCY_OPTIONS.find(f => f.value === habit.frequency)?.label} - {habit.when}
                  </p>
                </div>
                <span className="px-2 py-1 bg-violet-500/20 text-violet-300 text-xs rounded">
                  {habit.frequency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mental Skills */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          Mental Skills
          <span className="ml-2 text-sm font-normal text-gray-400">
            (Avg: {analysis.mentalSkillsAverage.toFixed(1)}/5)
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {MENTAL_SKILLS.map((skill) => {
            const rating = data.mentalSkillRatings[skill.id as keyof MentalSkillRatings] || 0;
            const isStrength = rating >= 4;
            const isDevelopment = rating <= 2;
            return (
              <div
                key={skill.id}
                className={`p-3 rounded-lg border ${
                  isStrength
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : isDevelopment
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-ruth-dark border-ruth-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{skill.name}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Strengths & Development */}
        <div className="grid grid-cols-2 gap-4">
          {analysis.mentalStrengths.length > 0 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-xs text-emerald-400 mb-2">Strengths</p>
              <ul className="text-sm text-white space-y-1">
                {analysis.mentalStrengths.map((s) => (
                  <li key={s}>+ {getSkillName(s)}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.developmentAreas.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-400 mb-2">Development Areas</p>
              <ul className="text-sm text-white space-y-1">
                {analysis.developmentAreas.map((s) => (
                  <li key={s}>- {getSkillName(s)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
