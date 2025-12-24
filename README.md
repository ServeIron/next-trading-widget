# Koin Grafik - Binance Kripto Grafik Modülü

Modern React, Next.js 15+ ve TypeScript kullanılarak geliştirilmiş, **plug-and-play** bir Binance kripto para grafik modülüdür. TradingView benzeri bir arayüze sahiptir ve yatay çizgi ekleme, indikatörler ve gerçek zamanlı veri güncellemeleri gibi özellikler sunar.

## 📖 Tanım

Bu proje, **başka bir Next.js projesine kolayca dahil edilebilen** bir trading chart modülüdür. Modül, **self-contained** (kendine yeten) bir yapıya sahiptir ve dış bağımlılıkları minimal seviyede tutar.

### Başka Bir Projeye Dahil Etme

Bu modülü kendi Next.js projenize dahil etmek için:

1. **Modülü kopyalayın:**
   ```bash
   # Trading modülünü kendi projenize kopyalayın
   cp -r src/features/trading /path/to/your/project/src/features/
   ```

2. **Gerekli bağımlılıkları yükleyin:**
   ```bash
   npm install lightweight-charts next react react-dom
   ```

3. **Modülü kullanın:**
   ```tsx
   // app/page.tsx veya istediğiniz component
   'use client';

   import dynamic from 'next/dynamic';
   import { TradingChartModule } from '@/features/trading';

   const DynamicTradingChartModule = dynamic(
     () => import('@/features/trading').then((mod) => ({ default: mod.TradingChartModule })),
     { ssr: false }
   );

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
   ```

4. **TypeScript path alias ayarlayın** (tsconfig.json):
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

**Önemli:** Modül tamamen **plug-and-play** yapıdadır. Sadece `TradingChartModule` component'ini import edip kullanmanız yeterlidir. Tüm internal implementasyon detayları gizlidir.

## 📋 Versiyon Gereklilikleri

Projenin sorunsuz çalışması için aşağıdaki minimum sürümler gereklidir:

- **Node.js**: `18.0.0` veya üzeri
- **npm**: `9.0.0` veya üzeri (veya `yarn` / `pnpm`)

Sürümünüzü kontrol etmek için:
```bash
node --version
npm --version
```

## 📦 Bağımlılıklar

### Production Dependencies

```json
{
  "lightweight-charts": "^5.1.0",  // Charting library
  "next": "^15.1.0",                // Next.js framework
  "react": "^19.2.0",               // React library
  "react-dom": "^19.2.0"            // React DOM
}
```

### Development Dependencies

```json
{
  "@types/node": "^24.10.1",
  "@types/react": "^19.2.5",
  "@types/react-dom": "^19.2.3",
  "eslint": "^9.39.1",
  "eslint-config-next": "^15.1.0",
  "typescript": "~5.9.3"
}
```

## 📁 Klasör Yapısı

Proje **Feature-Based Architecture** ve **Next.js App Router** yapısına göre organize edilmiştir:

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Ana sayfa
│   └── page.module.css          # Page styles
│
├── features/                     # Feature modülleri
│   └── trading/                 # Trading/Chart modülü (PLUG-AND-PLAY)
│       ├── components/          # Chart bileşenleri
│       │   ├── Chart.tsx
│       │   ├── ErrorOverlay.tsx
│       │   ├── LoadingOverlay.tsx
│       │   ├── CrosshairLabels.tsx
│       │   ├── TradingChartModule.tsx  # Main public component
│       │   └── widgets/         # Trading-specific widgets
│       │       ├── SymbolSelectorWidget.tsx
│       │       ├── IntervalSelectorWidget.tsx
│       │       └── LineAddWidget.tsx
│       ├── hooks/               # Chart hook'ları
│       │   ├── useBinanceData.ts
│       │   ├── useChartData.ts
│       │   ├── useChartIndicators.ts
│       │   ├── useChartInitialization.ts
│       │   ├── useChartLines.ts
│       │   ├── useChartMouseInteraction.ts
│       │   ├── useChartVolume.ts
│       │   └── useCrosshair.ts
│       ├── services/            # API servisleri
│       │   └── binance.ts      # Binance API & WebSocket
│       ├── types/               # TypeScript tipleri
│       │   ├── binance.ts
│       │   ├── config.ts
│       │   ├── indicators.ts
│       │   └── lines.ts
│       ├── utils/               # Yardımcı fonksiyonlar
│       │   └── indicators.ts
│       ├── constants.ts         # Chart sabitleri
│       └── index.ts            # Public API (barrel export)
│
└── constants/                   # Global sabitler
    └── index.ts                # UI_COLORS, UI_CONFIG
```

**Önemli:** `src/features/trading/` modülü tamamen **self-contained** (kendine yeten) bir yapıdadır. Bu klasörü başka bir projeye kopyaladığınızda, sadece `index.ts` dosyasından export edilen `TradingChartModule` component'ini kullanmanız yeterlidir.

## 🚀 Projeyi Ayağa Kaldırma

### 1. Bağımlılıkları Yükleme

```bash
npm install
```

### 2. Geliştirme Sunucusunu Başlatma

```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

### 3. Production Build

```bash
# Production build oluşturma
npm run build

# Build'i çalıştırma
npm start

# Build'i önizleme
npm run preview
```

