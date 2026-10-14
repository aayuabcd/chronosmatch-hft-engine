
import pytest

from src.chronosmatch.order_book import Order, OrderBook


def test_orders_match_at_resting_order_price():
    book = OrderBook()
    book.submit_order(Order("S1", "SELL", 100, 5, 1))

    trades = book.submit_order(Order("B1", "BUY", 100, 3, 2))

    assert len(trades) == 1
    assert trades[0].price == 100
    assert trades[0].quantity == 3
    assert book.snapshot()["open_orders"] == 1


def test_partial_fill():
    book = OrderBook()
    book.submit_order(Order("S1", "SELL", 100, 10, 1))

    trades = book.submit_order(Order("B1", "BUY", 100, 4, 2))

    assert trades[0].quantity == 4
    assert book.orders["S1"].remaining == 6


def test_price_priority():
    book = OrderBook()
    book.submit_order(Order("S1", "SELL", 102, 2, 1))
    book.submit_order(Order("S2", "SELL", 101, 2, 2))

    trades = book.submit_order(Order("B1", "BUY", 105, 3, 3))

    assert trades[0].sell_order_id == "S2"
    assert trades[0].price == 101
    assert trades[1].sell_order_id == "S1"
    assert trades[1].price == 102


def test_cancel_order():
    book = OrderBook()
    book.submit_order(Order("B1", "BUY", 99, 5, 1))

    assert book.cancel_order("B1") is True
    assert book.best_bid() is None
    assert book.cancel_order("B1") is False


def test_invalid_order():
    book = OrderBook()

    with pytest.raises(ValueError):
        book.submit_order(Order("B1", "BUY", 0, 5, 1))


def test_duplicate_order_id():
    book = OrderBook()
    book.submit_order(Order("B1", "BUY", 99, 5, 1))

    with pytest.raises(ValueError):
        book.submit_order(Order("B1", "BUY", 98, 2, 2))

def test_fifo_priority_for_orders_at_same_price():
    book = OrderBook()
    book.submit_order(Order("S1", "SELL", 100, 2, 1))
    book.submit_order(Order("S2", "SELL", 100, 2, 2))

    trades = book.submit_order(Order("B1", "BUY", 100, 3, 3))

    assert len(trades) == 2
    assert trades[0].sell_order_id == "S1"
    assert trades[0].quantity == 2
    assert trades[1].sell_order_id == "S2"
    assert trades[1].quantity == 1


def test_non_crossing_orders_do_not_match():
    book = OrderBook()
    book.submit_order(Order("B1", "BUY", 99, 5, 1))

    trades = book.submit_order(Order("S1", "SELL", 101, 5, 2))

    assert trades == []
    assert book.best_bid() == 99
    assert book.best_ask() == 101


def test_cancel_one_order_preserves_other_orders():
    book = OrderBook()
    book.submit_order(Order("B1", "BUY", 99, 5, 1))
    book.submit_order(Order("B2", "BUY", 99, 3, 2))

    assert book.cancel_order("B1") is True
    assert book.best_bid() == 99
    assert "B2" in book.orders
    assert "B1" not in book.orders


def test_sell_order_matches_at_resting_buy_price():
    book = OrderBook()
    book.submit_order(Order("B1", "BUY", 105, 4, 1))

    trades = book.submit_order(Order("S1", "SELL", 100, 2, 2))

    assert len(trades) == 1
    assert trades[0].price == 105
    assert trades[0].quantity == 2
    assert book.orders["B1"].remaining == 2
