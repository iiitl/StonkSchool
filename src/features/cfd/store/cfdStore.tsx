'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { calculateMarginLevel, calculatePnL, calculatePnLPercentage } from '../utils/calculations';
import * as api from '../api';
import { 
  Asset, 
  ContestParticipant, 
  Position as ApiPosition, 
  Order,
  DisplayPosition, 
  DisplayTradeRecord,
  OpenPositionRequest,
} from '../types';

// ============== Constants ==============
const POSITION_POLL_INTERVAL = 3000; // 3 seconds

// ============== Types ==============

// Callback type for auto-close events
export type AutoCloseEvent = {
  position: DisplayPosition;
  closeReason: 'LIQUIDATION' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'MARKET_CLOSE';
  pnl: number;
};

export type { DisplayPosition as Position, DisplayTradeRecord as TradeRecord };

export interface CfdState {
  // Contest context
  contestId: string | null;
  
  // Account (from ContestParticipant)
  balance: number;
  equity: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  isLiquidated: boolean;
  
  // Trading
  selectedLeverage: number;
  selectedAsset: string;
  assets: Asset[];
  
  // Positions (base positions without live price updates)
  positions: DisplayPosition[];
  
  // Trade History
  tradeHistory: DisplayTradeRecord[];
  
  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  priceConnected: boolean;
}

// Separate type for price-related data that updates frequently
export interface PriceData {
  prices: Record<string, { bid: number; ask: number }>;
  priceConnected: boolean;
}

interface CfdContextType extends Omit<CfdState, 'priceConnected'> {
  setContestId: (contestId: string) => void;
  setLeverage: (leverage: number) => void;
  setAsset: (asset: string) => void;
  openPosition: (position: Omit<OpenPositionRequest, 'asset_id'> & { symbol: string }) => Promise<void>;
  closePosition: (positionId: string) => Promise<void>;
  updatePrices: (prices: Record<string, { bid: number; ask: number }>) => void;
  setPriceConnected: (connected: boolean) => void;
  refreshData: () => Promise<void>;
  // Subscription-based price access
  subscribeToPrices: (callback: (data: PriceData) => void) => () => void;
  getCurrentPrices: () => Record<string, { bid: number; ask: number }>;
  isPriceConnected: () => boolean;
}

const defaultState: CfdState = {
  contestId: null,
  balance: 0,
  equity: 0,
  usedMargin: 0,
  freeMargin: 0,
  marginLevel: 100,
  isLiquidated: false,
  selectedLeverage: 10,
  selectedAsset: '',
  assets: [],
  positions: [],
  tradeHistory: [],
  isLoading: true,
  isSubmitting: false,
  error: null,
  priceConnected: false,
};

// ============== Helpers ==============

/**
 * Convert API position to display format
 */
function mapPosition(pos: ApiPosition, prices: Record<string, { bid: number; ask: number }>): DisplayPosition {
  const direction = pos.side.toLowerCase() as 'long' | 'short';
  const entryPrice = parseFloat(pos.entry_price);
  const markPrice = parseFloat(pos.current_mark_price);
  const quantity = parseFloat(pos.quantity);
  const margin = parseFloat(pos.initial_margin);
  
  // If we have live prices, use them to recalc PnL
  const livePrice = prices[pos.asset.symbol];
  const currentMark = livePrice 
    ? (direction === 'long' ? livePrice.bid : livePrice.ask)
    : markPrice;
  
  const pnl = calculatePnL(direction, entryPrice, currentMark, quantity);
  const pnlPercentage = calculatePnLPercentage(pnl, margin);

  return {
    id: pos.id,
    symbol: pos.asset.symbol,
    assetId: pos.asset.id,
    direction,
    quantity,
    entryPrice,
    markPrice: currentMark,
    margin,
    leverage: pos.leverage,
    liquidationPrice: parseFloat(pos.liquidation_price),
    stopLoss: pos.stop_loss ? parseFloat(pos.stop_loss) : undefined,
    takeProfit: pos.take_profit ? parseFloat(pos.take_profit) : undefined,
    pnl,
    pnlPercentage,
    openTime: new Date(pos.created_at),
  };
}

/**
 * Convert API order to trade record display format
 */
