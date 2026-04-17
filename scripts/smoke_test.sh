#!/usr/bin/env bash
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
REQUEST_TIMEOUT_SECONDS="${REQUEST_TIMEOUT_SECONDS:-15}"
CURL_BIN="${CURL_BIN:-curl}"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/myems-pv-smoke.XXXXXX")"

FAILURES=()
PASS_COUNT=0
TOKEN=""
LAST_BODY_FILE=""
LAST_STATUS=""

# shellcheck disable=SC2329
cleanup() {
  rm -rf "${WORK_DIR}"
}

trap cleanup EXIT

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 2
  fi
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'PASS %s\n' "$1"
}

fail() {
  FAILURES+=("$1")
  printf 'FAIL %s\n' "$1" >&2
}

urlencode() {
  python3 - "$1" <<'PY'
import sys
from urllib.parse import quote

print(quote(sys.argv[1], safe=""))
PY
}

json_get() {
  python3 - "$1" "$2" <<'PY'
import json
import sys

file_path = sys.argv[1]
path = sys.argv[2]

with open(file_path, "r", encoding="utf-8") as fh:
    value = json.load(fh)

if path:
    for part in filter(None, path.split(".")):
        while part:
            if part[0] == "[":
                end = part.index("]")
                value = value[int(part[1:end])]
                part = part[end + 1 :]
                continue
            bracket_index = part.find("[")
            if bracket_index == -1:
                key = part
                part = ""
            else:
                key = part[:bracket_index]
                part = part[bracket_index:]
            value = value[key]

if isinstance(value, (dict, list)):
    print(json.dumps(value, ensure_ascii=False))
elif isinstance(value, bool):
    print("true" if value else "false")
elif value is None:
    print("null")
else:
    print(value)
PY
}

json_length() {
  python3 - "$1" "$2" <<'PY'
import json
import sys

file_path = sys.argv[1]
path = sys.argv[2]

with open(file_path, "r", encoding="utf-8") as fh:
    value = json.load(fh)

for part in filter(None, path.split(".")):
    while part:
        if part[0] == "[":
            end = part.index("]")
            value = value[int(part[1:end])]
            part = part[end + 1 :]
            continue
        bracket_index = part.find("[")
        if bracket_index == -1:
            key = part
            part = ""
        else:
            key = part[:bracket_index]
            part = part[bracket_index:]
        value = value[key]

print(len(value))
PY
}

perform_request() {
  local label="$1"
  local method="$2"
  local path="$3"
  local data="${4-}"
  local body_file
  local status
  local curl_args=(
    --silent
    --show-error
    --output
    ""
    --write-out
    "%{http_code}"
    --max-time
    "${REQUEST_TIMEOUT_SECONDS}"
    --request
    "${method}"
    --header
    "Accept: application/json"
  )

  body_file="${WORK_DIR}/$(printf '%s' "${label}" | tr '/:?&=' '_' | tr ' ' '_').json"
  curl_args[3]="${body_file}"

  if [[ -n "${TOKEN}" ]]; then
    curl_args+=(--header "Authorization: Bearer ${TOKEN}")
  fi

  if [[ -n "${data}" ]]; then
    curl_args+=(--header "Content-Type: application/json" --data "${data}")
  fi

  if ! status="$("${CURL_BIN}" "${curl_args[@]}" "${BASE_URL%/}${path}")"; then
    LAST_STATUS="000"
    LAST_BODY_FILE="${body_file}"
    printf 'curl transport error\n' >"${body_file}"
    return 1
  fi

  LAST_STATUS="${status}"
  LAST_BODY_FILE="${body_file}"
  return 0
}

expect_status() {
  local label="$1"
  local expected="$2"

  if [[ "${LAST_STATUS}" == "${expected}" ]]; then
    pass "${label} HTTP ${expected}"
  else
    fail "${label} expected HTTP ${expected}, got ${LAST_STATUS}"
  fi
}

expect_json_path() {
  local label="$1"
  local path="$2"

  if json_get "${LAST_BODY_FILE}" "${path}" >/dev/null 2>&1; then
    pass "${label} JSON path ${path}"
  else
    fail "${label} missing JSON path ${path}"
  fi
}

