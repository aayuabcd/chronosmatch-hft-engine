
"""Generate reproducible synthetic orders for ChronosMatch."""

import random
from typing import Iterator

from src.chronosmatch.order_book import Order, Side


def generate_orders(
    count: int,
    seed: int = 42,
    start_price: int = 10_000,
) -> Iterator[Order]:
    """Yield synthetic limit orders with reproducible values."""
    if count < 0:
        raise ValueError("count cannot be negative.")
    if start_price <= 0:
        raise ValueError("start_price must be positive.")

    rng = random.Random(seed)

    for index in range(count):
        side: Side = rng.choice(["BUY", "SELL"])
        price = start_price + rng.randint(-20, 20)
        quantity = rng.randint(1, 100)

        yield Order(
            order_id=f"ORD-{index + 1:08d}",
            side=side,
            price=price,
            quantity=quantity,
            timestamp=index,
        )
