# Changelog Chainlink External Adapters

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
