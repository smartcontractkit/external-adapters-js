# @chainlink/finnhub-secondary-adapter

## 0.3.3

### Patch Changes

- [#2968](https://github.com/smartcontractkit/external-adapters-js/pull/2968) [`9fc4e5d04`](https://github.com/smartcontractkit/external-adapters-js/commit/9fc4e5d0457379600bcc763c20217dc2331cf941) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

- Updated dependencies [[`9fc4e5d04`](https://github.com/smartcontractkit/external-adapters-js/commit/9fc4e5d0457379600bcc763c20217dc2331cf941)]:
  - @chainlink/finnhub-adapter@2.5.3

## 0.3.2

### Patch Changes

- [#2959](https://github.com/smartcontractkit/external-adapters-js/pull/2959) [`e7a0196e8`](https://github.com/smartcontractkit/external-adapters-js/commit/e7a0196e8a36c012d482737820b2c89e3ace0e02) Thanks [@amit-momin](https://github.com/amit-momin)! - Bumped framework version

- [#2957](https://github.com/smartcontractkit/external-adapters-js/pull/2957) [`4f17496e9`](https://github.com/smartcontractkit/external-adapters-js/commit/4f17496e90ce4e552bd73e106b5573d812f1e14c) Thanks [@alecgard](https://github.com/alecgard)! - Bumped framework version

- [#2953](https://github.com/smartcontractkit/external-adapters-js/pull/2953) [`3c304b311`](https://github.com/smartcontractkit/external-adapters-js/commit/3c304b311ed864b4bbda580bcbeb0e28bb9298bc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

- Updated dependencies [[`e7a0196e8`](https://github.com/smartcontractkit/external-adapters-js/commit/e7a0196e8a36c012d482737820b2c89e3ace0e02), [`4f17496e9`](https://github.com/smartcontractkit/external-adapters-js/commit/4f17496e90ce4e552bd73e106b5573d812f1e14c), [`3c304b311`](https://github.com/smartcontractkit/external-adapters-js/commit/3c304b311ed864b4bbda580bcbeb0e28bb9298bc)]:
  - @chainlink/finnhub-adapter@2.5.2

## 0.3.1

### Patch Changes

- 011aec39e: Bumped framework version
- Updated dependencies [011aec39e]
  - @chainlink/finnhub-adapter@2.5.1

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
