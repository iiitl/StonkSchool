'use client';

import { useEffect, useRef, useCallback } from 'react';
import { PriceUpdate } from '../types';

const WS_URL = process.env.NEXT_PUBLIC_CFD_WS_URL || 'ws://localhost:3002/ws/prices';
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

interface UseWebSocketPricesOptions {
  enabled?: boolean;
  onPriceUpdate?: (prices: Record<string, { bid: number; ask: number }>) => void;
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * WebSocket hook for real-time price updates
 * Handles connection, reconnection, and cleanup
 * Uses refs for callbacks to prevent reconnection loops
 */
export function useWebSocketPrices({
  enabled = true,
  onPriceUpdate,
  onConnectionChange,
}: UseWebSocketPricesOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY_MS);
  const pricesRef = useRef<Record<string, { bid: number; ask: number }>>({});
  
  // Store callbacks in refs to prevent connect from being recreated on every render
  const onPriceUpdateRef = useRef(onPriceUpdate);
  const onConnectionChangeRef = useRef(onConnectionChange);
  
  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
    onConnectionChangeRef.current = onConnectionChange;
  });

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;
    
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {

        reconnectDelayRef.current = RECONNECT_DELAY_MS; // Reset delay on successful connect
        onConnectionChangeRef.current?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: PriceUpdate = JSON.parse(event.data);
          
          if (data.type === 'price_update') {
            pricesRef.current = {
              ...pricesRef.current,
              [data.symbol]: {
                bid: data.bid,
                ask: data.ask,
              },
            };
            onPriceUpdateRef.current?.({ ...pricesRef.current });
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
          console.error('[CFD WS] Failed to parse message:', error);
          }
        }
      };

      ws.onerror = (error) => {
        if (process.env.NODE_ENV === "development") {
        console.error('[CFD WS] WebSocket error:', error);
        }
      };

      ws.onclose = (event) => {

        onConnectionChangeRef.current?.(false);
        
        // Attempt reconnection with exponential backoff
        if (enabled) {
          clearReconnectTimeout();
          reconnectTimeoutRef.current = setTimeout(() => {

            connect();
            // Exponential backoff with max limit
            reconnectDelayRef.current = Math.min(
              reconnectDelayRef.current * 2,
              MAX_RECONNECT_DELAY_MS
            );
          }, reconnectDelayRef.current);
        }
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
      console.error('[CFD WS] Failed to create WebSocket:', error);
      }
    }
  }, [enabled, clearReconnectTimeout]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, connect, clearReconnectTimeout]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    prices: pricesRef.current,
  };
}
