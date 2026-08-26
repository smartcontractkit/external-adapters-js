# Generate TradingHours JSON for static-market-hours EA

The `static-market-hours` adapter can serve market status for any schedule
defined init configuration as JSON. The easiest way to get this JSON is to use
the `generate-tradinghours-json` script, which uses the official TradingHours
data to generate the JSON for a given market.

The official data can be downloaded if you have a TradingHours API token, which
you can find in 1password if you have access to the right vault.

## Install tradinghours tool and data

The TradingHours tool is a Python package that can be installed and used to
download the official TradingHours data. `tradinghours.ini` is configured to
store the downloaded data in an easy to find location.

`TRADINGHOURS_DIR` can be set to anything as long as it's not `"tradinghours"`
because that will interfere with the project name of the package we depend on.

```
export TRADINGHOURS_TOKEN="..."
TRADINGHOURS_DIR="$HOME/tradinghours-tmp"
mkdir -p "$TRADINGHOURS_DIR"
cd "$TRADINGHOURS_DIR"
uv init
uv add tradinghours
cat > tradinghours.ini <<EOF
[internal]
remote_dir = remote
EOF
uv run tradinghours import
```

At this point the official tradinghours data is available in
`$TRADINGHOURS_DIR/remote/csv`.

## Generate JSON for static-market-hours EA

To generate the JSON for a specific market, you need to know the `FinID` that
TradingHours uses for that market. You can find this in the TradingHours data
in `markets.csv`. An example FinID is `US.NYSE`. Run the following from the
`external-adapters-js` repo:

```
FIN_ID="..." # The FinID TradingHours uses for the market.
yarn generate-tradinghours-json --csv-dir "$TRADINGHOURS_DIR/remote/csv" --fin-id "$FIN_ID" | jq -c .
```

The JSON is written to stdout, so you can copy it to the right environment
variable of the `static-market-hours` EA. The environment variable is
`${MARKET}_REGULAR_SCHEDULE`, where `${MARKET}` can be anything as long as it
matches the `market` input parameter used in the requests to the EA. ("24/5"
schedules are not yet supported by `generate-tradinghours-json`.)

## Verify the generated schedule

To make sure the generated schedule matches the official TradingHours data, you
can use the `check-schedule.py` script. This is to make sure there aren't any
bugs in the `generate-tradinghours-json` script or the `static-market-hours`
adapter.

```
# First make sure the static-market-hours EA is running on port 8080 with
# the new config and with `ALLOW_AT_TIMESTAMP_FOR_TESTING=true` in the
# environment.
# Then:
MARKET="..." # The market parameter used for the EA.
FIN_ID="..." # The FinID TradingHours uses for the market.
source "$TRADINGHOURS_DIR/.venv/bin/activate"
python packages/sources/static-market-hours/src/scripts/check-market-status.py "$FIN_ID" "$MARKET"
```

This will start with a quick pass checking timestamps 1 hours apart. Once this
succeeds without errors, the schedule is very likely to be correct. But it will
continue checking every timestamp for the next 366 days or the remainder of the
available schedule, whichever ends first.
