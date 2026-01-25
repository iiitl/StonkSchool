'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { calculateMarginLevel, calculatePnL, calculatePnLPercentage } from '../utils/calculations';

// Types
export interface Position {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  leverage: number;
  liquidationPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  pnlPercentage: number;
  openTime: Date;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  margin: number;
  leverage: number;
  pnl: number;
  pnlPercentage: number;
  openTime: Date;
  closeTime: Date;
}

export interface CfdState {
  // Account
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  
  // Trading
  selectedLeverage: number;
  selectedAsset: string;
  
  // Positions
  positions: Position[];
  
  // Trade History
  tradeHistory: TradeRecord[];
  
  // Market Data (mock)
  prices: Record<string, { bid: number; ask: number }>;
}

interface CfdContextType extends CfdState {
  setLeverage: (leverage: number) => void;
  setAsset: (asset: string) => void;
  openPosition: (position: Omit<Position, 'id' | 'pnl' | 'pnlPercentage' | 'openTime' | 'markPrice'>) => void;
  closePosition: (positionId: string) => void;
  updatePrices: (prices: Record<string, { bid: number; ask: number }>) => void;
}

const defaultState: CfdState = {
  balance: 10000,
  equity: 10000,
  usedMargin: 0,
  freeMargin: 10000,
  marginLevel: 100,
  selectedLeverage: 10,
  selectedAsset: 'BTC/USD',
  positions: [],
  tradeHistory: [],
  prices: {
    'BTC/USD': { bid: 43250.50, ask: 43260.50 },
    'ETH/USD': { bid: 2280.25, ask: 2281.75 },
    'SOL/USD': { bid: 98.50, ask: 98.75 },
  },
};

// Mock positions for demo
const mockPositions: Position[] = [
  {
    id: '1',
    symbol: 'BTC/USD',
    direction: 'long',
    quantity: 0.05,
    entryPrice: 42800,
    markPrice: 43255,
    margin: 214,
    leverage: 10,
    liquidationPrice: 38520,
    pnl: 22.75,
    pnlPercentage: 10.63,
    openTime: new Date('2024-01-25T10:30:00'),
  },
  {
    id: '2',
    symbol: 'ETH/USD',
    direction: 'short',
    quantity: 0.5,
    entryPrice: 2310,
    markPrice: 2281,
    margin: 115.5,
    leverage: 10,
    liquidationPrice: 2541,
    pnl: 14.5,
    pnlPercentage: 12.55,
    openTime: new Date('2024-01-25T14:15:00'),
  },
];

// Mock trade history
const mockTradeHistory: TradeRecord[] = [
  {
    id: 'h1',
    symbol: 'BTC/USD',
    direction: 'long',
    quantity: 0.02,
    entryPrice: 42500,
    exitPrice: 42950,
    margin: 85,
    leverage: 10,
    pnl: 9,
    pnlPercentage: 10.59,
    openTime: new Date('2024-01-24T09:00:00'),
    closeTime: new Date('2024-01-24T15:30:00'),
  },
  {
    id: 'h2',
    symbol: 'ETH/USD',
    direction: 'short',
    quantity: 1,
    entryPrice: 2350,
    exitPrice: 2290,
    margin: 235,
    leverage: 10,
    pnl: 60,
    pnlPercentage: 25.53,
    openTime: new Date('2024-01-24T11:00:00'),
    closeTime: new Date('2024-01-24T18:00:00'),
  },
  {
    id: 'h3',
    symbol: 'SOL/USD',
    direction: 'long',
    quantity: 5,
    entryPrice: 95,
    exitPrice: 92,
    margin: 47.5,
    leverage: 10,
    pnl: -15,
    pnlPercentage: -31.58,
    openTime: new Date('2024-01-23T10:00:00'),
    closeTime: new Date('2024-01-23T14:00:00'),
  },
];

const CfdContext = createContext<CfdContextType | undefined>(undefined);

export function CfdProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CfdState>({
    ...defaultState,
    positions: mockPositions,
    tradeHistory: mockTradeHistory,
    usedMargin: mockPositions.reduce((sum, p) => sum + p.margin, 0),
  });

  // Calculate derived values
  const totalPnL = state.positions.reduce((sum, p) => sum + p.pnl, 0);
  const equity = state.balance + totalPnL;
  const freeMargin = equity - state.usedMargin;
  const marginLevel = calculateMarginLevel(equity, state.usedMargin);

  const setLeverage = useCallback((leverage: number) => {
    setState(prev => ({ ...prev, selectedLeverage: leverage }));
  }, []);

  const setAsset = useCallback((asset: string) => {
    setState(prev => ({ ...prev, selectedAsset: asset }));
  }, []);

  const openPosition = useCallback((positionData: Omit<Position, 'id' | 'pnl' | 'pnlPercentage' | 'openTime' | 'markPrice'>) => {
    const price = state.prices[positionData.symbol];
    const markPrice = positionData.direction === 'long' ? price.ask : price.bid;
    
    const newPosition: Position = {
      ...positionData,
      id: Date.now().toString(),
      markPrice,
      pnl: 0,
      pnlPercentage: 0,
      openTime: new Date(),
    };

    setState(prev => ({
      ...prev,
      positions: [...prev.positions, newPosition],
      usedMargin: prev.usedMargin + positionData.margin,
    }));
  }, [state.prices]);

  const closePosition = useCallback((positionId: string) => {
    setState(prev => {
      const position = prev.positions.find(p => p.id === positionId);
      if (!position) return prev;

      // Add to trade history
      const tradeRecord: TradeRecord = {
        id: `h${Date.now()}`,
        symbol: position.symbol,
        direction: position.direction,
        quantity: position.quantity,
        entryPrice: position.entryPrice,
        exitPrice: position.markPrice,
        margin: position.margin,
        leverage: position.leverage,
        pnl: position.pnl,
        pnlPercentage: position.pnlPercentage,
        openTime: position.openTime,
        closeTime: new Date(),
      };

      return {
        ...prev,
        positions: prev.positions.filter(p => p.id !== positionId),
        tradeHistory: [tradeRecord, ...prev.tradeHistory],
        usedMargin: prev.usedMargin - position.margin,
        balance: prev.balance + position.pnl,
      };
    });
  }, []);

  const updatePrices = useCallback((prices: Record<string, { bid: number; ask: number }>) => {
    setState(prev => {
      const updatedPositions = prev.positions.map(position => {
        const price = prices[position.symbol];
        if (!price) return position;
        
        const markPrice = position.direction === 'long' ? price.bid : price.ask;
        const pnl = calculatePnL(position.direction, position.entryPrice, markPrice, position.quantity);
        const pnlPercentage = calculatePnLPercentage(pnl, position.margin);
        
        return { ...position, markPrice, pnl, pnlPercentage };
      });

      return { ...prev, prices, positions: updatedPositions };
    });
  }, []);

  const contextValue: CfdContextType = {
    ...state,
    equity,
    freeMargin,
    marginLevel,
    setLeverage,
    setAsset,
    openPosition,
    closePosition,
    updatePrices,
  };

  return (
    <CfdContext.Provider value={contextValue}>
      {children}
    </CfdContext.Provider>
  );
}

export function useCfd() {
  const context = useContext(CfdContext);
  if (context === undefined) {
    throw new Error('useCfd must be used within a CfdProvider');
  }
  return context;
}
