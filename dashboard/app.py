"""ChronosMatch Pro: interactive matching-engine trading terminal."""

import sys
import subprocess
import re
from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.chronosmatch.order_book import Order, OrderBook
from src.chronosmatch.market_metrics import get_market_metrics
from src.chronosmatch.trade_audit import write_trades_csv

st.set_page_config(
    page_title="ChronosMatch Pro | Trading Terminal",
    page_icon="◈",
    layout="wide",
    initial_sidebar_state="expanded",
)

# -------------------- DESIGN SYSTEM --------------------
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');

:root {
  --bg:#080c12; --panel:#101822; --line:#273746;
  --muted:#91a3b6; --teal:#53ead4; --green:#39dfa0; --red:#ff6985;
}
.stApp {
  background:radial-gradient(ellipse at 12% 0%,#12303b55,transparent 35%),
             radial-gradient(ellipse at 92% 3%,#31245035,transparent 30%),var(--bg);
  color:#edf4fa;font-family:'Manrope',sans-serif;
}
.block-container{max-width:1700px;padding-top:1.35rem;padding-bottom:2rem}
[data-testid="stSidebar"]{background:#0b121a;border-right:1px solid var(--line)}
[data-testid="stSidebar"] *{font-family:'Manrope',sans-serif}
h1,h2,h3{letter-spacing:-.035em}
.eyebrow,.mono{font-family:'DM Mono',monospace;letter-spacing:1.2px}
.eyebrow{font-size:10px;color:var(--teal);text-transform:uppercase}
.hero{
 background:linear-gradient(115deg,#142630,#101822 62%,#211d34);
 border:1px solid #304b58;border-radius:18px;padding:25px 28px;margin:4px 0 20px;
}
.hero h1{font-size:clamp(28px,3.1vw,43px);font-weight:800;margin:8px 0 5px}
.hero h1 span{color:var(--teal)}
.hero p{color:#a9bac8;font-size:13px;margin:5px 0 0}
.pill{
 display:inline-block;border:1px solid #31545b;border-radius:30px;padding:5px 9px;
 color:#8af5df;font:10px 'DM Mono',monospace;margin:12px 5px 0 0;
}
.section{
 font:11px 'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;
 color:#9dafc0;margin:15px 0 12px
}
div[data-testid="stMetric"]{
 background:linear-gradient(145deg,#141f2b,#0e151e);
 border:1px solid #293947;border-radius:12px;padding:14px 15px;min-height:100px
}
div[data-testid="stMetricLabel"] p{color:#9aafbf!important;font-size:11px!important}
div[data-testid="stMetricValue"]{color:#f0f6fc!important;font:24px 'DM Mono',monospace!important}
.stButton button,.stDownloadButton button{
 background:linear-gradient(110deg,#163e43,#122c36);color:#8af5df;
 border:1px solid #315d62;border-radius:9px;font-weight:700;transition:.2s;
}
.stButton button:hover,.stDownloadButton button:hover{
 border-color:#53ead4;color:white;box-shadow:0 0 18px #53ead422;
}
div[data-testid="stDataFrame"]{border:1px solid #273746;border-radius:10px;overflow:hidden}
div[data-testid="stTabs"] button{font-weight:600}
hr{border-color:#263643}
footer{visibility:hidden}#MainMenu{visibility:hidden}
</style>
""", unsafe_allow_html=True)

# -------------------- SESSION STATE --------------------
if "book" not in st.session_state:
    st.session_state.book = OrderBook()
if "next_id" not in st.session_state:
    st.session_state.next_id = 1
if "benchmark_output" not in st.session_state:
    st.session_state.benchmark_output = None

book = st.session_state.book


def submit_order(side, price, quantity):
    order_id = f"ORD-{st.session_state.next_id:06d}"
    order = Order(
        order_id=order_id,
        side=side,
        price=int(price),
        quantity=int(quantity),
        timestamp=st.session_state.next_id,
    )
    book.submit_order(order)
    st.session_state.next_id += 1
    return order_id


def load_demo():
    submit_order("BUY", 9990, 20)
    submit_order("BUY", 9980, 30)
    submit_order("SELL", 10010, 15)
    submit_order("SELL", 10020, 20)
    submit_order("BUY", 10010, 8)


def make_chart():
    fig = go.Figure()
    fig.update_layout(
        height=320,
        margin=dict(l=8, r=8, t=18, b=8),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#aebdcc", family="DM Mono"),
        legend=dict(orientation="h", y=1.12, x=0),
        xaxis=dict(gridcolor="#202d39", zeroline=False),
        yaxis=dict(gridcolor="#202d39", zeroline=False),
    )
    return fig


# -------------------- SIDEBAR --------------------
with st.sidebar:
    st.markdown('<div class="eyebrow">◈ CHRONOSMATCH / PRO</div>',
                unsafe_allow_html=True)
    st.title("Trading Console")
    st.caption("LOCAL SIMULATION")
    st.divider()

    st.markdown("#### New limit order")
    side = st.radio("Side", ["BUY", "SELL"], horizontal=True)
    price = st.number_input("Limit price", min_value=1, value=10000, step=5)
    quantity = st.number_input("Quantity", min_value=1, value=10, step=1)

    if st.button("＋ Submit order", width='stretch', type="primary"):
        new_id = submit_order(side, price, quantity)
        st.success(f"Accepted: {new_id}")
        st.rerun()

    st.divider()
    st.markdown("#### Market controls")

    if st.button("Load demo market", width='stretch'):
        if not book.orders and not book.trades:
            load_demo()
            st.success("Demo orders loaded.")
        else:
            st.warning("Reset the current simulation first.")
        st.rerun()

    if st.button("Reset simulation", width='stretch'):
        st.session_state.book = OrderBook()
        st.session_state.next_id = 1
        st.session_state.benchmark_output = None
        st.rerun()

    st.divider()
    st.markdown("#### Engine status")
    st.markdown("🟢 **Matching engine** · Ready")
    st.markdown("🟢 **Market metrics** · Available")
    st.markdown("🟢 **Trade audit** · Available")
    st.markdown("⚪ **Live exchange** · Not connected")
    st.caption("All orders are simulated. No real money is involved.")

# -------------------- HEADER --------------------
st.markdown("""
<div class="hero">
  <div class="eyebrow">MARKET INTELLIGENCE &nbsp; / &nbsp; MATCHING ENGINE</div>
  <h1>ChronosMatch <span>Pro</span></h1>
  <p>Price-time priority. Execution analytics. Market microstructure.</p>
  <span class="pill">● ENGINE READY</span>
  <span class="pill">ORDER BOOK ACTIVE</span>
  <span class="pill">SIMULATION MODE</span>
</div>
""", unsafe_allow_html=True)

metrics = get_market_metrics(book)

# -------------------- MARKET SNAPSHOT --------------------
st.markdown('<div class="section">01 / Market snapshot</div>',
            unsafe_allow_html=True)

row1 = st.columns(4)
row1[0].metric("BEST BID", "—" if metrics["best_bid"] is None else f'{metrics["best_bid"]:,}')
row1[1].metric("BEST ASK", "—" if metrics["best_ask"] is None else f'{metrics["best_ask"]:,}')
row1[2].metric("BID–ASK SPREAD", "—" if metrics["spread"] is None else f'{metrics["spread"]:,}')
row1[3].metric("MID-PRICE", "—" if metrics["mid_price"] is None else f'{metrics["mid_price"]:,.2f}')

row2 = st.columns(4)
row2[0].metric("EXECUTED TRADES", f'{metrics["trade_count"]:,}')
row2[1].metric("TRADED VOLUME", f'{metrics["traded_volume"]:,}')
row2[2].metric("OPEN ORDERS", f'{metrics["open_orders"]:,}')
row2[3].metric("AVERAGE TRADE SIZE", f'{metrics["average_trade_size"]:.2f}')

# -------------------- MARKET INTELLIGENCE --------------------
st.markdown('<div class="section">02 / Interactive market intelligence</div>',
            unsafe_allow_html=True)

depth_col, analytics_col = st.columns([1.05, 1])

with depth_col:
    st.markdown("### Market depth")
    st.caption("Resting quantity grouped by limit price")

    bids, asks = {}, {}
    for order in book.orders.values():
        levels = bids if order.side == "BUY" else asks
        levels[order.price] = levels.get(order.price, 0) + order.remaining

    fig = make_chart()
    if bids:
        px = sorted(bids)
        fig.add_trace(go.Bar(
            x=px, y=[bids[p] for p in px], name="BUY liquidity",
            marker_color="#39dfa0",
            hovertemplate="BUY @ %{x}<br>Quantity: %{y}<extra></extra>",
        ))
    if asks:
        px = sorted(asks)
        fig.add_trace(go.Bar(
            x=px, y=[asks[p] for p in px], name="SELL liquidity",
            marker_color="#ff6985",
            hovertemplate="SELL @ %{x}<br>Quantity: %{y}<extra></extra>",
        ))
    fig.update_layout(barmode="group", xaxis_title="Limit price",
                      yaxis_title="Remaining quantity")
    if bids or asks:
        st.plotly_chart(fig, width='stretch')
    else:
        st.info("Load the demo market or submit orders to see market depth.")

with analytics_col:
    st.markdown("### Order-book imbalance")
    st.caption("Compares resting BUY quantity with resting SELL quantity")

    bid_qty = sum(bids.values())
    ask_qty = sum(asks.values())
    total_qty = bid_qty + ask_qty
    imbalance = (bid_qty - ask_qty) / total_qty if total_qty else 0

    st.metric("BOOK IMBALANCE", f"{imbalance:+.1%}",
              help="Positive means more resting BUY quantity; negative means more SELL quantity.")

    imb_fig = go.Figure(go.Bar(
        x=["BUY liquidity", "SELL liquidity"],
        y=[bid_qty, ask_qty],
        marker_color=["#39dfa0", "#ff6985"],
        text=[f"{bid_qty:,}", f"{ask_qty:,}"],
        textposition="outside",
    ))
    imb_fig.update_layout(
        height=175, margin=dict(l=5, r=5, t=15, b=5),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#aebdcc", family="DM Mono"),
        yaxis=dict(gridcolor="#202d39", title="Quantity"),
        xaxis=dict(gridcolor="#202d39"),
    )
    st.plotly_chart(imb_fig, width='stretch')

    st.markdown("### Execution-price history")
    if book.trades:
        trade_df = pd.DataFrame([
            {"Trade": i, "Price": t.price, "Quantity": t.quantity}
            for i, t in enumerate(book.trades, start=1)
        ])
        price_fig = make_chart()
        price_fig.add_trace(go.Scatter(
            x=trade_df["Trade"], y=trade_df["Price"],
            mode="lines+markers", name="Execution price",
            line=dict(color="#53ead4", width=2),
            marker=dict(size=7),
            hovertemplate="Trade %{x}<br>Price %{y}<extra></extra>",
        ))
        price_fig.update_layout(xaxis_title="Trade sequence",
                                yaxis_title="Execution price", height=240)
        st.plotly_chart(price_fig, width='stretch')
    else:
        st.info("Execution-price history will appear after trades occur.")

# -------------------- ORDER MANAGEMENT --------------------
st.markdown('<div class="section">03 / Order management & audit</div>',
            unsafe_allow_html=True)

orders_tab, trades_tab, audit_tab, benchmark_tab = st.tabs([
    "Open orders & cancellation",
    "Execution history",
    "Trade audit export",
    "Performance benchmark",
])

with orders_tab:
    st.markdown("### Resting orders")
    if book.orders:
        order_rows = [{
            "Order ID": o.order_id,
            "Side": o.side,
            "Limit price": o.price,
            "Remaining": o.remaining,
            "Timestamp": o.timestamp,
        } for o in book.orders.values()]

        st.dataframe(pd.DataFrame(order_rows), width='stretch',
                     hide_index=True)

        st.markdown("#### Cancel an order")
        order_ids = list(book.orders.keys())
        selected_id = st.selectbox("Select open order", order_ids)
        selected_order = book.orders[selected_id]
        st.caption(
            f"{selected_order.side} · Price {selected_order.price:,} · "
            f"Remaining quantity {selected_order.remaining:,}"
        )
        if st.button("Cancel selected order", type="primary"):
            if book.cancel_order(selected_id):
                st.success(f"Order {selected_id} cancelled.")
            else:
                st.error("Cancellation failed: order is no longer open.")
            st.rerun()
    else:
        st.info("No open orders. Submit an order or load the demo market.")

with trades_tab:
    if book.trades:
        all_trades = pd.DataFrame([{
            "Trade ID": f"T-{i:05d}",
            "Buy order": t.buy_order_id,
            "Sell order": t.sell_order_id,
            "Execution price": t.price,
            "Executed quantity": t.quantity,
            "Notional value": t.price * t.quantity,
        } for i, t in enumerate(book.trades, start=1)])
        st.dataframe(all_trades, width='stretch', hide_index=True)
        st.caption(f"{len(book.trades)} trades executed in this simulation.")
    else:
        st.info("No executions yet. Submit a crossing order to create a trade.")

with audit_tab:
    st.markdown("### Downloadable trade audit")
    if book.trades:
        audit_path = ROOT / "data" / "trade_audit.csv"
        write_trades_csv(book.trades, audit_path)
        st.caption(f"{len(book.trades)} executions ready for export.")
        st.download_button(
            "↓ Download trade audit CSV",
            data=audit_path.read_bytes(),
            file_name="chronosmatch_trade_audit.csv",
            mime="text/csv",
        )
        st.caption("The downloadable audit contains trade IDs, order IDs, price and quantity.")
    else:
        st.info("Execute a trade first to enable the audit export.")

with benchmark_tab:
    st.markdown("### Matching-engine performance")
    st.caption("Runs the local Python benchmark against synthetic orders.")
    benchmark_count = st.select_slider(
        "Orders to process",
        options=[1000, 5000, 10000, 25000, 50000],
        value=10000,
        format_func=lambda x: f"{x:,} orders",
    )
    if st.button("Run benchmark", type="primary"):
        script = ROOT / "benchmarks" / "benchmark_order_book.py"
        try:
            result = subprocess.run(
                [sys.executable, str(script), "--count", str(benchmark_count)],
                cwd=ROOT, capture_output=True, text=True, timeout=120,
            )
            if result.returncode == 0:
                st.session_state.benchmark_output = result.stdout
            else:
                st.session_state.benchmark_output = (
                    "Benchmark failed:\n" + result.stderr[-3000:]
                )
        except subprocess.TimeoutExpired:
            st.session_state.benchmark_output = (
                "Benchmark timed out. Try a smaller order count."
            )
        st.rerun()

    if st.session_state.benchmark_output:
        st.code(st.session_state.benchmark_output, language="text")
        st.caption("Results depend on your computer and current system load.")
    else:
        st.info("Choose an order count and run the benchmark to view measured results.")

# -------------------- FOOTER --------------------
st.divider()
st.markdown("""
<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;
color:#75889a;font:10px 'DM Mono',monospace">
<span>CHRONOSMATCH PRO</span>
<span>PYTHON · STREAMLIT · PLOTLY</span>
<span>EDUCATIONAL SIMULATION / NOT A LIVE EXCHANGE</span>
</div>
""", unsafe_allow_html=True)

