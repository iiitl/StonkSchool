'use client';

import React, { useState, useCallback, memo } from 'react';
import { useCfd, useLivePrices } from '../store/cfdStore';
import { DisplayPosition as Position } from '../types';
import { formatCurrency, formatPercentage, getMarginStatus } from '../utils/calculations';

export default function PositionTable() {
  const { closePosition } = useCfd();
  const { livePositions } = useLivePrices();
  const [closingId, setClosingId] = useState<string | null>(null);

  const handleClose = useCallback(async (positionId: string) => {
    setClosingId(positionId);
    try {
      await closePosition(positionId);
    } catch (error) {

    } finally {
      setClosingId(null);
    }
  }, [closePosition]);

  if (livePositions.length === 0) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="var(--border)" strokeWidth="2"/>
          <path d="M16 24h16M24 16v16" stroke="var(--foreground-tertiary)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p>No open positions</p>
        <span>Open a position using the order form</span>

        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: var(--foreground-tertiary);
          }
          
          .empty-state p {
            margin: 1rem 0 0.25rem;
            font-weight: 600;
            color: var(--foreground-secondary);
          }
          
          .empty-state span {
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="position-table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Direction</th>
            <th>Size</th>
            <th>Entry</th>
            <th>Mark</th>
            <th>Liq. Price</th>
            <th>Margin Ratio</th>
            <th>P&L ($)</th>
            <th>P&L (%)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {livePositions.map(position => (
            <MemoizedPositionRow 
              key={position.id} 
              position={position} 
              onClose={handleClose}
              isClosing={closingId === position.id}
            />
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .position-table-wrapper {
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}

interface PositionRowProps {
  position: Position;
  onClose: (positionId: string) => void;
  isClosing: boolean;
}

const MemoizedPositionRow = memo(function PositionRow({ position, onClose, isClosing }: PositionRowProps) {
  const marginRatio = (position.pnl / position.margin + 1) * 100;
  const marginStatus = getMarginStatus(marginRatio);
  
  // Calculate distance to liquidation (0-100%)
  const priceRange = Math.abs(position.entryPrice - position.liquidationPrice);
  const currentDistance = Math.abs(position.markPrice - position.liquidationPrice);
  const healthPercent = Math.min(100, (currentDistance / priceRange) * 100);

  return (
    <tr>
      <td>
        <div className="symbol-cell">
          <span className="symbol-name">{position.symbol}</span>
          <span className="leverage-badge">{position.leverage}x</span>
        </div>
      </td>
      <td>
        <span className={`direction-badge ${position.direction}`}>
          {position.direction === 'long' ? '↑ Long' : '↓ Short'}
        </span>
      </td>
      <td className="mono">{position.quantity.toFixed(4)}</td>
      <td className="mono">{formatCurrency(position.entryPrice)}</td>
      <td className="mono">{formatCurrency(position.markPrice)}</td>
      <td className="mono liq-price">{formatCurrency(position.liquidationPrice)}</td>
      <td>
        <div className="margin-ratio">
          <div className="health-bar">
            <div 
              className={`health-bar-fill ${marginStatus}`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <span className={`ratio-value ${marginStatus}`}>{marginRatio.toFixed(1)}%</span>
        </div>
      </td>
      <td className={`mono pnl ${position.pnl >= 0 ? 'positive' : 'negative'}`}>
        {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
      </td>
      <td className={`mono pnl ${position.pnlPercentage >= 0 ? 'positive' : 'negative'}`}>
        {formatPercentage(position.pnlPercentage)}
      </td>
      <td>
        <button 
          className="close-btn" 
          onClick={() => onClose(position.id)}
          disabled={isClosing}
        >
          {isClosing ? 'Closing...' : 'Close'}
        </button>
      </td>

      <style jsx>{`
        .symbol-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .symbol-name {
          font-weight: 600;
        }
        
        .leverage-badge {
          padding: 0.125rem 0.375rem;
          font-size: 0.625rem;
          font-weight: 600;
          background: var(--background-tertiary);
          border-radius: var(--radius-sm);
          color: var(--foreground-secondary);
        }
        
        .direction-badge {
          display: inline-flex;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
        }
        
        .direction-badge.long {
          background: var(--success-light);
          color: var(--success);
        }
        
        .direction-badge.short {
          background: var(--danger-light);
          color: var(--danger);
        }
        
        .mono {
          font-variant-numeric: tabular-nums;
          font-family: var(--font-mono);
        }
        
        .liq-price {
          color: var(--danger);
        }
        
        .margin-ratio {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 80px;
        }
        
        .ratio-value {
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .ratio-value.healthy { color: var(--success); }
        .ratio-value.warning { color: var(--warning); }
        .ratio-value.danger { color: var(--danger); }
        
        .pnl.positive {
          color: var(--profit);
          font-weight: 600;
        }
        
        .pnl.negative {
          color: var(--loss);
          font-weight: 600;
        }
        
        .close-btn {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--danger);
          background: transparent;
          border: 1px solid var(--danger);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .close-btn:hover:not(:disabled) {
          background: var(--danger);
          color: white;
        }
        
        .close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </tr>
  );
});
