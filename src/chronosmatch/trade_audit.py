"""Export executed ChronosMatch trades to a CSV audit file."""

import csv
from pathlib import Path
from typing import Iterable

from src.chronosmatch.order_book import Trade


TRADE_FIELDS = ["trade_id", "buy_order_id", "sell_order_id", "price", "quantity"]


def write_trades_csv(trades: Iterable[Trade], output_path: str | Path) -> int:
    """Write executed trades to CSV and return the number of trades exported."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0

    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=TRADE_FIELDS)
        writer.writeheader()

        for count, trade in enumerate(trades, start=1):
            writer.writerow({
                "trade_id": count,
                "buy_order_id": trade.buy_order_id,
                "sell_order_id": trade.sell_order_id,
                "price": trade.price,
                "quantity": trade.quantity,
            })

    return count
