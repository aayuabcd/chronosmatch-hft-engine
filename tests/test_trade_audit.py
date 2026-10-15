import csv

from src.chronosmatch.order_book import Trade
from src.chronosmatch.trade_audit import write_trades_csv


def test_export_trades_to_csv(tmp_path):
    trades = [
        Trade("BUY-1", "SELL-1", 100, 5),
        Trade("BUY-2", "SELL-2", 101, 3),
    ]
    output = tmp_path / "trades.csv"

    count = write_trades_csv(trades, output)

    assert count == 2
    with output.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    assert len(rows) == 2
    assert rows[0]["buy_order_id"] == "BUY-1"
    assert rows[0]["sell_order_id"] == "SELL-1"
    assert rows[0]["price"] == "100"
    assert rows[0]["quantity"] == "5"
    assert rows[1]["trade_id"] == "2"


def test_export_empty_trades(tmp_path):
    output = tmp_path / "empty.csv"

    assert write_trades_csv([], output) == 0

    with output.open(newline="", encoding="utf-8") as file:
        rows = list(csv.reader(file))

    assert rows == [["trade_id", "buy_order_id", "sell_order_id", "price", "quantity"]]
