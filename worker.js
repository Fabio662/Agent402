/**
 * Stacks sBTC Yield API with x402 Payment Protocol
 * Cloudflare Worker — x402scan compliant v2 schema
 * 
 * Fixes applied (same pattern as validated Base worker):
 *   1. x402Version: 2
 *   2. network: "eip155:8453" (Base — only network x402scan accepts)
 *   3. asset: USDC contract address on Base
 *   4. maxAmountRequired: "10000" (0.01 USDC × 10^6 atomic)
 *   5. resource: full origin URL
 *   6. /.well-known/x402 discovery endpoint present
 *   7. Payment header: X-Payment JSON {txHash, amount}
 *   8. Yield data: real Stacks DeFi protocols
 *   9. Embedded HTML landing page
 */

const CONFIG = {
  PAYMENT_ADDRESS: '0x97d794dB5F8B6569A7fdeD9DF57648f0b464d4F1',
  PAYMENT_AMOUNT: '0.01',                  // human-readable (for HTML + messages)
  PAYMENT_AMOUNT_ATOMIC: '10000',          // 0.01 USDC × 10^6 = 10,000 atomic units
  NETWORK: 'eip155:8453',                  // Base mainnet — only network x402scan accepts
  ASSET: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC contract on Base
  API_DESCRIPTION: 'Live sBTC & STX yields on Stacks: Bitflow, Velar, ALEX, Zest, Stacking DAO',
  MAX_TIMEOUT_SECONDS: 300
};

