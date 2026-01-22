import Link from 'next/link';
import { LucideIcon, ChevronRight, CheckCircle } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status?: 'not_started' | 'in_progress' | 'completed';
  accentColor?: string;
}

export default function ModuleCard({
  title,
  description,
  href,
  icon: Icon,
  status = 'not_started',
  accentColor = 'from-cyan-500 to-emerald-500',
}: ModuleCardProps) {
  const statusConfig = {
    not_started: {
      label: 'Not Started',
      color: 'text-gray-500',
      bg: 'bg-gray-500/10',
    },
    in_progress: {
      label: 'In Progress',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    completed: {
      label: 'Completed',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
  };

  const { label, color, bg } = statusConfig[status];

  return (
    <Link href={href} className="block group">
      <div className="bg-ruth-card border border-ruth-border rounded-2xl p-6 card-hover h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${bg}`}>
            {status === 'completed' && <CheckCircle className={`w-3.5 h-3.5 ${color}`} />}
            <span className={`text-xs font-medium ${color}`}>{label}</span>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-ruth-cyan transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center text-ruth-cyan text-sm font-medium">
          <span>{status === 'completed' ? 'View Results' : 'Start Assessment'}</span>
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
