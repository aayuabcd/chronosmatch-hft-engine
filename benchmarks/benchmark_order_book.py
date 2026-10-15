"""Benchmark ChronosMatch order-processing throughput and latency."""

import argparse
import statistics
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.chronosmatch.data_generator import generate_orders
from src.chronosmatch.order_book import OrderBook


def percentile(values, percent):
    ordered = sorted(values)
    index = int((percent / 100) * (len(ordered) - 1))
    return ordered[index]


def main():
    parser = argparse.ArgumentParser(description="ChronosMatch order-book benchmark")
    parser.add_argument("--count", type=int, default=100_000,
                        help="Number of orders to process (default: 100000)")
    args = parser.parse_args()

    if args.count <= 0:
        parser.error("--count must be greater than zero")

    book = OrderBook()
    orders = list(generate_orders(args.count, seed=42))
    latencies_ns = []

    start = time.perf_counter()
    for order in orders:
        order_start = time.perf_counter_ns()
        book.submit_order(order)
        latencies_ns.append(time.perf_counter_ns() - order_start)
    elapsed = time.perf_counter() - start

    print("\n=== ChronosMatch Benchmark Results ===")
    print(f"Orders processed:       {args.count:,}")
    print(f"Elapsed time:           {elapsed:.4f} seconds")
    print(f"Throughput:             {args.count / elapsed:,.0f} orders/second")
    print(f"Average latency:        {statistics.mean(latencies_ns) / 1_000:.2f} µs")
    print(f"Median latency (p50):   {percentile(latencies_ns, 50) / 1_000:.2f} µs")
    print(f"p95 latency:            {percentile(latencies_ns, 95) / 1_000:.2f} µs")
    print(f"p99 latency:            {percentile(latencies_ns, 99) / 1_000:.2f} µs")
    print(f"Trades executed:        {len(book.trades):,}")
    print(f"Open orders remaining:  {len(book.orders):,}")


if __name__ == "__main__":
    main()
