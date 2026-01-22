'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Movement, BarbellMovementData, BARBELL_RANGES_LBS, lbsToKg } from '@/lib/movement-data';
import { Card, ConfidenceRating, NotesField, ZoneCard } from './ui';

interface BarbellCardProps {
  movement: Movement;
  gender: 'male' | 'female';
  unit: 'lbs' | 'kg';
  data: BarbellMovementData;
  onChange: (id: string, data: BarbellMovementData) => void;
}

export function BarbellCard({ movement, gender, unit, data, onChange }: BarbellCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const rangeLbs = BARBELL_RANGES_LBS[movement.id] || { male: { min: 95, max: 315 }, female: { min: 65, max: 225 } };
  const genderRange = rangeLbs[gender] || rangeLbs.male;
  const range = unit === 'kg' 
    ? { min: lbsToKg(genderRange.min), max: lbsToKg(genderRange.max) } 
    : genderRange;
  const { min, max } = range;

  const getDefaultZones = () => ({
    light: Math.round(min + (max - min) * 0.25),
    moderate: Math.round(min + (max - min) * 0.45),
    heavy: Math.round(min + (max - min) * 0.65),
    max: Math.round(min + (max - min) * 0.85),
  });

  const zones = data.zones || getDefaultZones();
  const confidence = data.confidence || {};
  const [dragging, setDragging] = useState<string | null>(null);
  const [localZones, setLocalZones] = useState(zones);

  useEffect(() => {
    setLocalZones(data.zones || getDefaultZones());
  }, [gender, unit, movement.id]);

  const zoneConfig = [
    { key: 'light' as const, color: '#00ff88' },
    { key: 'moderate' as const, color: '#06b6d4' },
    { key: 'heavy' as const, color: '#ffbe0b' },
    { key: 'max' as const, color: '#ff6b6b' },
  ];

  const getPercent = (val: number) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
  const getValue = (pct: number) => {
    const step = unit === 'kg' ? 2.5 : 5;
    return Math.round((min + (pct / 100) * (max - min)) / step) * step;
  };

  const handleMove = (clientX: number) => {
    if (!dragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    let val = getValue(pct);
    const order = ['light', 'moderate', 'heavy', 'max'] as const;
    const idx = order.indexOf(dragging as any);
    const gap = unit === 'kg' ? 5 : 10;
    val = Math.max(min + gap, Math.min(max, val));
    if (idx > 0) val = Math.max(val, localZones[order[idx - 1]] + gap);
    if (idx < 3) val = Math.min(val, localZones[order[idx + 1]] - gap);
    setLocalZones(prev => ({ ...prev, [dragging]: val }));
  };

  const handleEnd = () => {
    if (dragging) {
      onChange(movement.id, { ...data, zones: localZones });
      setDragging(null);
    }
  };

  const handleConfChange = (zone: 'light' | 'moderate' | 'heavy', val: number) => {
    onChange(movement.id, { 
      ...data, 
      zones: localZones, 
      confidence: { ...confidence, [zone]: val } 
    });
  };

  const handleNotesChange = (notes: string) => {
    onChange(movement.id, { ...data, zones: localZones, notes });
  };

  const handleDoesNotApply = (doesNotApply: boolean) => {
    onChange(movement.id, { ...data, doesNotApply });
  };

  const unitLabel = unit === 'kg' ? 'kg' : '#';

  // Calculate average confidence for collapsed view
  const avgConfidence = confidence.light && confidence.moderate && confidence.heavy
    ? Math.round((confidence.light + confidence.moderate + confidence.heavy) / 3 * 10) / 10
    : null;

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
                background: 'rgba(255, 190, 11, 0.25)',
                color: '#ffbe0b',
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
              <div className="text-[10px] text-gray-500 mb-2">
                Drag markers to set zones. <strong className="text-red-400">Max</strong> = your 1RM.
              </div>

              {/* Draggable Zone Slider */}
              <div
                ref={sliderRef}
                className="relative h-[50px] mt-7 mb-5 touch-none"
                onMouseMove={(e) => handleMove(e.clientX)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                onTouchEnd={handleEnd}
              >
                {/* Track background */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2.5 bg-black/40 rounded overflow-hidden">
                  {/* Zone segments */}
                  <div 
                    className="absolute left-0 h-full"
                    style={{ 
                      width: `${getPercent(localZones.light)}%`, 
                      background: '#00ff8850' 
                    }}
                  />
                  <div 
                    className="absolute h-full"
                    style={{ 
                      left: `${getPercent(localZones.light)}%`,
                      width: `${getPercent(localZones.moderate) - getPercent(localZones.light)}%`, 
                      background: '#06b6d450' 
                    }}
                  />
                  <div 
                    className="absolute h-full"
                    style={{ 
                      left: `${getPercent(localZones.moderate)}%`,
                      width: `${getPercent(localZones.heavy) - getPercent(localZones.moderate)}%`, 
                      background: '#ffbe0b50' 
                    }}
                  />
                  <div 
                    className="absolute h-full"
                    style={{ 
                      left: `${getPercent(localZones.heavy)}%`,
                      width: `${getPercent(localZones.max) - getPercent(localZones.heavy)}%`, 
                      background: '#ff6b6b50' 
                    }}
                  />
                  <div 
                    className="absolute right-0 h-full"
                    style={{ 
                      left: `${getPercent(localZones.max)}%`,
                      background: 'rgba(50,50,50,0.5)' 
                    }}
                  />
                </div>

                {/* Draggable handles */}
                {zoneConfig.map(({ key, color }) => (
                  <div
                    key={key}
                    className="absolute top-1/2"
                    style={{ 
                      left: `${getPercent(localZones[key])}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: dragging === key ? 10 : 5,
                    }}
                    onMouseDown={(e) => { e.preventDefault(); setDragging(key); }}
                    onTouchStart={(e) => { e.preventDefault(); setDragging(key); }}
                  >
                    {/* Label above handle */}
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap"
                      style={{
                        background: dragging === key ? color : 'rgba(0,0,0,0.7)',
                        color: dragging === key ? '#000' : color,
                      }}
                    >
                      {localZones[key]}{unitLabel}
                    </div>
                    {/* Handle */}
                    <div 
                      className="w-5 h-5 rounded-full border-[3px] cursor-grab flex items-center justify-center"
                      style={{
                        background: '#111118',
                        borderColor: color,
                        boxShadow: dragging === key ? `0 0 10px ${color}` : '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                ))}

                {/* Min/Max labels */}
                <div className="absolute top-full left-0 mt-1.5 text-[10px] text-gray-600">
                  {min}{unitLabel}
                </div>
                <div className="absolute top-full right-0 mt-1.5 text-[10px] text-gray-600">
                  {max}{unitLabel}
                </div>
              </div>

              {/* Confidence cards for each zone */}
              <div className="grid grid-cols-2 gap-1.5 mt-8">
                {[
                  { key: 'light' as const, label: 'Light', range: `${min}-${localZones.light}${unitLabel}`, color: '#00ff88', desc: 'Fast cycling' },
                  { key: 'moderate' as const, label: 'Mod', range: `${localZones.light}-${localZones.moderate}${unitLabel}`, color: '#06b6d4', desc: 'Sustainable' },
                  { key: 'heavy' as const, label: 'Heavy', range: `${localZones.moderate}-${localZones.heavy}${unitLabel}`, color: '#ffbe0b', desc: 'Grinding' },
                ].map(({ key, label, range, color, desc }) => (
                  <ZoneCard key={key} color={color}>
                    <div className="text-[9px] text-gray-500 uppercase">{label}</div>
                    <div 
                      className="text-xs font-semibold mb-0.5"
                      style={{ color }}
                    >
                      {range}
                    </div>
                    <div className="text-[8px] text-gray-600 mb-1.5">{desc}</div>
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
