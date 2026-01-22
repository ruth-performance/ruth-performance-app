'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Movement, BasicMovementData } from '@/lib/movement-data';
import { Card, ConfidenceRating, MaxUBSlider, NotesField } from './ui';

interface BasicGymnasticsCardProps {
  movement: Movement;
  categoryColor: string;
  data: BasicMovementData;
  onChange: (id: string, data: BasicMovementData) => void;
}

export function BasicGymnasticsCard({ 
  movement, 
  categoryColor, 
  data, 
  onChange 
}: BasicGymnasticsCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const handleChange = (field: keyof BasicMovementData, value: any) => {
    onChange(movement.id, { ...data, [field]: value });
  };

  const showSlider = movement.maxUB && !movement.noSlider;
  const hasData = data.confidence || data.maxUB || data.notes;

  return (
    <Card>
      {/* Header - always visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm">{movement.name}</span>
          {movement.unit && (
            <span className="text-[10px] text-gray-500 uppercase">({movement.unit})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Quick confidence indicator when collapsed */}
          {!expanded && data.confidence && (
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ 
                background: `${categoryColor}25`,
                color: categoryColor,
              }}
            >
              {data.confidence}
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/5">
          {/* Doesn't Apply checkbox */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={data.doesNotApply || false}
              onChange={(e) => handleChange('doesNotApply', e.target.checked)}
              className="w-3.5 h-3.5 accent-cyan-500"
            />
            <span className="text-gray-400 text-xs">Doesn't apply to me</span>
          </label>

          {!data.doesNotApply && (
            <>
              {/* Confidence Rating */}
              <ConfidenceRating
                value={data.confidence}
                onChange={(v) => handleChange('confidence', v)}
                color={categoryColor}
              />

              {/* Max UB Slider (if applicable) */}
              {showSlider && (
                <div className="mt-4">
                  <div className="text-[10px] text-gray-500 mb-1 uppercase">
                    Max Unbroken ({movement.unit || 'reps'})
                  </div>
                  <MaxUBSlider
                    value={data.maxUB}
                    max={movement.maxUB!}
                    onChange={(v) => handleChange('maxUB', v)}
                    color={categoryColor}
                    unit={movement.unit || 'reps'}
                  />
                </div>
              )}

              {/* Special input for no-slider movements (like rope climbs, HS hold) */}
              {movement.noSlider && movement.maxValue && (
                <div className="mt-4">
                  <div className="text-[10px] text-gray-500 mb-1 uppercase">
                    Max {movement.unit || 'reps'}
                  </div>
                  <input
                    type="number"
                    value={data.maxUB || ''}
                    onChange={(e) => handleChange('maxUB', parseInt(e.target.value) || 0)}
                    placeholder={`0-${movement.maxValue}`}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-cyan-500/50"
                  />
                </div>
              )}

              {/* Notes */}
              <NotesField
                value={data.notes}
                onChange={(v) => handleChange('notes', v)}
              />
            </>
          )}
        </div>
      )}
    </Card>
  );
}
