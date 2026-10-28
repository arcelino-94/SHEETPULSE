import React, { useState } from 'react';
import { Share2, Loader2, Check } from 'lucide-react';
import { ShareCardId, SHAREABLE_CARDS_MAP } from '../lib/shareRegistry.ts';
import { useShareCard } from '../context/ShareContext.tsx';

interface ShareCardButtonProps {
  cardId?: ShareCardId;
  targetRef?: React.RefObject<HTMLElement | null>;
  cardTitle?: string;
  className?: string;
  onShared?: (message: string) => void;
  iconOnly?: boolean;
}

export const ShareCardButton: React.FC<ShareCardButtonProps> = ({
  cardId = 'overview',
  cardTitle,
  className = '',
  onShared,
  iconOnly = false,
}) => {
  const { triggerShare, isSharing, sharingCardId } = useShareCard();
  const [justShared, setJustShared] = useState(false);

  const isCurrentCardSharing = isSharing && sharingCardId === cardId;
  const meta = SHAREABLE_CARDS_MAP[cardId];
  const displayTitle = cardTitle || meta?.title || 'Card';

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isSharing) return;

    const ok = await triggerShare(cardId);
    if (ok) {
      setJustShared(true);
      setTimeout(() => setJustShared(false), 2500);
      onShared?.('Card compartilhado com sucesso!');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isSharing}
      type="button"
      title={`Compartilhar ${displayTitle} em alta definição (WhatsApp / PNG)`}
      aria-label={`Compartilhar ${displayTitle}`}
      className={`no-screenshot inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm border ${
        justShared
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-600'
          : isCurrentCardSharing
          ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-600'
          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isCurrentCardSharing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline font-mono text-[11px]">Gerando HD...</span>
        </>
      ) : justShared ? (
        <>
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline text-emerald-700 dark:text-emerald-400">Pronto!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600" />
          {!iconOnly && <span className="hidden sm:inline">Compartilhar</span>}
        </>
      )}
    </button>
  );
};
