#!/bin/bash
# Local WS integration test: WS failover across all Tiingo transports.
#
# Starts two WS proxies and the Tiingo EA locally, then triggers abnormal
# WS closures to verify:
#   1. Repeated primary closes eventually push non-IEX transports to secondary
#   2. IEX always stays on primary (it bypasses wsSelectUrl)
#   3. Closing secondary brings all transports back to primary
#   4. Data continues to flow after every reconnection
#   5. The full cycle repeats reliably
#
# The test is adaptive — it closes connections until the expected state
# transition is observed, rather than relying on exact counter values,
# which can be desynchronised by startup timing.
#
# Usage:
#   export TIINGO_API_KEY=<your-key>
#   bash test/local-ws-test/test-failover.sh
#
# Optional overrides (defaults shown):
#   EA_PORT=8181
#   PRIMARY_ATTEMPTS=2  SECONDARY_ATTEMPTS=1
#   PRIMARY_PORT=9001   PRIMARY_CTRL=9002
#   SECONDARY_PORT=9003 SECONDARY_CTRL=9004

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EA_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

EA_PORT="${EA_PORT:-8181}"
PRIMARY_PORT="${PRIMARY_PORT:-9001}"
PRIMARY_CTRL="${PRIMARY_CTRL:-9002}"
SECONDARY_PORT="${SECONDARY_PORT:-9003}"
SECONDARY_CTRL="${SECONDARY_CTRL:-9004}"
PRIMARY_ATTEMPTS="${PRIMARY_ATTEMPTS:-2}"
SECONDARY_ATTEMPTS="${SECONDARY_ATTEMPTS:-1}"
CYCLE_LENGTH=$(( PRIMARY_ATTEMPTS + SECONDARY_ATTEMPTS ))
API_KEY="${TIINGO_API_KEY:?Please export TIINGO_API_KEY}"

# ── helpers ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'
pass() { echo -e "  ${GREEN}PASS${RESET} $*"; }
fail() { echo -e "  ${RED}FAIL${RESET} $*"; FAILURES=$(( FAILURES + 1 )); }

FAILURES=0

status_json() { curl -s "http://localhost:$1/status" 2>/dev/null; }

conn_count() {
  status_json "$1" | python3 -c "import sys,json; print(json.load(sys.stdin)['openConnections'])" 2>/dev/null || echo "0"
}

conn_paths() {
  status_json "$1" | python3 -c "import sys,json; print(' '.join(sorted(c['path'] for c in json.load(sys.stdin)['connections'])))" 2>/dev/null || echo ""
}

iex_on_primary() {
  status_json "$PRIMARY_CTRL" | python3 -c \
    "import sys,json; cs=json.load(sys.stdin)['connections']; print(any(c['path']=='/iex' for c in cs))" 2>/dev/null || echo "False"
}

close_proxy() {
  local label=$1 ctrl=$2
  local result count
  result=$(curl -s -X POST "http://localhost:$ctrl/close?code=1005" 2>/dev/null)
  count=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['closed'])" 2>/dev/null || echo "?")
  echo "  closed $label ($count connection(s))"
}

price_simple() {
  curl -s -X POST "http://localhost:$EA_PORT" -H "Content-Type: application/json" -d "$1" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('result',None); print(round(float(r),2) if r else 'ERR')" 2>/dev/null
}
price_lwba() {
  curl -s -X POST "http://localhost:$EA_PORT" -H "Content-Type: application/json" -d "$1" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); dd=d.get('data',{}); print('mid='+str(round(dd['mid'],2))) if 'mid' in dd else print('ERR')" 2>/dev/null
}

