// CFD Trading API Types
// Matches the backend API specification

// ============== Enums ==============
export type PositionSide = 'LONG' | 'SHORT';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED';
export type OrderType = 'MARKET_OPEN' | 'MARKET_CLOSE' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION';

// ============== Core Models ==============
export interface Asset {
  id: string;
  symbol: string;
  max_leverage: number;
  is_active: boolean;
}

export interface ContestParticipant {
  id: string;
  contest_id: string;
  user_id: string;
  balance: number;
  locked_margin: number;
  current_equity: number;
  is_liquidated: boolean;
}

// Response when joining a contest
export interface JoinContestResponse {
  id: string;
  contest_id: string;
  user_id: string;
  balance: number;
  locked_margin: number;
  current_equity: number;
  is_liquidated: boolean;
}

// Participant info for leaderboard/list view
export interface ContestParticipantListItem {
  id: string;
  user_id: string;
  balance: number;
  current_equity: number;
  is_liquidated: boolean;
  joined_at: string | null;
  final_rank: number | null;
}

export type ContestStatus = 'UPCOMING' | 'LIVE' | 'ENDED' | 'SETTLED';

export interface Contest {
  id: string;
  title: string;
  entry_fee: string;
  initial_balance: string;
  start_time: string;
  end_time: string;
  status: ContestStatus;
  created_at: string;
}

export interface Position {
  id: string;
  asset: { id: string; symbol: string };
  side: PositionSide;
  entry_price: string;
  current_mark_price: string;
  quantity: string;
  leverage: number;
  initial_margin: string;
  liquidation_price: string;
  stop_loss: string | null;
  take_profit: string | null;
  unrealized_pnl: string;
  status: PositionStatus;
  created_at: string;
}

export interface Order {
  id: string;
  position_id: string;
  asset_symbol: string | null;
  side: string | null;
  type: OrderType;
  entry_price: string | null;
  executed_price: string;
  executed_quantity: string;
  realized_pnl: number | null;
  leverage: number | null;
  fee: number;
  created_at: string;
  position_opened_at: string | null;
}

// ============== WebSocket ==============
export interface PriceUpdate {
  type: 'price_update';
  symbol: string;
  bid: number;
  ask: number;
  timestamp: string;
}

// ============== Request Bodies ==============
export interface OpenPositionRequest {
  asset_id: string;
  side: PositionSide;
  quantity: number;
  leverage: number;
  stop_loss?: number;
  take_profit?: number;
}

export interface UpdatePositionRequest {
  stop_loss?: number;
  take_profit?: number;
}

// ============== Response Bodies ==============
export interface ClosePositionResponse {
  position_id: string;
  realized_pnl: number;
  executed_price: string;
}

export interface ApiError {
  error: string;
  status: number;
}

// ============== Frontend Display Types ==============
// These map backend types to frontend display format

export interface DisplayPosition {
  id: string;
  symbol: string;
  assetId: string;
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

export interface DisplayTradeRecord {
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
  type: OrderType;
}
