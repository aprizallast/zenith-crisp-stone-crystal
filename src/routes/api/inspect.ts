import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/inspect")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const address = (url.searchParams.get("address") || "")
          .trim()
          .toLowerCase();
        const customQuoteAddr = (url.searchParams.get("quoteAddress") || "")
          .trim()
          .toLowerCase();

        if (!/^0x[a-f0-9]{40}$/.test(address)) {
          return Response.json({ error: "Missing valid contract address" }, { status: 400 });
        }

        // 1. Fetch live market pairs from DexScreener, CoinGecko Terminal, and Brew Family
        const [dex, gecko, val] = await Promise.allSettled([
          fetch(`https://api.dexscreener.com/tokens/v1/bsc/${address}`, {
            headers: { accept: "application/json", "user-agent": "AgentBREW/1.0" },
          }).then((r) => (r.ok ? r.json() : null)),
          fetch(
            `https://api.geckoterminal.com/api/v2/networks/bsc/tokens/${address}/pools?page=1`,
            {
              headers: { accept: "application/json", "user-agent": "AgentBREW/1.0" },
            }
          ).then((r) => (r.ok ? r.json() : null)),
          fetch(
            `https://brew.family/api/shared/launches/valuations?addresses=${address}`,
            {
              headers: { accept: "application/json", "user-agent": "AgentBREW/1.0" },
            }
          ).then((r) => (r.ok ? r.json() : null)),
        ]);

        const pairs = dex.status === "fulfilled" && Array.isArray(dex.value) ? dex.value : [];
        const primaryPair = pairs[0] ?? null;

        // Extract CoinGecko Terminal pool details
        const geckoPools = gecko.status === "fulfilled" && Array.isArray(gecko.value?.data) ? gecko.value.data : [];
        const primaryGeckoPool = geckoPools[0]?.attributes ?? null;
        const poolAddress = (primaryGeckoPool?.address || primaryPair?.pairAddress || "").trim().toLowerCase();

        // Extract Quote token details from Pair or URL parameter
        const quoteSymbol = (primaryGeckoPool?.quote_token_price_usd ? (primaryPair?.quoteToken?.symbol || "WBNB") : primaryPair?.quoteToken?.symbol || "WBNB").trim();
        let quoteAddress = (customQuoteAddr || primaryPair?.quoteToken?.address || "").trim().toLowerCase();

        // If no custom quote address provided and pair is standard WBNB, fallback to canonical WBNB
        if (!quoteAddress && quoteSymbol.toUpperCase() === "WBNB") {
          quoteAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
        }

        // Parse Multi-timeframe Price Changes (5M, 1H, 6H, 24H)
        const parseNum = (val: any): number | null => {
          if (val == null) return null;
          const n = typeof val === "number" ? val : parseFloat(String(val));
          return Number.isFinite(n) ? n : null;
        };

        const changes = {
          m5: parseNum(primaryGeckoPool?.price_change_percentage?.m5) ?? parseNum(primaryPair?.priceChange?.m5),
          h1: parseNum(primaryGeckoPool?.price_change_percentage?.h1) ?? parseNum(primaryPair?.priceChange?.h1),
          h6: parseNum(primaryGeckoPool?.price_change_percentage?.h6) ?? parseNum(primaryPair?.priceChange?.h6),
          h24: parseNum(primaryGeckoPool?.price_change_percentage?.h24) ?? parseNum(primaryPair?.priceChange?.h24),
        };

        // Parse Multi-timeframe Buys & Sells
        const gTx = primaryGeckoPool?.transactions;
        const dTx = primaryPair?.txns;

        const transactions = {
          m5: {
            buys: Number(gTx?.m5?.buys ?? dTx?.m5?.buys ?? 0),
            sells: Number(gTx?.m5?.sells ?? dTx?.m5?.sells ?? 0),
          },
          h1: {
            buys: Number(gTx?.h1?.buys ?? dTx?.h1?.buys ?? 0),
            sells: Number(gTx?.h1?.sells ?? dTx?.h1?.sells ?? 0),
          },
          h6: {
            buys: Number(gTx?.h6?.buys ?? dTx?.h6?.buys ?? 0),
            sells: Number(gTx?.h6?.sells ?? dTx?.h6?.sells ?? 0),
          },
          h24: {
            buys: Number(gTx?.h24?.buys ?? dTx?.h24?.buys ?? 0),
            sells: Number(gTx?.h24?.sells ?? dTx?.h24?.sells ?? 0),
          },
        };

        const totalBuys = transactions.h24.buys || (transactions.h6.buys + transactions.h1.buys + transactions.m5.buys);
        const totalSells = transactions.h24.sells || (transactions.h6.sells + transactions.h1.sells + transactions.m5.sells);
        const totalTx = totalBuys + totalSells;
        const buyRatio = totalSells > 0 ? Math.round((totalBuys / totalSells) * 100) / 100 : totalBuys > 0 ? totalBuys : 1;

        // 2. Fetch GoPlus Security Audit for target token
        const securityAddresses = [address];
        if (quoteAddress && /^0x[a-f0-9]{40}$/.test(quoteAddress) && quoteAddress !== address) {
          securityAddresses.push(quoteAddress);
        }

        let securityResults: Record<string, any> = {};
        try {
          const secRes = await fetch(
            `https://api.gopluslabs.io/api/v1/token_security/56?contract_addresses=${securityAddresses.join(",")}`,
            { headers: { accept: "application/json", "user-agent": "AgentBREW/1.0" } }
          );
          if (secRes.ok) {
            const secData = await secRes.json();
            securityResults = secData?.result || {};
          }
        } catch {
          /* ignore transient security error */
        }

        const targetSecurity = securityResults[address] ?? null;
        const quoteSecurity = quoteAddress ? (securityResults[quoteAddress] ?? null) : null;

        const geckoToken =
          gecko.status === "fulfilled" && Array.isArray(gecko.value?.data) && gecko.value.data.length > 0
            ? gecko.value.data[0]?.attributes ?? null
            : null;

        const valuation =
          val.status === "fulfilled" && Array.isArray(val.value?.valuations) && val.value.valuations.length > 0
            ? val.value.valuations[0] ?? null
            : null;

        return Response.json({
          address,
          poolAddress,
          pair: primaryPair,
          pairs,
          security: targetSecurity,
          quoteSecurity,
          coingecko: primaryGeckoPool,
          changes,
          transactions,
          totalBuys,
          totalSells,
          buyRatio,
          valuation,
        });
      },
    },
  },
});
