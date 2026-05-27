#!/usr/bin/env python3
"""
Automated Android performance agent.

Measures startup time, FPS / jank, memory (PSS), CPU spike, CPU time, APK size,
and memory-leak slope via adb. Gates either against a fixed JSON threshold file
(--thresholds) or against recorded baselines (--baselines). Writes JSON + Markdown
reports and exits non-zero if any gate fails (unless --soft is passed).

No third-party dependencies; uses only the Python standard library so it can run
on any host with adb on PATH.  Fully generic — no app-specific defaults.

Required argument:
    --package   Android application ID (e.g. com.example.myapp)

Example (threshold mode):
    python3 scripts/perf/run_perf.py \\
        --package com.example.myapp \\
        --activity com.example.myapp/.MainActivity \\
        --thresholds scripts/perf/perf_thresholds.json \\
        --runs 5 \\
        --out build/reports/perf

Example (baseline mode — after recording baselines):
    python3 scripts/perf/run_perf.py \\
        --package com.example.myapp \\
        --baselines scripts/perf/perf_baselines.json \\
        --apk app/build/outputs/apk/debug/app-debug.apk \\
        --out build/reports/perf
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import statistics
import subprocess
import sys
import time
from dataclasses import dataclass, asdict, field
from typing import List, Optional

# No DEFAULT_PACKAGE — callers must supply --package to keep the script generic.
DEFAULT_THRESHOLDS_PATH = "scripts/perf/perf_thresholds.json"
DEFAULT_OUT_DIR = "build/reports/perf"
DEFAULT_RUNS = 5
DEFAULT_SCROLL_SECONDS = 6
DEFAULT_CPU_SAMPLE_COUNT = 10
DEFAULT_STEADY_STATE_DELAY_S = 2.0
DEFAULT_LEAK_CYCLES = 5
DEFAULT_LEAK_SETTLE_S = 2.0
SWIPE_DURATION_MS = 300
SWIPE_PAUSE_S = 0.4
PERFETTO_DURATION_MS = 10_000


# ---------------------------------------------------------------------------
# Shell helpers
# ---------------------------------------------------------------------------


class AdbError(RuntimeError):
    pass


def run(cmd: List[str], check: bool = True, timeout: int = 60) -> str:
    """Run a command; return decoded stdout. Raise AdbError on non-zero when check."""
    try:
        completed = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise AdbError(f"Command timed out: {' '.join(shlex.quote(c) for c in cmd)}") from exc

    if check and completed.returncode != 0:
        raise AdbError(
            f"Command failed ({completed.returncode}): {' '.join(shlex.quote(c) for c in cmd)}\n"
            f"stdout: {completed.stdout}\nstderr: {completed.stderr}"
        )
    return completed.stdout


def adb(serial: Optional[str], *args: str, check: bool = True, timeout: int = 60) -> str:
    cmd = ["adb"]
    if serial:
        cmd += ["-s", serial]
    cmd += list(args)
    return run(cmd, check=check, timeout=timeout)


def adb_shell(serial: Optional[str], shell_cmd: str, check: bool = True, timeout: int = 60) -> str:
    return adb(serial, "shell", shell_cmd, check=check, timeout=timeout)


# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------


def list_connected_devices() -> List[str]:
    """Return adb serial numbers of all currently connected devices/emulators."""
    try:
        out = run(["adb", "devices"], check=False)
    except Exception:
        return []
    serials: List[str] = []
    for line in out.splitlines()[1:]:   # skip "List of devices attached" header
        parts = line.split()
        if len(parts) >= 2 and parts[1] == "device":
            serials.append(parts[0])
    return serials


def wait_for_device(serial: Optional[str]) -> None:
    adb(serial, "wait-for-device", timeout=120)


def wait_for_device_ready(serial: Optional[str], retries: int = 10, interval: float = 2.0) -> None:
    """
    Poll `adb devices` until the target serial is in 'device' state (not offline/unauthorized).
    Raises AdbError if the device never becomes ready within the retry window.
    """
    for attempt in range(retries):
        try:
            out = run(["adb", "devices"], check=False)
        except Exception:
            out = ""
        for line in out.splitlines()[1:]:
            parts = line.split()
            target = serial or ""
            if len(parts) >= 2 and (not target or parts[0] == target) and parts[1] == "device":
                return
        print(f"[perf] Waiting for device to be ready (attempt {attempt + 1}/{retries})...")
        time.sleep(interval)
    raise AdbError(
        f"Device '{serial or 'any'}' did not reach 'device' state after {retries} attempts. "
        "Check `adb devices` — it may be offline or unauthorized."
    )


def disable_animations(serial: Optional[str]) -> None:
    """Set all system animation scales to 0 for accurate frame-timing measurements."""
    for key in ("window_animation_scale", "transition_animation_scale", "animator_duration_scale"):
        adb_shell(serial, f"settings put global {key} 0", check=False)
    print("[perf] System animations disabled (0×).")


def restore_animations(serial: Optional[str]) -> None:
    """Restore system animation scales to 1× (normal speed)."""
    for key in ("window_animation_scale", "transition_animation_scale", "animator_duration_scale"):
        adb_shell(serial, f"settings put global {key} 1", check=False)
    print("[perf] System animations restored (1×).")


def assert_package_installed(serial: Optional[str], pkg: str) -> None:
    out = adb_shell(serial, f"pm list packages {pkg}")
    if pkg not in out:
        raise AdbError(f"Package {pkg} is not installed on device. adb output: {out!r}")


def resolve_launcher_activity(serial: Optional[str], pkg: str) -> str:
    """Best-effort resolution of the launcher component for a package."""
    try:
        out = adb_shell(serial, f"cmd package resolve-activity --brief {pkg}")
    except AdbError:
        out = ""
    for line in reversed(out.strip().splitlines()):
        line = line.strip()
        if "/" in line and pkg in line:
            return line
    return f"{pkg}/.MainActivity"


def open_deep_link(serial: Optional[str], pkg: str, url: str) -> None:
    """Open a deep link (React Navigation linking) for the installed package."""
    adb_shell(
        serial,
        f'am start -W -a android.intent.action.VIEW -d "{url}" {pkg}',
        check=False,
        timeout=30,
    )


def wait_for_pid(serial: Optional[str], pkg: str, timeout_s: float = 10.0) -> int:
    """Poll pidof until the package is up; raise if it never starts."""
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        out = adb_shell(serial, f"pidof {pkg}", check=False).strip()
        if out:
            try:
                return int(out.split()[0])
            except ValueError:
                pass
        time.sleep(0.2)
    raise AdbError(f"Timed out waiting for pid of {pkg}")


# ---------------------------------------------------------------------------
# Measurements
# ---------------------------------------------------------------------------


@dataclass
class MetricResult:
    name: str
    value: float
    unit: str
    threshold: float
    comparator: str  # "<" or ">"
    passed: bool
    details: dict = field(default_factory=dict)

    def threshold_str(self) -> str:
        return f"{self.comparator} {self.threshold}{self.unit}"


_TOTAL_TIME_RE = re.compile(r"TotalTime:\s+(\d+)")


def warmup_launch(
    serial: Optional[str],
    pkg: str,
    activity: str,
    am_extras: str = "",
) -> None:
    """
    Perform one unmeasured launch so ART can JIT-compile hot paths before timed runs.
    Significantly reduces launch time variance on fresh emulators (CI) where no
    compiled profile exists yet. Has negligible effect on physical devices.
    """
    print("[perf] Warming up app (unmeasured launch for ART JIT) ...")
    adb_shell(serial, f"am force-stop {pkg}", check=False)
    adb_shell(serial, f"am start -n {activity} {am_extras}".strip(), check=False, timeout=30)
    time.sleep(3)
    adb_shell(serial, f"am force-stop {pkg}", check=False)
    time.sleep(1)


def measure_launch_ms(
    serial: Optional[str],
    pkg: str,
    activity: str,
    runs: int,
    am_extras: str = "",
) -> dict:
    warmup_launch(serial, pkg, activity, am_extras)
    samples: List[int] = []
    for _ in range(runs):
        adb_shell(serial, f"am force-stop {pkg}")
        time.sleep(0.5)
        out = adb_shell(serial, f"am start -W -n {activity} {am_extras}".strip(), timeout=30)
        match = _TOTAL_TIME_RE.search(out)
        if not match:
            raise AdbError(f"Could not parse TotalTime from am start output:\n{out}")
        samples.append(int(match.group(1)))
    return {
        "samples_ms": samples,
        "median_ms": int(statistics.median(samples)),
        "min_ms": min(samples),
        "max_ms": max(samples),
    }


def reset_gfxinfo(serial: Optional[str], pkg: str) -> None:
    adb_shell(serial, f"dumpsys gfxinfo {pkg} reset", check=False)


def drive_scroll(serial: Optional[str], duration_s: float) -> float:
    """Drive vertical swipes for ~duration_s and return the actual wall-clock time spent."""
    size_out = adb_shell(serial, "wm size")
    width = 1080
    height = 1920
    match = re.search(r"(\d+)x(\d+)", size_out)
    if match:
        width = int(match.group(1))
        height = int(match.group(2))
    cx = width // 2
    y_top = int(height * 0.75)
    y_bot = int(height * 0.25)

    start = time.monotonic()
    direction_up = True
    while time.monotonic() - start < duration_s:
        if direction_up:
            adb_shell(serial, f"input swipe {cx} {y_top} {cx} {y_bot} {SWIPE_DURATION_MS}", check=False)
        else:
            adb_shell(serial, f"input swipe {cx} {y_bot} {cx} {y_top} {SWIPE_DURATION_MS}", check=False)
        direction_up = not direction_up
        time.sleep(SWIPE_PAUSE_S)
    return time.monotonic() - start


_TOTAL_FRAMES_RE = re.compile(r"Total frames rendered:\s+(\d+)")
_JANKY_FRAMES_RE = re.compile(r"Janky frames:\s+(\d+)\s*\(([\d.]+)%\)")
_PCT_RE_TEMPLATE = r"{pct}th percentile:\s+(\d+)ms"


def parse_gfxinfo(text: str) -> dict:
    total_frames = 0
    janky_frames = 0
    janky_pct = 0.0
    pcts: dict = {}

    m = _TOTAL_FRAMES_RE.search(text)
    if m:
        total_frames = int(m.group(1))
    m = _JANKY_FRAMES_RE.search(text)
    if m:
        janky_frames = int(m.group(1))
        janky_pct = float(m.group(2))
    for pct in (50, 90, 95, 99):
        m = re.search(_PCT_RE_TEMPLATE.format(pct=pct), text)
        if m:
            pcts[f"p{pct}_ms"] = int(m.group(1))
    return {
        "total_frames": total_frames,
        "janky_frames": janky_frames,
        "janky_pct": janky_pct,
        "percentiles_ms": pcts,
    }


def _count_framestats_frames(text: str) -> int:
    """
    Count rendered frames from `dumpsys gfxinfo <pkg> framestats` output.

    This format uses a PROFILEDATA CSV ring-buffer that works on emulators with
    software rendering (swiftshader_indirect) where the standard gfxinfo summary
    line "Total frames rendered" is often 0.

    Each data row: <layer>,<flags>,<IntendedVsync>,...
    flags==0 means a normal rendered frame. The ring-buffer holds the last ~128
    frames, so this is a lower-bound count; divide by the elapsed time between
    first and last frame timestamp to get an accurate rate.
    """
    in_profile = False
    timestamps: List[int] = []
    frame_count = 0

    for line in text.splitlines():
        stripped = line.strip()
        if stripped == "---PROFILEDATA---":
            in_profile = not in_profile
            continue
        if not in_profile:
            continue
        parts = stripped.split(",")
        if len(parts) < 3:
            continue
        try:
            flags = int(parts[1])
        except ValueError:
            continue  # header row
        if flags == 0:
            frame_count += 1
            try:
                timestamps.append(int(parts[2]))  # IntendedVsync nanoseconds
            except ValueError:
                pass

    return frame_count, timestamps


def measure_fps(serial: Optional[str], pkg: str, scroll_seconds: float) -> dict:
    reset_gfxinfo(serial, pkg)
    elapsed = drive_scroll(serial, scroll_seconds)

    # Primary: standard gfxinfo summary (works on physical devices and HW-accel emulators).
    text = adb_shell(serial, f"dumpsys gfxinfo {pkg}")
    parsed = parse_gfxinfo(text)
    total_frames = parsed["total_frames"]
    fps_source = "gfxinfo"

    # Fallback: framestats ring-buffer (works on swiftshader_indirect emulators).
    # The ring-buffer holds the last ~128 frames; compute rate from their timestamps
    # rather than using `elapsed` directly to avoid underestimation.
    if total_frames == 0:
        framestats_text = adb_shell(serial, f"dumpsys gfxinfo {pkg} framestats", check=False)
        fb_count, timestamps = _count_framestats_frames(framestats_text)
        if fb_count > 1 and len(timestamps) >= 2:
            ns_span = max(timestamps) - min(timestamps)
            if ns_span > 0:
                fps_from_ts = fb_count / (ns_span / 1e9)
                parsed["total_frames"] = fb_count
                total_frames = fb_count
                fps_source = "framestats"
                elapsed = ns_span / 1e9  # use frame-timestamp span for accuracy

    fps_measurable = total_frames > 0
    fps_val = round(total_frames / elapsed, 2) if (elapsed > 0 and fps_measurable) else 0.0

    parsed.update({
        "wall_seconds": round(elapsed, 3),
        "fps": fps_val,
        "fps_source": fps_source,
        "fps_measurable": fps_measurable,
    })
    return parsed


# ---------------------------------------------------------------------------
# Memory leak detection
# ---------------------------------------------------------------------------


def measure_memory_leak(
    serial: Optional[str],
    pkg: str,
    activity: str,
    cycles: int,
    settle_s: float = DEFAULT_LEAK_SETTLE_S,
    am_extras: str = "",
) -> dict:
    """
    Detect memory leaks by measuring PSS across repeated background/foreground cycles.

    Each cycle: press HOME → wait → re-launch app → wait → sample PSS.
    A rising PSS trend that survives the inter-cycle pauses (giving the GC time to run)
    indicates objects are being retained across lifecycle events.

    Returns the per-cycle PSS samples plus a linear slope (MB/cycle). A slope above the
    `memory_leak_mb_per_cycle_max` threshold is flagged as a suspected leak.
    """
    samples: List[float] = []

    for i in range(cycles):
        adb_shell(serial, "input keyevent KEYCODE_HOME", check=False)
        time.sleep(settle_s)
        adb_shell(serial, f"am start -n {activity} {am_extras}".strip(), timeout=15)
        time.sleep(settle_s)
        mem = measure_memory_mb(serial, pkg)
        samples.append(mem["pss_mb"])
        print(f"[perf]   leak cycle {i + 1}/{cycles}: {mem['pss_mb']}MB PSS")

    n = len(samples)
    if n >= 2:
        x_mean = (n - 1) / 2.0
        y_mean = sum(samples) / n
        numerator = sum((i - x_mean) * (s - y_mean) for i, s in enumerate(samples))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        slope = numerator / denominator if denominator != 0 else 0.0
    else:
        slope = 0.0

    return {
        "samples_mb": [round(s, 2) for s in samples],
        "slope_mb_per_cycle": round(slope, 3),
        "min_mb": round(min(samples), 2) if samples else 0.0,
        "max_mb": round(max(samples), 2) if samples else 0.0,
        "total_growth_mb": round(samples[-1] - samples[0], 2) if len(samples) >= 2 else 0.0,
        "cycles": cycles,
    }




def measure_apk_size_mb(apk_path: str) -> dict:
    """Return the on-disk size of the APK in MB."""
    size_bytes = os.path.getsize(apk_path)
    return {
        "path": apk_path,
        "size_bytes": size_bytes,
        "size_mb": round(size_bytes / (1024 * 1024), 2),
    }


_TOTAL_PSS_RE = re.compile(r"TOTAL\s+PSS:\s+(\d+)")
_TOTAL_PSS_LEGACY_RE = re.compile(r"TOTAL:\s+(\d+)")


def measure_memory_mb(serial: Optional[str], pkg: str) -> dict:
    text = adb_shell(serial, f"dumpsys meminfo -d {pkg}")
    m = _TOTAL_PSS_RE.search(text)
    if not m:
        m = _TOTAL_PSS_LEGACY_RE.search(text)
    if not m:
        raise AdbError(f"Could not parse PSS from dumpsys meminfo output:\n{text[:600]}")
    pss_kb = int(m.group(1))
    return {
        "pss_kb": pss_kb,
        "pss_mb": round(pss_kb / 1024.0, 2),
    }


def _read_cpu_ticks(serial: Optional[str], pid: int) -> tuple:
    """
    Return (process_ticks, total_system_ticks) by reading /proc/{pid}/stat and /proc/stat.

    This approach is portable across every Android version and does not rely on
    `top` flag compatibility (which varies between toybox/busybox implementations).

    process_ticks = utime + stime (fields 14 and 15 in /proc/pid/stat, 1-indexed).
    total_ticks   = sum of all CPU time fields from the first "cpu " line in /proc/stat.
    """
    proc_out = adb_shell(serial, f"cat /proc/{pid}/stat", check=False)
    sys_out = adb_shell(serial, "cat /proc/stat", check=False)

    proc_ticks = 0
    fields = proc_out.split()
    if len(fields) > 14:
        try:
            proc_ticks = int(fields[13]) + int(fields[14])  # utime + stime (0-indexed: 13, 14)
        except ValueError:
            pass

    total_ticks = 0
    for line in sys_out.splitlines():
        if line.startswith("cpu "):
            try:
                total_ticks = sum(int(x) for x in line.split()[1:] if x.isdigit())
            except ValueError:
                pass
            break

    return proc_ticks, total_ticks


def _get_clk_tck(serial: Optional[str]) -> int:
    out = adb_shell(serial, "getconf CLK_TCK", check=False).strip()
    try:
        return int(out)
    except ValueError:
        return 100


def measure_cpu_peak_during_scroll(
    serial: Optional[str],
    pid: int,
    scroll_seconds: float,
    samples: int,
) -> dict:
    """
    Sample process CPU utilisation using /proc/{pid}/stat deltas while driving scroll.

    Each sample computes: cpu_pct = (Δprocess_ticks / Δtotal_ticks) × 100.
    Also records total process CPU time (seconds) over the scroll window from /proc ticks.
    """
    clk_tck = _get_clk_tck(serial)
    interval = max(scroll_seconds / samples, 0.5)
    readings: List[float] = []
    start = time.monotonic()
    end = start + scroll_seconds
    direction_up = True

    initial_proc_ticks, _ = _read_cpu_ticks(serial, pid)
    final_proc_ticks = initial_proc_ticks

    while time.monotonic() < end:
        proc_a, total_a = _read_cpu_ticks(serial, pid)

        try:
            swipe = "input swipe 540 1500 540 500 200" if direction_up else "input swipe 540 500 540 1500 200"
            adb_shell(serial, swipe, check=False, timeout=5)
        except AdbError:
            pass

        remaining = end - time.monotonic()
        time.sleep(min(interval, max(0, remaining)))

        proc_b, total_b = _read_cpu_ticks(serial, pid)
        final_proc_ticks = proc_b
        direction_up = not direction_up

        proc_delta = proc_b - proc_a
        total_delta = total_b - total_a
        if total_delta > 0 and proc_delta >= 0:
            readings.append(round(proc_delta / total_delta * 100.0, 2))

    elapsed_s = round(time.monotonic() - start, 3)
    tick_delta = max(0, final_proc_ticks - initial_proc_ticks)
    cpu_time_s = round(tick_delta / clk_tck, 3)

    if not readings:
        return {
            "samples_pct": [], "peak_pct": 0.0, "avg_pct": 0.0,
            "elapsed_s": elapsed_s, "cpu_time_s": cpu_time_s, "clk_tck": clk_tck,
        }

    return {
        "samples_pct": readings,
        "peak_pct": round(max(readings), 2),
        "avg_pct": round(sum(readings) / len(readings), 2),
        "elapsed_s": elapsed_s,
        "cpu_time_s": cpu_time_s,
        "clk_tck": clk_tck,
    }


# ---------------------------------------------------------------------------
# Optional Perfetto trace
# ---------------------------------------------------------------------------


PERFETTO_CONFIG = """
buffers: { size_kb: 63488 fill_policy: RING_BUFFER }
data_sources: { config { name: "android.packages_list" } }
data_sources: {
  config {
    name: "linux.ftrace"
    ftrace_config {
      ftrace_events: "sched/sched_switch"
      ftrace_events: "power/cpu_frequency"
      atrace_categories: "gfx"
      atrace_categories: "view"
      atrace_categories: "wm"
      atrace_categories: "am"
      atrace_categories: "idle"
    }
  }
}
data_sources: { config { name: "android.surfaceflinger.frametimeline" } }
duration_ms: %d
""" % PERFETTO_DURATION_MS


def capture_perfetto(serial: Optional[str], out_dir: str) -> Optional[str]:
    device_path = f"/data/misc/perfetto-traces/perf-{int(time.time())}.perfetto-trace"
    try:
        cmd = ["adb"]
        if serial:
            cmd += ["-s", serial]
        cmd += ["shell", f"perfetto -c - --txt -o {device_path}"]
        completed = subprocess.run(
            cmd,
            input=PERFETTO_CONFIG,
            capture_output=True,
            text=True,
            timeout=PERFETTO_DURATION_MS // 1000 + 30,
        )
        if completed.returncode != 0:
            print(f"[perfetto] capture failed: {completed.stderr.strip()}", file=sys.stderr)
            return None
    except subprocess.TimeoutExpired:
        print("[perfetto] capture timed out", file=sys.stderr)
        return None

    local_path = os.path.join(out_dir, os.path.basename(device_path))
    try:
        adb(serial, "pull", device_path, local_path)
    except AdbError as exc:
        print(f"[perfetto] pull failed: {exc}", file=sys.stderr)
        return None
    return local_path


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def evaluate(metrics_raw: dict, thresholds: dict) -> List[MetricResult]:
    launch_median = metrics_raw["launch"]["median_ms"]
    fps_value = metrics_raw["fps"]["fps"]
    memory_mb = metrics_raw["memory"]["pss_mb"]
    cpu_peak = metrics_raw["cpu"]["peak_pct"]

    results = [
        MetricResult(
            name="launch_time",
            value=launch_median,
            unit="ms",
            threshold=thresholds["launch_time_ms"],
            comparator="<",
            passed=launch_median < thresholds["launch_time_ms"],
            details=metrics_raw["launch"],
        ),
        MetricResult(
            name="fps",
            value=fps_value,
            unit="",
            threshold=thresholds["fps_min"],
            comparator=">",
            passed=(fps_value > thresholds["fps_min"]) if metrics_raw["fps"].get("fps_measurable", True) else True,
            details=metrics_raw["fps"],
        ),
        MetricResult(
            name="memory",
            value=memory_mb,
            unit="MB",
            threshold=thresholds["memory_mb_max"],
            comparator="<",
            passed=memory_mb < thresholds["memory_mb_max"],
            details=metrics_raw["memory"],
        ),
        MetricResult(
            name="cpu_spike",
            value=cpu_peak,
            unit="%",
            threshold=thresholds["cpu_peak_pct_max"],
            comparator="<",
            passed=cpu_peak < thresholds["cpu_peak_pct_max"],
            details=metrics_raw["cpu"],
        ),
    ]

    if "cpu_time_s_max" in thresholds:
        cpu_time_s = float(metrics_raw["cpu"].get("cpu_time_s", 0.0))
        results.append(MetricResult(
            name="cpu_time",
            value=cpu_time_s,
            unit="s",
            threshold=thresholds["cpu_time_s_max"],
            comparator="<",
            passed=cpu_time_s < thresholds["cpu_time_s_max"],
            details={"cpu_time_s": cpu_time_s, "clk_tck": metrics_raw["cpu"].get("clk_tck", 100)},
        ))

    if "apk" in metrics_raw and "apk_size_mb_max" in thresholds:
        apk_mb = metrics_raw["apk"]["size_mb"]
        results.append(MetricResult(
            name="apk_size",
            value=apk_mb,
            unit="MB",
            threshold=thresholds["apk_size_mb_max"],
            comparator="<",
            passed=apk_mb < thresholds["apk_size_mb_max"],
            details=metrics_raw["apk"],
        ))

    if "memory_leak" in metrics_raw and "memory_leak_mb_per_cycle_max" in thresholds:
        slope = metrics_raw["memory_leak"]["slope_mb_per_cycle"]
        threshold_slope = thresholds["memory_leak_mb_per_cycle_max"]
        results.append(MetricResult(
            name="memory_leak",
            value=slope,
            unit="MB/cycle",
            threshold=threshold_slope,
            comparator="<",
            passed=slope < threshold_slope,
            details=metrics_raw["memory_leak"],
        ))

    return results


def _baseline_upper_worse(value: float, baseline: float, tol: float) -> tuple[bool, float]:
    """Higher values are worse. Pass if value <= baseline * (1 + tol)."""
    if baseline <= 0:
        bound = baseline + max(abs(baseline), 1e-6) * tol
    else:
        bound = baseline * (1.0 + tol)
    return value <= bound, bound


def _baseline_lower_worse(value: float, baseline: float, tol: float) -> tuple[bool, float]:
    """Lower values are worse (e.g. FPS). Pass if value >= baseline * (1 - tol)."""
    if baseline <= 0:
        return True, 0.0
    bound = baseline * (1.0 - tol)
    return value >= bound, bound


def _baseline_leak_slope(value: float, baseline: float, tol: float) -> tuple[bool, float]:
    """More positive slope is worse. Allow small drift from recorded baseline."""
    span = max(abs(baseline), 0.05) * (1.0 + tol)
    bound = baseline + span
    return value <= bound, bound


def evaluate_with_baselines(metrics_raw: dict, cfg: dict) -> List[MetricResult]:
    """
    Gate each metric against recorded baseline values with relative_tolerance_pct.

    cfg format (from perf_baselines.json):
      { "relative_tolerance_pct": 15, "metrics": { "launch_time": 520.0, ... } }
    """
    tol = float(cfg.get("relative_tolerance_pct", 15)) / 100.0
    baselines: dict = cfg.get("metrics") or {}
    if not baselines:
        raise AdbError("Baseline file has no 'metrics' map")

    def _req(name: str) -> float:
        if name not in baselines:
            raise AdbError(f"Baseline file missing metric: {name}")
        return float(baselines[name])

    results: List[MetricResult] = []

    launch_median = float(metrics_raw["launch"]["median_ms"])
    b = _req("launch_time")
    ok, bound = _baseline_upper_worse(launch_median, b, tol)
    results.append(MetricResult(
        name="launch_time", value=launch_median, unit="ms", threshold=round(bound, 2),
        comparator="≤", passed=ok,
        details={**metrics_raw["launch"], "baseline": b, "tolerance_pct": tol * 100},
    ))

    fps_value = float(metrics_raw["fps"]["fps"])
    measurable = metrics_raw["fps"].get("fps_measurable", True)
    b = _req("fps")
    if not measurable:
        results.append(MetricResult(
            name="fps", value=fps_value, unit="", threshold=b, comparator="≥",
            passed=True,
            details={**metrics_raw["fps"], "baseline": b, "skipped": True},
        ))
    else:
        ok, bound = _baseline_lower_worse(fps_value, b, tol)
        results.append(MetricResult(
            name="fps", value=fps_value, unit="", threshold=round(bound, 3),
            comparator="≥", passed=ok,
            details={**metrics_raw["fps"], "baseline": b, "tolerance_pct": tol * 100},
        ))

    memory_mb = float(metrics_raw["memory"]["pss_mb"])
    b = _req("memory")
    ok, bound = _baseline_upper_worse(memory_mb, b, tol)
    results.append(MetricResult(
        name="memory", value=memory_mb, unit="MB", threshold=round(bound, 2),
        comparator="≤", passed=ok,
        details={**metrics_raw["memory"], "baseline": b, "tolerance_pct": tol * 100},
    ))

    cpu_peak = float(metrics_raw["cpu"]["peak_pct"])
    b = _req("cpu_spike")
    ok, bound = _baseline_upper_worse(cpu_peak, b, tol)
    results.append(MetricResult(
        name="cpu_spike", value=cpu_peak, unit="%", threshold=round(bound, 2),
        comparator="≤", passed=ok,
        details={**metrics_raw["cpu"], "baseline": b, "tolerance_pct": tol * 100},
    ))

    cpu_time_s = float(metrics_raw["cpu"].get("cpu_time_s", 0.0))
    b = _req("cpu_time")
    ok, bound = _baseline_upper_worse(cpu_time_s, b, tol)
    results.append(MetricResult(
        name="cpu_time", value=cpu_time_s, unit="s", threshold=round(bound, 3),
        comparator="≤", passed=ok,
        details={"baseline": b, "tolerance_pct": tol * 100, "cpu_time_s": cpu_time_s},
    ))

    if "apk" in metrics_raw:
        apk_mb = float(metrics_raw["apk"]["size_mb"])
        if "apk_size" in baselines:
            b = float(baselines["apk_size"])
            ok, bound = _baseline_upper_worse(apk_mb, b, tol)
            results.append(MetricResult(
                name="apk_size", value=apk_mb, unit="MB", threshold=round(bound, 2),
                comparator="≤", passed=ok,
                details={**metrics_raw["apk"], "baseline": b, "tolerance_pct": tol * 100},
            ))

    slope = float(metrics_raw["memory_leak"]["slope_mb_per_cycle"])
    b = _req("memory_leak")
    ok, bound = _baseline_leak_slope(slope, b, tol)
    results.append(MetricResult(
        name="memory_leak", value=slope, unit="MB/cycle", threshold=round(bound, 3),
        comparator="≤", passed=ok,
        details={**metrics_raw["memory_leak"], "baseline": b, "tolerance_pct": tol * 100},
    ))

    return results


def write_reports(out_dir: str, results: List[MetricResult], context: dict, perfetto_trace: Optional[str]) -> None:
    os.makedirs(out_dir, exist_ok=True)
    json_path = os.path.join(out_dir, "perf-report.json")
    md_path = os.path.join(out_dir, "perf-report.md")

    payload = {
        "context": context,
        "perfetto_trace": perfetto_trace,
        "metrics": [asdict(r) for r in results],
        "passed": all(r.passed for r in results),
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    lines = [
        "# Performance report",
        "",
        f"- Package: `{context['package']}`",
        f"- Activity: `{context['activity']}`",
        f"- Device: `{context.get('device') or 'auto'}`",
        f"- Runs: {context['runs']}",
        f"- Scroll seconds: {context['scroll_seconds']}",
    ]
    if context.get("deep_link"):
        lines.append(f"- Deep link: `{context['deep_link']}` (settle {context.get('perf_settle_seconds', 0)}s)")
    lines += [
        "",
        "| Metric | Value | Threshold | Result |",
        "| --- | --- | --- | --- |",
    ]
    for r in results:
        status = "PASS" if r.passed else "FAIL"
        lines.append(f"| {r.name} | {r.value}{r.unit} | {r.threshold_str()} | {status} |")
    if perfetto_trace:
        lines += ["", f"Perfetto trace: `{perfetto_trace}`"]
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--package", required=True, help="Android application ID, e.g. com.example.myapp")
    parser.add_argument("--activity", default=None, help="Component name; defaults to resolved launcher.")
    parser.add_argument("--apk", default=None, help="Path to the APK file; enables APK size gate when apk_size_mb_max is in thresholds.")
    parser.add_argument("--device", default=None, help="adb serial (-s); optional.")
    parser.add_argument("--thresholds", default=DEFAULT_THRESHOLDS_PATH)
    parser.add_argument(
        "--baselines",
        default=None,
        help="Path to perf_baselines.json — gate metrics vs recorded baselines (+ tolerance) instead of --thresholds.",
    )
    parser.add_argument("--runs", type=int, default=DEFAULT_RUNS)
    parser.add_argument("--scroll-seconds", type=float, default=float(DEFAULT_SCROLL_SECONDS))
    parser.add_argument("--cpu-samples", type=int, default=DEFAULT_CPU_SAMPLE_COUNT)
    parser.add_argument("--leak-cycles", type=int, default=DEFAULT_LEAK_CYCLES,
                        help="Number of background/foreground cycles for memory leak detection.")
    parser.add_argument("--out", default=DEFAULT_OUT_DIR)
    parser.add_argument("--perfetto", action="store_true", help="Also capture a 10s Perfetto trace.")
    parser.add_argument("--soft", action="store_true", help="Always exit 0 even if gates fail.")
    parser.add_argument(
        "--ez",
        nargs=2,
        metavar=("KEY", "VALUE"),
        action="append",
        default=[],
        help=(
            "Pass a boolean intent extra to every 'am start' invocation. "
            "Can be repeated. Example: --ez perf_auto_login true. "
            "Useful to bypass auth screens in debug builds during FPS/CPU measurement."
        ),
    )
    parser.add_argument(
        "--no-disable-animations",
        dest="disable_animations",
        action="store_false",
        default=True,
        help=(
            "Skip disabling system animations before measurement. "
            "Not recommended — animations inflate FPS/jank numbers. "
            "Omit this flag to let the agent disable and auto-restore animations."
        ),
    )
    parser.add_argument(
        "--deep-link",
        default=None,
        help=(
            "Deep link URL to open before FPS/CPU measurement (e.g. templatebareapp://posts). "
            "Use with --perf-settle-seconds so network + FlatList can load."
        ),
    )
    parser.add_argument(
        "--perf-settle-seconds",
        type=float,
        default=10.0,
        help="Seconds to wait after --deep-link before measuring FPS (API + list render).",
    )
    return parser.parse_args()


def _build_am_extras(ez_pairs: list) -> str:
    """Build an 'am start' extras suffix from --ez KEY VALUE pairs."""
    return " ".join(f"--ez {k} {v}" for k, v in ez_pairs)


def main() -> int:
    args = parse_args()
    gate_mode = "threshold"
    gate_config: dict = {}
    if args.baselines:
        if not os.path.isfile(args.baselines):
            print(f"[perf] ERROR: baselines file not found: {args.baselines}", file=sys.stderr)
            return 2
        with open(args.baselines, "r", encoding="utf-8") as f:
            gate_config = json.load(f)
        gate_mode = "baseline"
    else:
        with open(args.thresholds, "r", encoding="utf-8") as f:
            gate_config = json.load(f)

    am_extras = _build_am_extras(args.ez)
    if am_extras:
        print(f"[perf] am start extras: {am_extras}")

    serial = args.device

    # If no serial was given, show which device adb will use so local runs are unambiguous.
    if serial is None:
        connected = list_connected_devices()
        if len(connected) > 1:
            print(
                f"[perf] WARNING: {len(connected)} adb devices connected "
                f"({', '.join(connected)}). "
                f"Using the first one. Pass --device <serial> to target a specific device.",
                file=sys.stderr,
            )
            serial = connected[0]
        elif len(connected) == 1:
            serial = connected[0]
            print(f"[perf] Device: {serial}")

    wait_for_device(serial)
    wait_for_device_ready(serial)
    assert_package_installed(serial, args.package)
    activity = args.activity or resolve_launcher_activity(serial, args.package)

    print(f"[perf] package={args.package} activity={activity}")

    if args.disable_animations:
        disable_animations(serial)

    try:
        print("[perf] Measuring startup time ...")
        launch = measure_launch_ms(serial, args.package, activity, args.runs, am_extras)
        print(f"[perf] launch median={launch['median_ms']}ms samples={launch['samples_ms']}")

        # Ensure app is foreground for the rest of the run
        adb_shell(serial, f"am start -n {activity} {am_extras}".strip())
        pid = wait_for_pid(serial, args.package)
        time.sleep(DEFAULT_STEADY_STATE_DELAY_S)

        if args.deep_link:
            print(f"[perf] Opening deep link: {args.deep_link}")
            open_deep_link(serial, args.package, args.deep_link)
            settle = max(args.perf_settle_seconds, 0.0)
            if settle > 0:
                print(f"[perf] Waiting {settle}s for screen settle (API / FlatList) ...")
                time.sleep(settle)

        print("[perf] Measuring FPS / jank ...")
        fps = measure_fps(serial, args.package, args.scroll_seconds)
        fps_src = fps.get("fps_source", "gfxinfo")
        fps_ok = fps.get("fps_measurable", True)
        print(f"[perf] fps={fps['fps']} janky_pct={fps['janky_pct']} source={fps_src}{'' if fps_ok else ' (not measurable)'}")

        print("[perf] Measuring memory (PSS) ...")
        mem = measure_memory_mb(serial, args.package)
        print(f"[perf] memory={mem['pss_mb']}MB")

        print("[perf] Measuring CPU peak during scroll ...")
        cpu = measure_cpu_peak_during_scroll(serial, pid, args.scroll_seconds, args.cpu_samples)
        print(f"[perf] cpu peak={cpu['peak_pct']}% avg={cpu['avg_pct']}% time={cpu.get('cpu_time_s', 0)}s")

        print(f"[perf] Measuring memory leak ({args.leak_cycles} background/foreground cycles) ...")
        leak = measure_memory_leak(serial, args.package, activity, args.leak_cycles, am_extras=am_extras)
        print(f"[perf] leak slope={leak['slope_mb_per_cycle']}MB/cycle total_growth={leak['total_growth_mb']}MB")

        metrics_raw: dict = {
            "launch": launch,
            "fps": fps,
            "memory": mem,
            "cpu": cpu,
            "memory_leak": leak,
        }

        if args.apk:
            if not os.path.exists(args.apk):
                print(f"[perf] WARNING: --apk path not found: {args.apk}", file=sys.stderr)
            else:
                apk_info = measure_apk_size_mb(args.apk)
                metrics_raw["apk"] = apk_info
                print(f"[perf] apk size={apk_info['size_mb']}MB")

        perfetto_trace = capture_perfetto(serial, args.out) if args.perfetto else None
        if gate_mode == "baseline":
            results = evaluate_with_baselines(metrics_raw, gate_config)
        else:
            results = evaluate(metrics_raw, gate_config)

        context = {
            "package": args.package,
            "activity": activity,
            "device": serial,
            "runs": args.runs,
            "scroll_seconds": args.scroll_seconds,
            "leak_cycles": args.leak_cycles,
            "animations_disabled": args.disable_animations,
            "am_extras": am_extras or None,
            "deep_link": args.deep_link,
            "perf_settle_seconds": args.perf_settle_seconds if args.deep_link else None,
            "gate_mode": gate_mode,
            "gate_config": gate_config,
        }
        write_reports(args.out, results, context, perfetto_trace)

        print("\n[perf] Results:")
        for r in results:
            status = "PASS" if r.passed else "FAIL"
            print(f"  - {r.name}: {r.value}{r.unit} (gate {r.threshold_str()}) -> {status}")

        all_passed = all(r.passed for r in results)
        if all_passed:
            print("[perf] All gates passed.")
            return 0
        print("[perf] One or more gates failed.")
        return 0 if args.soft else 1

    finally:
        if args.disable_animations:
            restore_animations(serial)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AdbError as exc:
        print(f"[perf] ERROR: {exc}", file=sys.stderr)
        sys.exit(2)