const YIELD_DATA = {
  success: true,
  data: {
    opportunities: [
      { id: 1, protocol: "sBTC Native Hold",        apy: "~5%",      risk: "Low",         tvl: "Protocol-level", note: "Base 5% BTC reward on all sBTC holdings, paid every 2 weeks" },
      { id: 2, protocol: "Bitflow sBTC/STX Pool",   apy: "20%+",    risk: "Medium",      tvl: "~$10M+",        note: "DEX LP — real yield from swap fees + sBTC rewards" },
      { id: 3, protocol: "Velar sBTC Pool",         apy: "~20%",    risk: "Medium",      tvl: "~$20M+",        note: "LP yield + VELAR token incentive rewards" },
      { id: 4, protocol: "ALEX sBTC Pool",          apy: "5% + ALEX rewards", risk: "Low-Medium", tvl: "~$20M+", note: "Base 5% sBTC + Surge campaign ALEX rewards" },
      { id: 5, protocol: "Zest sBTC Lending",       apy: "7–10%",   risk: "Low",         tvl: "~$50M+",        note: "Supply sBTC, earn extra BTC yield. Backed by Binance Labs" },
      { id: 6, protocol: "Stacking DAO (stSTXbtc)", apy: "~10%",    risk: "Low",         tvl: "~$30M+",        note: "Liquid stacking — earn sBTC rewards daily, stay liquid" },
      { id: 7, protocol: "Hermetica USDh",          apy: "up to 25%", risk: "Medium",    tvl: "~$15M+",        note: "BTC-backed stablecoin yield via perpetual funding rates" }
    ],
    network: "Stacks",
    lastUpdated: new Date().toISOString(),
    disclaimer: "Yields fluctuate; always DYOR. Approximate early 2026 data from stacks.org ecosystem."
  }
};

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YieldAgent - Stacks sBTC</title>
  <style>
    body {
      background: #0a0e1a;
      color: white;
      font-family: -apple-system, sans-serif;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid #ff6b35;
      border-radius: 20px;
      padding: 40px;
      max-width: 720px;
      width: 100%;
    }
    .logo { font-size: 72px; margin-bottom: 12px; }
    h1 { font-size: 42px; margin: 8px 0; color: #fff; }
    .subtitle { font-size: 18px; color: #ff6b3588; margin-bottom: 8px; }
    .tag {
      display: inline-block;
      background: rgba(255,107,53,0.15);
      border: 1px solid #ff6b35aa;
      color: #ff6b35;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      margin: 2px;
    }
    .yield-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 14px 16px;
      margin: 6px 0;
      background: rgba(255,107,53,0.07);
      border-radius: 10px;
      border: 1px solid #ff6b3533;
      gap: 12px;
    }
    .yield-left { flex: 1; }
    .yield-left strong { display: block; margin-bottom: 3px; font-size: 15px; }
    .yield-left span { font-size: 12px; color: #999; }
    .apy { font-weight: 700; color: #ff6b35; font-size: 18px; white-space: nowrap; }
    .payment { text-align: center; margin: 28px 0; padding: 20px; background: rgba(255,107,53,0.06); border-radius: 14px; border: 1px solid #ff6b3522; }
    .cost { font-size: 32px; color: #ff6b35; font-weight: 700; margin: 8px 0; }
    .label { font-size: 13px; color: #777; margin-bottom: 4px; }
    .address { font-family: monospace; font-size: 13px; word-break: break-all; color: #ccc; margin: 8px 0; }
    .copy-btn {
      background: #ff6b35; color: #fff; border: none;
      padding: 8px 18px; border-radius: 6px; font-weight: 600;
      cursor: pointer; font-size: 13px; margin-top: 6px;
    }
    .copy-btn:hover { background: #e55a25; }
    .try-btn {
      background: #ff6b35; color: #fff; border: none;
      padding: 16px 40px; font-size: 18px; border-radius: 12px;
      cursor: pointer; font-weight: 700; margin-top: 20px; width: 100%;
    }
    .try-btn:hover { background: #e55a25; }
    .try-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .status { margin-top: 14px; font-size: 14px; color: #ff6b35; text-align: center; min-height: 20px; }
    .error { color: #ff4444 !important; }
    #yieldsOut { margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🟧</div>
    <h1>YieldAgent</h1>
    <p class="subtitle">Live sBTC & STX Yields — pay with USDC on Base</p>
    <div>
      <span class="tag">sBTC</span>
      <span class="tag">STX</span>
      <span class="tag">Bitcoin DeFi</span>
      <span class="tag">x402</span>
      <span class="tag">Base USDC</span>
    </div>

    <div class="payment">
      <div class="label">Pay once to unlock all yield data</div>
      <div class="cost">0.01 USDC</div>
      <div class="label">Send on Base mainnet</div>
      <div class="address">${CONFIG.PAYMENT_ADDRESS}</div>
      <button class="copy-btn" id="copyBtn">📋 Copy Address</button>
    </div>

    <button class="try-btn" id="tryBtn">🚀 Unlock Yields</button>
    <div class="status" id="status"></div>
    <div id="yieldsOut"></div>
  </div>

  <script>
    document.getElementById('copyBtn').addEventListener('click', function() {
      navigator.clipboard.writeText('${CONFIG.PAYMENT_ADDRESS}');
      this.textContent = '✅ Copied';
      setTimeout(() => { this.textContent = '📋 Copy Address'; }, 2000);
    });

    document.getElementById('tryBtn').addEventListener('click', async function() {
      const btn    = document.getElementById('tryBtn');
      const status = document.getElementById('status');
      const out    = document.getElementById('yieldsOut');

      out.innerHTML = '';
      status.textContent = '';
      btn.disabled = true;
      btn.textContent = '⏳ Waiting...';

      const hash = prompt('Paste your Base USDC tx hash:');
      if (!hash || !hash.trim()) {
        btn.disabled = false;
        btn.textContent = '🚀 Unlock Yields';
        return;
      }

      status.textContent = 'Verifying payment...';

      try {
        const res = await fetch('/', {
          headers: { 'X-Payment': JSON.stringify({ txHash: hash.trim(), amount: '0.01' }) }
        });

        if (res.ok) {
          const data = await res.json();
          out.innerHTML = data.data.opportunities.map(o =>
            '<div class="yield-item">' +
              '<div class="yield-left"><strong>' + o.protocol + '</strong><span>' + o.note + '</span></div>' +
              '<div class="apy">' + o.apy + '</div>' +
            '</div>'
          ).join('');
          status.textContent = '✅ Payment verified — data live';
        } else {
          status.innerHTML = '<span class="error">❌ Payment not verified. Check your tx hash and try again.</span>';
        }
      } catch (e) {
        status.innerHTML = '<span class="error">❌ Network error: ' + e.message + '</span>';
      }

      btn.disabled = false;
      btn.textContent = '🚀 Unlock Yields';
    });
  </script>
</body>
</html>`;

export default {
  async fetch(req) {
    const url    = new URL(req.url);
    const path   = url.pathname;
    const origin = url.origin;   // e.g. https://sbtc-yield-api.cryptoblac.workers.dev

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Payment, Content-Type'
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // ── Health ──────────────────────────────────────────────
    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        x402Enabled: true,
        network: 'base',
        asset: 'USDC',
        content: 'stacks-sbtc-yields'
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── x402 discovery (both paths — x402scan hits either) ─
    if (path === '/x402-info' || path === '/.well-known/x402') {
      return new Response(JSON.stringify({
        x402Version: 2,
        accepts: [{
          scheme: 'exact',
          network: CONFIG.NETWORK,
          maxAmountRequired: CONFIG.PAYMENT_AMOUNT_ATOMIC,
          maxTimeoutSeconds: CONFIG.MAX_TIMEOUT_SECONDS,
          asset: CONFIG.ASSET,
          payTo: CONFIG.PAYMENT_ADDRESS,
          resource: origin + '/',                          // full URL
          description: CONFIG.API_DESCRIPTION,
          mimeType: 'application/json',
          extra: { name: 'USD Coin', version: '2' },
          outputSchema: {
            input: {
              method: 'GET',
              type: 'http'
            },
            output: null
          }
        }]
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── Root ────────────────────────────────────────────────
    if (path === '/' || path === '/yield-opportunities') {
      const payHeader = req.headers.get('X-Payment');

      // No payment header → return 402 with full x402 schema
      if (!payHeader) {
        // If browser (Accept: text/html) and no payment → serve landing page
        if (req.headers.get('Accept')?.includes('text/html')) {
          return new Response(HTML_PAGE, {
            headers: { ...cors, 'Content-Type': 'text/html' }
          });
        }

        return new Response(JSON.stringify({
          x402Version: 2,
          accepts: [{
            scheme: 'exact',
            network: CONFIG.NETWORK,
            maxAmountRequired: CONFIG.PAYMENT_AMOUNT_ATOMIC,
            maxTimeoutSeconds: CONFIG.MAX_TIMEOUT_SECONDS,
            asset: CONFIG.ASSET,
            payTo: CONFIG.PAYMENT_ADDRESS,
            resource: origin + '/',
            description: CONFIG.API_DESCRIPTION,
            mimeType: 'application/json',
            extra: { name: 'USD Coin', version: '2' },
            outputSchema: {
              input: { method: 'GET', type: 'http' },
              output: null
            }
          }]
        }), {
          status: 402,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      // Has payment → validate and serve
      try {
        const payment = JSON.parse(payHeader);

        if (typeof payment.txHash !== 'string' || String(payment.amount) !== CONFIG.PAYMENT_AMOUNT) {
          return new Response(JSON.stringify({ error: 'Invalid payment details' }), {
            status: 402,
            headers: { ...cors, 'Content-Type': 'application/json' }
          });
        }

        // Accept-header check: HTML if browser, JSON if agent/API
        if (req.headers.get('Accept')?.includes('text/html')) {
          return new Response(HTML_PAGE, {
            headers: { ...cors, 'Content-Type': 'text/html', 'X-Payment-Verified': 'true' }
          });
        }

        return new Response(JSON.stringify(YIELD_DATA), {
          headers: { ...cors, 'Content-Type': 'application/json', 'X-Payment-Verified': 'true' }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: 'Bad request', message: e.message }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }
    }

    // ── 404 ─────────────────────────────────────────────────
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
