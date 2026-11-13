import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, BookOpen, CheckCircle2, CircleAlert, Clock3, Github, LayoutDashboard, ListOrdered, RefreshCcw, ShieldCheck, TrendingUp, Wifi, WifiOff, X } from 'lucide-react';

const API = '/api';
const fmt = (n) => Number(n ?? 0).toLocaleString('en-IN');
const money = (n) => `₹${fmt(n)}`;
const emptyBook = { bids: [], asks: [], orders: [], snapshot: {} };

// Display-only examples. Never submitted to FastAPI and never counted as engine trades.
const DEMO_TRADES = [
  { id:'TRD-1048', symbol:'AAPL', side:'BUY', price:245, quantity:20, time:'09:32:14', status:'Filled' },
  { id:'TRD-1049', symbol:'NVDA', side:'SELL', price:190, quantity:15, time:'09:38:26', status:'Filled' },
  { id:'TRD-1050', symbol:'MSFT', side:'BUY', price:428, quantity:10, time:'09:46:03', status:'Filled' },
  { id:'TRD-1051', symbol:'TSLA', side:'SELL', price:312, quantity:8, time:'10:04:55', status:'Filled' },
  { id:'TRD-1052', symbol:'AMZN', side:'BUY', price:222, quantity:12, time:'10:17:19', status:'Filled' },
  { id:'TRD-1053', symbol:'GOOGL', side:'SELL', price:177, quantity:18, time:'10:29:41', status:'Filled' },
  { id:'TRD-1054', symbol:'META', side:'BUY', price:516, quantity:6, time:'10:43:08', status:'Filled' },
  { id:'TRD-1055', symbol:'AAPL', side:'SELL', price:248, quantity:14, time:'11:02:37', status:'Filled' },
];


