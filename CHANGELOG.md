# Changelog Chainlink External Adapters

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- New adapters:
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
  - `bitcoin-json-rpc`: composite adapter for querying bitcoin blockchain stats(difficulty, height) according to the existing convention
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

### Removed

- WTI Outlier detection and IV Outlier detection adapters are now covered in the Outlier detection composite adapter

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
