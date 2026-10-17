## Data Provider

[FXMacroData](https://fxmacrodata.com/?utm_source=github&utm_medium=referral&utm_campaign=external-adapters-js&utm_content=readme) publishes daily FX reference rates and macroeconomic releases sourced from central banks and national statistics agencies.

- The `forex` endpoint returns the most recent daily reference rate for `base`/`quote`. `providerIndicatedTimeUnixMs` is the observation date of that rate.
- The `indicator` endpoint returns the most recent released value of a macroeconomic indicator (for example `inflation` or `policy_rate`) for a currency. `providerIndicatedTimeUnixMs` is the release time of that value. Indicator names for each currency are listed at `GET /v1/data_catalogue/{currency}`.
