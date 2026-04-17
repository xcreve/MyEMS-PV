#!/usr/bin/env bash
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
WAIT_SECONDS="${WAIT_SECONDS:-10}"
CURL_BIN="${CURL_BIN:-curl}"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/myems-pv-ws.XXXXXX")"

TOKEN=""

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

json_get() {
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

if isinstance(value, bool):
    print("true" if value else "false")
elif value is None:
    print("null")
else:
    print(value)
PY
}

perform_request() {
  local body_file="$1"
  local method="$2"
  local path="$3"
  local data="${4-}"
  local status
  local curl_args=(
    --silent
    --show-error
    --output
    "${body_file}"
    --write-out
    "%{http_code}"
    --max-time
    15
    --request
    "${method}"
    --header
    "Accept: application/json"
  )

  if [[ -n "${TOKEN}" ]]; then
    curl_args+=(--header "Authorization: Bearer ${TOKEN}")
  fi

  if [[ -n "${data}" ]]; then
    curl_args+=(--header "Content-Type: application/json" --data "${data}")
  fi

  if ! status="$("${CURL_BIN}" "${curl_args[@]}" "${BASE_URL%/}${path}")"; then
    return 1
  fi
  printf '%s' "${status}"
}

login() {
  local captcha_file="${WORK_DIR}/captcha.json"
  local login_file="${WORK_DIR}/login.json"
  local status
  local payload

  if ! status="$(perform_request "${captcha_file}" "GET" "/captchaImage")"; then
    printf 'captcha probe transport failure\n' >&2
    return 1
  fi
  if [[ "${status}" != "200" ]]; then
    printf 'captcha probe failed, status=%s\n' "${status}" >&2
    return 1
  fi

  if [[ "$(json_get "${captcha_file}" "captchaEnabled" 2>/dev/null || printf 'true')" == "true" ]]; then
    printf 'WebSocket smoke blocked: sys.account.captchaEnabled=true\n' >&2
    return 1
  fi

  payload=$(cat <<EOF
{"username":"${ADMIN_USERNAME}","password":"${ADMIN_PASSWORD}","code":"","uuid":""}
EOF
)

  if ! status="$(perform_request "${login_file}" "POST" "/login" "${payload}")"; then
    printf 'login transport failure\n' >&2
    return 1
  fi
  if [[ "${status}" != "200" ]]; then
    printf 'login failed, status=%s\n' "${status}" >&2
    return 1
  fi

  TOKEN="$(json_get "${login_file}" "token" 2>/dev/null || true)"
  if [[ -z "${TOKEN}" || "${TOKEN}" == "null" ]]; then
    printf 'login returned empty token\n' >&2
    return 1
  fi

  return 0
}

select_ws_client() {
  if command -v websocat >/dev/null 2>&1; then
    printf 'websocat'
    return 0
  fi
  if command -v wscat >/dev/null 2>&1; then
    printf 'wscat'
    return 0
  fi
  if command -v node >/dev/null 2>&1; then
    printf 'node'
    return 0
  fi
  return 1
}

build_ws_url() {
  python3 - "${BASE_URL}" "${TOKEN}" <<'PY'
import sys
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

base_url = sys.argv[1]
token = sys.argv[2]
parsed = urlparse(base_url)

scheme = "wss" if parsed.scheme == "https" else "ws"
base_path = parsed.path.rstrip("/")
ws_path = f"{base_path}/ws/pv/dashboard" if base_path else "/ws/pv/dashboard"
query = dict(parse_qsl(parsed.query, keep_blank_values=True))
query["token"] = token

print(urlunparse((scheme, parsed.netloc, ws_path, "", urlencode(query), "")))
PY
}

wait_for_message() {
  if [[ "$1" == "node" ]]; then
    node - "$2" "$3" <<'JS'
const wsUrl = process.argv[2];
const timeoutSeconds = Number(process.argv[3]);
const WebSocketCtor = globalThis.WebSocket;

if (!WebSocketCtor) {
  console.error("Node runtime does not provide global WebSocket");
  process.exit(2);
}

const timer = setTimeout(() => {
  console.error(`FAIL websocket push not received within ${timeoutSeconds}s`);
  process.exit(1);
}, timeoutSeconds * 1000);

const ws = new WebSocketCtor(wsUrl);
let resolved = false;

function finish(code, message) {
  if (resolved) {
    return;
  }
  resolved = true;
  clearTimeout(timer);
  if (message) {
    console.log(message);
  }
  try {
    ws.close();
  } catch (error) {
    // ignore close failures during smoke runs
  }
  process.exit(code);
}

ws.onmessage = (event) => {
  const payload = typeof event.data === "string" ? event.data : String(event.data);
  finish(0, payload);
};

ws.onerror = () => {
  finish(1, "WebSocket client error");
};

ws.onclose = () => {
  if (!resolved) {
    finish(1, "WebSocket closed before receiving a message");
  }
};
JS
    return $?
  fi

  python3 - "$1" "$2" "$3" <<'PY'
import re
import subprocess
import sys

client = sys.argv[1]
url = sys.argv[2]
timeout_seconds = int(sys.argv[3])

command = [client, url] if client == "websocat" else [client, "-c", url]

try:
    result = subprocess.run(command, capture_output=True, text=True, timeout=timeout_seconds)
    output = (result.stdout or "") + (result.stderr or "")
except subprocess.TimeoutExpired as exc:
    output = (exc.stdout or "") + (exc.stderr or "")

output = output.strip()
if output:
    print(output)

if re.search(r"\{.*\}", output, re.S):
    sys.exit(0)

sys.exit(1)
PY
}

main() {
  require_cmd "${CURL_BIN}"
  require_cmd python3

  if ! login; then
    exit 1
  fi

  local client
  local ws_url
  client="$(select_ws_client)" || {
    printf 'Missing websocket client: install websocat, wscat, or ensure node is available\n' >&2
    exit 2
  }
  ws_url="$(build_ws_url)"

  printf 'Connecting with %s -> %s\n' "${client}" "${ws_url}"
  if wait_for_message "${client}" "${ws_url}" "${WAIT_SECONDS}"; then
    printf 'PASS websocket push received within %ss\n' "${WAIT_SECONDS}"
    exit 0
  fi

  printf 'FAIL websocket push not received within %ss\n' "${WAIT_SECONDS}" >&2
  exit 1
}

main "$@"
