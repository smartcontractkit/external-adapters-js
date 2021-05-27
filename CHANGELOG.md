# Changelog Chainlink External Adapters

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added support for EOD close prices on Finage, IEX Cloud, Twelvedata, Tiingo and Unibit

- New adapters:
  - `expert-car-broker` to get car prices
  - `binance` to get binance market data
  - `sportsdataio` to get sports data from sportsdata.io
  - `vesper` to get TVL from Vesper

### Changed
- Conflux adapter sending transaction optimization

### Removed

- Removed custom `tradingeconomics-stream` as WS support is not included into `tradingeconomics` adapter

## [0.2.0] - 2021-4-13

### Added

- New adapters:
  - `agoric` to push results to the Agoric blockchain
  - `therundown` to get sports score data from TheRundown
  - `tradingeconomics-stream` to get stream data from TradingEconomics
  - `blockstream` to get Bitcoin height and difficulty
- Basic prometheus metrics endpoint

### Changed

- Remaining non-2-step adapters migrated to TS
- Updated support for `DIGG/BTC` in Kaiko and Amberdata
- Updated base URL for GeoDB
- CMC now uses preset IDs instead of preset slugs
- Added support for `tradermade` in `outlier-detection` composite adapter
- Added support for `overrides` param in price adapters
- Added a per-provider ratelimit reference
- Added Prometheus metrics
- `tradingeconomics` will now get stream data from TradingEconomics using a persistent WS connection
- `make` commands are now TypeScript files that can be run through yarn scripts

### Fixed

### Removed

- Removed serverless support (AWS Lambda & GPC Functions).

## [0.2.0-rc.1] - 2021-2-4

### Added

- New adapters:
  - `conflux` to send conflux chain transaction
  - `xbto` to get BRN quotes
  - `iv-outlier-detection` to get IV values with outlier detection
  - `taapi` to get Trading Analysis data
  - `stasis` to get Circulating Supply of EURS
  - `defi-pulse` to calculate an accurate price for the Defi Pulse Index
  - `finage` to get Financial data from finage.co.uk
  - `coincodex` to get crypto prices from CoinCodex
  - `coinranking` to get crypto prices from Coinranking
  - `crypto-volatility-index` to calculate the CVI (Crypto volatility index)
  - `btc.com` to get on-chain balances from BTC.com
  - `sochain` to get on-chain balances from SoChain
  - `dns-query` to query DNS over HTTPS
  - `dns-record-check` to check whether some record provided exists on DNS
  - `paxos` to get Paxos asset supply attestations
  - `outlier-detection`: composite adapter to check for outlier values between multiple sets of data providers
  - `dydx-stark` to sign the input price data with your private STARK key, and send it to the destination endpoint.
  - `apy-finance` to calculate the TVL in APY Finance
  - `token-allocation` composite adapter to calculate the total price from a set of tokens
  - `bitcoin-json-rpc`: composite adapter for querying bitcoin blockchain stats(difficulty, height) according to the existing convention
  - `iex-cloud` to get stock and crypto market data from IEX Cloud
  - `cfbenchmarks` to get crypto benchmarks and indices
  - `dxfeed-secondary` to handle secondary mappings for the TSLA symbol
  - `harmony` to write transactions to the Harmony blockchain
  - `tiingo` to get end-of-day stock price data from Tiingo
  - `geodb` to get location data from GeoDB
- Added support for metadata in requests. This gives adapters access to the FM on-chain round state.
- Moves re-usable test behaviors & testing utils to a new package - `@chainlink/adapter-test-helpers`
- Added support for using query string parameters as input to adapters.
- Add a package re-usable adapter factory implementations to - `@chainlink/ea-factories`

- Added support for using multiple API Keys per-adapter

### Fixed

- CMC adapter price query fixed for currencies where multiple currencies have the same symbol

### Changed

- Oilprice adapters now accept a common request for Brent crude oil: `{"market":"brent"}`
- Market closure is now a composite adapter, and now follows the build instructions for composite adapters. Market
  now also supports using metadata.
