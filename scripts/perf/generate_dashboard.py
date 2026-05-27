#!/usr/bin/env python3
"""
Performance dashboard generator.

Reads perf-trend.json (produced by append_trend.py) and
perf_thresholds.json, then writes a self-contained index.html with:

  - One line chart per metric (x = timestamp/SHA, y = measured value)
  - A horizontal threshold line on each chart
  - A summary table of the last 10 runs with pass/fail badges

Chart.js is loaded from CDN — no build step, no extra dependencies.

Usage:
    python3 scripts/perf/generate_dashboard.py \
        --trend      perf-trend.json \
        --thresholds scripts/perf/perf_thresholds.json \
        --out        docs/index.html \
        --title      "TemplateApp Android Performance"   # optional

Exit codes:
    0  Dashboard written successfully.
    2  Input file not found or parse error.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CHART_JS_CDN = "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"

# Maps JSON field name in perf-trend.json → (display label, threshold key, unit, lower-is-better)
METRICS: list[tuple[str, str, str, str, bool]] = [
    ("launch_time_ms",           "Launch Time",          "launch_time_ms",             "ms",       True),
    ("fps",                      "FPS",                  "fps_min",                    "",         False),
    ("memory_mb",                "Memory (PSS)",         "memory_mb_max",              "MB",       True),
    ("cpu_spike_pct",            "CPU Spike",            "cpu_peak_pct_max",           "%",        True),
    ("apk_size_mb",              "APK Size",             "apk_size_mb_max",            "MB",       True),
    ("memory_leak_mb_per_cycle", "Memory Leak Slope",    "memory_leak_mb_per_cycle_max","MB/cycle", True),
    ("api_latency_p95_ms",       "API Latency P95",      "api_latency_p95_ms_max",     "ms",       True),
]


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------


def load_json(path: str) -> object:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def short_sha(sha: str) -> str:
    return sha[:7] if sha and sha != "unknown" else "?"


def label_for(record: dict) -> str:
    """Short x-axis label: date + short SHA."""
    ts = record.get("timestamp", "")
    date = ts[:10] if len(ts) >= 10 else ts
    sha = short_sha(record.get("git_sha", ""))
    branch = record.get("branch", "")
    return f"{date} {sha} ({branch})" if branch else f"{date} {sha}"


# ---------------------------------------------------------------------------
# HTML / Chart builder
# ---------------------------------------------------------------------------


def _chart_datasets(records: list, field: str, threshold: float | None, lower_is_better: bool) -> str:
    values = [r.get(field) for r in records]
    values_js = json.dumps(values)

    datasets = [
        f"""{{
            label: '{field}',
            data: {values_js},
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.3,
            fill: false
        }}"""
    ]

    if threshold is not None:
        datasets.append(f"""{{
            label: 'Gate ({threshold})',
            data: Array({len(records)}).fill({threshold}),
            borderDash: [6, 3],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
        }}""")

    return ",\n".join(datasets)


def _chart_block(chart_id: str, label: str, unit: str, labels_js: str, datasets_str: str) -> str:
    y_title = f"{label} ({unit})" if unit else label
    return f"""
    <div class="chart-wrap">
      <h3>{label}</h3>
      <canvas id="{chart_id}"></canvas>
    </div>
    <script>
    (function() {{
      var ctx = document.getElementById('{chart_id}').getContext('2d');
      new Chart(ctx, {{
        type: 'line',
        data: {{
          labels: {labels_js},
          datasets: [{datasets_str}]
        }},
        options: {{
          responsive: true,
          plugins: {{
            legend: {{ position: 'top' }},
            tooltip: {{ mode: 'index', intersect: false }}
          }},
          scales: {{
            x: {{ ticks: {{ maxRotation: 45, font: {{ size: 10 }} }} }},
            y: {{ title: {{ display: true, text: '{y_title}' }} }}
          }}
        }}
      }});
    }})();
    </script>
