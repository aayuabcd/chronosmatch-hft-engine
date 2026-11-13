# ChronosMatch Pro — Setup (Windows PowerShell)

This is a **new React frontend only**. It does not modify `api.py`, `src/chronosmatch`, `dashboard`, or your existing `frontend`.

## 1. Extract
Extract the `chronosmatch-pro` folder from the ZIP into `D:\ChronosMatch\` and rename that folder `frontend-pro`.

Expected: `D:\ChronosMatch\frontend-pro\package.json` and `D:\ChronosMatch\frontend-pro\src\App.jsx`.

## 2. Install frontend dependencies (once)
Open PowerShell:

```powershell
cd D:\ChronosMatch\frontend-pro
npm.cmd install
```

## 3. Start the Python backend (PowerShell window 1)

```powershell
cd D:\ChronosMatch
.\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8765
```

Keep it running. Test `http://127.0.0.1:8765/health`.

## 4. Start the NEW frontend (PowerShell window 2)

```powershell
cd D:\ChronosMatch\frontend-pro
npm.cmd run dev
```

Keep it running. Open `http://127.0.0.1:5174/`.

**Do not use port 5173 for this new website**; that's the old frontend. Port 5174 is the new professional dashboard.

## 5. Verify matching

1. Status must say `Engine connected`.
2. BUY 10 at 100 and submit.
3. SELL 6 at 100 and submit.
4. Check Activity > Trades: one trade for 6 units, price 100.
5. Check Open Orders: remaining BUY quantity 4 (assuming a fresh backend).
6. You can cancel that remaining BUY order.

## Troubleshooting

- `Engine offline`: verify the backend PowerShell window remains open and `/health` responds. The frontend uses Vite's `/api` proxy to `127.0.0.1:8765` to avoid CORS issues.
- `localhost refused to connect`: the respective server process has stopped; restart it in its own terminal window.
- `port 5174 already in use`: close the old process using that port, or adjust `vite.config.js` and `package.json` together.
- If Vite starts but the API remains offline, check `http://127.0.0.1:5174/api/orderbook`. It should return JSON when the backend is running.
- Trades and orders are in-memory and reset when FastAPI restarts.
- The chart plots actual **executed simulation prices**, not live exchange data. Before trades occur it intentionally displays an empty state.

No existing files are overwritten by this ZIP. Keep your old `frontend` folder for backup.


## Analytics and sample trades (v1.1)
The Analytics panel computes volume-weighted average execution price, high/low, average trade size, and a volume histogram from GET /trades. Click **Generate Sample Trades** once with the backend connected to submit 12 BUY/SELL pairs through POST /orders. These are genuine simulated matching-engine transactions, not static mock data. The sample loader changes in-memory backend state. Restart the backend to clear it if the engine has no persistence.
