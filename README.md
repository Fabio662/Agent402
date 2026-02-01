# Agent402

Pay-per-use sBTC yield data API built on [x402](https://x402.org) and deployed as a [Cloudflare Worker](https://workers.cloudflare.com).

No subscriptions. No API keys. Send 0.0001 sBTC, get live yield data back.

---

## Repo Structure

```
agent402/
├── worker.js        ← the actual Cloudflare Worker (all logic + payment page)
├── wrangler.toml    ← tells Cloudflare this is an ES module worker
├── package.json     ← minimal project config
└── README.md        ← this file
```

---

## Deploy

### 1. Create the repo on GitHub

- Go to github.com → **New repository** → name it `agent402`
- Check **Add a README** so it creates with a `main` branch
- Click **Create repository**

### 2. Upload the files

- Click **Add file → Upload files**
- Drag in: `worker.js`, `wrangler.toml`, `package.json`, `README.md`
- Scroll down → **Commit changes**

### 3. Connect to Cloudflare

- Go to `dash.cloudflare.com`
- Click **Workers & Pages** in the left sidebar
- Click **Create → Worker**
- Click **Connect a Git repository**
- Authorize GitHub if prompted → select `agent402`
- Click **Begin setup**
- Build command: leave blank
- Build output directory: leave blank
- Click **Deploy**

### 4. Route to your subdomain

- Go to the worker's **Settings** tab
- Under **Routes**, add: `agent402.cryptoblac.workers.dev/*`

---

## Endpoints

| Endpoint | Method | What it returns |
|---|---|---|
| `/` | GET | Service info JSON |
| `/x402` | GET | x402 discovery document |
| `/.well-known/x402` | GET | x402 discovery document (alias) |
| `/data` | GET | Payment page (browser), 402 (API), or yield data (paid) |
| `/health` | GET | Health check |

---

## Payment Flow

```
1. Client hits GET /data
         │
         ▼
2. No payment header?
   ├── Browser request  → 200 + payment page HTML (copy address, pay)
   └── API request      → 402 + JSON { payTo, amount, asset }
         │
         ▼
3. Client sends 0.0001 sBTC to the payment address on Stacks mainnet
         │
         ▼
4. Client hits GET /data again with:
   Header: X-Payment-Proof: <transaction_id>
         │
         ▼
5. Worker sees the proof header → 200 + yield data JSON
```

---

## Usage

### Browser

Open `https://agent402.cryptoblac.workers.dev/data` — you'll see the payment page with a copy button for the address.

### curl — check discovery

```bash
curl https://agent402.cryptoblac.workers.dev/x402
```

### curl — trigger 402

```bash
curl -H "Accept: application/json" https://agent402.cryptoblac.workers.dev/data
```

### curl — access data after payment

```bash
curl -H "X-Payment-Proof: <your_tx_id>" https://agent402.cryptoblac.workers.dev/data
```

---

## Payment Details

| Field | Value |
|---|---|
| Network | Stacks Mainnet |
| Asset | sBTC |
| Contract | `SM3KNVZS30WM7F89SXKVVFY4SN9RMPZZ9FX929N0V.sbtc-token` |
| Cost | 0.0001 sBTC (10,000 satoshis) |
| Pay to | `SP1VT305S4FTT6MKRD9KCQP8XESD3BKZ1QKGDB4VX` |

---

## Yield Data (current)

| Protocol | Pool | APY | Risk | TVL |
|---|---|---|---|---|
| Bitflow Finance | sBTC/STX | 62.4% | Medium | $2.8M |
| Velar | sBTC/USDC | 51.7% | Medium | $1.2M |
| ALEX | sBTC/STX | 32.8% | High | $3.5M |
| Zest Protocol | sBTC/USDT | 18.2% | Low | $0.9M |

---

## Registry

Listed on [STX402](https://stx402service.pages.dev) — the x402 service directory for Stacks.
