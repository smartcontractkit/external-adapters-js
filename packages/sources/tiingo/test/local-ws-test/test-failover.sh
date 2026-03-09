#!/bin/bash
# Manual integration test: WS failover across all Tiingo transports.
#
# Starts two WS proxies and the Tiingo EA locally, then triggers abnormal
# WS closures across 6 rounds to verify the 2:1 failover cycle for crypto,
# crypto-lwba, and forex. IEX is expected to always stay on primary.
#
# Cycle math with ratio 2:1 (cycleLength=3):
#   counter  cycle  URL
#   0        0      primary
#   1        1      primary
#   2        2      SECONDARY  ← failover
#   3        0      primary    ← failback
#   4        1      primary
#   5        2      SECONDARY  ← failover again
#   6        0      primary    ← failback again
#
# Usage:
#   export TIINGO_API_KEY=<your-key>
#   bash test/manual/test-failover.sh
#
# Optional overrides (defaults shown):
#   EA_PORT=8181
#   PRIMARY_ATTEMPTS=2  SECONDARY_ATTEMPTS=1
#   PRIMARY_PORT=9001   PRIMARY_CTRL=9002
#   SECONDARY_PORT=9003 SECONDARY_CTRL=9004

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EA_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"  # test/manual → test → tiingo package root

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
info() { echo -e "  ${YELLOW}$*${RESET}"; }

FAILURES=0

status_json() {
  curl -s "http://localhost:$1/status" 2>/dev/null
}

connections() {
  local label=$1 ctrl=$2
  local out count paths
  out=$(status_json "$ctrl")
  count=$(echo "$out" | python3 -c "import sys,json; print(json.load(sys.stdin)['openConnections'])" 2>/dev/null || echo "?")
  paths=$(echo "$out" | python3 -c "import sys,json; print(' '.join(c['path'] for c in json.load(sys.stdin)['connections']))" 2>/dev/null || echo "")
  printf "    %-12s %s conn  %s\n" "[$label]" "$count" "$paths"
  echo "$count"  # return value on last line
}

conn_count() {
  local ctrl=$1
  status_json "$ctrl" | python3 -c "import sys,json; print(json.load(sys.stdin)['openConnections'])" 2>/dev/null || echo "0"
}

close_proxy() {
  local label=$1 ctrl=$2
  local result count
  result=$(curl -s -X POST "http://localhost:$ctrl/close?code=1005" 2>/dev/null)
  count=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin)['closed'])" 2>/dev/null || echo "?")
  echo "  close $label → $count connection(s) terminated"
}

prices() {
  local iex crypto lwba forex
  iex=$(curl -s -X POST "http://localhost:$EA_PORT" -H "Content-Type: application/json" \
    -d '{"data":{"endpoint":"iex","base":"AAPL"}}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result','ERR'))" 2>/dev/null)
  crypto=$(curl -s -X POST "http://localhost:$EA_PORT" -H "Content-Type: application/json" \
    -d '{"data":{"endpoint":"crypto","base":"BTC","quote":"USD"}}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('result',None); print(round(float(r),2) if r else 'ERR')" 2>/dev/null)
  lwba=$(curl -s -X POST "http://localhost:$EA_PORT" -H "Content-Type: application/json" \
    -d '{"data":{"endpoint":"crypto-lwba","base":"ETH","quote":"USD"}}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); dd=d.get('data',{}); print('mid='+str(round(dd['mid'],2))+' bid='+str(round(dd['bid'],2))+' ask='+str(round(dd['ask'],2))) if 'mid' in dd else print('ERR:'+str(d.get('error','no data')))" 2>/dev/null)
  forex=$(curl -s -X POST "http://localhost:$EA_PORT" -H "Content-Type: application/json" \
    -d '{"data":{"endpoint":"forex","base":"EUR","quote":"USD"}}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result','ERR'))" 2>/dev/null)
  echo "    prices: iex(AAPL)=$iex  crypto(BTC)=$crypto  lwba(ETH)=$lwba  forex(EUR)=$forex"
}

