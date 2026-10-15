"""Market metrics for the ChronosMatch order book."""

from src.chronosmatch.order_book import OrderBook


def get_market_metrics(book: OrderBook) -> dict:
    """Calculate current order-book and executed-trade metrics."""
    best_bid = book.best_bid()
    best_ask = book.best_ask()
    total_volume = sum(trade.quantity for trade in book.trades)
    trade_count = len(book.trades)

    spread = (
        best_ask - best_bid
        if best_bid is not None and best_ask is not None
        else None
    )
    mid_price = (
        (best_bid + best_ask) / 2
        if best_bid is not None and best_ask is not None
        else None
    )

    return {
        "best_bid": best_bid,
        "best_ask": best_ask,
        "spread": spread,
        "mid_price": mid_price,
        "open_orders": len(book.orders),
        "trade_count": trade_count,
        "traded_volume": total_volume,
        "average_trade_size": total_volume / trade_count if trade_count else 0,
    }
