'use client';

import React, { useState } from 'react';
import WalletBar from './WalletBar';
import PriceChart from './PriceChart';
import OrderForm from './OrderForm';
import PositionTable from './PositionTable';
import TradeHistory from './TradeHistory';
import MarginCallModal from './MarginCallModal';
import { useCfd } from '../store/cfdStore';
import { useWebSocketPrices } from '../hooks/useWebSocketPrices';

type BottomTab = 'positions' | 'orders' | 'history';

export default function TradingLayout() {
  const [activeTab, setActiveTab] = useState<BottomTab>('positions');
  const { updatePrices, setPriceConnected, isLoading, error } = useCfd();
  
  // Connect to real-time price feed
  useWebSocketPrices({
    enabled: true,
    onPriceUpdate: updatePrices,
    onConnectionChange: setPriceConnected,
  });

  if (isLoading) {
    return (
      <div className="trading-layout">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading trading data...</p>
        </div>
        <style jsx>{`
          .trading-layout {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--background-secondary);
          }
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            color: var(--foreground-secondary);
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trading-layout">
        <div className="error-container">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="var(--danger)" strokeWidth="2"/>
            <path d="M24 14v12M24 30v4" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Failed to load trading data</h3>
          <p>{error}</p>
        </div>
        <style jsx>{`
          .trading-layout {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--background-secondary);
          }
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            text-align: center;
            color: var(--foreground-secondary);
          }
          .error-container h3 {
            margin: 0;
            color: var(--danger);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="trading-layout">
      <WalletBar />
      
      <main className="trading-main">
        {/* Chart + Order Panel */}
        <div className="trading-grid">
          {/* Left: Chart Area */}
          <div className="chart-pane">
            <PriceChart />
          </div>
          
          {/* Right: Order Entry */}
          <div className="order-pane">
            <OrderForm />
          </div>
        </div>
        
        {/* Bottom: Positions Panel */}
        <div className="positions-panel card">
          <div className="panel-header">
            <button 
              className={`tab-btn ${activeTab === 'positions' ? 'active' : ''}`}
              onClick={() => setActiveTab('positions')}
            >
              Open Positions
            </button>
            <button 
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Pending Orders
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Trade History
            </button>
          </div>
          
          <div className="panel-content">
            {activeTab === 'positions' && <PositionTable />}
            {activeTab === 'orders' && (
              <div className="empty-tab">No pending orders</div>
            )}
            {activeTab === 'history' && <TradeHistory />}
          </div>
        </div>
      </main>
      
      <MarginCallModal />

      <style jsx>{`
        .trading-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--background-secondary);
        }
        
        .trading-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem 1.5rem;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }
        
        .trading-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 1rem;
          min-height: 500px;
        }
        
        .chart-pane {
          min-height: 400px;
        }
        
        .order-pane {
          max-height: 600px;
          overflow-y: auto;
        }
        
        .positions-panel {
          overflow: hidden;
        }
        
        .panel-header {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--border);
          background: var(--background);
        }
        
        .tab-btn {
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground-secondary);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -1px;
        }
        
        .tab-btn:hover {
          color: var(--foreground);
        }
        
        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
          font-weight: 600;
        }
        
        .panel-content {
          background: var(--background);
        }
        
        .empty-tab {
          padding: 3rem;
          text-align: center;
          color: var(--foreground-tertiary);
        }
        
        @media (max-width: 1024px) {
          .trading-grid {
            grid-template-columns: 1fr;
          }
          
          .order-pane {
            max-height: none;
          }
        }
        
        @media (max-width: 768px) {
          .trading-main {
            padding: 0.75rem;
          }
          
          .panel-header {
            overflow-x: auto;
          }
          
          .tab-btn {
            padding: 0.75rem 1rem;
            font-size: 0.8rem;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}
