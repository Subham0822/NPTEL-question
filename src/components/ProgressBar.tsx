import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  percentage?: number;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  color?: 'emerald' | 'indigo' | 'amber' | 'blue';
  className?: string;
  id?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  percentage,
  height = 'md',
  showLabel = false,
  color = 'indigo',
  className = '',
  id,
}) => {
  const calculatedPercent =
    percentage !== undefined
      ? Math.min(100, Math.max(0, percentage))
      : total > 0
      ? Math.min(100, Math.max(0, Math.round((current / total) * 100)))
      : 0;

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorClasses = {
    emerald: 'bg-emerald-600',
    indigo: 'bg-indigo-600',
    amber: 'bg-amber-500',
    blue: 'bg-blue-600',
  };

  return (
    <div id={id} className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
          <span>
            {current} of {total} completed
          </span>
          <span>{calculatedPercent}%</span>
        </div>
      )}
      <div
        className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClasses[height]}`}
        role="progressbar"
        aria-valuenow={calculatedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${heightClasses[height]} rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
          style={{ width: `${calculatedPercent}%` }}
        />
      </div>
    </div>
  );
};