expect_json_array() {
  local label="$1"
  local path="$2"
  local value

  if ! value="$(json_get "${LAST_BODY_FILE}" "${path}" 2>/dev/null)"; then
    fail "${label} missing JSON array ${path}"
    return
  fi

  if [[ "${value}" == \[* ]]; then
    pass "${label} JSON array ${path}"
  else
    fail "${label} expected ${path} to be array"
  fi
}

expect_json_equals() {
  local label="$1"
  local path="$2"
  local expected="$3"
  local actual

  if ! actual="$(json_get "${LAST_BODY_FILE}" "${path}" 2>/dev/null)"; then
    fail "${label} missing JSON path ${path}"
    return
  fi

  if [[ "${actual}" == "${expected}" ]]; then
    pass "${label} ${path}=${expected}"
  else
    fail "${label} expected ${path}=${expected}, got ${actual}"
  fi
}

expect_json_length() {
  local label="$1"
  local path="$2"
  local expected="$3"
  local actual

  if ! actual="$(json_length "${LAST_BODY_FILE}" "${path}" 2>/dev/null)"; then
    fail "${label} missing JSON path ${path}"
    return
  fi

  if [[ "${actual}" == "${expected}" ]]; then
    pass "${label} ${path} length=${expected}"
  else
    fail "${label} expected ${path} length=${expected}, got ${actual}"
  fi
}

login() {
  if ! perform_request "captcha_image" "GET" "/captchaImage"; then
    fail "/captchaImage transport failure"
    return 1
  fi

  expect_status "/captchaImage" "200"
  expect_json_path "/captchaImage" "captchaEnabled"

  local captcha_enabled
  captcha_enabled="$(json_get "${LAST_BODY_FILE}" "captchaEnabled" 2>/dev/null || printf 'true')"
  if [[ "${captcha_enabled}" == "true" ]]; then
    fail "/login blocked: sys.account.captchaEnabled=true, disable captcha for smoke/UAT first"
    return 1
  fi

  local login_payload
  login_payload=$(cat <<EOF
{"username":"${ADMIN_USERNAME}","password":"${ADMIN_PASSWORD}","code":"","uuid":""}
EOF
)

  if ! perform_request "login" "POST" "/login" "${login_payload}"; then
    fail "/login transport failure"
    return 1
  fi

  expect_status "/login" "200"
  expect_json_path "/login" "token"

  TOKEN="$(json_get "${LAST_BODY_FILE}" "token" 2>/dev/null || true)"
  if [[ -z "${TOKEN}" || "${TOKEN}" == "null" ]]; then
    fail "/login returned empty token"
    return 1
  fi

  pass "/login token acquired"
  return 0
}

main() {
  require_cmd "${CURL_BIN}"
  require_cmd python3

  if ! login; then
    printf '\nSmoke test aborted during login.\n' >&2
    exit 1
  fi

  if ! perform_request "dashboard_summary" "GET" "/pv/dashboard/summary"; then
    fail "/pv/dashboard/summary transport failure"
  else
    expect_status "/pv/dashboard/summary" "200"
    expect_json_path "/pv/dashboard/summary" "data.totalStations"
  fi

  if ! perform_request "station_list" "GET" "/pv/station/list"; then
    fail "/pv/station/list transport failure"
  else
    expect_status "/pv/station/list" "200"
    expect_json_array "/pv/station/list" "rows"
  fi

  local station_suffix
  local station_name
  local station_id=""
  local station_query
  local add_station_payload
  local update_station_payload
  station_suffix="$(date +%s)"
  station_name="UAT-SMOKE-${station_suffix}"
  station_query="$(urlencode "${station_name}")"
  add_station_payload=$(cat <<EOF
{"stationName":"${station_name}","location":"UAT smoke site","capacityMw":1.23,"tagId":1,"legacyFirebaseId":"smoke-${station_suffix}","remark":"smoke add"}
EOF
)

  if ! perform_request "station_add" "POST" "/pv/station" "${add_station_payload}"; then
    fail "POST /pv/station transport failure"
  else
    expect_status "POST /pv/station" "200"
    expect_json_equals "POST /pv/station" "code" "200"
  fi

  if ! perform_request "station_list_after_add" "GET" "/pv/station/list?stationName=${station_query}"; then
    fail "GET /pv/station/list?stationName=<unique> transport failure"
  else
    expect_status "GET /pv/station/list?stationName=<unique>" "200"
    expect_json_array "GET /pv/station/list?stationName=<unique>" "rows"
    expect_json_path "GET /pv/station/list?stationName=<unique>" "rows[0].stationId"
    station_id="$(json_get "${LAST_BODY_FILE}" "rows[0].stationId" 2>/dev/null || true)"
  fi

  if [[ -n "${station_id}" ]]; then
    update_station_payload=$(cat <<EOF
{"stationId":${station_id},"stationName":"${station_name}","location":"UAT smoke site updated","capacityMw":2.34,"tagId":1,"remark":"smoke update"}
EOF
)

    if ! perform_request "station_update" "PUT" "/pv/station" "${update_station_payload}"; then
      fail "PUT /pv/station transport failure"
    else
      expect_status "PUT /pv/station" "200"
      expect_json_equals "PUT /pv/station" "code" "200"
    fi

    if ! perform_request "station_detail" "GET" "/pv/station/${station_id}"; then
      fail "GET /pv/station/${station_id} transport failure"
    else
      expect_status "GET /pv/station/${station_id}" "200"
      expect_json_equals "GET /pv/station/${station_id}" "data.location" "UAT smoke site updated"
    fi

    if ! perform_request "station_delete" "DELETE" "/pv/station/${station_id}"; then
      fail "DELETE /pv/station/${station_id} transport failure"
    else
      expect_status "DELETE /pv/station/${station_id}" "200"
      expect_json_equals "DELETE /pv/station/${station_id}" "code" "200"
    fi

    if ! perform_request "station_list_after_delete" "GET" "/pv/station/list?stationName=${station_query}"; then
      fail "GET /pv/station/list?stationName=<unique> after delete transport failure"
    else
      expect_status "GET /pv/station/list?stationName=<unique> after delete" "200"
      expect_json_length "GET /pv/station/list?stationName=<unique> after delete" "rows" "0"
    fi
  else
    fail "Station CRUD follow-up skipped because stationId was not recovered"
  fi

  if ! perform_request "gateway_list" "GET" "/pv/gateway/list"; then
    fail "/pv/gateway/list transport failure"
  else
    expect_status "/pv/gateway/list" "200"
    expect_json_array "/pv/gateway/list" "rows"
  fi

  if ! perform_request "inverter_list" "GET" "/pv/inverter/list"; then
    fail "/pv/inverter/list transport failure"
  else
    expect_status "/pv/inverter/list" "200"
    expect_json_array "/pv/inverter/list" "rows"
  fi

  if ! perform_request "alert_list" "GET" "/pv/alert/list"; then
    fail "/pv/alert/list transport failure"
  else
    expect_status "/pv/alert/list" "200"
    expect_json_array "/pv/alert/list" "rows"
  fi

  local today
  today="$(date +%F)"
  if ! perform_request "analysis_hourly_yield" "GET" "/pv/analysis/hourly-yield?startDate=${today}&endDate=${today}"; then
    fail "/pv/analysis/hourly-yield transport failure"
  else
    expect_status "/pv/analysis/hourly-yield" "200"
    expect_json_array "/pv/analysis/hourly-yield" "data"
  fi

  if ! perform_request "station_tag_list" "GET" "/pv/stationTag/list"; then
    fail "/pv/stationTag/list transport failure"
  else
    expect_status "/pv/stationTag/list" "200"
    expect_json_array "/pv/stationTag/list" "rows"
  fi

  if ! perform_request "model_list" "GET" "/pv/model/list"; then
    fail "/pv/model/list transport failure"
  else
    expect_status "/pv/model/list" "200"
    expect_json_array "/pv/model/list" "rows"
  fi

  if ((${#FAILURES[@]} > 0)); then
    printf '\nSmoke test failed with %d issue(s):\n' "${#FAILURES[@]}" >&2
    printf ' - %s\n' "${FAILURES[@]}" >&2
    exit 1
  fi

  printf '\nSmoke test passed. Assertions: %d\n' "${PASS_COUNT}"
  exit 0
}

main "$@"
