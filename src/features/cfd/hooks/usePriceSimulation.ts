'use client';

import { useEffect, useRef } from 'react';
import { useCfd } from '../store/cfdStore';

/**
 * Custom hook that simulates real-time price updates
 * In production, this would connect to a WebSocket
 */
export function usePriceSimulation(enabled: boolean = true) {
  const { updatePrices, prices } = useCfd();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Base prices for simulation
    const basePrices = {
      'BTC/USD': { mid: 43250, volatility: 50 },
      'ETH/USD': { mid: 2280, volatility: 5 },
      'SOL/USD': { mid: 98.5, volatility: 0.5 },
    };

    // Simulate price movement with random walk
    const simulatePriceUpdate = () => {
      const newPrices: Record<string, { bid: number; ask: number }> = {};

      Object.entries(basePrices).forEach(([symbol, { mid, volatility }]) => {
        // Get current price or use base
        const currentMid = prices[symbol] 
          ? (prices[symbol].bid + prices[symbol].ask) / 2 
          : mid;
        
        // Random walk with mean reversion
        const change = (Math.random() - 0.5) * volatility;
        const meanReversion = (mid - currentMid) * 0.01;
        const newMid = currentMid + change + meanReversion;
        
        // Calculate spread based on asset (tighter for larger assets)
        const spreadPercent = symbol === 'BTC/USD' ? 0.0002 : 0.0005;
        const halfSpread = newMid * spreadPercent;
        
        newPrices[symbol] = {
          bid: parseFloat((newMid - halfSpread).toFixed(2)),
          ask: parseFloat((newMid + halfSpread).toFixed(2)),
        };
      });

      updatePrices(newPrices);
    };

    // Update prices every 1.5 seconds
    intervalRef.current = setInterval(simulatePriceUpdate, 1500);

    // Initial update
    simulatePriceUpdate();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, updatePrices]);
}

/**
 * Hook to track previous value for comparison
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}
