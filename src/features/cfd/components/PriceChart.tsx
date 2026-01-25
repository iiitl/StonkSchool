'use client';

import React from 'react';
import { useCfd } from '../store/cfdStore';
import { formatCurrency } from '../utils/calculations';

export default function PriceChart() {
  const { selectedAsset, prices } = useCfd();
  const price = prices[selectedAsset];
  const spread = price ? (price.ask - price.bid).toFixed(2) : '0.00';

  return (
    <div className="price-chart">
      <div className="chart-header">
        <div className="asset-info">
          <h2 className="asset-symbol">{selectedAsset}</h2>
          <span className="asset-label">Perpetual Contract</span>
        </div>
        
        <div className="price-ticker">
          <div className="bid-ask">
            <div className="price-box bid">
              <span className="price-label">BID</span>
              <span className="price-value">{price?.bid.toLocaleString()}</span>
            </div>
            <div className="spread-indicator">
              <span className="spread-label">Spread</span>
              <span className="spread-value">${spread}</span>
            </div>
            <div className="price-box ask">
              <span className="price-label">ASK</span>
              <span className="price-value">{price?.ask.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-area">
        <div className="chart-placeholder">
          <svg className="chart-visual" viewBox="0 0 400 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--chart-grid)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Candlestick-style area chart */}
            <path 
              d="M0,150 L20,140 L40,145 L60,130 L80,135 L100,120 L120,125 L140,110 L160,115 L180,100 L200,95 L220,105 L240,90 L260,85 L280,75 L300,80 L320,70 L340,65 L360,60 L380,55 L400,50" 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="2"
            />
            <path 
              d="M0,150 L20,140 L40,145 L60,130 L80,135 L100,120 L120,125 L140,110 L160,115 L180,100 L200,95 L220,105 L240,90 L260,85 L280,75 L300,80 L320,70 L340,65 L360,60 L380,55 L400,50 L400,200 L0,200 Z" 
              fill="url(#chartGradient)"
            />
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02"/>
              </linearGradient>
            </defs>
          </svg>
          
          <div className="chart-overlay">
            <div className="ohlc-data">
              <span>O: {((price?.bid || 0) - 50).toLocaleString()}</span>
              <span>H: {((price?.ask || 0) + 150).toLocaleString()}</span>
              <span>L: {((price?.bid || 0) - 200).toLocaleString()}</span>
              <span className="text-profit">C: {price?.bid.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="timeframe-selector">
          {['1m', '5m', '15m', '1H', '4H', '1D'].map(tf => (
            <button key={tf} className={`tf-btn ${tf === '15m' ? 'active' : ''}`}>
              {tf}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .price-chart {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--background);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
        }
        
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        
        .asset-info {
          display: flex;
          flex-direction: column;
        }
        
        .asset-symbol {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--foreground);
          margin: 0;
        }
        
        .asset-label {
          font-size: 0.75rem;
          color: var(--foreground-tertiary);
        }
        
        .price-ticker {
          display: flex;
          align-items: center;
        }
        
        .bid-ask {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .price-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
        }
        
        .price-box.bid {
          background: var(--success-light);
        }
        
        .price-box.ask {
          background: var(--danger-light);
        }
        
        .price-label {
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        
        .bid .price-label { color: var(--success); }
        .ask .price-label { color: var(--danger); }
        
        .price-value {
          font-size: 0.9rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        
        .bid .price-value { color: var(--success); }
        .ask .price-value { color: var(--danger); }
        
        .spread-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 0.5rem;
        }
        
        .spread-label {
          font-size: 0.625rem;
          color: var(--foreground-tertiary);
        }
        
        .spread-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--foreground-secondary);
        }
        
        .chart-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .chart-placeholder {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        .chart-visual {
          width: 100%;
          height: 100%;
        }
        
        .chart-overlay {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
        }
        
        .ohlc-data {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--foreground-secondary);
          font-variant-numeric: tabular-nums;
        }
        
        .timeframe-selector {
          display: flex;
          gap: 0.25rem;
          padding: 0.75rem;
          border-top: 1px solid var(--border);
        }
        
        .tf-btn {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--foreground-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tf-btn:hover {
          background: var(--background-tertiary);
        }
        
        .tf-btn.active {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