predict() {
  local counter=$1 cycle=$(( $1 % CYCLE_LENGTH ))
  (( cycle < PRIMARY_ATTEMPTS )) && echo "primary" || echo "SECONDARY"
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

PROXY_JS="$SCRIPT_DIR/proxy.js"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

echo "==> Starting PRIMARY proxy   (port $PRIMARY_PORT → wss://api.tiingo.com)..."
UPSTREAM_WS_URL=wss://api.tiingo.com PROXY_PORT=$PRIMARY_PORT CONTROL_PORT=$PRIMARY_CTRL \
  yarn --cwd "$MONOREPO_ROOT" node "$PROXY_JS" > /tmp/proxy-primary.log 2>&1 &

echo "==> Starting SECONDARY proxy (port $SECONDARY_PORT → wss://api.redundantstack.com)..."
UPSTREAM_WS_URL=wss://api.redundantstack.com PROXY_PORT=$SECONDARY_PORT CONTROL_PORT=$SECONDARY_CTRL \
  yarn --cwd "$MONOREPO_ROOT" node "$PROXY_JS" > /tmp/proxy-secondary.log 2>&1 &
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

echo "==> Subscribing to all four transports..."
for req in \
  '{"data":{"endpoint":"iex","base":"AAPL"}}' \
  '{"data":{"endpoint":"crypto","base":"BTC","quote":"USD"}}' \
  '{"data":{"endpoint":"crypto-lwba","base":"ETH","quote":"USD"}}' \
  '{"data":{"endpoint":"forex","base":"EUR","quote":"USD"}}'; do
  curl -s -X POST "http://localhost:$EA_PORT" -H "Content-Type: application/json" -d "$req" > /dev/null
done
echo "    iex/AAPL  crypto/BTC  crypto-lwba/ETH  forex/EUR"
echo -n "==> Waiting for initial data"; sleep 10; echo " done."

# ── check/assert helpers ──────────────────────────────────────────────────────

assert_round() {
  local round=$1 expected=$2
  local pri sec
  pri=$(conn_count $PRIMARY_CTRL)
  sec=$(conn_count $SECONDARY_CTRL)

  if [[ "$expected" == "primary" ]]; then
    # 4 on primary, 0 on secondary, IEX on primary
    local iex_on_pri
    iex_on_pri=$(status_json $PRIMARY_CTRL | python3 -c \
      "import sys,json; cs=json.load(sys.stdin)['connections']; print(any(c['path']=='/iex' for c in cs))" 2>/dev/null)
    if [[ "$pri" == "4" && "$sec" == "0" ]]; then
      pass "Round $round: all on primary (pri=$pri, sec=$sec)"
    else
      fail "Round $round: expected all primary, got pri=$pri sec=$sec"
    fi
    if [[ "$iex_on_pri" == "True" ]]; then
      pass "Round $round: IEX on primary"
    else
      fail "Round $round: IEX not on primary!"
    fi
  else
    # 1 on primary (IEX only), 3 on secondary
    local iex_on_pri
    iex_on_pri=$(status_json $PRIMARY_CTRL | python3 -c \
      "import sys,json; cs=json.load(sys.stdin)['connections']; print(any(c['path']=='/iex' for c in cs))" 2>/dev/null)
    if [[ "$pri" == "1" && "$sec" == "3" ]]; then
      pass "Round $round: failover to secondary (pri=$pri[IEX], sec=$sec)"
    else
      fail "Round $round: expected pri=1 sec=3, got pri=$pri sec=$sec"
    fi
    if [[ "$iex_on_pri" == "True" ]]; then
      pass "Round $round: IEX stayed on primary (not affected by failover)"
    else
      fail "Round $round: IEX not on primary!"
    fi
  fi
}

# ── baseline ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}── BASELINE  (counter=0, all→primary expected) ──────────────${RESET}"
connections "primary"   $PRIMARY_CTRL   > /dev/null
connections "secondary" $SECONDARY_CTRL > /dev/null
pri=$(conn_count $PRIMARY_CTRL); sec=$(conn_count $SECONDARY_CTRL)
printf "    primary=%s  secondary=%s\n" "$pri" "$sec"
prices
[[ "$pri" == "4" && "$sec" == "0" ]] \
  && pass "Baseline: all 4 connections on primary" \
  || fail "Baseline: expected 4 on primary, got pri=$pri sec=$sec"

# ── rounds ────────────────────────────────────────────────────────────────────

COUNTER=0

run_round() {
  local round=$1 proxy_label=$2 proxy_ctrl=$3
  COUNTER=$(( COUNTER + 1 ))
  local expected; expected=$(predict $COUNTER)

  echo ""
  echo -e "${BOLD}── ROUND $round  close $proxy_label → counter=$COUNTER, expect: $expected ──${RESET}"
  close_proxy "$proxy_label" "$proxy_ctrl"
  echo -n "  waiting for reconnection"; sleep 6; echo " done."

  pri=$(conn_count $PRIMARY_CTRL); sec=$(conn_count $SECONDARY_CTRL)
  printf "    primary=%s  secondary=%s\n" "$pri" "$sec"
  prices
  assert_round "$round" "$expected"
}

# Round 1: close primary  → counter=1, cycle=1 → primary
run_round 1 primary   $PRIMARY_CTRL
# Round 2: close primary  → counter=2, cycle=2 → SECONDARY
run_round 2 primary   $PRIMARY_CTRL
# Round 3: close secondary → counter=3, cycle=0 → primary (failback)
run_round 3 secondary $SECONDARY_CTRL
# Round 4: close primary  → counter=4, cycle=1 → primary
run_round 4 primary   $PRIMARY_CTRL
# Round 5: close primary  → counter=5, cycle=2 → SECONDARY
run_round 5 primary   $PRIMARY_CTRL
# Round 6: close secondary → counter=6, cycle=0 → primary (failback)
run_round 6 secondary $SECONDARY_CTRL

# ── final summary ─────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}── FINAL SUMMARY ─────────────────────────────────────────────${RESET}"
echo "  Abnormal close events detected:"
grep -c "abnormal" /tmp/tiingo-ea.log 2>/dev/null | xargs printf "    %s total abnormal close(s)\n"
echo "  Secondary URL selections:"
grep -c "using secondary" /tmp/tiingo-ea.log 2>/dev/null | xargs printf "    %s wsSelectUrl→secondary call(s)\n"
echo "  Final connections:"
pri=$(conn_count $PRIMARY_CTRL); sec=$(conn_count $SECONDARY_CTRL)
printf "    primary=%s  secondary=%s\n" "$pri" "$sec"
prices

echo ""
if [[ $FAILURES -eq 0 ]]; then
  echo -e "  ${GREEN}${BOLD}All assertions passed.${RESET}"
else
  echo -e "  ${RED}${BOLD}$FAILURES assertion(s) failed.${RESET}"
fi

echo ""
echo "==> Done. EA log: /tmp/tiingo-ea.log  Proxy logs: /tmp/proxy-{primary,secondary}.log"
echo "    Ctrl+C to stop."
wait $EA_PID
