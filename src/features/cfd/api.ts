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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${CFD_API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      credentials: 'include', // Include httpOnly cookies for auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new CfdApiError(
        error.error || `Request failed with status ${response.status}`,
        response.status,
        error.code
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof CfdApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new CfdApiError('Request timed out', 408, 'TIMEOUT');
    }

    throw new CfdApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
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
