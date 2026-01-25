#!/usr/bin/env python3
"""
Utility to analyze token usage and costs from the .token_usage.log file.
"""
import json
import argparse
from pathlib import Path
from collections import defaultdict
from datetime import datetime


def show_costs(log_file: str, model_filter: str = None):
    """
    Display cost summary from the token usage log.

    Args:
        log_file: Path to the log file
        model_filter: Optional model name filter
    """
    totals = defaultdict(lambda: {
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "total_cost": 0.0,
        "requests": 0,
        "first_request": None,
        "last_request": None,
    })

    log_path = Path(log_file)
    if not log_path.exists():
        print(f"Log file not found: {log_file}")
        return

    with open(log_path) as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                model = entry["model"]

                if model_filter and model != model_filter:
                    continue

                totals[model]["total_input_tokens"] += entry["input_tokens"]
                totals[model]["total_output_tokens"] += entry["output_tokens"]
                totals[model]["total_cost"] += entry["total_cost_usd"] or 0
                totals[model]["requests"] += 1

                # Track time range
                timestamp = entry.get("timestamp", "")
                if timestamp:
                    ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    if totals[model]["first_request"] is None or ts < totals[model]["first_request"]:
                        totals[model]["first_request"] = ts
                    if totals[model]["last_request"] is None or ts > totals[model]["last_request"]:
                        totals[model]["last_request"] = ts
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Skipping malformed line: {e}")

    print("\n" + "=" * 70)
    print("                       COST SUMMARY")
    print("=" * 70)

    grand_total = 0.0
    grand_requests = 0
    grand_input = 0
    grand_output = 0

    for model, stats in sorted(totals.items()):
        print(f"\n  {model}:")
        print(f"    Requests:          {stats['requests']:,}")
        print(f"    Input Tokens:      {stats['total_input_tokens']:,}")
        print(f"    Output Tokens:     {stats['total_output_tokens']:,}")
        print(f"    Total Cost:        ${stats['total_cost']:.4f}")

        grand_total += stats["total_cost"]
        grand_requests += stats["requests"]
        grand_input += stats["total_input_tokens"]
        grand_output += stats["total_output_tokens"]

    print("\n" + "-" * 70)
    print("  GRAND TOTAL:")
    print(f"    All Models:        {len(totals)}")
    print(f"    Total Requests:    {grand_requests:,}")
    print(f"    Total Input:       {grand_input:,} tokens")
    print(f"    Total Output:      {grand_output:,} tokens")
    print(f"    Total Cost:        ${grand_total:.4f}")
    print("=" * 70 + "\n")


def show_recent(log_file: str, count: int = 10, model_filter: str = None):
    """Show recent log entries."""
    log_path = Path(log_file)
    if not log_path.exists():
        print(f"Log file not found: {log_file}")
        return

    entries = []
    with open(log_path) as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                if model_filter and entry["model"] != model_filter:
                    continue
                entries.append(entry)
            except (json.JSONDecodeError, KeyError):
                pass

    # Show last N entries
    recent_entries = entries[-count:] if count else entries

    print(f"\nRecent {len(recent_entries)} entries:")
    print("-" * 70)

    for entry in reversed(recent_entries):
        print(f"\n  [{entry['timestamp']}]")
        print(f"    Model:  {entry['model']}")
        print(f"    Input:  {entry['input_tokens']} tokens (${entry['input_cost_usd']:.6f})")
        print(f"    Output: {entry['output_tokens']} tokens (${entry['output_cost_usd']:.6f})")
        print(f"    Total:  ${entry['total_cost_usd']:.6f}")


def main():
    parser = argparse.ArgumentParser(description="Analyze token usage and costs")
    parser.add_argument(
        "--log-file",
        default=".token_usage.log",
        help="Path to the token usage log file (default: .token_usage.log)"
    )
    parser.add_argument(
        "--model",
        help="Filter by specific model name"
    )
    parser.add_argument(
        "--recent",
        type=int,
        metavar="N",
        help="Show recent N entries instead of summary"
    )

    args = parser.parse_args()

    if args.recent:
        show_recent(args.log_file, args.recent, args.model)
    else:
        show_costs(args.log_file, args.model)


if __name__ == "__main__":
    main()
