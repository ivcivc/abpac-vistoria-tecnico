import React from 'react';
import { cn } from '@/lib/utils';
import { getProgressColor, getProgressTextColor } from '@/utils/progressCalculation';

interface ProgressIndicatorProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'detailed';
  animated?: boolean;
}

export function ProgressIndicator({ 
  value, 
  size = 'md', 
  showLabel = true, 
  label = 'Progresso',
  description,
  className,
  variant = 'default',
  animated = true
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Garantir que o valor está entre 0 e 100
  const clampedValue = Math.max(0, Math.min(100, value));
  
  const progressColor = getProgressColor(clampedValue);
  const textColor = getProgressTextColor(clampedValue);

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className={cn('flex-1 bg-gray-200 rounded-full', sizeClasses[size])}>
          <div
            className={cn(
              'rounded-full transition-all duration-500 ease-out',
              progressColor,
              sizeClasses[size],
              animated && 'transition-all duration-500'
            )}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        <span className={cn('font-medium', textSizeClasses[size], textColor)}>
          {clampedValue}%
        </span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-2', className)}>
        {showLabel && (
          <div className="flex justify-between items-center">
            <span className={cn('font-medium text-gray-700 dark:text-gray-300', textSizeClasses[size])}>
              {label}
            </span>
            <span className={cn('font-semibold', textSizeClasses[size], textColor)}>
              {clampedValue}%
            </span>
          </div>
        )}
        
        <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full', sizeClasses[size])}>
          <div
            className={cn(
              'rounded-full transition-all ease-out',
              progressColor,
              sizeClasses[size],
              animated ? 'duration-700' : 'duration-0'
            )}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        
        {description && (
          <p className={cn('text-gray-600 dark:text-gray-400', textSizeClasses[size])}>
            {description}
          </p>
        )}
      </div>
    );
  }

  // Variant 'default'
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className={cn('font-medium text-gray-700 dark:text-gray-300', textSizeClasses[size])}>
            {label}
          </span>
          <span className={cn('font-semibold', textSizeClasses[size], textColor)}>
            {clampedValue}%
          </span>
        </div>
      )}
      
      <div className={cn('w-full bg-gray-200 dark:bg-gray-700 rounded-full', sizeClasses[size])}>
        <div
          className={cn(
            'rounded-full transition-all ease-out',
            progressColor,
            sizeClasses[size],
            animated ? 'duration-500' : 'duration-0'
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      
      {description && (
        <p className={cn('text-gray-600 dark:text-gray-400 mt-1', textSizeClasses[size])}>
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Componente de progresso circular (para casos especiais)
 */
export function CircularProgress({ 
  value, 
  size = 40, 
  strokeWidth = 4, 
  className 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number; 
  className?: string; 
}) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  
  const progressColor = clampedValue < 25 ? '#ef4444' : 
                       clampedValue < 50 ? '#f97316' : 
                       clampedValue < 75 ? '#eab308' : 
                       clampedValue < 100 ? '#3b82f6' : '#22c55e';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-semibold" style={{ color: progressColor }}>
        {clampedValue}%
      </span>
    </div>
  );
}
