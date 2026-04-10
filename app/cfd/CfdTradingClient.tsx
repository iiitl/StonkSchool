'use client';

import { useSearchParams } from 'next/navigation';
import { CfdProvider } from '@/features/cfd/store/cfdStore';
import TradingLayout from '@/features/cfd/components/TradingLayout';
import ContestList from '@/features/cfd/components/ContestList';
import { ProtectedRoute } from '@/features/auth';

export default function CfdTradingClient() {
  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');

  return (
    <ProtectedRoute>
      {!contestId ? (
        <ContestList />
      ) : (
        <CfdProvider initialContestId={contestId}>
          <TradingLayout />
        </CfdProvider>
      )}
    </ProtectedRoute>
  );
}

