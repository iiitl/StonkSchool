import { Metadata } from 'next';
import { CfdProvider } from '@/features/cfd/store/cfdStore';
import TradingLayout from '@/features/cfd/components/TradingLayout';

export const metadata: Metadata = {
  title: 'CFD Trading | StonkSchool',
  description: 'Practice CFD trading with leverage, margin, and real-time position management',
};

export default function CfdTradingPage() {
  return (
    <CfdProvider>
      <TradingLayout />
    </CfdProvider>
  );
}
