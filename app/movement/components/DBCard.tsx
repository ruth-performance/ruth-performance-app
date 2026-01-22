'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Movement, DBMovementData, MOVEMENTS } from '@/lib/movement-data';
import { Card, ConfidenceRating, NotesField, ZoneCard } from './ui';

interface DBCardProps {
  movement: Movement;
  gender: 'male' | 'female';
  data: DBMovementData;
  onChange: (id: string, data: DBMovementData) => void;
}

export function DBCard({ movement, gender, data, onChange }: DBCardProps) {
  const [expanded, setExpanded] = useState(false);
  const zones = MOVEMENTS.DB.loadingZones![gender];
  const confidence = data.confidence || {};

  const handleConfChange = (zone: 'light' | 'moderate' | 'heavy', val: number) => {
    onChange(movement.id, { 
      ...data, 
      confidence: { ...confidence, [zone]: val } 
    });
  };

  const handleNotesChange = (notes: string) => {
    onChange(movement.id, { ...data, notes });
  };

  const handleDoesNotApply = (doesNotApply: boolean) => {
    onChange(movement.id, { ...data, doesNotApply });
  };

  // Calculate average confidence for collapsed view
  const avgConfidence = confidence.light && confidence.moderate && confidence.heavy
    ? Math.round((confidence.light + confidence.moderate + confidence.heavy) / 3 * 10) / 10
    : null;

  const zoneConfig = [
    { key: 'light' as const, label: 'Light', weight: zones.light, color: '#00ff88' },
    { key: 'moderate' as const, label: 'Moderate', weight: zones.moderate, color: '#06b6d4' },
    { key: 'heavy' as const, label: 'Heavy', weight: zones.heavy, color: '#ffbe0b' },
  ];

  return (
    <Card>
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-medium text-white text-sm">{movement.name}</span>
        <div className="flex items-center gap-2">
          {!expanded && avgConfidence && (
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ 
                background: 'rgba(168, 85, 247, 0.25)',
                color: '#a855f7',
              }}
            >
              {avgConfidence}
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
              onChange={(e) => handleDoesNotApply(e.target.checked)}
              className="w-3.5 h-3.5 accent-cyan-500"
            />
            <span className="text-gray-400 text-xs">Doesn't apply to me</span>
          </label>

          {!data.doesNotApply && (
            <>
              {/* Loading Zones Grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {zoneConfig.map(({ key, label, weight, color }) => (
                  <ZoneCard key={key} color={color}>
                    <div className="text-[10px] text-gray-500 uppercase">{label}</div>
                    <div 
                      className="text-sm font-semibold mb-1.5"
                      style={{ color }}
                    >
                      {weight}#
                    </div>
                    <ConfidenceRating
                      value={confidence[key]}
                      onChange={(v) => handleConfChange(key, v)}
                      color={color}
                      label="Proficiency"
                    />
                  </ZoneCard>
                ))}
              </div>

              {/* Notes */}
              <NotesField
                value={data.notes}
                onChange={handleNotesChange}
              />
            </>
          )}
        </div>
      )}
    </Card>
  );
}
