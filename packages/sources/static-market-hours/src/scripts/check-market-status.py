#!/usr/bin/env python3
"""
Validate tradinghours data against an adapter endpoint by comparing
market status for every minute from now until a specified end date.

Usage:
    python check-market-status.py <FinID> <market_name> [end_date]

Arguments:
    FinID:          Market identifier (e.g., US.NYMEX.AGRI.SUGAR11)
    market_name:    Market name for the adapter (e.g., nymex-sugar)
    end_date:       Optional ISO date string (e.g., 2027-12-31). Defaults to 1 year from now.

Examples:
    python check-market-status.py US.NYMEX.AGRI.SUGAR11 nymex-sugar
    python check-market-status.py US.NYMEX.AGRI.SUGAR11 nymex-sugar 2026-12-31
"""

import sys
import json
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import urllib.request
import urllib.error

from tradinghours import Market


def query_adapter(market_name: str, timestamp_seconds: int) -> tuple[dict | None, str | None]:
    """Query the adapter endpoint for market status at a given timestamp.
    Returns (response_dict, error_message)"""
    try:
        data = {
            "data": {
                "market": market_name,
                "atTimestampSeconds": timestamp_seconds
            }
        }

        request = urllib.request.Request(
            "http://localhost:8080",
            data=json.dumps(data).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(request, timeout=5) as response:
            return json.loads(response.read().decode('utf-8')), None
    except urllib.error.HTTPError as e:
        try:
            error_body = e.read().decode('utf-8')
        except:
            error_body = str(e)
        return None, f"HTTP {e.code}: {error_body}"
    except urllib.error.URLError as e:
        return None, f"Connection error: {e.reason}"
    except Exception as e:
        return None, f"Error: {e}"


def main():
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print("Usage: python check-market-status.py <FinID> <market_name> [end_date]", file=sys.stderr)
        print("Example: python check-market-status.py US.NYMEX.AGRI.SUGAR11 nymex-sugar", file=sys.stderr)
        print("Example: python check-market-status.py US.NYMEX.AGRI.SUGAR11 nymex-sugar 2026-12-31", file=sys.stderr)
        sys.exit(1)

    fin_id = sys.argv[1]
    market_name = sys.argv[2]
    end_date_str = sys.argv[3] if len(sys.argv) == 4 else None

    # Get the market
    try:
        market = Market.get(fin_id)
    except Exception as e:
        print(f"Error: Failed to get market '{fin_id}': {e}", file=sys.stderr)
        sys.exit(1)

    # Generate timestamps efficiently: first check every hour, then every minute
    start = datetime.now(tz=ZoneInfo("UTC")).replace(microsecond=0)

    if end_date_str:
        try:
            end = datetime.fromisoformat(end_date_str).replace(tzinfo=ZoneInfo("UTC"))
        except ValueError:
            print(f"Error: Invalid end_date format. Use ISO format (e.g., 2026-12-31)", file=sys.stderr)
            sys.exit(1)
    else:
        # Use market's max date if it's less than 1 year from now
        default_end = start + timedelta(days=366)
        market_max_dt = datetime.combine(market.holidays_max_date, datetime.max.time(), tzinfo=ZoneInfo("UTC"))

        if market_max_dt < default_end:
            end = market_max_dt
        else:
            end = default_end

    checked = 0

    def check_timestamp(timestamp):
        """Check a single timestamp and return True if mismatch found."""
        nonlocal checked
        timestamp_seconds = int(timestamp.timestamp())

        # Query adapter
        adapter_response, adapter_error = query_adapter(market_name, timestamp_seconds)
        if adapter_response is None:
            print(f"Error: Failed to query adapter at {timestamp.isoformat()} ({int(timestamp.timestamp())}): {adapter_error}", file=sys.stderr)
            sys.exit(1)

        # Query tradinghours
        try:
            market_status = market.status(timestamp)
        except Exception as e:
            print(f"Warning: Failed to query tradinghours at {timestamp.isoformat()} ({int(timestamp.timestamp())}): {e}", file=sys.stderr)
            return

        # Compare
        adapter_status = adapter_response.get("data", {}).get("statusString")
        tradinghours_status = market_status.status.upper()

        if adapter_status != tradinghours_status:
            # Convert timestamp to market's local timezone
            market_tz = ZoneInfo(market.timezone)
            local_timestamp = timestamp.astimezone(market_tz)

            mismatch = {
                "timestamp": local_timestamp.isoformat(),
                "timestamp_seconds": timestamp_seconds,
                "market_timezone": market.timezone,
                "adapter_status": adapter_status,
                "tradinghours_status": tradinghours_status,
                "tradinghours_reason": market_status.reason,
            }
            print(json.dumps(mismatch, indent=2))
            sys.exit(0)

        checked += 1
        if checked % 1000 == 0:
            print(f"Checked {checked} timestamps...")


    print(f"Checking market status for {fin_id} ({market_name})...")
    print(f"Data available from {market.holidays_min_date} to {market.holidays_max_date}")
    print()

    for round_num in range(0, 60):
        # Take steps of 23 module 60 to spread checked timestamps across
        # the hour to find gaps more quickly.
        minute_offset = (round_num * 23) % 60

        if round_num == 0:
            print("Checking every hour...")
        elif round_num == 1:
            print("Every hour checked. Now checking remaining minutes...")
            print()

        current = start + timedelta(minutes=minute_offset)
        while current <= end:
            check_timestamp(current)
            current += timedelta(hours=1)

    print(f"No mismatches found after checking {checked} timestamps")


if __name__ == "__main__":
    main()
