from src.chronosmatch.order_book import Order, OrderBook
from src.chronosmatch.market_metrics import get_market_metrics


def test_metrics_with_trades():
    book = OrderBook()
    book.submit_order(Order("B1", "BUY", 100, 10, 1))
    book.submit_order(Order("S1", "SELL", 100, 4, 2))
    book.submit_order(Order("S2", "SELL", 105, 3, 3))

    metrics = get_market_metrics(book)

    assert metrics["best_bid"] == 100
    assert metrics["best_ask"] == 105
    assert metrics["spread"] == 5
    assert metrics["mid_price"] == 102.5
    assert metrics["trade_count"] == 1
    assert metrics["traded_volume"] == 4
    assert metrics["average_trade_size"] == 4
    assert metrics["open_orders"] == 2


def test_metrics_on_empty_book():
    metrics = get_market_metrics(OrderBook())

    assert metrics["best_bid"] is None
    assert metrics["best_ask"] is None
    assert metrics["spread"] is None
    assert metrics["mid_price"] is None
    assert metrics["trade_count"] == 0
    assert metrics["traded_volume"] == 0
    assert metrics["average_trade_size"] == 0
