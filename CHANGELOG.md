# Changelog Chainlink External Adapters

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- [Request coalescing](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/) support to mitigate the issue of requests for data coming in bursts and missing the cache.
- Remote cache (Redis/ElastiCache) support, with adapter key grouping, to enable more efficient serverless deployments.
- Support for composite adapters:
  - `composite/proof-of-reserves` adapter combines multiple adapters to find total balance in custody for wBTC or renBTC.
- New adapters:
  - `wbtc-address-set` adapter to query wBTC custody address set.
  - `renvm-address-set` adapter to query renVM protocol custody address set.
  - `blockchain.com` adapter to BTC indexer used to fetch balances for a set of addresses.
  - `blockcypher` adapter to BTC indexer used to fetch balances for a set of addresses.
  - `trueusd`
  - `cryptoid`
  - `blockchair`
  - `bitso`
  - `cryptomkt`
  - `satoshitango`
  - `bitex`
  - `orchid-bandwidth`
  - `genesis-volatility`

### Changed

- Improved logs
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
