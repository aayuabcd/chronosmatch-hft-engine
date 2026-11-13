
import { useEffect, useState } from "react";
import "./TradingTerminal.css";

const API = "http://127.0.0.1:8765";

export default function TradingTerminal() {
  const [side, setSide] = useState("BUY");
  const [price, setPrice] = useState("100");
  const [quantity, setQuantity] = useState("10");
  const [book, setBook] = useState({ bids: [], asks: [], orders: [] });
  const [trades, setTrades] = useState([]);
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      const [bookResponse, tradeResponse] = await Promise.all([
        fetch(`${API}/orderbook`),
        fetch(`${API}/trades`),
      ]);

      if (!bookResponse.ok || !tradeResponse.ok) {
        throw new Error("Unable to load trading data");
      }

      const bookData = await bookResponse.json();
      const tradeData = await tradeResponse.json();

      setBook(bookData);
      setTrades(tradeData.trades || []);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, []);

  async function submitOrder(event) {
    event.preventDefault();

    const p = Number(price);
    const q = Number(quantity);

    if (!Number.isSafeInteger(p) || p <= 0 ||
        !Number.isSafeInteger(q) || q <= 0) {
      setMessage("Enter positive whole numbers for price and quantity.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, price: p, quantity: q }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Order rejected"
        );
      }

      const count = data.trades?.length || 0;
      setMessage(
        `${side} order ${data.order.order_id} accepted. ` +
        `${count} trade(s) executed.`
      );
      await refresh();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder(orderId) {
    setBusy(true);

    try {
      const response = await fetch(
        `${API}/orders/${encodeURIComponent(orderId)}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Cancellation failed");

      setMessage(`${orderId} cancelled.`);
      await refresh();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cm-terminal">
      <div className="cm-terminal-heading">
        <div>
          <span className="cm-eyebrow">CHRONOSMATCH / LIVE SIMULATION</span>
          <h3>TRADING TERMINAL</h3>
        </div>
        <span className={online ? "cm-online" : "cm-offline"}>
          ● {online ? "ENGINE CONNECTED" : "ENGINE OFFLINE"}
        </span>
      </div>

      <div className="cm-terminal-grid">
        <form className="cm-panel" onSubmit={submitOrder}>
          <h4>PLACE AN ORDER</h4>

          <div className="cm-side-toggle">
            <button type="button"
              className={side === "BUY" ? "selected" : ""}
              onClick={() => setSide("BUY")}>
              BUY
            </button>
            <button type="button"
              className={side === "SELL" ? "selected" : ""}
              onClick={() => setSide("SELL")}>
              SELL
            </button>
          </div>

          <label htmlFor="cm-price">PRICE (₹)</label>
          <input id="cm-price" type="number" min="1" step="1"
            value={price} onChange={(e) => setPrice(e.target.value)}
            required />

          <label htmlFor="cm-quantity">QUANTITY</label>
          <input id="cm-quantity" type="number" min="1" step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required />

          <button className="cm-submit" type="submit"
            disabled={!online || busy}>
            {busy ? "PROCESSING..." : `PLACE ${side} ORDER`}
          </button>

          {message && <p className="cm-message" role="status">{message}</p>}
        </form>

        <div className="cm-panel">
          <h4>MARKET DEPTH / ORDER BOOK</h4>
          <div className="cm-depth-grid">
            <div>
              <strong className="cm-buy-text">BUY BIDS</strong>
              <div className="cm-table-head">
                <span>PRICE</span><span>QTY</span>
              </div>
              {book.bids.length === 0 && <p>No bids</p>}
              {book.bids.map((bid) => (
                <div className="cm-data-row" key={bid.price}>
                  <span>₹{bid.price}</span>
                  <span>{bid.quantity}</span>
                </div>
              ))}
            </div>
            <div>
              <strong className="cm-sell-text">SELL ASKS</strong>
              <div className="cm-table-head">
                <span>PRICE</span><span>QTY</span>
              </div>
              {book.asks.length === 0 && <p>No asks</p>}
              {book.asks.map((ask) => (
                <div className="cm-data-row" key={ask.price}>
                  <span>₹{ask.price}</span>
                  <span>{ask.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="cm-terminal-grid">
        <div className="cm-panel">
          <h4>OPEN ORDERS</h4>
          <div className="cm-scroll">
            {book.orders.length === 0 && <p>No open orders</p>}
            {book.orders.map((order) => (
              <div className="cm-order-row" key={order.order_id}>
                <span>{order.order_id}</span>
                <strong className={
                  order.side === "BUY" ? "cm-buy-text" : "cm-sell-text"
                }>{order.side}</strong>
                <span>₹{order.price} × {order.remaining}</span>
                <button type="button" disabled={busy || !online}
                  onClick={() => cancelOrder(order.order_id)}>
                  CANCEL
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="cm-panel">
          <h4>EXECUTED TRADES ({trades.length})</h4>
          <div className="cm-scroll">
            {trades.length === 0 && <p>No trades executed yet</p>}
            {[...trades].reverse().map((trade, index) => (
              <div className="cm-trade-row" key={index}>
                <span>₹{trade.price}</span>
                <span>{trade.quantity} units</span>
                <small>{trade.buy_order_id} / {trade.sell_order_id}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="cm-disclaimer">
        Educational simulation only. No real-money trades are placed.
      </p>
    </div>
  );
}