"""


def _summary_table(records: list) -> str:
    recent = records[-10:][::-1]  # last 10, newest first
    rows = []
    for r in recent:
        badge = '<span class="pass">PASS</span>' if r.get("passed") else '<span class="fail">FAIL</span>'
        rows.append(
            f"<tr>"
            f"<td>{r.get('timestamp','')[:16]}</td>"
            f"<td><code>{short_sha(r.get('git_sha',''))}</code></td>"
            f"<td>{r.get('branch','')}</td>"
            f"<td>{r.get('run_id','')}</td>"
            f"<td>{r.get('launch_time_ms','—')}</td>"
            f"<td>{r.get('fps','—')}</td>"
            f"<td>{r.get('memory_mb','—')}</td>"
            f"<td>{r.get('cpu_spike_pct','—')}</td>"
            f"<td>{r.get('apk_size_mb','—')}</td>"
            f"<td>{badge}</td>"
            f"</tr>"
        )
    return "\n".join(rows)


def generate_html(records: list, thresholds: dict, title: str) -> str:
    labels = [label_for(r) for r in records]
    labels_js = json.dumps(labels)

    charts_html = ""
    for field, label, threshold_key, unit, lower_is_better in METRICS:
        threshold = thresholds.get(threshold_key)
        datasets_str = _chart_datasets(records, field, threshold, lower_is_better)
        chart_id = f"chart_{field}"
        charts_html += _chart_block(chart_id, label, unit, labels_js, datasets_str)

    summary_rows = _summary_table(records)
    total_runs = len(records)
    passed_runs = sum(1 for r in records if r.get("passed"))

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <script src="{CHART_JS_CDN}"></script>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: system-ui, sans-serif; background: #f5f5f7; color: #1d1d1f; }}
    header {{ background: #1d1d1f; color: #fff; padding: 1.5rem 2rem; }}
    header h1 {{ font-size: 1.4rem; font-weight: 600; }}
    header p  {{ font-size: 0.85rem; opacity: 0.7; margin-top: 0.25rem; }}
    .stats {{ display: flex; gap: 1.5rem; padding: 1.5rem 2rem; background: #fff;
              border-bottom: 1px solid #e0e0e0; }}
    .stat {{ text-align: center; }}
    .stat .value {{ font-size: 2rem; font-weight: 700; }}
    .stat .label {{ font-size: 0.75rem; text-transform: uppercase; opacity: 0.6; }}
    .charts {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
               gap: 1.5rem; padding: 1.5rem 2rem; }}
    .chart-wrap {{ background: #fff; border-radius: 10px; padding: 1.25rem;
                   box-shadow: 0 1px 4px rgba(0,0,0,.08); }}
    .chart-wrap h3 {{ font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; }}
    .table-section {{ padding: 0 2rem 2rem; }}
    .table-section h2 {{ font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; }}
    table {{ width: 100%; border-collapse: collapse; background: #fff;
             border-radius: 10px; overflow: hidden;
             box-shadow: 0 1px 4px rgba(0,0,0,.08); font-size: 0.82rem; }}
    th {{ background: #f0f0f0; padding: 0.6rem 0.75rem; text-align: left; font-weight: 600; }}
    td {{ padding: 0.55rem 0.75rem; border-top: 1px solid #f0f0f0; }}
    tr:hover td {{ background: #fafafa; }}
    .pass {{ background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px;
             font-size: 0.75rem; font-weight: 600; }}
    .fail {{ background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px;
             font-size: 0.75rem; font-weight: 600; }}
  </style>
</head>
<body>
  <header>
    <h1>{title}</h1>
    <p>Performance trend across CI runs — auto-generated by generate_dashboard.py</p>
  </header>

  <div class="stats">
    <div class="stat">
      <div class="value">{total_runs}</div>
      <div class="label">Total Runs</div>
    </div>
    <div class="stat">
      <div class="value" style="color:#065f46">{passed_runs}</div>
      <div class="label">Passed</div>
    </div>
    <div class="stat">
      <div class="value" style="color:#991b1b">{total_runs - passed_runs}</div>
      <div class="label">Failed</div>
    </div>
  </div>

  <div class="charts">
    {charts_html}
  </div>

  <div class="table-section">
    <h2>Last 10 Runs</h2>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th><th>SHA</th><th>Branch</th><th>Run ID</th>
          <th>Launch (ms)</th><th>FPS</th><th>Mem (MB)</th>
          <th>CPU (%)</th><th>APK (MB)</th><th>Result</th>
        </tr>
      </thead>
      <tbody>
        {summary_rows}
      </tbody>
    </table>
  </div>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--trend", required=True, help="Path to perf-trend.json")
    parser.add_argument("--thresholds", required=True, help="Path to perf_thresholds.json")
    parser.add_argument("--out", required=True, help="Output path for the HTML dashboard (e.g. docs/index.html)")
    parser.add_argument("--title", default="Android Performance Dashboard", help="Page title")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    for path in (args.trend, args.thresholds):
        if not os.path.exists(path):
            print(f"[generate_dashboard] ERROR: file not found: {path}", file=sys.stderr)
            return 2

    try:
        records = load_json(args.trend)
        thresholds = load_json(args.thresholds)
    except (json.JSONDecodeError, OSError) as exc:
        print(f"[generate_dashboard] ERROR reading input: {exc}", file=sys.stderr)
        return 2

    if not isinstance(records, list) or len(records) == 0:
        print("[generate_dashboard] perf-trend.json is empty — no data to plot.", file=sys.stderr)
        return 2

    html = generate_html(records, thresholds, args.title)

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with open(args.out, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"[generate_dashboard] Dashboard written to {args.out}  ({len(records)} runs, {len(records[0])} fields each)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
