'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Contest, ContestStatus } from '../types';
import { getContests, joinContest, CfdApiError } from '../api';

interface ContestListProps {
  onSelectContest?: (contestId: string) => void;
}

export default function ContestList({ onSelectContest }: ContestListProps) {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ContestStatus | 'ALL'>('ALL');
  const [joiningContestId, setJoiningContestId] = useState<string | null>(null);
  const [joinedContests, setJoinedContests] = useState<Set<string>>(new Set());
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContests() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getContests();
        setContests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contests');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContests();
  }, []);

  const handleContestClick = (contestId: string) => {
    if (onSelectContest) {
      onSelectContest(contestId);
    } else {
      router.push(`/cfd?contestId=${contestId}`);
    }
  };

  const handleJoinContest = async (e: React.MouseEvent, contestId: string) => {
    e.stopPropagation();
    setJoinError(null);
    setJoiningContestId(contestId);

    try {
      await joinContest(contestId);
      setJoinedContests(prev => new Set([...prev, contestId]));
      // Navigate to the contest page after successful join
      router.push(`/cfd?contestId=${contestId}`);
    } catch (err) {
      if (err instanceof CfdApiError) {
        if (err.status === 409) {
          // Already joined - add to joined set and navigate
          setJoinedContests(prev => new Set([...prev, contestId]));
          router.push(`/cfd?contestId=${contestId}`);
          return;
        } else if (err.status === 401) {
          setJoinError('Please log in to join a contest');
        } else {
          setJoinError(err.message);
        }
      } else {
        setJoinError(err instanceof Error ? err.message : 'Failed to join contest');
      }
    } finally {
      setJoiningContestId(null);
    }
  };

  const filteredContests = activeFilter === 'ALL' 
    ? contests 
    : contests.filter(c => c.status === activeFilter);

  const getStatusBadgeClass = (status: ContestStatus): string => {
    switch (status) {
      case 'LIVE': return 'status-live';
      case 'UPCOMING': return 'status-upcoming';
      case 'ENDED': return 'status-ended';
      case 'SETTLED': return 'status-settled';
      default: return '';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: string): string => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getTimeRemaining = (contest: Contest): string => {
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);

    if (contest.status === 'UPCOMING') {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `Starts in ${days}d ${hours}h`;
      if (hours > 0) return `Starts in ${hours}h`;
      return 'Starting soon';
    } else if (contest.status === 'LIVE') {
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) return `${days}d ${hours}h remaining`;
      if (hours > 0) return `${hours}h ${minutes}m remaining`;
      if (minutes > 0) return `${minutes}m remaining`;
      return 'Ending soon';
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="contest-list-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading contests...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contest-list-container">
        <div className="error-container">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="var(--danger)" strokeWidth="2"/>
            <path d="M24 14v12M24 30v4" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Failed to load contests</h3>
          <p>{error}</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="contest-list-container">
      <header className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 6l4-4l4 4M8 18l4 4l4-4M12 2v20"/>
            </svg>
          </div>
          <div>
            <h1>CFD Trading Contests</h1>
            <p className="subtitle">Compete in virtual trading challenges and prove your skills</p>
          </div>
        </div>
      </header>

      <div className="filter-bar">
        {(['ALL', 'LIVE', 'UPCOMING', 'ENDED', 'SETTLED'] as const).map((filter) => (
          <button
            key={filter}
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === 'ALL' ? 'All Contests' : filter}
            {filter !== 'ALL' && (
              <span className="filter-count">
                {contests.filter(c => c.status === filter).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {joinError && (
        <div className="join-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          {joinError}
          <button 
            onClick={() => setJoinError(null)} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
      {filteredContests.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2"/>
            <path d="M12 8v4l2 2"/>
          </svg>
          <h3>No contests found</h3>
          <p>There are no {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} contests available at the moment.</p>
        </div>
      ) : (
        <div className="contest-grid">
          {filteredContests.map((contest) => (
            <div
              key={contest.id}
              className={`contest-card ${contest.status === 'LIVE' ? 'live' : ''}`}
              onClick={() => handleContestClick(contest.id)}
            >
              {contest.status === 'LIVE' && (
                <div className="live-indicator">
                  <span className="pulse" />
                  LIVE NOW
                </div>
              )}

              <div className="card-header">
                <h3 className="contest-title">{contest.title}</h3>
                <span className={`status-badge ${getStatusBadgeClass(contest.status)}`}>
                  {contest.status}
                </span>
              </div>

              <div className="contest-details">
                <div className="detail-row">
                  <span className="detail-label">Entry Fee</span>
                  <span className="detail-value entry-fee">
                    {parseFloat(contest.entry_fee) === 0 ? 'FREE' : formatCurrency(contest.entry_fee)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Starting Balance</span>
                  <span className="detail-value balance">{formatCurrency(contest.initial_balance)}</span>
                </div>
                <div className="detail-row time-row">
                  <div className="time-block">
                    <span className="detail-label">Start</span>
                    <span className="detail-value">{formatDate(contest.start_time)}</span>
                  </div>
                  <div className="time-separator">→</div>
                  <div className="time-block">
                    <span className="detail-label">End</span>
                    <span className="detail-value">{formatDate(contest.end_time)}</span>
                  </div>
                </div>
              </div>

              {(contest.status === 'LIVE' || contest.status === 'UPCOMING') && (
                <div className="time-remaining">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  {getTimeRemaining(contest)}
                </div>
              )}

              <div className="card-footer">
                {contest.status === 'UPCOMING' && !joinedContests.has(contest.id) ? (
                  <button
                    className="join-btn join-contest-btn"
                    onClick={(e) => handleJoinContest(e, contest.id)}
                    disabled={joiningContestId === contest.id}
                  >
                    {joiningContestId === contest.id ? (
                      <>
                        <span className="btn-spinner" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Contest
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                      </>
                    )}
                  </button>
                ) : (
                  <button className="join-btn" onClick={(e) => { e.stopPropagation(); handleContestClick(contest.id); }}>
                    {contest.status === 'LIVE' ? 'Join Now' : contest.status === 'UPCOMING' ? 'Enter Contest' : 'View Results'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .contest-list-container {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--background-secondary) 0%, var(--background) 100%);
    padding: 2rem;
  }

  .loading-container,
  .error-container {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

  .error-container h3 {
    margin: 0;
    color: var(--danger);
  }

  .page-header {
    max-width: 1200px;
    margin: 0 auto 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .header-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
    border-radius: 16px;
    color: white;
  }

  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, var(--foreground) 0%, var(--primary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    margin: 0.25rem 0 0;
    color: var(--foreground-secondary);
    font-size: 1rem;
  }

  .filter-bar {
    max-width: 1200px;
    margin: 0 auto 2rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--foreground-secondary);
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-btn:hover {
    border-color: var(--primary);
    color: var(--foreground);
  }

  .filter-btn.active {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .filter-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .filter-btn:not(.active) .filter-count {
    background: var(--background-tertiary);
  }

  .empty-state {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
    padding: 4rem 2rem;
    color: var(--foreground-secondary);
  }

  .empty-state h3 {
    margin: 1rem 0 0.5rem;
    color: var(--foreground);
  }

  .contest-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .contest-card {
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .contest-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(var(--primary-rgb), 0.03) 100%);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  .contest-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    border-color: var(--primary);
  }

  .contest-card:hover::before {
    opacity: 1;
  }

  .contest-card.live {
    border-color: var(--success);
    box-shadow: 0 0 0 1px var(--success), 0 4px 20px rgba(16, 185, 129, 0.1);
  }

  .live-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--success);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pulse {
    width: 8px;
    height: 8px;
    background: var(--success);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .contest-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--foreground);
    line-height: 1.3;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }

  .status-live {
    background: rgba(16, 185, 129, 0.15);
    color: var(--success);
  }

  .status-upcoming {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }

  .status-ended {
    background: rgba(107, 114, 128, 0.15);
    color: #6b7280;
  }

  .status-settled {
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
  }

  .contest-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-label {
    font-size: 0.8rem;
    color: var(--foreground-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .detail-value {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--foreground);
  }

  .detail-value.entry-fee {
    color: var(--primary);
    font-weight: 600;
  }

  .detail-value.balance {
    color: var(--success);
    font-weight: 600;
  }

  .time-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
    margin-top: 0.5rem;
  }

  .time-block {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .time-block .detail-value {
    font-size: 0.85rem;
  }

  .time-separator {
    color: var(--foreground-tertiary);
    font-size: 0.875rem;
  }

  .time-remaining {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--background-tertiary);
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--foreground-secondary);
    margin-bottom: 1rem;
  }

  .card-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .join-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .join-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .contest-card.live .join-btn {
    background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
  }

  .contest-card.live .join-btn:hover {
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .join-contest-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  .join-contest-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .join-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .join-error {
    max-width: 1200px;
    margin: 0 auto 1rem;
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--danger);
    border-radius: 8px;
    color: var(--danger);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  @media (max-width: 768px) {
    .contest-list-container {
      padding: 1rem;
    }

    .header-content {
      flex-direction: column;
      text-align: center;
    }

    .page-header h1 {
      font-size: 1.5rem;
    }

    .filter-bar {
      justify-content: center;
    }

    .contest-grid {
      grid-template-columns: 1fr;
    }
  }
`;
