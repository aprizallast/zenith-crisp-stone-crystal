import React, { useState } from 'react';
import { ExternalLink, LineChart, RefreshCw, BarChart2, Check } from 'lucide-react';

interface TradingViewChartProps {
  poolAddress?: string;
  tokenAddress: string;
  symbol: string;
  quoteSymbol?: string;
  height?: number | string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  poolAddress,
  tokenAddress,
  symbol,
  quoteSymbol = 'WBNB',
  height = 420,
}) => {
  const [source, setSource] = useState<'geckoterminal' | 'dexscreener'>('geckoterminal');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const cleanPool = (poolAddress || '').trim().toLowerCase();
  const cleanToken = (tokenAddress || '').trim().toLowerCase();
  const activeAddress = cleanPool || cleanToken;

  const geckoEmbedUrl = cleanPool
    ? `https://www.geckoterminal.com/bsc/pools/${cleanPool}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0`
    : `https://www.geckoterminal.com/bsc/tokens/${cleanToken}?embed=1&info=0&swaps=0`;

  const dexEmbedUrl = cleanPool
    ? `https://dexscreener.com/bsc/${cleanPool}?embed=1&theme=dark&trades=0&info=0`
    : `https://dexscreener.com/bsc/${cleanToken}?embed=1&theme=dark&trades=0&info=0`;

  const currentEmbedUrl = source === 'geckoterminal' ? geckoEmbedUrl : dexEmbedUrl;
  const geckoExternalUrl = cleanPool
    ? `https://www.geckoterminal.com/bsc/pools/${cleanPool}`
    : `https://www.geckoterminal.com/bsc/tokens/${cleanToken}`;
  const dexExternalUrl = cleanPool
    ? `https://dexscreener.com/bsc/${cleanPool}`
    : `https://dexscreener.com/bsc/${cleanToken}`;

  const handleCopy = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[#120d09] overflow-hidden shadow-lg shadow-black/40 flex flex-col">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-line)] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold font-mono text-[var(--color-ink)]">
            <LineChart className="w-4 h-4 text-amber-500" />
            <span className="tracking-wide">TRADINGVIEW CHART</span>
            <span className="text-[11px] text-[var(--color-muted)] font-normal">
              ({symbol}/{quoteSymbol})
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CoinGecko Terminal API</span>
          </span>
        </div>

        {/* Action Controls & Source Switcher */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <div className="flex rounded-md bg-[var(--color-field)] border border-[var(--color-line)] p-0.5">
            <button
              onClick={() => {
                if (source !== 'geckoterminal') {
                  setSource('geckoterminal');
                  setIsLoading(true);
                }
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                source === 'geckoterminal'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              🦎 GeckoTerminal
            </button>
            <button
              onClick={() => {
                if (source !== 'dexscreener') {
                  setSource('dexscreener');
                  setIsLoading(true);
                }
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                source === 'dexscreener'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              🦅 DexScreener
            </button>
          </div>

          <a
            href={source === 'geckoterminal' ? geckoExternalUrl : dexExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-field)] border border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-amber-600/40 transition-colors"
            title="Open on full charting platform"
          >
            <span className="hidden sm:inline">Open Chart</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Chart Iframe Canvas */}
      <div className="relative w-full bg-[#0a0705]" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d0907]/90 backdrop-blur-xs text-xs font-mono text-[var(--color-muted)] gap-2">
            <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
            <span>Loading TradingView chart from {source === 'geckoterminal' ? 'CoinGecko Terminal' : 'DexScreener'}...</span>
          </div>
        )}

        <iframe
          key={`${source}-${activeAddress}`}
          src={currentEmbedUrl}
          title={`${symbol} TradingView Real-Time Chart`}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="clipboard-write"
          loading="lazy"
        />
      </div>

      {/* Chart Footer with Pool Address & Quick Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[var(--color-surface)] border-t border-[var(--color-line)] text-[10px] font-mono text-[var(--color-muted)]">
        <div className="flex items-center gap-2">
          <span>Pool: {cleanPool ? `${cleanPool.slice(0, 6)}...${cleanPool.slice(-4)}` : 'Bonding Curve Active'}</span>
          {cleanPool && (
            <button
              onClick={handleCopy}
              className="text-[var(--color-copper)] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <span>Copy</span>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <BarChart2 className="w-3 h-3 text-amber-500/80" />
            <span>Candles · Volume · Indicators</span>
          </span>
          <a
            href={`https://pancakeswap.finance/swap?outputCurrency=${cleanToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:underline"
          >
            Trade on PancakeSwap ↗
          </a>
        </div>
      </div>
    </div>
  );
};