function mapOrder(order: Order): DisplayTradeRecord {
  const direction = order.side?.toLowerCase() as 'long' | 'short' || 'long';
  const entryPrice = order.entry_price ? parseFloat(order.entry_price) : 0;
  const exitPrice = parseFloat(order.executed_price);
  const quantity = parseFloat(order.executed_quantity);
  // Rough margin calculation (actual comes from position)
  const margin = order.leverage ? (entryPrice * quantity) / order.leverage : 0;
  const pnl = order.realized_pnl || 0;
  const pnlPercentage = margin > 0 ? (pnl / margin) * 100 : 0;

  return {
    id: order.id,
    symbol: order.asset_symbol || 'Unknown',
    direction,
    quantity,
    entryPrice,
    exitPrice,
    margin,
    leverage: order.leverage || 1,
    pnl,
    pnlPercentage,
    openTime: order.position_opened_at ? new Date(order.position_opened_at) : new Date(order.created_at),
    closeTime: new Date(order.created_at),
    type: order.type,
  };
}

const CfdContext = createContext<CfdContextType | undefined>(undefined);

export function CfdProvider({ children, initialContestId }: { children: ReactNode; initialContestId?: string }) {
  const [state, setState] = useState<CfdState>({
    ...defaultState,
    contestId: initialContestId || null,
  });

  // Store prices in a ref to avoid re-renders
  const pricesRef = useRef<Record<string, { bid: number; ask: number }>>({});
  const priceConnectedRef = useRef(false);
  const priceSubscribersRef = useRef<Set<(data: PriceData) => void>>(new Set());
  const basePositionsRef = useRef<DisplayPosition[]>([]);

  // ============== Data Loading ==============
  const loadData = useCallback(async (contestId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load all data in parallel
      const [assets, participant, positions, orders] = await Promise.all([
        api.getAssets(),
        api.getParticipant(contestId),
        api.getPositions(contestId),
        api.getOrders(contestId),
      ]);

      // Map positions to display format
      const displayPositions = positions
        .filter(p => p.status === 'OPEN')
        .map(p => mapPosition(p, pricesRef.current));

      // Store base positions in ref for price updates
      basePositionsRef.current = displayPositions;

      // Map orders to trade history (only closed orders)
      const displayOrders = orders
        .filter(o => o.type !== 'MARKET_OPEN')
        .map(mapOrder);

      // Calculate derived values
      const usedMargin = displayPositions.reduce((sum, p) => sum + p.margin, 0);
      const totalPnL = displayPositions.reduce((sum, p) => sum + p.pnl, 0);
      // Ensure balance is a number (API may return string)
      const balance = Number(participant.balance);
      const equity = balance + totalPnL;
      const freeMargin = equity - usedMargin;
      const marginLevel = calculateMarginLevel(equity, usedMargin);

      setState(prev => ({
        ...prev,
        isLoading: false,
        assets,
        positions: displayPositions,
        tradeHistory: displayOrders,
        balance,
        equity,
        usedMargin,
        freeMargin,
        marginLevel,
        isLiquidated: participant.is_liquidated,
         selectedAsset: assets.find(a => a.symbol === 'ETH/USD')?.symbol
          ?? (assets.length > 0 ? assets[0].symbol : ''),
    } catch (error) {
      console.error('[CFD Store] Failed to load data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load trading data',
      }));
    }
  }, []);

  // Load data when contestId changes
  useEffect(() => {
    if (state.contestId) {
      loadData(state.contestId);
    }
  }, [state.contestId, loadData]);

  // ============== Position Polling ==============
  // Poll positions every 3 seconds to detect server-side auto-closes
  useEffect(() => {
    if (!state.contestId || state.isLoading) return;

    const contestId = state.contestId;

    const pollPositions = async () => {
      try {
        const [participant, positions, orders] = await Promise.all([
          api.getParticipant(contestId),
          api.getPositions(contestId),
          api.getOrders(contestId),
        ]);

        // Get currently open positions from API
        const openPositions = positions.filter(p => p.status === 'OPEN');
        const openPositionIds = new Set(openPositions.map(p => p.id));

        // Detect positions that were closed server-side
        const closedPositionIds = basePositionsRef.current
          .filter(p => !openPositionIds.has(p.id))
          .map(p => p.id);

        if (closedPositionIds.length > 0) {


          // Find closing orders for these positions
          const closingOrders = orders.filter(
            o => o.position_id && closedPositionIds.includes(o.position_id) && o.type !== 'MARKET_OPEN'
          );

          // Create trade records from closing orders
          const newTradeRecords = closingOrders.map(mapOrder);

          // Update state with new positions and trade records
          const displayPositions = openPositions.map(p => mapPosition(p, pricesRef.current));
          basePositionsRef.current = displayPositions;

          // Calculate new values
          const usedMargin = displayPositions.reduce((sum, p) => sum + p.margin, 0);
          const totalPnL = displayPositions.reduce((sum, p) => sum + p.pnl, 0);
          const balance = Number(participant.balance);
          const equity = balance + totalPnL;
          const freeMargin = equity - usedMargin;
          const marginLevel = calculateMarginLevel(equity, usedMargin);

          setState(prev => {
            // Merge new trade records, avoiding duplicates
            const existingIds = new Set(prev.tradeHistory.map(t => t.id));
            const uniqueNewRecords = newTradeRecords.filter(t => !existingIds.has(t.id));

            return {
              ...prev,
              positions: displayPositions,
              tradeHistory: [...uniqueNewRecords, ...prev.tradeHistory],
              balance,
              equity,
              usedMargin,
              freeMargin,
              marginLevel,
              isLiquidated: participant.is_liquidated,
            };
          });
        } else {
          // Just update liquidation status and balance if changed - use functional update to access current state
          setState(prev => {
            const balance = Number(participant.balance);
            if (participant.is_liquidated !== prev.isLiquidated || 
                balance !== prev.balance) {
              return {
                ...prev,
                balance,
                isLiquidated: participant.is_liquidated,
              };
            }
            return prev; // No change, no re-render
          });
        }
      } catch (error) {
        // Silently log polling errors - don't disrupt UI
        console.error('[CFD Store] Position poll error:', error);
      }
    };

    const intervalId = setInterval(pollPositions, POSITION_POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [state.contestId, state.isLoading]); // Only depend on contestId and isLoading to prevent interval recreation

  // ============== Actions ==============
  const setContestId = useCallback((contestId: string) => {
    setState(prev => ({ ...prev, contestId }));
  }, []);

  const setLeverage = useCallback((leverage: number) => {
    setState(prev => ({ ...prev, selectedLeverage: leverage }));
  }, []);

  const setAsset = useCallback((asset: string) => {
    setState(prev => ({ ...prev, selectedAsset: asset }));
  }, []);

  const openPosition = useCallback(async (
    positionData: Omit<OpenPositionRequest, 'asset_id'> & { symbol: string }
  ) => {
    if (!state.contestId) {
      throw new Error('No contest selected');
    }

    // Find asset ID from symbol
    const asset = state.assets.find(a => a.symbol === positionData.symbol);
    if (!asset) {
      throw new Error(`Asset not found: ${positionData.symbol}`);
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const newPosition = await api.openPosition(state.contestId, {
        asset_id: asset.id,
        side: positionData.side,
        quantity: positionData.quantity,
        leverage: positionData.leverage,
        stop_loss: positionData.stop_loss,
        take_profit: positionData.take_profit,
      });

      const displayPos = mapPosition(newPosition, pricesRef.current);
      basePositionsRef.current = [...basePositionsRef.current, displayPos];

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        positions: [...prev.positions, displayPos],
        usedMargin: prev.usedMargin + displayPos.margin,
        balance: prev.balance - displayPos.margin,
        freeMargin: prev.freeMargin - displayPos.margin,
      }));
    } catch (error) {
      console.error('[CFD Store] Failed to open position:', error);
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to open position',
      }));
      throw error;
    }
  }, [state.contestId, state.assets]);

  const closePosition = useCallback(async (positionId: string) => {
    if (!state.contestId) {
      throw new Error('No contest selected');
    }

    const position = state.positions.find(p => p.id === positionId);
    if (!position) {
      throw new Error('Position not found');
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const result = await api.closePosition(state.contestId, positionId);

      // Create trade record from closed position
      const tradeRecord: DisplayTradeRecord = {
        id: `h${Date.now()}`,
        symbol: position.symbol,
        direction: position.direction,
        quantity: position.quantity,
        entryPrice: position.entryPrice,
        exitPrice: parseFloat(result.executed_price),
        margin: position.margin,
        leverage: position.leverage,
        pnl: result.realized_pnl,
        pnlPercentage: (result.realized_pnl / position.margin) * 100,
        openTime: position.openTime,
        closeTime: new Date(),
        type: 'MARKET_CLOSE',
      };

      basePositionsRef.current = basePositionsRef.current.filter(p => p.id !== positionId);

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        positions: prev.positions.filter(p => p.id !== positionId),
        tradeHistory: [tradeRecord, ...prev.tradeHistory],
        usedMargin: prev.usedMargin - position.margin,
        balance: prev.balance + position.margin + result.realized_pnl,
      }));
    } catch (error) {
      console.error('[CFD Store] Failed to close position:', error);
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to close position',
      }));
      throw error;
    }
  }, [state.contestId, state.positions]);

  // Update prices WITHOUT triggering state updates
  // This notifies subscribers directly via callback pattern
  const updatePrices = useCallback((prices: Record<string, { bid: number; ask: number }>) => {
    pricesRef.current = prices;
    
    // Notify all subscribers of price update
    const priceData: PriceData = {
      prices,
      priceConnected: priceConnectedRef.current,
    };
    
    priceSubscribersRef.current.forEach(callback => {
      try {
        callback(priceData);
      } catch (e) {
        console.error('[CFD Store] Price subscriber error:', e);
      }
    });
  }, []);

  const setPriceConnected = useCallback((connected: boolean) => {
    priceConnectedRef.current = connected;
    // Only update state for connection status changes (relatively rare)
    setState(prev => {
      if (prev.priceConnected === connected) return prev;
      return { ...prev, priceConnected: connected };
    });
  }, []);

  const refreshData = useCallback(async () => {
    if (state.contestId) {
      await loadData(state.contestId);
    }
  }, [state.contestId, loadData]);

  // Subscribe to price updates (returns unsubscribe function)
  const subscribeToPrices = useCallback((callback: (data: PriceData) => void) => {
    priceSubscribersRef.current.add(callback);
    // Immediately call with current prices
    callback({
      prices: pricesRef.current,
      priceConnected: priceConnectedRef.current,
    });
    return () => {
      priceSubscribersRef.current.delete(callback);
    };
  }, []);

  // Get current prices without subscribing
  const getCurrentPrices = useCallback(() => pricesRef.current, []);
  
  const isPriceConnected = useCallback(() => priceConnectedRef.current, []);

  // ============== Context Value ==============
  const contextValue: CfdContextType = useMemo(() => ({
    ...state,
    setContestId,
    setLeverage,
    setAsset,
    openPosition,
    closePosition,
    updatePrices,
    setPriceConnected,
    refreshData,
    subscribeToPrices,
    getCurrentPrices,
    isPriceConnected,
  }), [state, setContestId, setLeverage, setAsset, openPosition, closePosition, updatePrices, setPriceConnected, refreshData, subscribeToPrices, getCurrentPrices, isPriceConnected]);

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

