import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'slate';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'text-slate-600',
    border: 'border-slate-200',
  },
};

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  color = 'red',
  subtitle,
  trend,
}) => {
  const classes = colorClasses[color];

  return (
    <div className={`card border-l-4 ${classes.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            {trend && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  trend.isPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 ${classes.bg} rounded-lg flex items-center justify-center`}
        >
          <Icon size={24} className={classes.icon} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;