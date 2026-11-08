from dataclasses import asdict
from itertools import count
from pathlib import Path
from threading import Lock
import sys
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

from chronosmatch.order_book import Order, OrderBook

app = FastAPI(
    title="ChronosMatch Trading API",
    description="Educational price-time-priority matching engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

book = OrderBook()
order_counter = count(1)
lock = Lock()


class OrderRequest(BaseModel):
    side: str
    price: int = Field(gt=0)
    quantity: int = Field(gt=0)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "engine": "ChronosMatch",
        "mode": "simulation",
    }


@app.post("/orders")
def create_order(request: OrderRequest):
    side = request.side.upper()

    if side not in ("BUY", "SELL"):
        raise HTTPException(
            status_code=422,
            detail="Side must be BUY or SELL.",
        )

    with lock:
        order = Order(
            order_id=f"ORD-{next(order_counter):06d}",
            side=side,
            price=request.price,
            quantity=request.quantity,
            timestamp=time.time_ns(),
        )

        try:
            trades = book.submit_order(order)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        return {
            "order": asdict(order),
            "trades": [asdict(trade) for trade in trades],
            "snapshot": book.snapshot(),
        }


@app.get("/orderbook")
def get_orderbook():
    with lock:
        return {
            "snapshot": book.snapshot(),
            "bids": [
                {
                    "price": price,
                    "quantity": sum(
                        order.remaining for order in queue
                    ),
                }
                for price, queue in sorted(
                    book.bids.items(),
                    reverse=True,
                )
            ],
            "asks": [
                {
                    "price": price,
                    "quantity": sum(
                        order.remaining for order in queue
                    ),
                }
                for price, queue in sorted(book.asks.items())
            ],
            "orders": [
                asdict(order)
                for order in book.orders.values()
            ],
        }


@app.get("/trades")
def get_trades():
    with lock:
        return {
            "trades": [
                asdict(trade)
                for trade in book.trades
            ],
            "total": len(book.trades),
        }


@app.delete("/orders/{order_id}")
def cancel_order(order_id: str):
    with lock:
        cancelled = book.cancel_order(order_id)

        if not cancelled:
            raise HTTPException(
                status_code=404,
                detail="Open order not found.",
            )

        return {
            "cancelled": True,
            "order_id": order_id,
            "snapshot": book.snapshot(),
        }
