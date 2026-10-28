import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { ShareCardId, SHAREABLE_CARDS_MAP, getCardFilename } from '../lib/shareRegistry.ts';
import { SheetRResult, SalesRecord, DashboardKPIs } from '../lib/salesEngine.ts';
import { DeterministicMetrics, IntelligentAnalysis } from '../lib/sheetCache.ts';

export interface ShareDataContext {
  periodLabel: string;
  monthKey: string;
  sheetRTotais?: SheetRResult['totais'] | null;
  sheetRData?: SheetRResult | null;
  deterministicMetrics?: DeterministicMetrics | null;
  analysis?: IntelligentAnalysis | null;
  kpis?: DashboardKPIs | null;
  allRecords?: SalesRecord[];
  vendasData?: any;
}

interface ShareContextValue {
  activeShareCard: ShareCardId | null;
  isSharing: boolean;
  sharingCardId: ShareCardId | null;
  shareData: ShareDataContext;
  updateShareData: (data: Partial<ShareDataContext>) => void;
  triggerShare: (cardId: ShareCardId, customData?: any) => Promise<boolean>;
  lastShareResult: { success: boolean; message: string; filename?: string; dimensions?: string } | null;
}

const ShareContext = createContext<ShareContextValue | null>(null);

export const ShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shareData, setShareData] = useState<ShareDataContext>({
    periodLabel: 'Outubro / 2026',
    monthKey: '2026-10',
    sheetRTotais: null,
    sheetRData: null,
    deterministicMetrics: null,
    analysis: null,
    kpis: null,
    allRecords: [],
    vendasData: null,
  });

  const [activeShareCard, setActiveShareCard] = useState<ShareCardId | null>(null);
  const [sharingCardId, setSharingCardId] = useState<ShareCardId | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [lastShareResult, setLastShareResult] = useState<{
    success: boolean;
    message: string;
    filename?: string;
    dimensions?: string;
  } | null>(null);

  const offscreenContainerRef = useRef<HTMLDivElement | null>(null);

  const updateShareData = useCallback((data: Partial<ShareDataContext>) => {
    setShareData((prev) => ({ ...prev, ...data }));
  }, []);

  const triggerShare = useCallback(
    async (cardId: ShareCardId, _customData?: any): Promise<boolean> => {
      if (isSharing) return false;
      setIsSharing(true);
      setSharingCardId(cardId);
      setActiveShareCard(cardId);

      try {
        // 1. Wait for React to render the off-screen template into the DOM
        await new Promise((resolve) => setTimeout(resolve, 80));

        // 2. Wait for fonts to be ready
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
          try {
            await document.fonts.ready;
          } catch {
            // Ignore font timeout
          }
        }

        // 3. Find the off-screen element
        const container = document.getElementById('offscreen-share-card-container');
        if (!container) {
          throw new Error('Container de compartilhamento off-screen não encontrado');
        }

        // 4. Capture using html-to-image with fixed 1600px width and pristine quality
        const dataUrl = await toPng(container, {
          quality: 1.0,
          pixelRatio: 1.0, // Fixed 1600px width container rendered at 1:1 gives guaranteed >=1600px width PNG
          backgroundColor: '#ffffff',
          cacheBust: true,
          style: {
            position: 'static',
            left: '0px',
            top: '0px',
            transform: 'none',
            backgroundColor: '#ffffff',
            margin: '0',
            boxSizing: 'border-box',
          },
        });

        // 5. Measure dimensions from Image object
        const img = new Image();
        img.src = dataUrl;
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });

        const width = img.naturalWidth || 1600;
        const height = img.naturalHeight || 900;
        const dimStr = `${width} x ${height} px`;

        // 6. Convert DataURL to Blob and File
        const blob = await (await fetch(dataUrl)).blob();
        const filename = getCardFilename(cardId, shareData.monthKey || 'periodo');
        const file = new File([blob], filename, { type: 'image/png' });

        const cardMeta = SHAREABLE_CARDS_MAP[cardId];
        const cardTitle = cardMeta ? cardMeta.title : 'CrediFlow Analytics';

        // 7. Check Web Share API (native mobile / Android / WhatsApp share sheet)
        let sharedViaNative = false;
        if (
          typeof navigator !== 'undefined' &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              title: cardTitle,
              text: `${cardTitle} - ${shareData.periodLabel}`,
              files: [file],
            });
            sharedViaNative = true;
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') {
              // User dismissed the share sheet
              setLastShareResult({
                success: true,
                message: 'Compartilhamento cancelado pelo usuário.',
                filename,
                dimensions: dimStr,
              });
              return true;
            }
            console.warn('Navigator share error, falling back to download:', shareErr);
          }
        }

        // 8. Fallback to direct high-resolution PNG download
        if (!sharedViaNative) {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        setLastShareResult({
          success: true,
          message: sharedViaNative
            ? 'Card compartilhado com sucesso via WhatsApp / Android!'
            : 'Imagem de alta definição gerada e baixada com sucesso!',
          filename,
          dimensions: dimStr,
        });

        return true;
      } catch (err: any) {
        console.error('Failed to generate high-resolution share card:', err);
        setLastShareResult({
          success: false,
          message: `Erro ao gerar card de compartilhamento: ${err?.message || 'Falha na renderização'}`,
        });
        return false;
      } finally {
        setIsSharing(false);
        setSharingCardId(null);
      }
    },
    [isSharing, shareData.monthKey, shareData.periodLabel]
  );

  return (
    <ShareContext.Provider
      value={{
        activeShareCard,
        isSharing,
        sharingCardId,
        shareData,
        updateShareData,
        triggerShare,
        lastShareResult,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
};

export const useShareCard = () => {
  const ctx = useContext(ShareContext);
  if (!ctx) {
    throw new Error('useShareCard must be used within a ShareProvider');
  }
  return ctx;
};
