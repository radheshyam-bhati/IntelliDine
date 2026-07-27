import React from 'react'

export interface KPICardProps {
  label: string
  value: string | number
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  className?: string
}

export function KPICard({ label, value, trend, icon, className = '' }: KPICardProps) {
  return (
    <div className={`bg-surface border border-slate-200 rounded-lg p-6 shadow-sm ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon && (
          <div className="p-3 bg-primary-light text-primary rounded-md">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span
            className={`font-medium flex items-center mr-2 ${
              trend.direction === 'up'
                ? 'text-success'
                : trend.direction === 'down'
                ? 'text-error'
                : 'text-slate-500'
            }`}
          >
            {trend.direction === 'up' && (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {trend.direction === 'neutral' && (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
