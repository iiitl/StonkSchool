'use client';

import React, { memo } from 'react';
import { useCfd, useLivePrices } from '../store/cfdStore';
import { formatCurrency, formatPercentage, getMarginStatus } from '../utils/calculations';

function WalletBar() {
  const { balance, usedMargin } = useCfd();
  const { liveEquity, liveFreeMargin, liveMarginLevel, priceConnected } = useLivePrices();
  const marginStatus = getMarginStatus(liveMarginLevel);

  const getMarginLevelColor = () => {
    switch (marginStatus) {
      case 'healthy': return 'text-success';
      case 'warning': return 'text-warning';
      case 'danger': return 'text-danger';
    }
  };

  return (
    <div className="wallet-bar">
      <div className="wallet-bar-inner">
        <div className="wallet-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--primary)" />
            <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="wallet-title">CFD Trading</span>
          <span className={`connection-status ${priceConnected ? 'connected' : 'disconnected'}`}>
            {priceConnected ? '● Live' : '○ Connecting...'}
          </span>
        </div>

        <div className="wallet-metrics">
          <MetricItem label="Balance" value={formatCurrency(balance)} />
          <MetricItem 
            label="Equity" 
            value={formatCurrency(liveEquity)} 
            highlight={liveEquity !== balance}
            positive={liveEquity >= balance}
          />
          <MetricItem label="Used Margin" value={formatCurrency(usedMargin)} />
          <MetricItem label="Free Margin" value={formatCurrency(liveFreeMargin)} />
          <MetricItem 
            label="Margin Level" 
            value={formatPercentage(liveMarginLevel, 1).replace('+', '')} 
            className={getMarginLevelColor()}
          />
        </div>
      </div>

      <style jsx>{`
        .wallet-bar {
          background: var(--background);
          border-bottom: 1px solid var(--border);
          padding: 0 1.5rem;
        }
        
        .wallet-bar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          max-width: 1600px;
          margin: 0 auto;
        }
        
        .wallet-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .wallet-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--foreground);
        }
        
        .connection-status {
          font-size: 0.7rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }
        
        .connection-status.connected {
          color: var(--success);
          background: var(--success-light);
        }
        
        .connection-status.disconnected {
          color: var(--warning);
          background: var(--warning-light);
        }
        
        .wallet-metrics {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        
        @media (max-width: 1024px) {
          .wallet-metrics {
            gap: 1rem;
          }
        }
        
        @media (max-width: 768px) {
          .wallet-bar-inner {
            flex-direction: column;
            height: auto;
            padding: 1rem 0;
            gap: 1rem;
          }
          
          .wallet-metrics {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
  className?: string;
}

const MetricItem = memo(function MetricItem({ label, value, highlight, positive, className }: MetricItemProps) {
  return (
    <div className="metric-item">
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${className || ''} ${highlight ? (positive ? 'text-profit' : 'text-loss') : ''}`}>
        {value}
      </span>

      <style jsx>{`
        .metric-item {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .metric-label {
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--foreground-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .metric-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--foreground);
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
});

export default memo(WalletBar);
