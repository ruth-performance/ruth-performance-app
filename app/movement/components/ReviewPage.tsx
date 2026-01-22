'use client';

import { MovementData, MOVEMENTS } from '@/lib/movement-data';
import { analyzeMovementData, AnalysisResult } from '@/lib/movement-analysis';
import { Card, NavButtons } from './ui';

interface ReviewPageProps {
  movementData: MovementData;
  competitionTier: string;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function ReviewPage({ 
  movementData, 
  competitionTier, 
  onBack, 
  onSubmit,
  isSubmitting = false 
}: ReviewPageProps) {
  const analysis = analyzeMovementData(movementData, competitionTier);
  
  const topWeaknesses = analysis.weaknesses.slice(0, 5);
  const topStrengths = analysis.strengths.slice(0, 5);
  const strengthPatterns = analysis.patterns.filter(p => p.type === 'strength').slice(0, 3);
  const weaknessPatterns = analysis.patterns.filter(p => p.type === 'weakness').slice(0, 3);

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">Review & Submit</h2>

      {/* Overview Stats */}
      <Card>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gradient bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              {analysis.overallAverage.toFixed(1)}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">Overall Avg</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {analysis.strengths.length}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">Strengths</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {analysis.weaknesses.length}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">Weaknesses</div>
          </div>
        </div>
      </Card>

      {/* Category Averages */}
      <Card>
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Category Averages</h3>
        <div className="space-y-2">
          {Object.entries(analysis.categoryAverages).map(([cat, avg]) => {
            const color = cat === 'Basic CF' ? '#ff6b6b' 
              : cat === 'Gymnastics' ? '#4ecdc4'
              : cat === 'Dumbbell' ? '#a855f7'
              : '#ffbe0b';
            const percent = (avg / 5) * 100;
            
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{cat}</span>
                  <span style={{ color }} className="font-semibold">{avg.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percent}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Priority Weaknesses */}
      {topWeaknesses.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-red-400 uppercase mb-3">
            Priority Weaknesses (Top 5)
          </h3>
          <div className="space-y-1.5">
            {topWeaknesses.map((w, i) => (
              <div 
                key={i}
                className="flex justify-between items-center text-xs p-2 bg-red-500/10 rounded"
              >
                <span className="text-gray-300">{w.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[10px]">{w.category}</span>
                  <span className="text-red-400 font-bold">{w.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Strengths */}
      {topStrengths.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold text-emerald-400 uppercase mb-3">
            Top Strengths
          </h3>
          <div className="space-y-1.5">
            {topStrengths.map((s, i) => (
              <div 
                key={i}
                className="flex justify-between items-center text-xs p-2 bg-emerald-500/10 rounded"
              >
                <span className="text-gray-300">{s.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[10px]">{s.category}</span>
                  <span className="text-emerald-400 font-bold">{s.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Patterns */}
      <div className="grid grid-cols-2 gap-2">
        {/* Weakness Patterns */}
        {weaknessPatterns.length > 0 && (
          <Card className="col-span-1">
            <h3 className="text-[10px] font-semibold text-red-400 uppercase mb-2">
              Weak Patterns
            </h3>
            {weaknessPatterns.map((p, i) => (
              <div 
                key={i}
                className="flex justify-between items-center text-[11px] mb-1 p-1.5 bg-red-500/10 rounded"
              >
                <span className="text-gray-400">{p.name}</span>
                <span className="text-red-400 font-bold">{p.avg}</span>
              </div>
            ))}
          </Card>
        )}

        {/* Strength Patterns */}
        {strengthPatterns.length > 0 && (
          <Card className="col-span-1">
            <h3 className="text-[10px] font-semibold text-emerald-400 uppercase mb-2">
              Strong Patterns
            </h3>
            {strengthPatterns.map((p, i) => (
              <div 
                key={i}
                className="flex justify-between items-center text-[11px] mb-1 p-1.5 bg-emerald-500/10 rounded"
              >
                <span className="text-gray-400">{p.name}</span>
                <span className="text-emerald-400 font-bold">{p.avg}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Completion Status */}
      <Card>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Assessment Completion</span>
          <span className="text-sm font-semibold text-cyan-400">
            {analysis.completedMovements} / {analysis.totalMovements} movements
          </span>
        </div>
        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mt-2">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
            style={{ width: `${(analysis.completedMovements / analysis.totalMovements) * 100}%` }}
          />
        </div>
      </Card>

      {/* Navigation */}
      <NavButtons
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={isSubmitting ? 'Saving...' : 'Save Assessment →'}
        nextDisabled={isSubmitting}
      />
    </div>
  );
}
