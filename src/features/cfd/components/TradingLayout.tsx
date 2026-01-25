'use client';

import React, { useState } from 'react';
import WalletBar from './WalletBar';
import PriceChart from './PriceChart';
import OrderForm from './OrderForm';
import PositionTable from './PositionTable';
import TradeHistory from './TradeHistory';
import MarginCallModal from './MarginCallModal';
import { usePriceSimulation } from '../hooks/usePriceSimulation';

type BottomTab = 'positions' | 'orders' | 'history';

export default function TradingLayout() {
  const [activeTab, setActiveTab] = useState<BottomTab>('positions');
  
  // Enable real-time price simulation
  usePriceSimulation(true);

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
