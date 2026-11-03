# ChronosMatch â€” High-Frequency Trading Engine

ChronosMatch is a Python-based educational prototype of a high-frequency trading (HFT) engine. It explores efficient order processing, limit order book management, market simulation, trade auditing, and performance measurement.

## Project Goals

- Implement a limit order book and order-matching engine.
- Explore a ring buffer and memory-mapped data transfer.
- Simulate market activity using asynchronous Python.
- Measure throughput and order-processing latency.
- Compare baseline and optimized implementations using reproducible benchmarks.
- Record executed trades for audit and analysis.
- Present performance metrics in an interactive dashboard.

## Planned Technology Stack

- Python 3.11
- Cython for selected performance-critical components
- `asyncio` for asynchronous simulation
- `mmap` and `struct` for low-level data handling
- SQLite for trade auditing
- Streamlit and Plotly for performance visualization
- pytest for automated testing

## Project Structure

```text
ChronosMatch/
â”œâ”€â”€ src/chronosmatch/   # Core engine
â”œâ”€â”€ tests/              # Automated tests
â”œâ”€â”€ benchmarks/         # Benchmark scripts
â”œâ”€â”€ data/sample/        # Small sample datasets
â”œâ”€â”€ docs/               # Documentation and progress log
â”œâ”€â”€ scripts/            # Utility scripts
â”œâ”€â”€ dashboard/          # Performance dashboard
â”œâ”€â”€ README.md
â”œâ”€â”€ requirements.txt
â”œâ”€â”€ pyproject.toml
â””â”€â”€ .gitignore
```

## Performance Evaluation

The project will measure order throughput and latency using reproducible workloads. Any performance comparisons will be based on actual runs and will document the test environment and methodology.

## Current Status

Core implementation and automated testing completed.

### Implemented Features

- Price-time priority order matching engine
- Limit order book with buy and sell orders
- Partial fills and order cancellation
- Market data generation
- Market metrics and order book imbalance
- Trade auditing with CSV export
- Interactive Streamlit dashboard
- Automated testing and performance benchmarking

### Latest Verified Results

- Automated tests: 19 passed
- Orders processed: 100,000
- Throughput: 340,001 orders/second
- Elapsed time: 0.2941 seconds
- Average reported latency: 2.71 microseconds
- Trades executed: 78,453

### Run the Dashboard

Run from the project root:

`python -m streamlit run dashboard/app.py`

### Run Tests

`python -m pytest -v`

### Run Benchmark

`python benchmarks/benchmark_order_book.py`

### Review Status

Core features implemented and automated tests passing.
Final interactive dashboard verification remains pending.

## Disclaimer

This is an educational simulation, not a production trading system or financial advice. Simulated results do not guarantee real-world trading performance.
