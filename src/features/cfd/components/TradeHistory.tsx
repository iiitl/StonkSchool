'use client';

import React from 'react';
import { useCfd, TradeRecord } from '../store/cfdStore';
import { formatCurrency, formatPercentage } from '../utils/calculations';

export default function TradeHistory() {
  const { tradeHistory } = useCfd();

  if (tradeHistory.length === 0) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="var(--border)" strokeWidth="2"/>
          <path d="M16 20h16M16 24h12M16 28h8" stroke="var(--foreground-tertiary)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p>No trade history yet</p>
        <span>Closed trades will appear here</span>

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
    <div className="history-table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Direction</th>
            <th>Size</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>P&L ($)</th>
            <th>P&L (%)</th>
            <th>Duration</th>
            <th>Closed</th>
          </tr>
        </thead>
        <tbody>
          {tradeHistory.map(trade => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .history-table-wrapper {
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}

interface TradeRowProps {
  trade: TradeRecord;
}

function TradeRow({ trade }: TradeRowProps) {
  const duration = getDuration(trade.openTime, trade.closeTime);
  const closeTimeStr = formatTime(trade.closeTime);

  return (
    <tr>
      <td>
        <div className="symbol-cell">
          <span className="symbol-name">{trade.symbol}</span>
          <span className="leverage-badge">{trade.leverage}x</span>
        </div>
      </td>
      <td>
        <span className={`direction-badge ${trade.direction}`}>
          {trade.direction === 'long' ? '↑ Long' : '↓ Short'}
        </span>
      </td>
      <td className="mono">{trade.quantity.toFixed(4)}</td>
      <td className="mono">{formatCurrency(trade.entryPrice)}</td>
      <td className="mono">{formatCurrency(trade.exitPrice)}</td>
      <td className={`mono pnl ${trade.pnl >= 0 ? 'positive' : 'negative'}`}>
        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
      </td>
      <td className={`mono pnl ${trade.pnlPercentage >= 0 ? 'positive' : 'negative'}`}>
        {formatPercentage(trade.pnlPercentage)}
      </td>
      <td className="mono duration">{duration}</td>
      <td className="mono close-time">{closeTimeStr}</td>

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
        
        .pnl.positive {
          color: var(--profit);
          font-weight: 600;
        }
        
        .pnl.negative {
          color: var(--loss);
          font-weight: 600;
        }
        
        .duration {
          color: var(--foreground-secondary);
        }
        
        .close-time {
          color: var(--foreground-tertiary);
          font-size: 0.8rem;
        }
      `}</style>
    </tr>
  );
}

function getDuration(start: Date, end: Date): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
