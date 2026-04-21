#!/usr/bin/env bash
set -euo pipefail

# 用法：./scripts/run_perf_test.sh [jmeter_home]
# 默认读取环境变量 JMETER_HOME；未指定则尝试 PATH 中的 jmeter。
# 验收标准：dashboard summary P95 < 100ms，station list P95 < 80ms，错误率 0。

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JMETER_HOME_ARG="${1:-}"

if [[ -n "$JMETER_HOME_ARG" ]]; then
  JMETER_BIN="$JMETER_HOME_ARG/bin/jmeter"
elif [[ -n "${JMETER_HOME:-}" ]]; then
  JMETER_BIN="$JMETER_HOME/bin/jmeter"
else
  JMETER_BIN="$(command -v jmeter || true)"
fi

if [[ -z "${JMETER_BIN:-}" || ! -x "$JMETER_BIN" ]]; then
  echo "ERROR: jmeter executable not found. Pass [jmeter_home], set JMETER_HOME, or add jmeter to PATH." >&2
  exit 2
fi

RESULT_DIR="$ROOT_DIR/scripts/results"
mkdir -p "$RESULT_DIR"
RESULT_FILE="$RESULT_DIR/perf_$(date +%Y%m%d_%H%M%S).jtl"

BASE_URL="${BASE_URL:-localhost}"
BASE_PORT="${BASE_PORT:-8080}"
THREAD_COUNT="${THREAD_COUNT:-200}"
RAMP_UP_SECONDS="${RAMP_UP_SECONDS:-60}"
DURATION_SECONDS="${DURATION_SECONDS:-600}"

"$JMETER_BIN" \
  -n \
  -t "$ROOT_DIR/scripts/jmeter/myems_pv_perf.jmx" \
  -l "$RESULT_FILE" \
  -JBASE_URL="$BASE_URL" \
  -JBASE_PORT="$BASE_PORT" \
  -JTHREAD_COUNT="$THREAD_COUNT" \
  -JRAMP_UP_SECONDS="$RAMP_UP_SECONDS" \
  -JDURATION_SECONDS="$DURATION_SECONDS" \
  -Jjmeter.save.saveservice.output_format=csv \
  -Jjmeter.save.saveservice.print_field_names=true \
  -Jjmeter.save.saveservice.label=true \
  -Jjmeter.save.saveservice.time=true \
  -Jjmeter.save.saveservice.successful=true \
  -Jjmeter.save.saveservice.response_code=true

python3 - "$RESULT_FILE" <<'PY'
import csv
import math
import sys

result_file = sys.argv[1]
targets = {
    "Dashboard Summary": 100.0,
    "Station List": 80.0,
}
samples = {label: [] for label in targets}
total = 0
failures = 0

with open(result_file, newline="") as fh:
    reader = csv.DictReader(fh)
    required = {"elapsed", "label", "success"}
    missing = required.difference(reader.fieldnames or [])
    if missing:
        raise SystemExit(f"ERROR: JTL missing fields: {', '.join(sorted(missing))}")
    for row in reader:
        total += 1
        success = str(row.get("success", "")).strip().lower()
        if success not in {"true", "1"}:
            failures += 1
        label = row.get("label", "")
        if label in samples:
            samples[label].append(float(row["elapsed"]))

def percentile(values, percent):
    if not values:
        return math.inf
    ordered = sorted(values)
    index = int(math.ceil((percent / 100.0) * len(ordered))) - 1
    return ordered[max(0, min(index, len(ordered) - 1))]

print(f"Result file: {result_file}")
print(f"Total samples: {total}")
print(f"Failed samples: {failures}")

ok = failures == 0
for label, limit in targets.items():
    p95 = percentile(samples[label], 95)
    count = len(samples[label])
    status = "PASS" if p95 < limit else "FAIL"
    print(f"{label}: count={count}, p95={p95:.2f}ms, target < {limit:.0f}ms, {status}")
    ok = ok and count > 0 and p95 < limit

if failures:
    print("FAIL: non-zero JMeter sample failures")
if ok:
    print("PERF_BASELINE_PASS")
    sys.exit(0)
print("PERF_BASELINE_FAIL")
sys.exit(1)
PY