/**
 * Hook for components that need live price updates
 * Uses subscription pattern to avoid context re-renders
 */
export function useLivePrices() {
  const { subscribeToPrices, getCurrentPrices, isPriceConnected, positions, balance, usedMargin } = useCfd();
  const [priceData, setPriceData] = useState<PriceData>({
    prices: {},
    priceConnected: false,
  });

  useEffect(() => {
    const unsubscribe = subscribeToPrices((data) => {
      setPriceData(data);
    });
    return unsubscribe;
  }, [subscribeToPrices]);

  // Calculate live positions with updated prices
  const livePositions = useMemo(() => {
    return positions.map(position => {
      const price = priceData.prices[position.symbol];
      if (!price) return position;

      const markPrice = position.direction === 'long' ? price.bid : price.ask;
      const pnl = calculatePnL(position.direction, position.entryPrice, markPrice, position.quantity);
      const pnlPercentage = calculatePnLPercentage(pnl, position.margin);

      return { ...position, markPrice, pnl, pnlPercentage };
    });
  }, [positions, priceData.prices]);

  // Calculate live equity
  const liveEquity = useMemo(() => {
    const totalPnL = livePositions.reduce((sum, p) => sum + p.pnl, 0);
    return balance + totalPnL;
  }, [livePositions, balance]);

  const liveFreeMargin = useMemo(() => liveEquity - usedMargin, [liveEquity, usedMargin]);
  const liveMarginLevel = useMemo(() => calculateMarginLevel(liveEquity, usedMargin), [liveEquity, usedMargin]);

  return {
    prices: priceData.prices,
    priceConnected: priceData.priceConnected,
    livePositions,
    liveEquity,
    liveFreeMargin,
    liveMarginLevel,
  };
}
