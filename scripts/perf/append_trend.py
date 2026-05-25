#!/usr/bin/env python3
"""
Performance trend database — append a run to perf-trend.json.

Reads the current perf-report.json, extracts the key metric values, and
appends one record to an append-only JSON array (perf-trend.json).

No third-party dependencies — uses only the Python standard library.

Usage:
    python3 scripts/perf/append_trend.py \
        --report  build/reports/perf/perf-report.json \
        --trend   perf-trend.json \
        --sha     <git-sha>     \
        --branch  <branch-name>

    # Run ID and timestamp are optional; defaults are auto-generated.
    --run-id   $GITHUB_RUN_ID   (defaults to "local")
    --timestamp ISO-8601 string (defaults to utcnow)

Record format (one element of the JSON array):
    {
      "timestamp":               "2026-04-21T16:30:00Z",
      "git_sha":                 "83fa17c",
      "branch":                  "main",
      "run_id":                  "12345678",
      "launch_time_ms":          1099,
      "fps":                     0.0,
      "memory_mb":               216.12,
      "cpu_spike_pct":           6.9,
      "apk_size_mb":             49.04,
      "memory_leak_mb_per_cycle": -0.496,
      "api_latency_p95_ms":      0,
      "passed":                  false
    }

Exit codes:
    0  Record appended successfully.
    2  Input file not found or JSON parse error.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Optional


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def load_report(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_trend(path: str) -> list:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []


def extract_metric(metrics: list, name: str) -> Optional[float]:
    """Return the numeric value for a named metric, or None if absent."""
    for m in metrics:
        if m.get("name") == name:
            return m.get("value")
    return None


# ---------------------------------------------------------------------------
# Record builder
# ---------------------------------------------------------------------------


def build_record(
    report: dict,
    sha: str,
    branch: str,
    run_id: str,
    timestamp: str,
) -> dict:
    metrics = report.get("metrics", [])
    return {
        "timestamp":                timestamp,
        "git_sha":                  sha,
        "branch":                   branch,
        "run_id":                   run_id,
        "launch_time_ms":           extract_metric(metrics, "launch_time"),
        "fps":                      extract_metric(metrics, "fps"),
        "memory_mb":                extract_metric(metrics, "memory"),
        "cpu_spike_pct":            extract_metric(metrics, "cpu_spike"),
        "apk_size_mb":              extract_metric(metrics, "apk_size"),
        "memory_leak_mb_per_cycle": extract_metric(metrics, "memory_leak"),
        "api_latency_p95_ms":       extract_metric(metrics, "api_latency_p95"),
        "passed":                   report.get("passed", False),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--report", required=True, help="Path to current perf-report.json")
    parser.add_argument("--trend", required=True, help="Path to perf-trend.json (created if absent)")
    parser.add_argument("--sha", default="unknown", help="Git commit SHA for this run")
    parser.add_argument("--branch", default="unknown", help="Git branch name for this run")
    parser.add_argument("--run-id", default="local", help="CI run ID (e.g. GITHUB_RUN_ID)")
    parser.add_argument(
        "--timestamp",
        default=None,
        help="ISO-8601 timestamp (defaults to current UTC time)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not os.path.exists(args.report):
        print(f"[append_trend] ERROR: report not found: {args.report}", file=sys.stderr)
        return 2

    try:
        report = load_report(args.report)
    except (json.JSONDecodeError, OSError) as exc:
        print(f"[append_trend] ERROR reading report: {exc}", file=sys.stderr)
        return 2

    timestamp = args.timestamp or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    record = build_record(report, args.sha, args.branch, args.run_id, timestamp)

    trend = load_trend(args.trend)
    trend.append(record)

    out_dir = os.path.dirname(args.trend)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with open(args.trend, "w", encoding="utf-8") as f:
        json.dump(trend, f, indent=2)

    verdict = "PASS" if record["passed"] else "FAIL"
    print(f"[append_trend] Appended record #{len(trend)} to {args.trend}  [{verdict}]  sha={args.sha[:7]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
