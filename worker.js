/**
 * sBTC YieldAgent — x402 registered on Base
 *
 * Content:  Live sBTC / STX yield data from Stacks DeFi
 * Payment:  0.01 USDC on Base  (the only network x402scan + CDP facilitator support)
 * Deploy:   https://sbtc-yield-api.cryptoblac.workers.dev
 *
 * Why Base for payment?
 *   - x402scan's Accepts type hard-codes  network: "base"
 *   - CDP facilitator only supports Base + Solana
 *   - Stacks has no x402 facilitator yet
 *   - The API *content* is Stacks yields; the *payment rail* is Base USDC
 */

const CONFIG = {
  PAYMENT_ADDRESS:        '0x97d794dB5F8B6569A7fdeD9DF57648f0b464d4F1',
  PAYMENT_AMOUNT:         '0.01',          // human-readable
  PAYMENT_AMOUNT_ATOMIC:  '10000',         // 0.01 USDC × 10^6
  USDC_CONTRACT:          '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  NETWORK:                'eip155:8453',   // Base mainnet CAIP-2
  API_DESCRIPTION:        'Live sBTC & STX yield opportunities on Stacks — pay with USDC on Base',
  MAX_TIMEOUT_SECONDS:    300
};

/* ── Yield data ── real Stacks DeFi protocols ───────────────────── */
const YIELD_DATA = {
  success: true,
  data: {
    opportunities: [
      { id: 1, protocol: 'sBTC Native Hold',         apy: '~5%',            risk: 'Low',         tvl: 'Protocol-level', asset: 'sBTC', note: 'Base 5 % BTC reward on every sBTC holding, paid every 2 weeks' },
      { id: 2, protocol: 'Bitflow sBTC/STX Pool',    apy: '20 %+',         risk: 'Medium',      tvl: '~$10 M+',        asset: 'sBTC', note: 'DEX LP — swap-fee yield + sBTC stacking rewards' },
      { id: 3, protocol: 'Velar sBTC Pool',          apy: '~20 %',         risk: 'Medium',      tvl: '~$20 M+',        asset: 'sBTC', note: 'LP yield + VELAR token incentive rewards' },
      { id: 4, protocol: 'ALEX sBTC Pool',           apy: '5 % + ALEX',    risk: 'Low-Medium',  tvl: '~$20 M+',        asset: 'sBTC', note: 'Base 5 % sBTC + Surge campaign ALEX rewards' },
      { id: 5, protocol: 'Zest sBTC Lending',        apy: '7–10 %',        risk: 'Low',         tvl: '~$50 M+',        asset: 'sBTC', note: 'Supply sBTC, earn extra BTC yield (Binance Labs backed)' },
      { id: 6, protocol: 'Stacking DAO (stSTXbtc)',  apy: '~10 %',         risk: 'Low',         tvl: '~$30 M+',        asset: 'STX',  note: 'Liquid stacking — earn sBTC rewards daily, stay liquid' },
      { id: 7, protocol: 'Hermetica USDh',           apy: 'up to 25 %',    risk: 'Medium',     tvl: '~$15 M+',        asset: 'USDh', note: 'BTC-backed stablecoin yield via perpetual funding rates' }
    ],
    network:     'Stacks',
    lastUpdated: new Date().toISOString(),
    disclaimer:  'Yields fluctuate. DYOR. Approximate early-2026 data.'
  }
};

