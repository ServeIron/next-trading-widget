'use client';

import dynamic from 'next/dynamic';
import { TradingChartModule } from '@/features/trading';

// Dynamic import for TradingChartModule (client-side only, no SSR)
const DynamicTradingChartModule = dynamic(() => import('@/features/trading').then((mod) => ({ default: mod.TradingChartModule })), {
  ssr: false,
  loading: () => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Yükleniyor...</div>,
});

export default function Page() {
  return (
    <DynamicTradingChartModule
      config={{
        api: {
          apiBaseUrl: 'https://api.binance.com/api/v3',
          wsBaseUrl: 'wss://stream.binance.com:9443/ws',
        },
        defaultSymbol: 'BTCUSDT',
        defaultInterval: '1d',
        defaultHeight: 600,
        headerHeight: 60,
      }}
    />
  );
}

