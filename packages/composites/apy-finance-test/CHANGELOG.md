# @chainlink/apy-finance-test-adapter

## 0.1.14

### Patch Changes

- Updated dependencies []:
  - @chainlink/token-allocation-adapter@1.11.19

## 0.1.13

### Patch Changes

- Updated dependencies []:
  - @chainlink/token-allocation-adapter@1.11.18

## 0.1.12

### Patch Changes

- Updated dependencies []:
  - @chainlink/token-allocation-adapter@1.11.17

## 0.1.11

### Patch Changes

- [#3055](https://github.com/smartcontractkit/external-adapters-js/pull/3055) [`0f47b6639`](https://github.com/smartcontractkit/external-adapters-js/commit/0f47b663912413c83d266d95f7aa27089c0d1941) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Bumped framework version

- Updated dependencies [[`0f47b6639`](https://github.com/smartcontractkit/external-adapters-js/commit/0f47b663912413c83d266d95f7aa27089c0d1941)]:
  - @chainlink/token-allocation-adapter@1.11.16

## 0.1.10

### Patch Changes

- Updated dependencies []:
  - @chainlink/token-allocation-adapter@1.11.15

## 0.1.9

### Patch Changes

- Updated dependencies []:
  - @chainlink/token-allocation-adapter@1.11.14

## 0.1.8

### Patch Changes

- Updated dependencies []:
  - @chainlink/token-allocation-adapter@1.11.13

## 0.1.7

### Patch Changes

- Updated dependencies []:
  - @chainlink/token-allocation-adapter@1.11.12

## 0.1.6

### Patch Changes

- Updated dependencies []:
  - @chainlink/token-allocation-adapter@1.11.11

## 0.1.5

### Patch Changes

- [#2968](https://github.com/smartcontractkit/external-adapters-js/pull/2968) [`9fc4e5d04`](https://github.com/smartcontractkit/external-adapters-js/commit/9fc4e5d0457379600bcc763c20217dc2331cf941) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

- Updated dependencies [[`9fc4e5d04`](https://github.com/smartcontractkit/external-adapters-js/commit/9fc4e5d0457379600bcc763c20217dc2331cf941)]:
  - @chainlink/token-allocation-adapter@1.11.10

## 0.1.4

### Patch Changes

- [#2959](https://github.com/smartcontractkit/external-adapters-js/pull/2959) [`e7a0196e8`](https://github.com/smartcontractkit/external-adapters-js/commit/e7a0196e8a36c012d482737820b2c89e3ace0e02) Thanks [@amit-momin](https://github.com/amit-momin)! - Bumped framework version

- [#2957](https://github.com/smartcontractkit/external-adapters-js/pull/2957) [`4f17496e9`](https://github.com/smartcontractkit/external-adapters-js/commit/4f17496e90ce4e552bd73e106b5573d812f1e14c) Thanks [@alecgard](https://github.com/alecgard)! - Bumped framework version

- [#2953](https://github.com/smartcontractkit/external-adapters-js/pull/2953) [`3c304b311`](https://github.com/smartcontractkit/external-adapters-js/commit/3c304b311ed864b4bbda580bcbeb0e28bb9298bc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

- Updated dependencies [[`e7a0196e8`](https://github.com/smartcontractkit/external-adapters-js/commit/e7a0196e8a36c012d482737820b2c89e3ace0e02), [`4f17496e9`](https://github.com/smartcontractkit/external-adapters-js/commit/4f17496e90ce4e552bd73e106b5573d812f1e14c), [`3c304b311`](https://github.com/smartcontractkit/external-adapters-js/commit/3c304b311ed864b4bbda580bcbeb0e28bb9298bc)]:
  - @chainlink/token-allocation-adapter@1.11.9

## 0.1.3

### Patch Changes

- @chainlink/token-allocation-adapter@1.11.8

## 0.1.2

### Patch Changes

- @chainlink/token-allocation-adapter@1.11.7

## 0.1.1

### Patch Changes

- 011aec39e: Bumped framework version
- Updated dependencies [011aec39e]
  - @chainlink/token-allocation-adapter@1.11.6

## 0.1.0

### Minor Changes

- f0237fffc: APY.Finance: Upgrade to V3 and use Multicall.

  - Adds `apy-finance-test` EA, which is the `apy-finance` EA migrated to V3 of the EA Framework and utilising the Multicall3 contract to batch
    static contract calls.
  - As `apy-finance` is a Composite EA which makes multiple sequential requests for data, this commit also adds a new transport
    `CompositeHttpTransport` so that the EA can be implemented in the V3 framework. \* `CompositeHttpTransport` allows the EA to retain control over making the requests for data, rather than outsourcing this to the
    transport. The EA defines the request logic in the `performRequest` config parameter.
  - Also included in this commit is utilising Multicall3 to reduce the number of RPC calls from 311 to 5.
    _ This is achieved by using the Multicall3 contract (https://github.com/mds1/multicall) to batch static contract calls into a single RPC
    call.
    _ This should alleviate issues we have seen where the ~300 parallel calls to an RPC node results in requests being rate limited. This also
    has the secondary benefit that the data fetched is now guaranteed to be from the same block, whereas before the combined data could be from
    multiple blocks.

### Patch Changes

- 1a00fdfc1: Bumped framework version
- 715221438: Bumped framework version
- Updated dependencies [1a00fdfc1]
- Updated dependencies [715221438]
  - @chainlink/token-allocation-adapter@1.11.5
