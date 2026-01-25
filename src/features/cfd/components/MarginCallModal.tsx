'use client';

import React, { useState, useEffect } from 'react';
import { useCfd } from '../store/cfdStore';
import { getMarginStatus } from '../utils/calculations';

export default function MarginCallModal() {
  const { marginLevel, equity, usedMargin } = useCfd();
  const [isVisible, setIsVisible] = useState(false);
  const [severity, setSeverity] = useState<'warning' | 'critical'>('warning');
  
  useEffect(() => {
    const status = getMarginStatus(marginLevel);
    
    if (status === 'danger' && usedMargin > 0) {
      setSeverity(marginLevel < 100 ? 'critical' : 'warning');
      setIsVisible(true);
    } else if (status === 'warning' && marginLevel < 120 && usedMargin > 0) {
      setSeverity('warning');
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [marginLevel, usedMargin]);

  if (!isVisible) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={() => setIsVisible(false)} />
      <div className={`margin-call-modal ${severity}`}>
        <div className="modal-icon">
          {severity === 'critical' ? (
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="var(--danger-light)"/>
              <path d="M24 14v12M24 30v4" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="var(--warning-light)"/>
              <path d="M24 16v10M24 30v2" stroke="var(--warning)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        
        <h3 className="modal-title">
          {severity === 'critical' ? 'Margin Call!' : 'Margin Warning'}
        </h3>
        
        <p className="modal-message">
          {severity === 'critical' 
            ? 'Your margin level has dropped below 100%. Your positions may be liquidated.'
            : 'Your margin level is approaching the danger zone. Consider closing some positions or adding funds.'
          }
        </p>
        
        <div className="margin-stats">
          <div className="stat">
            <span className="stat-label">Margin Level</span>
            <span className={`stat-value ${severity}`}>{marginLevel.toFixed(1)}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Equity</span>
            <span className="stat-value">${equity.toFixed(2)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Used Margin</span>
            <span className="stat-value">${usedMargin.toFixed(2)}</span>
          </div>
        </div>
        
        <button className="dismiss-btn" onClick={() => setIsVisible(false)}>
          I Understand
        </button>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        
        .margin-call-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 400px;
          background: var(--background);
          border-radius: var(--radius-xl);
          padding: 2rem;
          text-align: center;
          z-index: 1001;
          box-shadow: var(--shadow-lg);
          animation: modalSlideIn 0.3s ease;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        
        .modal-icon {
          margin-bottom: 1rem;
        }
        
        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }
        
        .margin-call-modal.critical .modal-title {
          color: var(--danger);
        }
        
        .margin-call-modal.warning .modal-title {
          color: var(--warning);
        }
        
        .modal-message {
          font-size: 0.875rem;
          color: var(--foreground-secondary);
          margin: 0 0 1.5rem;
          line-height: 1.5;
        }
        
        .margin-stats {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          padding: 1rem;
          background: var(--background-secondary);
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-label {
          font-size: 0.7rem;
          color: var(--foreground-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .stat-value {
          font-size: 1rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        
        .stat-value.critical { color: var(--danger); }
        .stat-value.warning { color: var(--warning); }
        
        .dismiss-btn {
          width: 100%;
          padding: 0.875rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .margin-call-modal.critical .dismiss-btn {
          background: var(--danger);
        }
        
        .margin-call-modal.warning .dismiss-btn {
          background: var(--warning);
        }
        
        .dismiss-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </>
  );
}
