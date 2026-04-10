'use client';

import React from 'react';
import { useCfd } from '../store/cfdStore';

interface LeverageSelectorProps {
  value: number;
  onChange: (leverage: number) => void;
  max?: number;
}

const ALL_LEVERAGE_OPTIONS = [2, 5, 10, 25, 50];

export default function LeverageSelector({ value, onChange, max = 50 }: LeverageSelectorProps) {
  // Filter leverage options based on max allowed
  const LEVERAGE_OPTIONS = ALL_LEVERAGE_OPTIONS.filter(lev => lev <= max);
  
  return (
    <div className="leverage-selector">
      <label className="input-label" id="leverage-label">Leverage</label>
      <div className="leverage-options" role="radiogroup" aria-labelledby="leverage-label">
        {LEVERAGE_OPTIONS.map(lev => (
          <button
            key={lev}
            className={`leverage-btn ${value === lev ? 'active' : ''}`}
            onClick={() => onChange(lev)}
          >
            {lev}x
          </button>
        ))}
      </div>
      
      <div className="leverage-bar">
        <div 
          className="leverage-fill" 
          style={{ 
            width: `${(LEVERAGE_OPTIONS.indexOf(value) + 1) / LEVERAGE_OPTIONS.length * 100}%` 
          }}
        />
        <div className="leverage-markers">
          {LEVERAGE_OPTIONS.map((lev, idx) => (
            <div 
              key={lev}
              className={`leverage-marker ${LEVERAGE_OPTIONS.indexOf(value) >= idx ? 'active' : ''}`}
              style={{ left: `${(idx + 1) / LEVERAGE_OPTIONS.length * 100}%` }}
            />
          ))}
        </div>
      </div>
      
      <div className="leverage-info">
        <span className="info-text">
          {value}x = {(100 / value).toFixed(1)}% margin required
        </span>
      </div>

      <style jsx>{`
        .leverage-selector {
          margin-bottom: 1rem;
        }
        
        .leverage-options {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .leverage-btn {
          flex: 1;
          padding: 0.625rem 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--foreground-secondary);
          background: var(--background-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .leverage-btn:hover {
          background: var(--background);
          border-color: var(--primary);
          color: var(--primary);
        }
        
        .leverage-btn.active {
          background: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary);
        }
        
        .leverage-bar {
          position: relative;
          height: 6px;
          background: var(--background-tertiary);
          border-radius: 3px;
          margin-bottom: 0.5rem;
        }
        
        .leverage-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--primary-hover));
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .leverage-markers {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        
        .leverage-marker {
          position: absolute;
          top: 50%;
          width: 10px;
          height: 10px;
          background: var(--background-tertiary);
          border: 2px solid var(--border);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: all 0.2s;
        }
        
        .leverage-marker.active {
          background: var(--primary);
          border-color: var(--primary);
        }
        
        .leverage-info {
          text-align: center;
        }
        
        .info-text {
          font-size: 0.7rem;
          color: var(--foreground-tertiary);
        }
      `}</style>
    </div>
  );
}
