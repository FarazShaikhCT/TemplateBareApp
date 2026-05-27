#!/usr/bin/env python3
"""
Android performance regression analyzer.

Reads a perf-report.json produced by run_perf.py and (optionally) a baseline
report from the previous run. Computes per-metric deltas and produces a
human-readable analysis.md.

Exit codes:
  0  All good (or --fail-on-regression not set).
  1  Regressions detected and --fail-on-regression was passed.
  2  Input file error.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Optional

# Per-metric regression thresholds (percentage, expressed as a fraction).
# A metric must move by at least this much in the "worse" direction to be
# flagged as a regression (independent of hard gate failures).
_REGRESSION_PCT = {
    "launch_time":     0.10,   # 10% slower
    "fps":             0.10,   # 10% fewer FPS
    "memory":          0.15,   # 15% more PSS
    "cpu_spike":       0.15,   # 15% more CPU
    "cpu_time":        0.15,   # 15% more CPU time
    "apk_size":        0.05,   # 5% larger APK
    "memory_leak":     0.50,   # slope 50% worse (leak worsening significantly)
    "api_latency_p95": 0.20,   # P95 latency 20% slower
}

# Fractional change required in the "better" direction to label a row **Improved** (PR table).
_IMPROVE_PCT = 0.05

# "increase" → higher value is worse; "decrease" → lower value is worse.
_WORSE_DIRECTION = {
    "launch_time":     "increase",
    "fps":             "decrease",
    "memory":          "increase",
    "cpu_spike":       "increase",
    "cpu_time":        "increase",
    "apk_size":        "increase",
    "memory_leak":     "increase",
    "api_latency_p95": "increase",
}

# Human-readable display names for the PR comment table.
_DISPLAY_NAMES = {
    "launch_time":     "Cold Launch Time",
    "fps":             "Frame Rate (FPS)",
    "memory":          "Memory Usage (PSS)",
    "cpu_spike":       "CPU Peak During Scroll",
    "cpu_time":        "CPU Time During Scroll",
    "apk_size":        "APK Size",
    "memory_leak":     "Memory Leak Slope",
    "api_latency_p95": "API Latency P95",
}


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------


@dataclass
class Delta:
    name: str
    unit: str
    baseline_value: float
    current_value: float
    pct_change: float      # percentage points: (current - baseline) / |baseline| * 100
    is_regression: bool
    gate_passed: bool
    skipped: bool = False  # e.g. FPS not measurable on emulator for baseline or current


def load_report(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def metric_comparison_skipped(m: dict) -> bool:
    """FPS cannot be compared when the emulator did not expose frame timing."""
    if m.get("name") != "fps":
        return False
    details = m.get("details") or {}
    if details.get("skipped") is True:
        return True
    try:
        val = float(m.get("value", 0.0))
    except (TypeError, ValueError):
        val = 0.0
    return val == 0.0 and details.get("fps_measurable") is False


def _delta_fraction(d: Delta) -> float:
    if d.skipped or d.baseline_value == 0:
        return 0.0
    return (d.current_value - d.baseline_value) / abs(d.baseline_value)


def is_meaningful_improvement(name: str, frac: float) -> bool:
    """True if the metric moved enough in the better direction (not a regression)."""
    direction = _WORSE_DIRECTION.get(name, "increase")
    if direction == "increase":
        return frac < -_IMPROVE_PCT
    return frac > _IMPROVE_PCT


def compute_deltas(current: dict, baseline: dict) -> list[Delta]:
    current_by_name = {m["name"]: m for m in current.get("metrics", [])}
    baseline_by_name = {m["name"]: m for m in baseline.get("metrics", [])}
    deltas: list[Delta] = []

    for name, curr in current_by_name.items():
        if name not in baseline_by_name:
            continue
        base = baseline_by_name[name]
        base_val: float = float(base["value"])
        curr_val: float = float(curr["value"])

        if metric_comparison_skipped(base) or metric_comparison_skipped(curr):
            deltas.append(Delta(
                name=name,
                unit=curr.get("unit", ""),
                baseline_value=base_val,
                current_value=curr_val,
                pct_change=0.0,
                is_regression=False,
                gate_passed=curr.get("passed", True),
                skipped=True,
            ))
            continue

        frac = ((curr_val - base_val) / abs(base_val)) if base_val != 0 else 0.0
        threshold = _REGRESSION_PCT.get(name, 0.10)
        direction = _WORSE_DIRECTION.get(name, "increase")

        if direction == "increase":
            is_regression = frac > threshold
        else:
            is_regression = frac < -threshold

        deltas.append(Delta(
            name=name,
            unit=curr.get("unit", ""),
            baseline_value=base_val,
            current_value=curr_val,
            pct_change=round(frac * 100, 1),
            is_regression=is_regression,
            gate_passed=curr.get("passed", True),
            skipped=False,
        ))

    return deltas


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------


def _comparison_status(d: Delta) -> tuple[str, str]:
    """Return (delta_column, status_label) for the comparison table."""
    if d.skipped:
        return "—", "Skipped"
    sign = "+" if d.pct_change >= 0 else ""
    delta_cell = f"{sign}{d.pct_change}%"
    if d.is_regression:
        return delta_cell, "Regressed"
    frac = _delta_fraction(d)
    if is_meaningful_improvement(d.name, frac):
        return delta_cell, "Improved"
    return delta_cell, "Unchanged"


def analyze(report: dict, deltas: Optional[list[Delta]]) -> str:
    all_passed = report.get("passed", False)
    failures = [m for m in report.get("metrics", []) if not m["passed"]]
    regressions = [d for d in deltas if d.is_regression and not d.skipped] if deltas else []
    improvements = [
        d for d in (deltas or [])
        if not d.skipped and not d.is_regression and is_meaningful_improvement(d.name, _delta_fraction(d))
    ]

    lines: list[str] = ["## Performance Analysis", ""]

    if deltas:
        lines += [
            "*Baseline for this table: the last successful performance run on `main` "
            "(stored as `main-perf-baseline.json` on the `perf-data` branch), "
            "or the previous run on this branch if that file does not exist yet.*",
            "",
        ]

    # Verdict line
    if failures:
        verdict = f"FAIL — {len(failures)} gate(s) did not pass."
    elif regressions:
        verdict = f"PASS (gates) — {len(regressions)} metric(s) **regressed** vs baseline."
    else:
        verdict = "PASS — all gates passed" + (" with no regressions." if deltas is not None else ".")
    lines += [f"**Verdict:** {verdict}", ""]

    # Full metrics table — always shown
    gate_mode = report.get("context", {}).get("gate_mode", "threshold")
    gate_col = "Baseline gate" if gate_mode == "baseline" else "Threshold"
    lines += ["### Metrics", ""]
    lines += [
        f"| Metric | Value | {gate_col} | Status |",
        "| --- | --- | --- | --- |",
    ]
    for m in report.get("metrics", []):
        display = _DISPLAY_NAMES.get(m["name"], m["name"])
        comparator = m.get("comparator", "<")
        fps_skipped = (
            m["name"] == "fps" and
            m["value"] == 0.0 and
            m.get("details", {}).get("fps_measurable") is False
        )
        if fps_skipped:
            status = "⏭️ SKIP"
            note = " ⁽¹⁾"
        else:
            status = "✅ PASS" if m["passed"] else "❌ FAIL"
            note = ""
        lines.append(
            f"| {display} | {m['value']}{m['unit']}{note} "
            f"| {comparator} {m['threshold']}{m['unit']} | {status} |"
        )
    fps_unmeasurable = any(
        m["name"] == "fps" and m["value"] == 0.0 and m.get("details", {}).get("fps_measurable") is False
        for m in report.get("metrics", [])
    )
    if fps_unmeasurable:
        lines += [
            "_⁽¹⁾ FPS = 0.0: the emulator's software renderer (swiftshader) does not expose frame "
            "timing data via `gfxinfo` or `framestats`. Gate skipped — not a real failure._",
            "",
        ]
    else:
        lines.append("")

    # Baseline comparison table (Improved / Regressed / Skipped / Unchanged)
    if deltas:
        lines += ["### Comparison vs baseline", ""]
        lines += [
            "| Metric | Baseline | Current | Δ% | Status |",
            "| --- | --- | --- | --- | --- |",
        ]
        for d in deltas:
            display = _DISPLAY_NAMES.get(d.name, d.name)
            delta_cell, status = _comparison_status(d)
            lines.append(
                f"| {display} | {d.baseline_value}{d.unit} | {d.current_value}{d.unit} "
                f"| {delta_cell} | {status} |"
            )
        lines.append("")

    if regressions:
        lines += ["### Regressions", ""]
        for r in regressions:
            sign = "+" if r.pct_change >= 0 else ""
            display = _DISPLAY_NAMES.get(r.name, r.name)
            lines.append(
                f"- **{display}**: {sign}{r.pct_change}% "
                f"({r.baseline_value}{r.unit} → {r.current_value}{r.unit})"
            )
        lines += [
            "",
            "**Possible causes to investigate:**",
            "- New SDK or library added to the build",
            "- Blocking work (network, disk I/O) moved to the main thread",
            "- Large asset or resource file added without compression",
            "- Analytics or third-party initialisation added to Application.onCreate()",
            "",
        ]

    if improvements:
        lines += ["### Improvements", ""]
        for i in improvements:
            display = _DISPLAY_NAMES.get(i.name, i.name)
            lines.append(f"- **{display}**: {i.pct_change}% better than baseline")
        lines.append("")

    if not deltas:
        lines += [
            "_No baseline report available yet. After the first successful perf run on `main`, "
            "the next PR will compare against those metrics._",
            "",
        ]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--report", required=True, help="Path to current perf-report.json")
    parser.add_argument("--baseline", default=None, help="Path to previous perf-report.json for regression comparison")
    parser.add_argument("--out", default=None, help="Write analysis markdown to this path (e.g. build/reports/perf/analysis.md)")
    parser.add_argument("--fail-on-regression", action="store_true", help="Exit 1 if regressions are detected (requires --baseline)")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not os.path.exists(args.report):
        print(f"[analyze] ERROR: report not found: {args.report}", file=sys.stderr)
        return 2

    report = load_report(args.report)
    baseline: Optional[dict] = None
    if args.baseline and os.path.exists(args.baseline):
        baseline = load_report(args.baseline)
    elif args.baseline:
        print(f"[analyze] Baseline not found at {args.baseline} — skipping regression comparison.", file=sys.stderr)

    deltas = compute_deltas(report, baseline) if baseline else None
    analysis = analyze(report, deltas)

    print("\n" + analysis)

    if args.out:
        out_dir = os.path.dirname(args.out)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(analysis)
        print(f"\n[analyze] Analysis written to {args.out}")

    if args.fail_on_regression and deltas:
        regressions = [d for d in deltas if d.is_regression]
        if regressions:
            names = ", ".join(d.name for d in regressions)
            print(f"[analyze] {len(regressions)} regression(s) detected: {names}", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
