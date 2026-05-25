#!/usr/bin/env python3
"""
Record perf_baselines.json from a golden perf-report.json.

Run after a successful local or CI perf run:

  python3 scripts/perf/record_baselines.py \\
    --report build/reports/perf/perf-report.json \\
    --out scripts/perf/perf_baselines.json

Commit the generated file so CI compares future runs against these numbers.
Adjust relative_tolerance_pct in the file if you need tighter or looser gates.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--report", required=True, help="Path to perf-report.json from run_perf.py")
    parser.add_argument("--out", default="scripts/perf/perf_baselines.json", help="Output baseline JSON path")
    parser.add_argument(
        "--tolerance-pct",
        type=float,
        default=15.0,
        help="Default relative tolerance (%%) for baseline gates (default: 15)",
    )
    args = parser.parse_args()

    if not os.path.isfile(args.report):
        print(f"[record_baselines] ERROR: report not found: {args.report}", file=sys.stderr)
        return 2

    with open(args.report, "r", encoding="utf-8") as f:
        report = json.load(f)

    metrics_map: dict[str, float] = {}
    for m in report.get("metrics", []):
        name = m.get("name")
        if name:
            metrics_map[name] = float(m["value"])

    if not metrics_map:
        print("[record_baselines] ERROR: no metrics in report", file=sys.stderr)
        return 2

    payload = {
        "relative_tolerance_pct": args.tolerance_pct,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "source_report": os.path.abspath(args.report),
        "metrics": metrics_map,
    }

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"[record_baselines] Wrote {args.out} ({len(metrics_map)} metrics).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
