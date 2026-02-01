'use client';
import { useCfd } from '../store/cfdStore';
import { DisplayTradeRecord as TradeRecord } from '../types';
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
            <th>Type</th>
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
  const closeTimeStr = formatTime(trade.closeTime);
  const typeLabel = getOrderTypeLabel(trade.type);

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
      <td>
        <span className={`type-badge ${trade.type.toLowerCase().replace('_', '-')}`}>
          {typeLabel}
        </span>
      </td>
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
        
        .type-badge {
          display: inline-flex;
          padding: 0.25rem 0.5rem;
          font-size: 0.65rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          background: var(--background-tertiary);
          color: var(--foreground-secondary);
        }
        
        .type-badge.stop-loss {
          background: var(--danger-light);
          color: var(--danger);
        }
        
        .type-badge.take-profit {
          background: var(--success-light);
          color: var(--success);
        }
        
        .type-badge.liquidation {
          background: var(--danger-light);
          color: var(--danger);
        }
        
        .close-time {
          color: var(--foreground-tertiary);
          font-size: 0.8rem;
        }
      `}</style>
    </tr>
  );
}

function getOrderTypeLabel(type: string): string {
  switch (type) {
    case 'MARKET_CLOSE': return 'Market';
    case 'STOP_LOSS': return 'Stop Loss';
    case 'TAKE_PROFIT': return 'Take Profit';
    case 'LIQUIDATION': return 'Liquidated';
    default: return type;
  }
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
