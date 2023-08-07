# @chainlink/finnhub-secondary-adapter

## 0.3.0

### Minor Changes

- 0395ad50a: Add inverse config to Finnhub EA's.

  - Add's support for inverse pairs to Finnhub EAs.

### Patch Changes

- Updated dependencies [0395ad50a]
  - @chainlink/finnhub-adapter@2.5.0

## 0.2.2

### Patch Changes

- 1a00fdfc1: Bumped framework version
- 715221438: Bumped framework version
- Updated dependencies [1a00fdfc1]
- Updated dependencies [715221438]
  - @chainlink/finnhub-adapter@2.4.2

## 0.2.1

### Patch Changes

- 81a8ac7c7: Downgrade Finnhub EAs to v0.29.12 of the EA Framework

  - Temporary measure to fix Finnhub README's by maintaining the same version as the README generation script

- eff4c4cf5: Bumped framework version
- e7e30d963: Bumped framework version
- Updated dependencies [81a8ac7c7]
- Updated dependencies [eff4c4cf5]
- Updated dependencies [e7e30d963]
  - @chainlink/finnhub-adapter@2.4.1

## 0.2.0

### Minor Changes

- fbf3a4dc3: Finnhub: Separate base, quote and exchange params.

  - Separating the base, quote and exchange params allows us to maintain standardised inbound and DP requests.
  - This fixes an issue where Finnhub EA's would fail for certain requests when using WebSockets. Previously Finnhub WebSocket requests would succeed for full symbols (e.g. {"base": "OANDA:EUR_USD"}), but fail for requests with separate base and quote (e.g. {"base": "EUR", "quote: "USD"}). This is because the WebSocket message returns a single symbol which is cached as the base, and future requests included a quote so did not match the cached key.
  - This commit introduces a requestTransform for the Finnhub Quote endpoint, which splits full symbols into their constituent base, quote and exchange. We can the consistently build and destructure the symbols in our REST and WS transports. As part of this a new input parameter `exchange` is added, allowing requests to specify the exchange they wish to fetch data for.

### Patch Changes

- Updated dependencies [fbf3a4dc3]
  - @chainlink/finnhub-adapter@2.4.0

## 0.1.0

### Minor Changes

- 2ccb7ad2c: Add finnhub-secondary EA. Identical to existing finnhub EA, with different provided overrides.

### Patch Changes

- Updated dependencies [2ccb7ad2c]
- Updated dependencies [634ff0496]
- Updated dependencies [6062242a8]
- Updated dependencies [2ccb7ad2c]
  - @chainlink/finnhub-adapter@2.3.0
