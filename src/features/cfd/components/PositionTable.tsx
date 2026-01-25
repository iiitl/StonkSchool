'use client';

import React, { useState, useEffect } from 'react';
import { useCfd, Position } from '../store/cfdStore';
import { formatCurrency, formatPercentage, getMarginStatus } from '../utils/calculations';

export default function PositionTable() {
  const { positions, closePosition } = useCfd();
  const [flashingIds, setFlashingIds] = useState<Record<string, 'positive' | 'negative' | null>>({});

  // Track PnL changes for flash animation
  useEffect(() => {
    const newFlashing: Record<string, 'positive' | 'negative' | null> = {};
    positions.forEach(pos => {
      if (pos.pnl > 0) newFlashing[pos.id] = 'positive';
      else if (pos.pnl < 0) newFlashing[pos.id] = 'negative';
    });
    setFlashingIds(newFlashing);
    
    const timeout = setTimeout(() => setFlashingIds({}), 500);
    return () => clearTimeout(timeout);
  }, [positions.map(p => p.markPrice).join(',')]);

  if (positions.length === 0) {
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
          {positions.map(position => (
            <PositionRow 
              key={position.id} 
              position={position} 
              flash={flashingIds[position.id]}
              onClose={() => closePosition(position.id)}
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
  flash: 'positive' | 'negative' | null | undefined;
  onClose: () => void;
}

function PositionRow({ position, flash, onClose }: PositionRowProps) {
  const marginRatio = (position.pnl / position.margin + 1) * 100;
  const marginStatus = getMarginStatus(marginRatio);
  
  // Calculate distance to liquidation (0-100%)
  const priceRange = Math.abs(position.entryPrice - position.liquidationPrice);
  const currentDistance = Math.abs(position.markPrice - position.liquidationPrice);
  const healthPercent = Math.min(100, (currentDistance / priceRange) * 100);

  return (
    <tr className={flash ? `pnl-flash-${flash}` : ''}>
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
        <button className="close-btn" onClick={onClose}>
          Close
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
        
        .close-btn:hover {
          background: var(--danger);
          color: white;
        }
      `}</style>
    </tr>
  );
}
