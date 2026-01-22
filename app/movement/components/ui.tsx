'use client';

import { useRef, useState, useEffect } from 'react';
import { STEPS, Step } from '@/lib/movement-data';

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface ProgressBarProps {
  currentStep: Step;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const idx = STEPS.indexOf(currentStep);
  const percent = ((idx + 1) / STEPS.length) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        {STEPS.map((s, i) => (
          <span 
            key={s} 
            className={`text-[9px] font-semibold uppercase ${
              i <= idx ? 'text-cyan-400' : 'text-gray-600'
            }`}
          >
            {s === 'Basic CF' ? 'Basic' : s === 'Gymnastics' ? 'Gym' : s === 'Dumbbell' ? 'DB' : s === 'Barbell' ? 'BB' : s}
          </span>
        ))}
      </div>
      <div className="h-[3px] bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// CONFIDENCE RATING (1-5)
// ============================================================================

interface ConfidenceRatingProps {
  value?: number;
  onChange: (value: number) => void;
  color?: string;
  label?: string;
}

export function ConfidenceRating({ 
  value, 
  onChange, 
  color = '#06b6d4', 
  label = 'Movement Proficiency' 
}: ConfidenceRatingProps) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 mb-1.5 uppercase">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="flex-1 min-w-[26px] h-[30px] rounded text-xs font-semibold transition-all"
            style={{
              border: value === n ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.15)',
              background: value === n ? `${color}25` : 'rgba(0,0,0,0.3)',
              color: value === n ? color : '#555',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAX UNBROKEN SLIDER
// ============================================================================

interface MaxUBSliderProps {
  value?: number;
  max: number;
  onChange: (value: number) => void;
  color?: string;
  unit?: string;
}

export function MaxUBSlider({ 
  value = 0, 
  max, 
  onChange, 
  color = '#06b6d4', 
  unit = 'reps' 
}: MaxUBSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const percent = (value / max) * 100;

  const handleMove = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    onChange(Math.round((pct / 100) * max));
  };

  useEffect(() => {
    if (dragging) {
      const up = () => setDragging(false);
      const move = (e: MouseEvent) => handleMove(e.clientX);
      window.addEventListener('mouseup', up);
      window.addEventListener('mousemove', move);
      return () => {
        window.removeEventListener('mouseup', up);
        window.removeEventListener('mousemove', move);
      };
    }
  }, [dragging]);

  return (
    <div className="py-1.5">
      <div
        ref={trackRef}
        className="relative h-2 bg-black/40 rounded cursor-pointer"
        onMouseDown={(e) => { setDragging(true); handleMove(e.clientX); }}
        onTouchStart={(e) => { setDragging(true); handleMove(e.touches[0].clientX); }}
        onTouchMove={(e) => dragging && handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setDragging(false)}
      >
        <div 
          className="absolute left-0 top-0 h-full rounded"
          style={{ width: `${percent}%`, background: color }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-[3px] cursor-grab"
          style={{ 
            left: `${percent}%`, 
            transform: 'translate(-50%, -50%)',
            background: '#111118',
            borderColor: color,
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-gray-600">
        <span>0</span>
        <span className="font-semibold text-[13px]" style={{ color }}>
          {value} {unit}
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ============================================================================
// NOTES FIELD
// ============================================================================

interface NotesFieldProps {
  value?: string;
  onChange: (value: string) => void;
}

export function NotesField({ value = '', onChange }: NotesFieldProps) {
  return (
    <div className="mt-2.5">
      <div className="text-[10px] text-gray-500 mb-1 uppercase">Notes (optional)</div>
      <textarea
        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm resize-y min-h-[40px] outline-none focus:border-cyan-500/50 transition-colors"
        placeholder="Why are you strong/weak here?"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 200))}
      />
    </div>
  );
}

// ============================================================================
// TOGGLE (lbs/kg, in/cm)
// ============================================================================

interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export function Toggle({ options, value, onChange }: ToggleProps) {
  return (
    <div className="flex bg-black/30 p-0.5 rounded-md">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            value === opt.value 
              ? 'bg-cyan-500/20 text-cyan-400' 
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// ZONE CARD (for DB/Barbell loading zones)
// ============================================================================

interface ZoneCardProps {
  color: string;
  children: React.ReactNode;
}

export function ZoneCard({ color, children }: ZoneCardProps) {
  return (
    <div 
      className="p-2.5 bg-black/25 rounded-lg"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SUBCATEGORY HEADER
// ============================================================================

interface SubcategoryHeaderProps {
  color: string;
  children: React.ReactNode;
}

export function SubcategoryHeader({ color, children }: SubcategoryHeaderProps) {
  return (
    <div 
      className="text-[11px] font-semibold uppercase tracking-wide mb-2 mt-4 pb-1.5"
      style={{ 
        color, 
        borderBottom: `1px solid ${color}30` 
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CARD WRAPPER
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-2.5 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// NAVIGATION BUTTONS
// ============================================================================

interface NavButtonsProps {
  onBack?: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel: string;
  nextDisabled?: boolean;
}

export function NavButtons({ 
  onBack, 
  onNext, 
  backLabel = '← Back', 
  nextLabel, 
  nextDisabled = false 
}: NavButtonsProps) {
  return (
    <div className="flex gap-2.5 mt-4">
      {onBack && (
        <button
          onClick={onBack}
          className="px-6 py-3 bg-transparent border border-white/20 rounded-xl text-white text-sm font-medium hover:border-white/40 transition-colors"
        >
          {backLabel}
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={`flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl text-gray-900 text-sm font-semibold transition-opacity ${
          nextDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}
