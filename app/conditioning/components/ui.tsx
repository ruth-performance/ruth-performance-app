'use client';

import { Zone } from '@/lib/conditioning-data';

// ============================================================================
// TIME INPUT COMPONENT
// ============================================================================

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  sublabel?: string;
}

export function TimeInput({ label, value, onChange, placeholder = 'MM:SS', sublabel }: TimeInputProps) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">
        {label}
        {sublabel && <span className="text-gray-600 ml-1">({sublabel})</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white text-sm font-mono outline-none focus:border-cyan-500/50 transition-colors"
      />
    </div>
  );
}

// ============================================================================
// NUMBER INPUT COMPONENT
// ============================================================================

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  unit?: string;
}

export function NumberInput({ label, value, onChange, placeholder, unit }: NumberInputProps) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-cyan-500/50 transition-colors pr-12"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  size?: 'sm' | 'lg';
}

export function MetricCard({ label, value, unit, color = '#06b6d4', size = 'sm' }: MetricCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{label}</div>
      <div 
        className={`font-bold ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}
        style={{ color }}
      >
        {value}
      </div>
      {unit && <div className="text-xs text-gray-600 mt-1">{unit}</div>}
    </div>
  );
}

// ============================================================================
// ZONE TABLE COMPONENT
// ============================================================================

interface ZoneTableProps {
  zones: Zone[];
  title: string;
  paceLabel: string;
  color: string;
  isRun?: boolean;
  paceUnit?: 'mile' | 'km';
}

export function ZoneTable({ zones, title, paceLabel, color, isRun = false, paceUnit = 'mile' }: ZoneTableProps) {
  if (zones.length === 0) return null;
  
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
      <div 
        className="text-[11px] uppercase tracking-wider font-semibold mb-4"
        style={{ color }}
      >
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-gray-500 font-medium">ZONE</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium">NAME</th>
              <th className="text-center py-2 px-2 text-gray-500 font-medium">{paceLabel}</th>
              <th className="text-left py-2 px-2 text-gray-500 font-medium hidden sm:table-cell">PURPOSE</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.zone} className="border-b border-white/5">
                <td className="py-2.5 px-2">
                  <span 
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold text-black"
                    style={{ background: z.color }}
                  >
                    {z.zone}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-white font-medium">{z.name}</td>
                <td 
                  className="py-2.5 px-2 text-center font-mono font-semibold"
                  style={{ color: z.color }}
                >
                  {isRun 
                    ? (paceUnit === 'mile' ? z.paceRangeMile : z.paceRangeKm) 
                    : z.paceRange
                  }
                </td>
                <td className="py-2.5 px-2 text-gray-500 hidden sm:table-cell">{z.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// ASSESSMENT BANNER
// ============================================================================

interface AssessmentBannerProps {
  text: string;
  priority: boolean;
}

export function AssessmentBanner({ text, priority }: AssessmentBannerProps) {
  if (!text) return null;
  
  return (
    <div 
      className={`rounded-lg p-3 text-sm ${
        priority 
          ? 'bg-red-500/10 border border-red-500/30 text-orange-400' 
          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
      }`}
    >
      {text}
    </div>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  title: string;
  color: string;
  icon?: React.ReactNode;
}

export function SectionHeader({ title, color, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && (
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          {icon}
        </div>
      )}
      <h3 
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color }}
      >
        {title}
      </h3>
    </div>
  );
}

// ============================================================================
// TOGGLE BUTTONS
// ============================================================================

interface ToggleButtonsProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  color?: string;
}

export function ToggleButtons({ options, value, onChange, color = '#eab308' }: ToggleButtonsProps) {
  return (
    <div className="flex bg-black/30 rounded-md p-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-3 py-1.5 rounded text-[10px] font-semibold transition-colors"
          style={{
            background: value === opt.value ? color : 'transparent',
            color: value === opt.value ? '#000' : '#666',
          }}
        >
          {opt.label}
        </button>
      ))}
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
    <div className={`bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}