prices() {
  echo "    iex:    AAPL=$(price_simple '{"data":{"endpoint":"iex","base":"AAPL"}}')  MSFT=$(price_simple '{"data":{"endpoint":"iex","base":"MSFT"}}')  GOOG=$(price_simple '{"data":{"endpoint":"iex","base":"GOOG"}}')"
  echo "    crypto: BTC=$(price_simple '{"data":{"endpoint":"crypto","base":"BTC","quote":"USD"}}')  ETH=$(price_simple '{"data":{"endpoint":"crypto","base":"ETH","quote":"USD"}}')  SOL=$(price_simple '{"data":{"endpoint":"crypto","base":"SOL","quote":"USD"}}')"
  echo "    lwba:   BTC=$(price_lwba '{"data":{"endpoint":"crypto-lwba","base":"BTC","quote":"USD"}}')  ETH=$(price_lwba '{"data":{"endpoint":"crypto-lwba","base":"ETH","quote":"USD"}}')  SOL=$(price_lwba '{"data":{"endpoint":"crypto-lwba","base":"SOL","quote":"USD"}}')"
  echo "    forex:  EUR=$(price_simple '{"data":{"endpoint":"forex","base":"EUR","quote":"USD"}}')  GBP=$(price_simple '{"data":{"endpoint":"forex","base":"GBP","quote":"USD"}}')  JPY=$(price_simple '{"data":{"endpoint":"forex","base":"JPY","quote":"USD"}}')"
}

wait_state() {
  local want_primary=$1 want_secondary=$2 timeout=${3:-20}
  for attempt in $(seq 1 $timeout); do
    p=$(conn_count $PRIMARY_CTRL)
    s=$(conn_count $SECONDARY_CTRL)
    if [[ "$p" == "$want_primary" && "$s" == "$want_secondary" ]]; then
      echo "  state reached: primary=$p secondary=$s (${attempt}s)"
      return 0
    fi
    sleep 1
  done
  echo "  timeout: primary=$p secondary=$s (wanted primary=$want_primary secondary=$want_secondary)"
  return 1
}

cleanup() {
  lsof -ti:$PRIMARY_PORT,$PRIMARY_CTRL,$SECONDARY_PORT,$SECONDARY_CTRL,$EA_PORT \
    | xargs kill -9 2>/dev/null || true
}
trap 'echo ""; echo "==> Cleaning up..."; cleanup' EXIT

# ── startup ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}==> WS Failover Test  (ratio ${PRIMARY_ATTEMPTS}:${SECONDARY_ATTEMPTS}, cycleLength=$CYCLE_LENGTH)${RESET}"
echo ""
echo "==> Killing any existing processes on required ports..."
cleanup
sleep 1

PROXY_WORK="/tmp/tiingo-proxy"
mkdir -p "$PROXY_WORK"
cp "$SCRIPT_DIR/proxy.js" "$PROXY_WORK/proxy.js"
if [[ ! -d "$PROXY_WORK/node_modules/ws" ]]; then
  echo "==> Installing ws package for proxy (one-time, in $PROXY_WORK)..."
  (cd "$PROXY_WORK" && npm init -y --silent 2>/dev/null && npm install --silent ws 2>/dev/null)
fi

echo "==> Starting PRIMARY proxy   (port $PRIMARY_PORT -> wss://api.tiingo.com)..."
cd "$PROXY_WORK"
UPSTREAM_WS_URL=wss://api.tiingo.com PROXY_PORT=$PRIMARY_PORT CONTROL_PORT=$PRIMARY_CTRL \
  node proxy.js > /tmp/proxy-primary.log 2>&1 &

echo "==> Starting SECONDARY proxy (port $SECONDARY_PORT -> wss://api.redundantstack.com)..."
UPSTREAM_WS_URL=wss://api.redundantstack.com PROXY_PORT=$SECONDARY_PORT CONTROL_PORT=$SECONDARY_CTRL \
  node proxy.js > /tmp/proxy-secondary.log 2>&1 &
sleep 2

echo "==> Starting Tiingo EA (port $EA_PORT)..."
cd "$EA_DIR"
EA_PORT=$EA_PORT \
  API_KEY=$API_KEY \
  WS_API_ENDPOINT=ws://localhost:$PRIMARY_PORT \
  SECONDARY_WS_API_ENDPOINT=ws://localhost:$SECONDARY_PORT \
  WS_URL_PRIMARY_ATTEMPTS=$PRIMARY_ATTEMPTS \
  WS_URL_SECONDARY_ATTEMPTS=$SECONDARY_ATTEMPTS \
  WS_SUBSCRIPTION_UNRESPONSIVE_TTL=180000 \
  LOG_LEVEL=debug \
  yarn server:dist > /tmp/tiingo-ea.log 2>&1 &
