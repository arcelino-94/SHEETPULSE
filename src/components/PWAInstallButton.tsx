import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  // If already running as an installed PWA, show a subtle installed indicator
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        App Instalado
      </span>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer transform active:scale-95"
        title="Instalar CrediFlow como aplicativo no seu computador ou celular"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">1</span>
                  <span>Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima) na barra do Safari.</span>
                </p>
                <p className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">2</span>
                  <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                </p>
                <p className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">3</span>
                  <span>Confirme em <strong>Adicionar</strong> no canto superior direito.</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-900 dark:bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGenericGuide(true)}
        className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-sm"
        title="Como instalar no seu dispositivo"
      >
        <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Instalar PWA</span>
      </button>

      {showGenericGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Instalar Aplicativo</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGenericGuide(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                Para instalar o Lívia Cred como aplicativo no seu dispositivo, abra o menu do seu navegador (três pontinhos no Chrome ou ícone de instalação na barra de navegação) e clique em <strong>Instalar Lívia Cred</strong> ou <strong>Adicionar à tela inicial</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGenericGuide(false)}
              className="mt-6 w-full rounded-xl bg-slate-900 dark:bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