async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { cache: 'no-store', ...options });
  let body;
  try { body = await response.json(); } catch { body = {}; }
  if (!response.ok) {
    const detail = body.detail;
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${response.status})`);
  }
  return body;
}

function PriceChart({ trades, demo = false }) {
  const points = useMemo(() => trades.map((t, i) => ({ x: i, y: Number(t.price), qty: Number(t.quantity) })).filter(t => Number.isFinite(t.y)), [trades]);
  if (!points.length) return <div className="chart-empty"><BarChart3 size={38}/><strong>No executed trades yet</strong><span>Submit matching BUY and SELL orders to populate the execution-price chart.</span></div>;
  const w = 860, h = 270, pad = 35;
  const low = Math.min(...points.map(p => p.y)), high = Math.max(...points.map(p => p.y));
  const spread = Math.max(2, high - low);
  const min = low - spread * .15, max = high + spread * .15;
  const px = i => pad + (points.length === 1 ? (w - pad * 2) / 2 : i * (w - pad * 2) / (points.length - 1));
  const py = y => h - pad - (y - min) * (h - pad * 2) / (max - min);
  const coords = points.map((p, i) => `${px(i)},${py(p.y)}`).join(' ');
  const last = points[points.length - 1];
  const area = `${pad},${h-pad} ${coords} ${w-pad},${h-pad}`;
  return <div className="chart-wrap"><div className="chart-meta"><div><span className="muted">{demo ? 'DEMO PRICE SERIES' : 'LAST EXECUTION PRICE'}</span><h2>{money(last.y)}</h2></div><span className="subtle">{demo ? 'Illustrative sample prices · not market data' : `${points.length} execution${points.length === 1 ? '' : 's'} recorded`}</span></div><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Execution price history chart" preserveAspectRatio="none"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#1bbf9a" stopOpacity=".25"/><stop offset="100%" stopColor="#1bbf9a" stopOpacity="0"/></linearGradient></defs>{[0,1,2,3,4].map(i => <g key={i}><line x1={pad} y1={pad+i*(h-2*pad)/4} x2={w-pad} y2={pad+i*(h-2*pad)/4} stroke="#25344b" strokeDasharray="4 7"/><text x="2" y={pad+i*(h-2*pad)/4+4} fill="#71849e" fontSize="12">{Math.round(max-i*(max-min)/4)}</text></g>)}<polygon points={area} fill="url(#chartFill)"/><polyline points={coords} stroke="#26d5ad" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round"/>{points.map((p,i)=><circle key={i} cx={px(i)} cy={py(p.y)} r="4" fill="#26d5ad" stroke="#0c1728" strokeWidth="2"/>)}</svg><div className="chart-foot"><span>Earlier executions</span><span>Latest execution</span></div></div>;
}

function OrderBook({ book }) {
  const maxQty = Math.max(1, ...book.bids.map(x => Number(x.quantity)), ...book.asks.map(x => Number(x.quantity)));
  return <div className="panel book-panel"><div className="panel-heading"><div><h3>Order Book</h3><p>Aggregated open limit orders</p></div><BookOpen size={18}/></div><div className="book-columns"><div><div className="book-head green">BIDS <span>PRICE / QTY</span></div>{book.bids.length ? book.bids.slice(0,8).map(b=><div className="depth-row" key={b.price}><div className="depth-bar bid" style={{width:`${100*Number(b.quantity)/maxQty}%`}}/><span className="green">{money(b.price)}</span><span>{fmt(b.quantity)}</span></div>) : <div className="empty-small">No buy orders</div>}</div><div><div className="book-head red">ASKS <span>PRICE / QTY</span></div>{book.asks.length ? book.asks.slice(0,8).map(a=><div className="depth-row" key={a.price}><div className="depth-bar ask" style={{width:`${100*Number(a.quantity)/maxQty}%`}}/><span className="red">{money(a.price)}</span><span>{fmt(a.quantity)}</span></div>) : <div className="empty-small">No sell orders</div>}</div></div></div>;
}

export default function App() {
  const [book, setBook] = useState(emptyBook);
  const [trades, setTrades] = useState([]);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [side, setSide] = useState('BUY');
  const [price, setPrice] = useState('100');
  const [quantity, setQuantity] = useState('10');
  const [notice, setNotice] = useState(null);
  const [tab, setTab] = useState('trades');
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([request('/orderbook'), request('/trades')]);
      setBook({ ...emptyBook, ...b });
      setTrades(Array.isArray(t.trades) ? t.trades : []);
      setOnline(true);
      setLastUpdated(new Date());
    } catch {
      setOnline(false);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 2500);
    return () => clearInterval(timer);
  }, [refresh]);

  const stats = useMemo(() => {
    const volume = trades.reduce((sum,t) => sum + Number(t.quantity || 0),0);
    const notional = trades.reduce((sum,t) => sum + Number(t.quantity || 0)*Number(t.price || 0),0);
    return { volume, notional, trades: trades.length, open: book.orders.length, average: volume ? notional / volume : 0, high: trades.length ? Math.max(...trades.map(t => Number(t.price))) : 0, low: trades.length ? Math.min(...trades.map(t => Number(t.price))) : 0 };
  }, [trades,book.orders]);

  async function placeOrder(e) {
    e.preventDefault();
    const p = Number(price), q = Number(quantity);
    if (!Number.isSafeInteger(p) || p <= 0 || !Number.isSafeInteger(q) || q <= 0) {
      setNotice({type:'error',text:'Price and quantity must be positive whole numbers.'}); return;
    }
    setBusy(true); setNotice(null);
    try {
      const data = await request('/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({side,price:p,quantity:q})});
      const matches = Array.isArray(data.trades) ? data.trades.length : 0;
      setNotice({type:'success',text:`${side} order ${data.order?.order_id || ''} accepted. ${matches} trade(s) executed.`});
      await refresh();
    } catch (err) { setNotice({type:'error',text:err.message}); }
    finally { setBusy(false); }
  }

  async function loadSampleTrades() {
    if (!online || busy || seeding) return;
    setSeeding(true); setBusy(true); setNotice(null);
    // These are real API submissions to the existing matching engine, not fabricated chart values.
    // Distinct increasing prices avoid crossing existing resting orders in most normal sessions.
    const examples = [
      [105, 8], [108, 12], [104, 6], [111, 15], [109, 9], [115, 11],
      [112, 7], [117, 14], [114, 10], [119, 5], [116, 13], [121, 8]
    ];
    let completed = 0;
    try {
      for (const [p, q] of examples) {
        for (const orderSide of ['BUY', 'SELL']) {
          await request('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ side: orderSide, price: p, quantity: q }) });
        }
        completed++;
      }
      await refresh();
      setTab('trades');
      setNotice({ type: 'success', text: `Submitted ${completed * 2} sample orders through the matching engine. Check Trades and Analytics.` });
    } catch (err) {
      await refresh();
      setNotice({ type: 'error', text: `Stopped after ${completed} complete sample pairs: ${err.message}` });
    } finally { setSeeding(false); setBusy(false); }
  }

  async function cancelOrder(id) {
    setBusy(true); setNotice(null);
    try { await request(`/orders/${encodeURIComponent(id)}`,{method:'DELETE'});setNotice({type:'success',text:`Order ${id} cancelled.`});await refresh(); }
    catch(err) { setNotice({type:'error',text:err.message}); }
    finally { setBusy(false); }
  }

  const showDemo = trades.length === 0;
  const chartTrades = showDemo ? DEMO_TRADES : trades;
  const bestBid = book.bids[0]?.price;
  const bestAsk = book.asks[0]?.price;
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-icon"><Activity size={22}/></div><div><strong>CHRONOS<span>MATCH</span></strong><small>TRADING SYSTEM</small></div></div><div className="nav-label">WORKSPACE</div><a href="#dashboard" className="nav-item active"><LayoutDashboard size={18}/> Dashboard</a><a href="#analytics" className="nav-item"><BarChart3 size={18}/> Analytics</a><a href="#order-entry" className="nav-item"><TrendingUp size={18}/> Order Entry</a><a href="#order-history" className="nav-item"><ListOrdered size={18}/> Order History</a><a href="#market-depth" className="nav-item"><BookOpen size={18}/> Market Depth</a><div className="sidebar-bottom"><div className="mode"><ShieldCheck size={17}/><div><strong>Simulation mode</strong><span>No real funds involved</span></div></div><a href="https://github.com/aayuabcd/chronosmatch-hft-engine" target="_blank" rel="noreferrer" className="github"><Github size={17}/> Project repository</a></div></aside>
    <main className="main" id="dashboard"><header className="topbar"><div className="mobile-brand">CHRONOSMATCH</div><div className="topbar-title"><span className="crumb">WORKSPACE /</span> Overview</div><div className="topbar-right"><span className={`status ${online?'connected':'disconnected'}`}>{online?<Wifi size={15}/>:<WifiOff size={15}/>} {online?'Engine connected':'Engine offline'}</span><button className="icon-button" title="Refresh" onClick={refresh}><RefreshCcw size={17}/></button><div className="avatar">CM</div></div></header>
    <div className="content"><div className="page-heading"><div><div className="eyebrow">CHRONOSMATCH / EXECUTION WORKSPACE</div><h1>Trading Dashboard</h1><p>Price–time priority order matching • Python engine • FastAPI</p></div><div className="session-tag"><span className="live-dot"/> SIMULATED MARKET</div></div>
    {!online && !loading && <div className="connection-warning"><CircleAlert size={18}/><div><strong>Matching engine is offline.</strong><span>Start FastAPI on port 8765. This dashboard uses the Vite /api proxy, so no CORS configuration is required.</span></div><button onClick={refresh}>Retry</button></div>}
    <section className="stats-grid"><div className="stat-card"><div className="stat-label">EXECUTED TRADES <CheckCircle2 size={17}/></div><div className="stat-value">{fmt(stats.trades)}</div><div className="stat-foot">Matched transactions</div></div><div className="stat-card"><div className="stat-label">OPEN ORDERS <Clock3 size={17}/></div><div className="stat-value">{fmt(stats.open)}</div><div className="stat-foot">Waiting in the order book</div></div><div className="stat-card"><div className="stat-label">EXECUTED VOLUME <BarChart3 size={17}/></div><div className="stat-value">{fmt(stats.volume)}</div><div className="stat-foot">Total units matched</div></div><div className="stat-card"><div className="stat-label">TRADED NOTIONAL <Activity size={17}/></div><div className="stat-value">{money(stats.notional)}</div><div className="stat-foot">Simulated execution value</div></div></section>
    <section className="analytics-panel panel" id="analytics"><div className="panel-heading"><div><h3>Trading Analytics</h3><p>Calculated from executed trades in the matching engine</p></div><div className="analytics-actions"><span className="pill">SIMULATED</span><button className="sample-button" type="button" onClick={loadSampleTrades} disabled={!online || busy}>{seeding ? 'ADDING TRADES...' : '＋ Generate Sample Trades'}</button></div></div><div className="analytics-metrics"><div><span>VOLUME-WEIGHTED AVG PRICE</span><strong>{stats.volume ? money(stats.average.toFixed(2)) : '—'}</strong></div><div><span>HIGHEST EXECUTION</span><strong className="green">{stats.trades ? money(stats.high) : '—'}</strong></div><div><span>LOWEST EXECUTION</span><strong className="red">{stats.trades ? money(stats.low) : '—'}</strong></div><div><span>AVERAGE TRADE SIZE</span><strong>{stats.trades ? (stats.volume / stats.trades).toFixed(1) : '—'} <small>units</small></strong></div></div><div className="volume-heading">{showDemo ? 'DEMO VOLUME PREVIEW' : 'RECENT EXECUTED VOLUME'} <span>Units per trade</span></div><div className="volume-bars">{(trades.length ? trades : DEMO_TRADES).slice(-24).map((t,i,arr) => <div key={i} className="volume-bar-wrap" title={`Trade ${trades.length-arr.length+i+1}: ${t.quantity} units @ ${money(t.price)}`}><div className="volume-bar" style={{height:`${Math.max(6, Number(t.quantity)/Math.max(...arr.map(x=>Number(x.quantity)||1))*100)}%`}}/></div>)}</div><p className="analytics-disclaimer">Sample trades are simulated and submitted to your actual Python engine. They change its in-memory order book and trade history until the backend restarts.</p></section>
    <section className="workspace-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h3>Execution Price</h3><p>{showDemo ? 'Illustrative demo price series · switches to actual executions automatically' : 'Price history from actual matched orders'}</p></div><span className="pill">{showDemo ? 'DEMO DATA' : 'ENGINE DATA'}</span></div><PriceChart trades={chartTrades} demo={showDemo}/><div className="quote-strip"><div><span>BEST BID</span><strong className="green">{bestBid == null ? '—' : money(bestBid)}</strong></div><div><span>BEST ASK</span><strong className="red">{bestAsk == null ? '—' : money(bestAsk)}</strong></div><div><span>SPREAD</span><strong>{bestBid == null || bestAsk == null ? '—' : money(Number(bestAsk)-Number(bestBid))}</strong></div></div></div>
    <div className="panel order-panel" id="order-entry"><div className="panel-heading"><div><h3>Place Order</h3><p>Submit to ChronosMatch matching engine</p></div><TrendingUp size={18}/></div><div className="side-switch"><button type="button" className={side==='BUY'?'selected buy':''} onClick={()=>setSide('BUY')}><ArrowUpRight size={17}/> BUY</button><button type="button" className={side==='SELL'?'selected sell':''} onClick={()=>setSide('SELL')}><ArrowDownRight size={17}/> SELL</button></div><form onSubmit={placeOrder}><label htmlFor="price">Limit Price (₹)</label><input id="price" type="number" min="1" step="1" value={price} onChange={e=>setPrice(e.target.value)} required/><label htmlFor="quantity">Quantity (units)</label><input id="quantity" type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)} required/><div className="estimate"><span>Estimated order value</span><strong>{money(Number(price || 0)*Number(quantity || 0))}</strong></div><button className={`submit-order ${side.toLowerCase()}`} type="submit" disabled={!online || busy}>{busy?'PROCESSING...':`PLACE ${side} ORDER`}</button></form>{notice && <div className={`notice ${notice.type}`} role="status"><span>{notice.text}</span><button onClick={()=>setNotice(null)} aria-label="Dismiss"><X size={14}/></button></div>}<div className="order-note"><ShieldCheck size={15}/> All orders are educational simulations.</div></div></section>
    <section className="bottom-grid"><div id="market-depth"><OrderBook book={book}/></div><div className="panel history-panel" id="order-history"><div className="panel-heading"><div><h3>Trade Blotter & Orders</h3><p>Execution history and open-order management</p></div><span className="subtle">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for engine'}</span></div><div className="tabs"><button className={tab==='orders'?'current':''} onClick={()=>setTab('orders')}>Open Orders ({book.orders.length})</button><button className={tab==='trades'?'current':''} onClick={()=>setTab('trades')}>Trade Blotter ({trades.length || DEMO_TRADES.length}{showDemo ? ' demo' : ''})</button></div><div className="table-scroll">{tab==='orders'?<table><thead><tr><th>ORDER ID</th><th>SIDE</th><th>PRICE</th><th>REMAINING</th><th>ACTION</th></tr></thead><tbody>{book.orders.length ? book.orders.map(o=><tr key={o.order_id}><td className="mono">{o.order_id}</td><td><span className={`side-tag ${o.side.toLowerCase()}`}>{o.side}</span></td><td>{money(o.price)}</td><td>{fmt(o.remaining)}</td><td><button className="cancel" disabled={busy||!online} onClick={()=>cancelOrder(o.order_id)}>Cancel</button></td></tr>):<tr><td colSpan="5" className="table-empty">No open orders in the matching engine</td></tr>}</tbody></table>:<><div className="blotter-label"><span className={`blotter-indicator ${showDemo?'demo':'live'}`}>{showDemo?'DEMO DATA · ILLUSTRATIVE ONLY':'ENGINE EXECUTIONS · SIMULATED'}</span><span>{showDemo?'Sample symbols and prices; not real exchange data':'Recorded by your Python matching engine'}</span></div><table><thead>{showDemo?<tr><th>TRADE ID</th><th>ASSET</th><th>SIDE</th><th>PRICE</th><th>QTY</th><th>TIME</th><th>STATUS</th></tr>:<tr><th>BUY ORDER</th><th>SELL ORDER</th><th>PRICE</th><th>QTY</th><th>STATUS</th></tr>}</thead><tbody>{showDemo?DEMO_TRADES.map(t=><tr key={t.id}><td className="mono">{t.id}</td><td className="asset-symbol">{t.symbol}</td><td><span className={`side-tag ${t.side.toLowerCase()}`}>{t.side}</span></td><td>{money(t.price)}</td><td>{fmt(t.quantity)}</td><td className="mono">{t.time}</td><td><span className="filled-status">● {t.status}</span></td></tr>):[...trades].reverse().map((t,i)=><tr key={i}><td className="mono">{t.buy_order_id}</td><td className="mono">{t.sell_order_id}</td><td>{money(t.price)}</td><td>{fmt(t.quantity)}</td><td><span className="filled-status">● Matched</span></td></tr>)}</tbody></table></>}</div></div></section>
    <footer>ChronosMatch © 2026 · Educational order-matching simulator · Data refreshes every 2.5 seconds</footer></div></main></div>;
}
