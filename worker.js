/**
 * YieldAgent — x402 compliant Cloudflare Worker
 * Deploy as: my-agent-worker (wrangler name)
 * URL:       https://my-agent-worker.cryptoblac.workers.dev
 *
 * Routes:
 *   GET /.well-known/x402   → discovery JSON (x402scan probes this)
 *   GET /x402-info          → same discovery JSON
 *   GET /health             → quick status check
 *   GET /data               → protected: 402 if no payment, yield JSON if paid
 *   GET /                   → browser: HTML page | agent: 402 JSON
 */

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const PAYMENT_ADDRESS = '0x97d794dB5F8B6569A7fdeD9DF57648f0b464d4F1';
const USDC_CONTRACT   = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const NETWORK         = 'base';
const AMOUNT_HUMAN    = '0.01';
const AMOUNT_ATOMIC   = '10000';                                        // 0.01 × 10^6

// ─── YIELD DATA ──────────────────────────────────────────────────────────────
const YIELD_PAYLOAD = {
  success: true,
  data: {
    opportunities: [
      { id: 1, protocol: 'sBTC Native Hold',        apy: '~5 %',          risk: 'Low',        tvl: 'Protocol-level', asset: 'sBTC', note: 'Base 5 % BTC reward every 2 weeks on all sBTC holdings' },
      { id: 2, protocol: 'Bitflow sBTC/STX Pool',   apy: '20 %+',        risk: 'Medium',     tvl: '~$10 M+',       asset: 'sBTC', note: 'DEX LP — swap-fee yield + sBTC stacking rewards' },
      { id: 3, protocol: 'Velar sBTC Pool',         apy: '~20 %',        risk: 'Medium',     tvl: '~$20 M+',       asset: 'sBTC', note: 'LP yield + VELAR token incentive rewards' },
      { id: 4, protocol: 'ALEX sBTC Pool',          apy: '5 % + ALEX',   risk: 'Low-Medium', tvl: '~$20 M+',       asset: 'sBTC', note: 'Base 5 % sBTC yield + Surge campaign ALEX rewards' },
      { id: 5, protocol: 'Zest sBTC Lending',       apy: '7–10 %',       risk: 'Low',        tvl: '~$50 M+',       asset: 'sBTC', note: 'Supply sBTC, earn extra BTC yield (Binance Labs backed)' },
      { id: 6, protocol: 'Stacking DAO (stSTXbtc)', apy: '~10 %',       risk: 'Low',        tvl: '~$30 M+',       asset: 'STX',  note: 'Liquid stacking — earn sBTC rewards daily, stay liquid' },
      { id: 7, protocol: 'Hermetica USDh',          apy: 'up to 25 %',   risk: 'Medium',    tvl: '~$15 M+',       asset: 'USDh', note: 'BTC-backed stablecoin yield via perpetual funding rates' }
    ],
    network:     'Stacks',
    lastUpdated: new Date().toISOString(),
    disclaimer:  'Yields fluctuate — DYOR. Approximate early-2026 data.'
  }
};

// ─── DISCOVERY DOC ───────────────────────────────────────────────────────────
function discoveryDoc(origin) {
  return {
    x402Version: 2,
    accepts: [
      {
        scheme:            'exact',
        network:           'base',
        maxAmountRequired: AMOUNT_ATOMIC,
        resource:          origin + '/',
        description:       'Live sBTC & STX yield data from top Stacks DeFi protocols',
        mimeType:          'application/json',
        payTo:             PAYMENT_ADDRESS,
        maxTimeoutSeconds: 300,
        asset:             USDC_CONTRACT,
        outputSchema: {
          input:  { 
            type: 'http',
            method: 'GET'
          },
          output: null
        }
      }
    ]
  };
}