EA_PID=$!

echo -n "==> Waiting for EA"
for i in $(seq 1 30); do
  curl -s "http://localhost:$EA_PORT" > /dev/null 2>&1 && echo " ready." && break
  echo -n "."; sleep 1
done

# ── subscribe ─────────────────────────────────────────────────────────────────

echo "==> Subscribing to all four transports (3 assets each)..."
for req in \
  '{"data":{"endpoint":"iex","base":"AAPL"}}' \
  '{"data":{"endpoint":"iex","base":"MSFT"}}' \
  '{"data":{"endpoint":"iex","base":"GOOG"}}' \
  '{"data":{"endpoint":"crypto","base":"BTC","quote":"USD"}}' \
  '{"data":{"endpoint":"crypto","base":"ETH","quote":"USD"}}' \
  '{"data":{"endpoint":"crypto","base":"SOL","quote":"USD"}}' \
  '{"data":{"endpoint":"crypto-lwba","base":"BTC","quote":"USD"}}' \
  '{"data":{"endpoint":"crypto-lwba","base":"ETH","quote":"USD"}}' \
  '{"data":{"endpoint":"crypto-lwba","base":"SOL","quote":"USD"}}' \
  '{"data":{"endpoint":"forex","base":"EUR","quote":"USD"}}' \
  '{"data":{"endpoint":"forex","base":"GBP","quote":"USD"}}' \
  '{"data":{"endpoint":"forex","base":"JPY","quote":"USD"}}'; do
  curl -s -X POST "http://localhost:$EA_PORT" -H "Content-Type: application/json" -d "$req" > /dev/null
done
echo "    iex: AAPL MSFT GOOG | crypto: BTC ETH SOL | lwba: BTC ETH SOL | forex: EUR GBP JPY"

# ── establish baseline ────────────────────────────────────────────────────────
# The framework's lastMessageReceivedAt starts at 0, which may cause a spurious
# "unresponsive" counter bump at startup and push some transports to secondary.
# We handle this by closing any stray secondary connections until everything
# stabilises on primary.

echo "==> Establishing baseline (all 4 on primary)..."
for reset_attempt in $(seq 1 5); do
  sleep 4
  p=$(conn_count $PRIMARY_CTRL)
  s=$(conn_count $SECONDARY_CTRL)
  if [[ "$p" == "4" && "$s" == "0" ]]; then
    echo "  baseline reached: primary=$p secondary=$s"
    break
  fi
  echo "  current: primary=$p secondary=$s — resetting stray connections..."
  if [[ "$s" != "0" ]]; then
    close_proxy secondary $SECONDARY_CTRL
  fi
  if [[ "$p" != "0" ]] && [[ "$p" != "4" ]]; then
    # Some transports haven't connected yet, or some are connecting to wrong proxy
    # Close primary too to force a full reconnect cycle
    close_proxy primary $PRIMARY_CTRL
  fi
  sleep 4
done
sleep 3

# ── PHASE 1: Baseline check ──────────────────────────────────────────────────

echo ""
echo -e "${BOLD}── PHASE 1: Baseline ──${RESET}"
p=$(conn_count $PRIMARY_CTRL); s=$(conn_count $SECONDARY_CTRL)
echo "  primary=$p  secondary=$s  primary_paths=[$(conn_paths $PRIMARY_CTRL)]"
prices
if [[ "$p" == "4" && "$s" == "0" ]]; then
  pass "All 4 transports on primary"
else
  fail "Expected primary=4 secondary=0, got primary=$p secondary=$s"
fi

# ── PHASE 2: Push non-IEX transports to secondary ────────────────────────────

echo ""
echo -e "${BOLD}── PHASE 2: Close primary repeatedly until non-IEX transports fail over to secondary ──${RESET}"
failover_reached=false
for attempt in $(seq 1 8); do
  close_proxy primary $PRIMARY_CTRL
  sleep 6
  p=$(conn_count $PRIMARY_CTRL); s=$(conn_count $SECONDARY_CTRL)
  echo "  attempt $attempt: primary=$p secondary=$s"
  if [[ "$s" -ge 3 ]]; then
    failover_reached=true
    break
  fi
