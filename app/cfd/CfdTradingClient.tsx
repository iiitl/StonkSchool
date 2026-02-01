'use client';

import { useSearchParams } from 'next/navigation';
import { CfdProvider } from '@/features/cfd/store/cfdStore';
import TradingLayout from '@/features/cfd/components/TradingLayout';
import ContestList from '@/features/cfd/components/ContestList';

export default function CfdTradingClient() {
  const searchParams = useSearchParams();
  const contestId = searchParams.get('contestId');

  if (!contestId) {
    return <ContestList />;
  }

  return (
    <CfdProvider initialContestId={contestId}>
      <TradingLayout />
    </CfdProvider>
  );
}

