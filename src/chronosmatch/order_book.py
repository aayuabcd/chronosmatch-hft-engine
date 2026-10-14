
from dataclasses import dataclass
from collections import defaultdict, deque
from typing import Deque, Dict, List, Literal, Optional


Side = Literal["BUY", "SELL"]


@dataclass
class Order:
    order_id: str
    side: Side
    price: int
    quantity: int
    timestamp: int
    remaining: int = 0

    def __post_init__(self) -> None:
        if self.remaining == 0:
            self.remaining = self.quantity


@dataclass
class Trade:
    buy_order_id: str
    sell_order_id: str
    price: int
    quantity: int


class OrderBook:
    """A simple price-time-priority limit order book."""

    def __init__(self) -> None:
        self.bids: Dict[int, Deque[Order]] = defaultdict(deque)
        self.asks: Dict[int, Deque[Order]] = defaultdict(deque)
        self.orders: Dict[str, Order] = {}
        self.trades: List[Trade] = []

    def submit_order(self, order: Order) -> List[Trade]:
        if not order.order_id:
            raise ValueError("Order ID cannot be empty.")
        if order.order_id in self.orders:
            raise ValueError(f"Duplicate order ID: {order.order_id}")
        if order.side not in ("BUY", "SELL"):
            raise ValueError("Side must be BUY or SELL.")
        if order.price <= 0:
            raise ValueError("Price must be positive.")
        if order.quantity <= 0:
            raise ValueError("Quantity must be positive.")
        if order.timestamp < 0:
            raise ValueError("Timestamp cannot be negative.")

        order.remaining = order.quantity
        self.orders[order.order_id] = order
        new_trades: List[Trade] = []

        if order.side == "BUY":
            self._match_buy(order, new_trades)
        else:
            self._match_sell(order, new_trades)

        if order.remaining > 0:
            book = self.bids if order.side == "BUY" else self.asks
            book[order.price].append(order)
        else:
            self.orders.pop(order.order_id, None)

        self.trades.extend(new_trades)
        return new_trades

    def _match_buy(self, buy: Order, trades: List[Trade]) -> None:
        while buy.remaining > 0 and self.asks:
            best_price = min(self.asks)
            if best_price > buy.price:
                break

            queue = self.asks[best_price]
            while buy.remaining > 0 and queue:
                sell = queue[0]
                quantity = min(buy.remaining, sell.remaining)

                buy.remaining -= quantity
                sell.remaining -= quantity

                trades.append(
                    Trade(buy.order_id, sell.order_id, sell.price, quantity)
                )

                if sell.remaining == 0:
                    queue.popleft()
                    self.orders.pop(sell.order_id, None)

            if not queue:
                del self.asks[best_price]

    def _match_sell(self, sell: Order, trades: List[Trade]) -> None:
        while sell.remaining > 0 and self.bids:
            best_price = max(self.bids)
            if best_price < sell.price:
                break

            queue = self.bids[best_price]
            while sell.remaining > 0 and queue:
                buy = queue[0]
                quantity = min(sell.remaining, buy.remaining)

                sell.remaining -= quantity
                buy.remaining -= quantity

                trades.append(
                    Trade(buy.order_id, sell.order_id, buy.price, quantity)
                )

                if buy.remaining == 0:
                    queue.popleft()
                    self.orders.pop(buy.order_id, None)

            if not queue:
                del self.bids[best_price]

    def cancel_order(self, order_id: str) -> bool:
        order = self.orders.get(order_id)
        if order is None:
            return False

        book = self.bids if order.side == "BUY" else self.asks
        queue = book.get(order.price)

        if queue is None:
            return False

        try:
            queue.remove(order)
        except ValueError:
            return False

        if not queue:
            del book[order.price]

        self.orders.pop(order_id, None)
        return True

    def best_bid(self) -> Optional[int]:
        return max(self.bids) if self.bids else None

    def best_ask(self) -> Optional[int]:
        return min(self.asks) if self.asks else None

    def snapshot(self) -> dict:
        return {
            "best_bid": self.best_bid(),
            "best_ask": self.best_ask(),
            "open_orders": len(self.orders),
            "total_trades": len(self.trades),
        }