// ─── HTML LANDING PAGE ───────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>YieldAgent — sBTC Yields</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background:#0a0e1a; color:#fff;
    font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    padding:20px;
  }
  .card {
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,107,53,.6);
    border-radius:18px; padding:36px 32px;
    max-width:520px; width:100%; text-align:center;
  }
  .icon  { font-size:48px; margin-bottom:4px; }
  h1     { font-size:28px; margin:6px 0 2px; }
  .sub   { color:rgba(255,107,53,.7); font-size:15px; margin-bottom:18px; }
  .tag   { display:inline-block; background:rgba(255,107,53,.12); border:1px solid rgba(255,107,53,.35);
           color:#ff6b35; padding:3px 10px; border-radius:14px; font-size:11px; margin:2px; }
  .pay   { background:rgba(255,107,53,.06); border:1px solid rgba(255,107,53,.2);
           border-radius:12px; padding:18px; margin:20px 0; }
  .pay-label { font-size:11px; color:#888; margin-bottom:2px; }
  .pay-cost  { font-size:28px; color:#ff6b35; font-weight:700; margin:4px 0; }
  .pay-addr  { font-family:'SF Mono',monospace; font-size:12px; color:#bbb;
               word-break:break-all; margin:8px 0; }
  .copy-btn  { background:#ff6b35; color:#fff; border:none;
               padding:6px 14px; border-radius:6px; cursor:pointer;
               font-size:12px; font-weight:600; }
  .copy-btn:hover { background:#e55a25; }
  .unlock { background:#ff6b35; color:#fff; border:none;
            padding:13px; font-size:16px; border-radius:10px;
            cursor:pointer; font-weight:700; width:100%; margin-top:6px; }
  .unlock:hover    { background:#e55a25; }
  .unlock:disabled { opacity:.45; cursor:not-allowed; }
  .status { min-height:18px; margin-top:10px; font-size:13px; color:#ff6b35; }
  .err    { color:#ff4c4c !important; }
  .yield { display:flex; justify-content:space-between; align-items:center; gap:8px;
           padding:11px 14px; margin:4px 0;
           background:rgba(255,107,53,.07); border:1px solid rgba(255,107,53,.25);
           border-radius:8px; text-align:left; }
  .yield strong { font-size:13px; display:block; }
  .yield span   { font-size:10px; color:#777; }
  .apy          { color:#ff6b35; font-weight:700; font-size:16px; white-space:nowrap; }
  .footer { margin-top:20px; font-size:10px; color:#444; line-height:1.5; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">🤖</div>
  <h1>YieldAgent</h1>
  <p class="sub">Live sBTC & STX yields — pay once with USDC on Base</p>
  <div>
    <span class="tag">sBTC</span>
    <span class="tag">STX</span>
    <span class="tag">Stacks DeFi</span>
    <span class="tag">x402</span>
    <span class="tag">Base USDC</span>
  </div>

  <div class="pay">
    <div class="pay-label">Send USDC on Base mainnet to unlock</div>
    <div class="pay-cost">0.01 USDC</div>
    <div class="pay-addr" id="addr">0x97d794dB5F8B6569A7fdeD9DF57648f0b464d4F1</div>
    <button class="copy-btn" id="copyBtn">📋 Copy Address</button>
  </div>

  <button class="unlock" id="unlockBtn">🚀 Unlock Yield Data</button>
  <div class="status" id="status"></div>
  <div id="yields"></div>

  <div class="footer">
    Pay 0.01 USDC on Base mainnet · paste your tx hash to unlock<br>
    <a href="/.well-known/x402" style="color:#ff6b35;text-decoration:none;">View x402 discovery doc →</a>
  </div>
</div>

<script>
document.getElementById('copyBtn').onclick = function () {
  navigator.clipboard.writeText('0x97d794dB5F8B6569A7fdeD9DF57648f0b464d4F1');
  this.textContent = '✅ Copied';
  setTimeout(() => { this.textContent = '📋 Copy Address'; }, 1800);
};

document.getElementById('unlockBtn').onclick = async function () {
  const btn    = this;
  const status = document.getElementById('status');
  const out    = document.getElementById('yields');
  out.innerHTML = '';
  status.textContent = '';
  btn.disabled = true;
  btn.textContent = '⏳ …';

  const hash = prompt('Paste your Base USDC tx hash:');
  if (!hash || !hash.trim()) { btn.disabled = false; btn.textContent = '🚀 Unlock Yield Data'; return; }

  status.textContent = 'Verifying…';
  try {
    const res = await fetch('/data', {
      headers: { 'X-Payment': JSON.stringify({ txHash: hash.trim(), amount: '0.01' }) }
    });
    if (res.ok) {
      const json = await res.json();
      out.innerHTML = json.data.opportunities.map(o =>
        '<div class="yield">' +
          '<div><strong>' + o.protocol + '</strong><span>' + o.note + '</span></div>' +
          '<div class="apy">' + o.apy + '</div></div>'
      ).join('');
      status.textContent = '✅ Unlocked';
    } else {
      status.innerHTML = '<span class="err">❌ Not verified — check hash and retry</span>';
    }
  } catch (e) {
    status.innerHTML = '<span class="err">❌ ' + e.message + '</span>';
  }
  btn.disabled = false;
  btn.textContent = '🚀 Unlock Yield Data';
};
</script>
</body>
</html>`;

// ─── CORS ────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Payment, Content-Type'
};

function jsonResp(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra }
  });
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
export default {
  async fetch(request) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const origin = url.origin;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── /health ──────────────────────────────────────────────────────────
    if (path === '/health') {
      return jsonResp({ status: 'ok', x402: true, network: 'base', asset: 'USDC', content: 'stacks-sbtc-yields' });
    }

    // ── discovery ── x402scan hits /.well-known/x402 ──────────────────
    if (path === '/.well-known/x402' || path === '/x402-info') {
      return jsonResp(discoveryDoc(origin));
    }

    // ── protected routes: / and /data ──────────────────────────────────
    if (path === '/' || path === '/data') {

      const payHeader = request.headers.get('X-Payment');

      // no payment
      if (!payHeader) {
        // browser on root → HTML
        if (path === '/' && request.headers.get('Accept')?.includes('text/html')) {
          return new Response(HTML, { headers: { ...CORS, 'Content-Type': 'text/html; charset=utf-8' } });
        }
        // everything else (agent, curl, x402scan probe) → 402 + discovery in body
        return jsonResp(discoveryDoc(origin), 402);
      }

      // has payment
      try {
        const payment = JSON.parse(payHeader);

        if (!payment.txHash || String(payment.amount) !== AMOUNT_HUMAN) {
          return jsonResp({ error: 'Invalid payment — need {"txHash":"0x…","amount":"0.01"}' }, 402);
        }

        return jsonResp(YIELD_PAYLOAD, 200, { 'X-Payment-Verified': 'true' });

      } catch (_) {
        return jsonResp({ error: 'Malformed X-Payment header' }, 400);
      }
    }

    // ── 404 ──────────────────────────────────────────────────────────────
    return jsonResp({ error: 'Not found', routes: ['/', '/data', '/.well-known/x402', '/x402-info', '/health'] }, 404);
  }
};