### 4. Diğer Komutlar

```bash
# ESLint kontrolü
npm run lint
```

## ➕ Yeni Özellik Nasıl Eklenir?

### Örnek: Yatay Çizgi Ekleme Özelliği

Yatay çizgi ekleme özelliği şu şekilde implement edilmiştir:

#### 1. **Tip Tanımı** (`src/features/trading/types/lines.ts`)

```typescript
export interface HorizontalLineConfig {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  label?: string;
  labelVisible?: boolean;
}
```

#### 2. **Hook Oluşturma** (`src/features/trading/hooks/useChartLines.ts`)

```typescript
export function useChartLines({
  series,
  horizontalLines,
  hasData,
}: UseChartLinesOptions): void {
  useEffect(() => {
    if (!series || !hasData) return;
    
    // Çizgileri ekleme/güncelleme mantığı
    horizontalLines.forEach((line) => {
      series.createPriceLine({
        price: line.price,
        color: line.color,
        lineWidth: line.lineWidth,
        lineStyle: line.lineStyle as LineStyle,
        axisLabelVisible: line.labelVisible,
        title: line.label,
      });
    });
  }, [series, horizontalLines, hasData]);
}
```

#### 3. **Mouse Interaction Hook** (`src/features/trading/hooks/useChartMouseInteraction.ts`)

```typescript
// Mouse tıklama olaylarını yakalama ve fiyat hesaplama
const handleClick = useCallback((event: MouseEvent) => {
  if (!enableLineAdding || !onAddLine) return;
  
  // Fiyat hesaplama
  const price = calculatePriceFromMouseY(...);
  
  if (price !== null) {
    onAddLine(price);
  }
}, [enableLineAdding, onAddLine]);
```

#### 4. **Widget Oluşturma** (`src/features/trading/components/widgets/LineAddWidget.tsx`)

```typescript
'use client';

export function LineAddWidget({ isActive, onToggle }: LineAddWidgetProps) {
  return (
    <button onClick={onToggle} className={isActive ? styles.active : ''}>
      Çizgi Ekle
    </button>
  );
}
```

#### 5. **Chart Component'te Kullanım** (`src/features/trading/components/Chart.tsx`)

```typescript
useChartLines({
  series,
  horizontalLines,
  hasData: data.length > 0,
});

useChartMouseInteraction({
  chart,
  series,
  chartContainer: chartContainerRef.current,
  enableLineAdding,
  onAddLine: onAddLineAtPrice,
  hoveredPriceRef,
  mousePositionRef,
});
```

#### 6. **TradingChartModule'de State Yönetimi** (`src/features/trading/components/TradingChartModule.tsx`)

```typescript
const [horizontalLines, setHorizontalLines] = useState<HorizontalLineConfig[]>([]);
const [isLineAddingMode, setIsLineAddingMode] = useState<boolean>(false);

const handleAddLineAtPrice = useCallback((price: number) => {
  setHorizontalLines((prev) => {
    const newLine: HorizontalLineConfig = {
      id: `line-${Date.now()}-${Math.random()}`,
      price,
      color: PRESET_LINE_COLORS[prev.length % PRESET_LINE_COLORS.length],
      lineWidth: 2,
      lineStyle: 'solid',
      label: price.toFixed(2),
      labelVisible: true,
    };
    return [...prev, newLine];
  });
}, []);
```

### Yeni Özellik Ekleme Adımları (Genel)

1. **Tip tanımı ekleyin** → `src/features/trading/types/` altında ilgili dosyaya
2. **Hook oluşturun** → `src/features/trading/hooks/` altında
3. **Widget oluşturun** (gerekirse) → `src/features/trading/components/widgets/` altında
4. **Chart component'te kullanın** → `src/features/trading/components/Chart.tsx`
5. **TradingChartModule'de state ekleyin** → `src/features/trading/components/TradingChartModule.tsx`
6. **Constants'a ekleyin** (gerekirse) → `src/features/trading/constants.ts`

### Örnek: Dikey Çizgi Özelliği Ekleme

1. **Tip tanımı:**
   ```typescript
   // src/features/trading/types/lines.ts
   export interface VerticalLineConfig {
     id: string;
     time: number;
     color: string;
     lineWidth: number;
   }
   ```

2. **Hook:**
   ```typescript
   // src/features/trading/hooks/useChartVerticalLines.ts
   export function useChartVerticalLines({ chart, verticalLines, hasData }) {
     // Implementation
   }
   ```

3. **Chart'ta kullanım:**
   ```typescript
   useChartVerticalLines({ chart, verticalLines, hasData: data.length > 0 });
   ```

## 🛠️ Teknolojiler

- **Next.js 15.1.0** - React framework (App Router)
- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety
- **lightweight-charts 5.1.0** - Charting library

## 📝 Notlar

- Proje **Next.js App Router** kullanıyor
- Tüm interaktif component'ler `'use client'` direktifi ile işaretlenmiş
- Chart component dynamic import ile yükleniyor (SSR disabled)
- Import path'leri `@/` alias kullanıyor (tsconfig.json'da tanımlı)
- Modül **plug-and-play** yapıdadır, başka projelere kolayca entegre edilebilir
