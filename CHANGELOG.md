# Changelog Chainlink External Adapters

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Oilprice adapters now accept a common request for Brent crude oil: `{"market":"brent"}`

## [0.1.4] - 2020-10-30

### Added

- New adapters:
  - `linkpool` to get ICE futures quotes
  - `onchain` to get ICE futures quotes

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