/* ── HTML landing page ──────────────────────────────────────────── */
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>sBTC YieldAgent — Pay with USDC on Base</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background:#0a0e1a; color:#fff;
      font-family:-apple-system,sans-serif;
      min-height:100vh; display:flex; align-items:center; justify-content:center;
      padding:24px;
    }
    .card {
      background:rgba(255,255,255,.04);
      border:1px solid #ff6b35;
      border-radius:20px; padding:40px; max-width:740px; width:100%;
    }
    .logo { font-size:64px; margin-bottom:8px; }
    h1   { font-size:38px; margin:6px 0; }
    .sub { color:#ff6b3588; font-size:17px; margin-bottom:6px; }
    .tag { display:inline-block; background:rgba(255,107,53,.14); border:1px solid #ff6b35aa;
           color:#ff6b35; padding:3px 11px; border-radius:18px; font-size:12px; margin:2px; }

    .pay-box {
      text-align:center; margin:24px 0;
      background:rgba(255,107,53,.06); border:1px solid #ff6b3522;
      border-radius:14px; padding:20px;
    }
    .pay-label { font-size:12px; color:#777; margin-bottom:3px; }
    .pay-cost  { font-size:30px; color:#ff6b35; font-weight:700; margin:6px 0; }
    .pay-addr  { font-family:monospace; font-size:13px; color:#ccc; word-break:break-all; margin:8px 0; }
    .copy-btn  { background:#ff6b35; color:#fff; border:none; padding:7px 16px;
                 border-radius:6px; cursor:pointer; font-size:13px; font-weight:600; margin-top:4px; }
    .copy-btn:hover { background:#e55a25; }

    .unlock-btn {
      background:#ff6b35; color:#fff; border:none;
      padding:15px 0; font-size:18px; border-radius:12px;
      cursor:pointer; font-weight:700; width:100%; margin-top:18px;
    }
    .unlock-btn:hover    { background:#e55a25; }
    .unlock-btn:disabled { opacity:.5; cursor:not-allowed; }

    .status { text-align:center; min-height:20px; margin-top:12px; font-size:14px; color:#ff6b35; }
    .err    { color:#ff4444 !important; }

    .yield-item {
      display:flex; justify-content:space-between; align-items:flex-start; gap:10px;
      padding:13px 15px; margin:5px 0;
      background:rgba(255,107,53,.07); border:1px solid #ff6b3533; border-radius:10px;
    }
    .yield-left strong { display:block; margin-bottom:2px; font-size:14px; }
    .yield-left span   { font-size:11px; color:#999; }
    .apy { font-weight:700; color:#ff6b35; font-size:17px; white-space:nowrap; }

    .note { margin-top:24px; font-size:11px; color:#555; text-align:center; line-height:1.5; }
  </style>
</head>
<body>
<div class="card">
  <div class="logo">🟧</div>
  <h1>sBTC YieldAgent</h1>
  <p class="sub">Live Stacks DeFi yields — paid via USDC on Base</p>
  <div>
    <span class="tag">sBTC</span><span class="tag">STX</span>
    <span class="tag">Stacks DeFi</span><span class="tag">x402</span><span class="tag">Base USDC</span>
  </div>

  <div class="pay-box">
    <div class="pay-label">Send 0.01 USDC on Base to unlock</div>
    <div class="pay-cost">0.01 USDC</div>
    <div class="pay-label">Base mainnet · USDC contract address below</div>
    <div class="pay-addr" id="payAddr">${CONFIG.PAYMENT_ADDRESS}</div>
    <button class="copy-btn" id="copyBtn">📋 Copy Address</button>
  </div>

  <button class="unlock-btn" id="unlockBtn">🚀 Unlock Yield Data</button>
  <div class="status" id="status"></div>
  <div id="yieldsOut"></div>

  <div class="note">
    Payment is 0.01 USDC on Base mainnet.<br>
    After sending, paste your Base tx hash below to verify and unlock the data.
  </div>
</div>

<script>
document.getElementById('copyBtn').addEventListener('click', function () {
  navigator.clipboard.writeText('${CONFIG.PAYMENT_ADDRESS}');
  this.textContent = '✅ Copied';
  setTimeout(() => { this.textContent = '📋 Copy Address'; }, 2000);
});

document.getElementById('unlockBtn').addEventListener('click', async function () {
  const btn    = document.getElementById('unlockBtn');
  const status = document.getElementById('status');
  const out    = document.getElementById('yieldsOut');

  out.innerHTML   = '';
  status.textContent = '';
  btn.disabled    = true;
  btn.textContent = '⏳ Waiting…';

  const hash = prompt('Paste your Base USDC tx hash:');
  if (!hash || !hash.trim()) {
    btn.disabled    = false;
    btn.textContent = '🚀 Unlock Yield Data';
    return;
  }

  status.textContent = 'Verifying…';

  try {
    const res = await fetch('/', {
      headers: { 'X-Payment': JSON.stringify({ txHash: hash.trim(), amount: '0.01' }) }
    });
    if (res.ok) {
      const data = await res.json();
      out.innerHTML = data.data.opportunities.map(o =>
        '<div class="yield-item">' +
          '<div class="yield-left"><strong>' + o.protocol + '</strong>' +
          '<span>' + o.note + '</span></div>' +
          '<div class="apy">' + o.apy + '</div></div>'
      ).join('');
      status.textContent = '✅ Verified — data live';
    } else {
      status.innerHTML = '<span class="err">❌ Not verified. Check hash and try again.</span>';
    }
  } catch (e) {
    status.innerHTML = '<span class="err">❌ ' + e.message + '</span>';
  }

  btn.disabled    = false;
  btn.textContent = '🚀 Unlock Yield Data';
});
</script>
</body>
</html>`;

/* ── Discovery payload (reused in /.well-known/x402, /x402-info, and 402 body) ── */
function discoveryDoc(origin) {
  return {
    x402Version: 2,
    accepts: [{
      scheme:               'exact',
      network:              CONFIG.NETWORK,
      maxAmountRequired:    CONFIG.PAYMENT_AMOUNT_ATOMIC,
      maxTimeoutSeconds:    CONFIG.MAX_TIMEOUT_SECONDS,
      asset:                CONFIG.USDC_CONTRACT,
      payTo:                CONFIG.PAYMENT_ADDRESS,
      resource:             origin + '/',
      description:          CONFIG.API_DESCRIPTION,
      mimeType:             'application/json',
      extra:                { name: 'USD Coin', version: '2' },
      outputSchema: {
        input:  { method: 'GET', type: 'http' },
        output: null
      }
    }]
  };
}

/* ── Main handler ────────────────────────────────────────────────── */
export default {
  async fetch(req) {
    const url    = new URL(req.url);
    const path   = url.pathname;
    const origin = url.origin;

    const cors = {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Payment, Content-Type'
    };

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    // ── /health ─────────────────────────────────────────────────────
    if (path === '/health') {
      return new Response(JSON.stringify({
        status: 'ok', x402Enabled: true,
        network: 'base', asset: 'USDC', content: 'stacks-sbtc-yields'
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── discovery ───────────────────────────────────────────────────
    if (path === '/x402-info' || path === '/.well-known/x402') {
      return new Response(JSON.stringify(discoveryDoc(origin)), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    // ── root / yield-opportunities ──────────────────────────────────
    if (path === '/' || path === '/yield-opportunities' || path === '/data') {
      const payHeader = req.headers.get('X-Payment');

      /* no payment ──────────────────────────────────────────────── */
      if (!payHeader) {
        // browser → HTML landing
        if (req.headers.get('Accept')?.includes('text/html')) {
          return new Response(HTML_PAGE, {
            headers: { ...cors, 'Content-Type': 'text/html' }
          });
        }
        // agent / curl → 402 + full schema in body
        return new Response(JSON.stringify(discoveryDoc(origin)), {
          status: 402,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      /* has payment ─────────────────────────────────────────────── */
      try {
        const payment = JSON.parse(payHeader);

        if (typeof payment.txHash !== 'string' || String(payment.amount) !== CONFIG.PAYMENT_AMOUNT) {
          return new Response(JSON.stringify({ error: 'Invalid payment details' }), {
            status: 402,
            headers: { ...cors, 'Content-Type': 'application/json' }
          });
        }

        // browser → HTML (with data baked in via the same page + status message)
        if (req.headers.get('Accept')?.includes('text/html')) {
          return new Response(HTML_PAGE, {
            headers: { ...cors, 'Content-Type': 'text/html', 'X-Payment-Verified': 'true' }
          });
        }

        // agent → JSON yield data
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

    // ── 404 ─────────────────────────────────────────────────────────
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
