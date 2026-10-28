import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600/95 text-white px-3.5 py-2 text-xs font-semibold shadow-xl shadow-amber-900/30 backdrop-blur-md border border-amber-400/30 animate-pulse">
      <WifiOff className="w-4 h-4 text-white" />
      <span>Modo Offline — Você está navegando nos dados salvos localmente no PWA.</span>
    </div>
  );
};