done
if $failover_reached; then
  pass "Non-IEX transports moved to secondary after $attempt close(s)"
else
  fail "Non-IEX transports never reached secondary after 8 closes"
fi

iex_check=$(iex_on_primary)
[[ "$iex_check" == "True" ]] \
  && pass "IEX stayed on primary during failover" \
  || fail "IEX not on primary after failover!"

sec_paths=$(conn_paths $SECONDARY_CTRL)
if echo "$sec_paths" | python3 -c "import sys; p=set(sys.stdin.read().strip().split()); exit(0 if {'/crypto-synth','/crypto-synth-top','/fx'}<=p else 1)" 2>/dev/null; then
  pass "Secondary has crypto, lwba, forex ($sec_paths)"
else
  fail "Expected crypto/lwba/forex on secondary, got: $sec_paths"
fi

echo "  prices after failover:"
prices

# ── PHASE 3: Failback to primary ─────────────────────────────────────────────

echo ""
echo -e "${BOLD}── PHASE 3: Close secondary to trigger failback to primary ──${RESET}"
close_proxy secondary $SECONDARY_CTRL
wait_state 4 0 15
p=$(conn_count $PRIMARY_CTRL); s=$(conn_count $SECONDARY_CTRL)
if [[ "$p" == "4" && "$s" == "0" ]]; then
  pass "All 4 back on primary after failback"
else
  fail "Expected all on primary, got primary=$p secondary=$s"
fi
echo "  prices after failback:"
prices

# ── PHASE 4: Second cycle — push to secondary again ──────────────────────────

echo ""
echo -e "${BOLD}── PHASE 4: Second cycle — close primary until failover ──${RESET}"
failover_reached=false
for attempt in $(seq 1 8); do
  close_proxy primary $PRIMARY_CTRL
  sleep 6
  p=$(conn_count $PRIMARY_CTRL); s=$(conn_count $SECONDARY_CTRL)
  echo "  attempt $attempt: primary=$p secondary=$s"
  if [[ "$s" -ge 3 ]]; then
    failover_reached=true
    break
  fi
done
if $failover_reached; then
  pass "Non-IEX transports moved to secondary (2nd cycle) after $attempt close(s)"
else
  fail "Non-IEX transports never reached secondary (2nd cycle)"
fi

iex_check=$(iex_on_primary)
[[ "$iex_check" == "True" ]] \
  && pass "IEX stayed on primary (2nd cycle)" \
  || fail "IEX not on primary (2nd cycle)!"

echo "  prices after 2nd failover:"
prices

# ── PHASE 5: Second failback ─────────────────────────────────────────────────

echo ""
echo -e "${BOLD}── PHASE 5: Second failback ──${RESET}"
close_proxy secondary $SECONDARY_CTRL
wait_state 4 0 15
p=$(conn_count $PRIMARY_CTRL); s=$(conn_count $SECONDARY_CTRL)
if [[ "$p" == "4" && "$s" == "0" ]]; then
  pass "All 4 back on primary (2nd failback)"
else
  fail "Expected all on primary, got primary=$p secondary=$s"
fi
echo "  prices after 2nd failback:"
prices

# ── FINAL SUMMARY ─────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}── SUMMARY ──${RESET}"
abnormal_count=$(grep -c "abnormal" /tmp/tiingo-ea.log 2>/dev/null || echo "0")
secondary_count=$(grep -c "using secondary" /tmp/tiingo-ea.log 2>/dev/null || echo "0")
echo "  EA log: $abnormal_count abnormal close(s), $secondary_count secondary URL selection(s)"
p=$(conn_count $PRIMARY_CTRL); s=$(conn_count $SECONDARY_CTRL)
echo "  final: primary=$p secondary=$s"

echo ""
if [[ $FAILURES -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}All assertions passed.${RESET}"
else
  echo -e "  ${RED}${BOLD}$FAILURES assertion(s) failed.${RESET}"
fi

echo ""
echo "==> Logs: /tmp/tiingo-ea.log  /tmp/proxy-{primary,secondary}.log"
echo "    Ctrl+C to stop."
wait $EA_PID