- Coinlore now accepts an optional environment variable to set the default API endpoint
- Migrates @chainlink/ea-bootstrap and @chainlink/external-adapter packages to TS.
- Updates the following adapters with a second endpoint for getting an account's on-chain balance
  - `amberdata`
  - `blockchair`
  - `cryptoapis`
- dxFeed now uses OTC feeds for FTSE and N225, rather than licensed data feeds
- Migrated to Typescript
  - `kaiko`
  - `marketstack`
  - `metalsapi`
  - `nikkei`
  - `poa-gasprice`
  - `polygon`
  - `nomics`
  - `openexchangerates`
  - `coinmarketcap`
- `synth-index` adapter is now a composite adapter. Going forward there is only one instance of `synth-index` adapter built, one that you configure with the underlying data provider you wish to use.
- Removed
  - `google-finance`

### Removed

- WTI Outlier detection and IV Outlier detection adapters are now covered in the Outlier detection composite adapter

## [0.1.5] - 2021-2-2

- Cache key generator now ignores `'meta'` metadata as default setting

## [0.1.4] - 2020-10-30

### Added

- New adapters:
  - `linkpool` to get ICE futures quotes
  - `onchain` to get ICE futures quotes
  - `lcx` to get BTC and ETH prices in USD or EUR

### Fixed

- Local in-memory cache got broken in the last release, and was reinitialized on every request.
- `amberdata` adapter wasn't responding for some assets because they don't make cross-rates by default. Cross-rates are now included which enables this adapter to support markets like `BNB/USD`, not just the actual `BNB/USDT`.

## [0.1.3] - 2020-10-29

### Added

- Caching improvements:
  - [Request coalescing](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/) support to mitigate the issue of requests for data coming in bursts and missing the cache.
  - Remote cache (Redis/ElastiCache) support, with adapter key grouping, to enable more efficient serverless deployments.
- Support for composite adapters:
  - `composite/proof-of-reserves` adapter combines multiple adapters to find total balance in custody for wBTC or renBTC protocols.
- New adapters:
  - `wbtc-address-set` to query wBTC custody address set.
  - `renvm-address-set` to query renVM protocol custody address set.
  - `blockchain.com` to fetch balances for a set of Bitcoin addresses.
  - `blockcypher` to fetch balances for a set of Bitcoin addresses.
  - `reduce` to reduce an array to a result. Different reducers are supported like: `sum`, `product`, `average`, `median`, `min` & `max`.
  - `trueusd` to query supply and issuance data for TrueUSD.
  - `cryptoid` to get chain difficulty measurement from different networks.
  - `blockchair` to get chain difficulty measurement from different networks.
  - `bitso` to get last 24 hours volume weighted average price (vwap) for multiple markets.
  - `cryptomkt` to get last transaction price for multiple markets.
  - `satoshitango` to get last bid price for multiple markets.
  - `bitex` to get volume weighted average price (vwap) for multiple markets.
  - `orchid-bandwidth` to get available bandwidth from Chainlink as service provider.
  - `genesis-volatility` to get implied volatility of an asset.
  - `covid-tracker` to query COVID-19 statistics.
  - `lition` to query the price in Euros per MWh for Lition.
  - `coinlore` to query the Bitcoin market dominance and market capitalization.
  - `messari` to query the Bitcoin market dominance.

### Changed

- Improved logs.
- Prettier logs in development environment.

## [0.1.2] - 2020-09-18

### Changed

- Replaced `alphavantage-sdr` with `alphachain` adapter

## [0.1.1] - 2020-09-18

### Added

- CHANGELOG.md (this file), to keep track of changes between releases

### Changed

- Gas adapters (`amberdata-gasprice`, `anyblock-gasprice`, `etherchain`, `ethgasstation` & `poa-gasprice`) now do not require `speed` param on input, but will use a sensible default.

### Fixed

- Kaiko adapter endpoint fix

## [0.1.0] - 2020-09-17

Initial external adapter release!
