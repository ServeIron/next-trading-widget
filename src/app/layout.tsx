import type { Metadata } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Koin Grafik - Binance Kripto Grafik',
  description: 'Modern React ve TypeScript kullanılarak geliştirilmiş, Binance API\'sinden gerçek zamanlı kripto para grafikleri',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

