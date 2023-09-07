# @chainlink/frxeth-exchange-rate-adapter

## 1.0.2

### Patch Changes

- [#2968](https://github.com/smartcontractkit/external-adapters-js/pull/2968) [`9fc4e5d04`](https://github.com/smartcontractkit/external-adapters-js/commit/9fc4e5d0457379600bcc763c20217dc2331cf941) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.0.1

### Patch Changes

- [#2959](https://github.com/smartcontractkit/external-adapters-js/pull/2959) [`e7a0196e8`](https://github.com/smartcontractkit/external-adapters-js/commit/e7a0196e8a36c012d482737820b2c89e3ace0e02) Thanks [@amit-momin](https://github.com/amit-momin)! - Bumped framework version

- [#2957](https://github.com/smartcontractkit/external-adapters-js/pull/2957) [`4f17496e9`](https://github.com/smartcontractkit/external-adapters-js/commit/4f17496e90ce4e552bd73e106b5573d812f1e14c) Thanks [@alecgard](https://github.com/alecgard)! - Bumped framework version

- [#2953](https://github.com/smartcontractkit/external-adapters-js/pull/2953) [`3c304b311`](https://github.com/smartcontractkit/external-adapters-js/commit/3c304b311ed864b4bbda580bcbeb0e28bb9298bc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.0.0

### Major Changes

- 29720f068: Add frxETH-ETH Exchange Rate Adapter.

  - Adapter fetches the fraxETH-ETH exchange rate values from frxETH-ETH Dual Oracle contract.
  - Returns either priceHigh or priceLow, depending on the priceType parameter provided.
  - If `isBadData` flag is set in contract response, the EA returns an error.
