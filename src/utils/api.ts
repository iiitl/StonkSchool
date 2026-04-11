export interface ApiErrorConstructor<E> {
  new (message: string, status: number, code?: string): E;
}

/**
 * Shared fetch wrapper with timeout, error handling, and auth
 */
export async function sharedFetch<T, E extends Error>(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  ErrorClass: ApiErrorConstructor<E>
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include', // Include httpOnly cookies for auth
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ErrorClass(
        error.error || `Request failed with status ${response.status}`,
        response.status,
        error.code
      );
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      throw new ErrorClass('Invalid JSON response', response.status, 'PARSE_ERROR');
    }
  } catch (error) {
    if (error instanceof ErrorClass) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ErrorClass('Request timed out', 408, 'TIMEOUT');
    }

    throw new ErrorClass(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
