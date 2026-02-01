import { Suspense } from 'react';
import { Metadata } from 'next';
import CfdTradingClient from './CfdTradingClient';

export const metadata: Metadata = {
  title: 'CFD Trading | StonkSchool',
  description: 'Practice CFD trading with leverage, margin, and real-time position management',
};

function LoadingState() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background-secondary)',
    }}>
      <div style={{ textAlign: 'center', color: 'var(--foreground-secondary)' }}>
        <p>Loading trading interface...</p>
      </div>
    </div>
  );
}

export default function CfdTradingPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CfdTradingClient />
    </Suspense>
  );
}
