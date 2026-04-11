// CFD Trading API Service
// Handles all communication with the CFD backend

import {
  Asset,
  Contest,
  ContestParticipant,
  ContestParticipantListItem,
  JoinContestResponse,
  Position,
  Order,
  OpenPositionRequest,
  UpdatePositionRequest,
  ClosePositionResponse,
} from './types';
import { sharedFetch } from '../../utils/api';

const CFD_API_URL = process.env.NEXT_PUBLIC_CFD_API_URL || 'http://localhost:3002';
const REQUEST_TIMEOUT = 15000; // 15 second timeout

export class CfdApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'CfdApiError';
  }
}

/**
 * Fetch wrapper with timeout, error handling, and auth
 */
async function cfdFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return sharedFetch<T, CfdApiError>(
    `${CFD_API_URL}${endpoint}`,
    options,
    REQUEST_TIMEOUT,
    CfdApiError
  );
}

// ============== Assets API ==============

/**
 * Get list of all active trading assets
 * No authentication required
 */
export async function getAssets(): Promise<Asset[]> {
  return cfdFetch<Asset[]>('/api/assets');
}

// ============== Contests API ==============

/**
 * Get list of all available contests
 * No authentication required
 */
export async function getContests(): Promise<Contest[]> {
  return cfdFetch<Contest[]>('/api/contests');
}

// ============== Contest Participant API ==============

/**
 * Get current user's contest wallet
 */
export async function getParticipant(contestId: string): Promise<ContestParticipant> {
  return cfdFetch<ContestParticipant>(`/api/contests/${contestId}/participant`);
}

/**
 * Join a contest and receive initial trading balance
 * Only works for UPCOMING contests
 * Requires authentication
 */
export async function joinContest(contestId: string): Promise<JoinContestResponse> {
  return cfdFetch<JoinContestResponse>(`/api/contests/${contestId}/join`, {
    method: 'POST',
  });
}

/**
 * Get all participants in a contest (sorted by equity for leaderboard)
 * No authentication required
 */
export async function getContestParticipants(contestId: string): Promise<ContestParticipantListItem[]> {
  return cfdFetch<ContestParticipantListItem[]>(`/api/contests/${contestId}/participants`);
}

// ============== Positions API ==============

/**
 * Get all open positions for current user in a contest
 */
export async function getPositions(contestId: string): Promise<Position[]> {
  return cfdFetch<Position[]>(`/api/contests/${contestId}/positions`);
}

/**
 * Open a new CFD position
 */
export async function openPosition(
  contestId: string,
  data: OpenPositionRequest
): Promise<Position> {
  return cfdFetch<Position>(`/api/contests/${contestId}/positions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Close a position at market price
 */
export async function closePosition(
  contestId: string,
  positionId: string
): Promise<ClosePositionResponse> {
  return cfdFetch<ClosePositionResponse>(
    `/api/contests/${contestId}/positions/${positionId}`,
    { method: 'DELETE' }
  );
}

/**
 * Update stop-loss and/or take-profit for a position
 */
export async function updatePosition(
  contestId: string,
  positionId: string,
  data: UpdatePositionRequest
): Promise<Position> {
  return cfdFetch<Position>(
    `/api/contests/${contestId}/positions/${positionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

// ============== Orders API ==============

/**
 * Get closed/settled orders (trade history)
 */
export async function getOrders(contestId: string): Promise<Order[]> {
  return cfdFetch<Order[]>(`/api/contests/${contestId}/orders`);
}

export { CfdApiError as ApiError };
