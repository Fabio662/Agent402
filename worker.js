/**
 * agent402 Worker — sBTC/STX YieldAgent on Stacks
 * Returns 402 + JSON on unpaid root (required for registration)
 */

const CONFIG = {
  PAYMENT_ADDRESS: 'SPNTEKCYS2PWDKH92WFTAT66N0NJG45D01G7T9YR',
  PAYMENT_AMOUNT: '0.1',
  API_DESCRIPTION: 'Live sBTC & STX yields on Stacks: Bitflow, Velar, ALEX, Zest, Stacking DAO',
  MAX_TIMEOUT_SECONDS: 300
};

const YIELD_DATA = {
  success: true,
  data: {
    opportunities: [
      { protocol: 'sBTC Native Hold', apy: '~5%', risk: 'Low', tvl: 'Protocol-level', note: 'Base 5% BTC reward on sBTC holdings' },
      { protocol: 'Bitflow sBTC/STX Pool', apy: '20%+', risk: 'Medium', tvl: '~$10M+', note: 'DEX LP yield + sBTC stacking' },
      { protocol: 'Velar sBTC Pool', apy: '~20%', risk: 'Medium', tvl: '~$20M+', note: 'LP yield + VELAR incentives' },
      { protocol: 'ALEX sBTC Pool', apy: '5% + ALEX', risk: 'Low-Medium', tvl: '~$20M+', note: 'sBTC + ALEX rewards' },
      { protocol: 'Zest sBTC Lending', apy: '7–10%', risk: 'Low', tvl: '~$50M+', note: 'Supply sBTC for BTC yield' },
      { protocol: 'Stacking DAO (stSTXbtc)', apy: '~10%', risk: 'Low', tvl: '~$30M+', note: 'Liquid stacking with sBTC rewards' },
      { protocol: 'Hermetica USDh', apy: 'up to 25%', risk: 'Medium', tvl: '~$15M+', note: 'BTC-backed stablecoin yield' }
    ],
    network: 'Stacks',
    lastUpdated: new Date().toISOString(),
    disclaimer: 'Yields fluctuate. DYOR. Approximate early-2026 data.'
  }
};

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YieldAgent - Stacks sBTC</title>
  <style>
    body { background: #0a0a0a; color: #f0f0f0; font-family: system-ui, sans-serif; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #111; border: 1px solid #f7931a; border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; text-align: center; }
    h1 { color: #f7931a; font-size: 2.5rem; margin-bottom: 16px; }
    .desc { margin-bottom: 24px; opacity: 0.9; }
    .pay-box { background: rgba(247,147,26,0.1); border: 1px solid #f7931a; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .amount { font-size: 2rem; color: #f7931a; font-weight: bold; }
    .address { font-family: monospace; word-break: break-all; margin: 16px 0; color: #ccc; }
    .btn { background: #f7931a; color: black; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; margin: 8px; }
    .btn:hover { background: #e67e00; }
    .status { margin-top: 16px; min-height: 24px; }
  </style>
</head>
<body>
<div class="card">
  <h1>YieldAgent - Stacks sBTC</h1>
  <p class="desc">Live sBTC & STX yields on Stacks: Bitflow, Velar, ALEX, Zest, Stacking DAO</p>
  <div class="pay-box">
    <div class="amount">0.1 STX</div>
    <div class="address">${CONFIG.PAYMENT_ADDRESS}</div>
    <button class="btn" onclick="navigator.clipboard.writeText('${CONFIG.PAYMENT_ADDRESS}'); this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy Address', 2000);">Copy Address</button>
  </div>
  <button class="btn" onclick="const hash = prompt('Paste your STX tx hash:'); if (hash) fetch('/', {headers: {'X-Payment': JSON.stringify({txHash: hash, amount: '0.1'})}}).then(r => r.json()).then(d => alert('Verified!')).catch(e => alert('Error'));">Unlock Yields</button>
  <div class="status" id="status"></div>
</div>
</body>
</html>`;

function discoveryDoc(origin) {
  return {
    x402Version: 2,
    accepts: [{
      scheme: "exact",
      network: "stacks:1",
      maxAmountRequired: "100000",
      maxTimeoutSeconds: 300,
      asset: "STX",
      payTo: "SPNTEKCYS2PWDKH92WFTAT66N0NJG45D01G7T9YR",
      resource: origin + "/",
      description: "Live sBTC & STX yields on Stacks: Bitflow, Velar, ALEX, Zest, Stacking DAO",
      mimeType: "application/json",
      extra: { name: "Stacks Token", version: "1" },
      outputSchema: { input: { method: "GET", type: "http" }, output: null }
    }]
  };
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const origin = url.origin;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    };

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    // Discovery
    if (path === '/.well-known/x402' || path === '/x402-info' || path === '/x402.json') {
      return new Response(JSON.stringify(discoveryDoc(origin)), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    // Root
    if (path === '/' || path === '') {
      const payHeader = req.headers.get('X-Payment');

      if (!payHeader) {
        if (req.headers.get('Accept')?.includes('text/html')) {
          return new Response(HTML_PAGE, {
            headers: { ...cors, 'Content-Type': 'text/html' }
          });
        }
        return new Response(JSON.stringify(discoveryDoc(origin)), {
          status: 402,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      // Paid → return yields JSON (add real verification later)
      return new Response(JSON.stringify(YIELD_DATA), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: cors });
  }
};
