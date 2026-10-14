
import pytest

from src.chronosmatch.data_generator import generate_orders


def test_generates_requested_number_of_orders():
    orders = list(generate_orders(100))
    assert len(orders) == 100


def test_generated_orders_are_reproducible():
    first = list(generate_orders(20, seed=7))
    second = list(generate_orders(20, seed=7))
    assert first == second


def test_order_fields_are_valid():
    orders = list(generate_orders(100))
    assert len({order.order_id for order in orders}) == 100
    assert all(order.side in ("BUY", "SELL") for order in orders)
    assert all(order.price > 0 for order in orders)
    assert all(order.quantity > 0 for order in orders)


def test_negative_count_is_rejected():
    with pytest.raises(ValueError):
        list(generate_orders(-1))


def test_zero_count_returns_no_orders():
    assert list(generate_orders(0)) == []
