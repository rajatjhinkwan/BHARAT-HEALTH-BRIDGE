import React from 'react';

/**
 * Universal Shimmer Block
 */
export function Shimmer({ className = '', style = {} }) {
  return (
    <div 
      className={`shimmer-block ${className}`} 
      style={{ minHeight: '1rem', width: '100%', ...style }}
    />
  );
}

/**
 * Dashboard Stats Cards Shimmer Loader
 */
export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm flex flex-col gap-3"
          style={{ minHeight: '110px' }}
        >
          <Shimmer style={{ width: '40%', height: '12px', borderRadius: '6px' }} />
          <Shimmer style={{ width: '65%', height: '32px', borderRadius: '8px', marginTop: '4px' }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Queue Cards / Clinical Waitlist Shimmer Loader
 */
export function SkeletonQueue({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm flex items-center justify-between gap-4"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar placeholder */}
            <Shimmer style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0 }} />
            <div className="flex-1 space-y-2">
              {/* Patient Name placeholder */}
              <Shimmer style={{ width: '50%', height: '14px', borderRadius: '6px' }} />
              {/* Patient MRN / Queue status placeholder */}
              <Shimmer style={{ width: '30%', height: '10px', borderRadius: '4px' }} />
            </div>
          </div>
          {/* Action button placeholder */}
          <Shimmer style={{ width: '80px', height: '32px', borderRadius: '10px', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Structured Data Grid / Table Logs Shimmer Loader
 */
export function SkeletonTable({ rows = 4, cols = 5 }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-hover)]/50 px-6 py-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1">
            <Shimmer style={{ width: '60%', height: '12px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>
      {/* Table Body */}
      <div className="divide-y divide-[var(--divider)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="flex-1">
                <Shimmer 
                  style={{ 
                    width: c === 0 ? '75%' : c === cols - 1 ? '40%' : '55%', 
                    height: '10px', 
                    borderRadius: '5px' 
                  }} 
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Text Lines Loader for Doctor Notes / EMR Charts
 */
export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer 
          key={i} 
          style={{ 
            width: i === lines - 1 ? '60%' : i % 2 === 0 ? '95%' : '85%', 
            height: '11px', 
            borderRadius: '6px' 
          }} 
        />
      ))}
    </div>
  );
}

/**
 * Standard glowing page-level Spinner
 */
export function GlowingLoader({ message = 'Loading records securely...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in-up">
      <div className="glowing-spinner" />
      {message && (
        <p className="mt-4 font-semibold text-sm text-[var(--text-muted)] tracking-wide uppercase font-sans">
          {message}
        </p>
      )}
    </div>
  );
}
