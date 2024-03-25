# @chainlink/eth-beacon-adapter

## 2.0.9

### Patch Changes

- [#3233](https://github.com/smartcontractkit/external-adapters-js/pull/3233) [`e95cbbe`](https://github.com/smartcontractkit/external-adapters-js/commit/e95cbbe59ddc286d59db6d5f95f8591c256fb2e0) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 2.0.8

### Patch Changes

- [#3209](https://github.com/smartcontractkit/external-adapters-js/pull/3209) [`4724c2e`](https://github.com/smartcontractkit/external-adapters-js/commit/4724c2e421755be8fa4ad8277a0c403a6899babc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 2.0.7

### Patch Changes

- [#3178](https://github.com/smartcontractkit/external-adapters-js/pull/3178) [`eeff213`](https://github.com/smartcontractkit/external-adapters-js/commit/eeff213c555b0bb401afa6a8ef252861a490be25) Thanks [@amit-momin](https://github.com/amit-momin)! - Added env var default override to set MAX_PAYLOAD_SIZE_LIMIT to 5MB

## 2.0.6

### Patch Changes

- [#3130](https://github.com/smartcontractkit/external-adapters-js/pull/3130) [`45038be71`](https://github.com/smartcontractkit/external-adapters-js/commit/45038be71ca433291229324174c50023b2513afc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 2.0.5

### Patch Changes

- [#3055](https://github.com/smartcontractkit/external-adapters-js/pull/3055) [`0f47b6639`](https://github.com/smartcontractkit/external-adapters-js/commit/0f47b663912413c83d266d95f7aa27089c0d1941) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Bumped framework version

## 2.0.4

### Patch Changes

- [#2967](https://github.com/smartcontractkit/external-adapters-js/pull/2967) [`a7c807fc6`](https://github.com/smartcontractkit/external-adapters-js/commit/a7c807fc6ce96059c1324381ea75417872849d30) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Add examples to input parameters

## 2.0.3

### Patch Changes

- [#2968](https://github.com/smartcontractkit/external-adapters-js/pull/2968) [`9fc4e5d04`](https://github.com/smartcontractkit/external-adapters-js/commit/9fc4e5d0457379600bcc763c20217dc2331cf941) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 2.0.2

### Patch Changes

- [#2959](https://github.com/smartcontractkit/external-adapters-js/pull/2959) [`e7a0196e8`](https://github.com/smartcontractkit/external-adapters-js/commit/e7a0196e8a36c012d482737820b2c89e3ace0e02) Thanks [@amit-momin](https://github.com/amit-momin)! - Bumped framework version

- [#2957](https://github.com/smartcontractkit/external-adapters-js/pull/2957) [`4f17496e9`](https://github.com/smartcontractkit/external-adapters-js/commit/4f17496e90ce4e552bd73e106b5573d812f1e14c) Thanks [@alecgard](https://github.com/alecgard)! - Bumped framework version

- [#2953](https://github.com/smartcontractkit/external-adapters-js/pull/2953) [`3c304b311`](https://github.com/smartcontractkit/external-adapters-js/commit/3c304b311ed864b4bbda580bcbeb0e28bb9298bc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 2.0.1

### Patch Changes

- 737c6d094: Cleaned up tsconfig
- f743aabb6: Add validation for 'addresses' input param

## 2.0.0

### Major Changes

- 2f72e4178: Upgraded adapter from v2 to v3 framework

### Patch Changes

- 1b0d1a84e: Added sleep to background execute to limit request processing
- aa2d3e74c: Fixed response providerDataRequestedUnixMs timestamp value

## 1.5.1

### Patch Changes

- 3caaea024: Refactored batch skipping logic.

## 1.5.0

### Minor Changes

- a574dbc4a: Added way to configure adapter to skip validator batching. Set BATCH_SIZE to 0.

## 1.4.0

### Minor Changes

- 4f4ca79e1: Added optional feature to search deposit events for validators in limbo

### Patch Changes

- bda124176: Added adjustable request grouping to reduce load on the beacon client

## 1.3.7

### Patch Changes

- c600ca386: Upgrade typescript version to 5.0.4
- Updated dependencies [c600ca386]
  - @chainlink/ea-bootstrap@2.27.1
  - @chainlink/ea-test-helpers@1.4.3

## 1.3.6

### Patch Changes

- Updated dependencies [3dc13a0bc]
  - @chainlink/ea-bootstrap@2.27.0
  - @chainlink/ea-test-helpers@1.4.2

## 1.3.5

### Patch Changes

- Updated dependencies [2fdaa5aa4]
  - @chainlink/ea-bootstrap@2.26.1
  - @chainlink/ea-test-helpers@1.4.2

## 1.3.4

### Patch Changes

- 65014014d: Upgraded typescript version to 4.9.5
- Updated dependencies [b29509be0]
- Updated dependencies [65014014d]
  - @chainlink/ea-bootstrap@2.26.0
  - @chainlink/ea-test-helpers@1.4.2

## 1.3.3

### Patch Changes

- Updated dependencies [838c9d927]
  - @chainlink/ea-bootstrap@2.25.2
  - @chainlink/ea-test-helpers@1.4.1

## 1.3.2

### Patch Changes

- Updated dependencies [0719f739b]
  - @chainlink/ea-bootstrap@2.25.1
  - @chainlink/ea-test-helpers@1.4.1

## 1.3.1

### Patch Changes

- f6821df3e: Populate results for filtered addresses with 0 balance

## 1.3.0

### Minor Changes

- fc46b78fc: Added smarter batching to improve performance

### Patch Changes

- Updated dependencies [fc46b78fc]
- Updated dependencies [1de0689c6]
  - @chainlink/ea-bootstrap@2.25.0
  - @chainlink/ea-test-helpers@1.4.1

## 1.2.0

### Minor Changes

- 9c52f1b52: When queried with status, invalid validators return a 0 balance instead of erroring

## 1.1.8

### Patch Changes

- Updated dependencies [e8576df4e]
- Updated dependencies [842651f93]
  - @chainlink/ea-bootstrap@2.24.0
  - @chainlink/ea-test-helpers@1.4.1

## 1.1.7

### Patch Changes

- Updated dependencies [13eb04f5a]
- Updated dependencies [221ab1e5f]
  - @chainlink/ea-bootstrap@2.23.0
  - @chainlink/ea-test-helpers@1.4.1

## 1.1.6

### Patch Changes

- Updated dependencies [572b89314]
- Updated dependencies [068dd3672]
  - @chainlink/ea-bootstrap@2.22.2
  - @chainlink/ea-test-helpers@1.4.1

## 1.1.5

### Patch Changes

- Updated dependencies [26b046b1e]
  - @chainlink/ea-bootstrap@2.22.1
  - @chainlink/ea-test-helpers@1.4.1

## 1.1.4

### Patch Changes

- Updated dependencies [b8061e1d5]
  - @chainlink/ea-bootstrap@2.22.0
  - @chainlink/ea-test-helpers@1.4.1

## 1.1.3

### Patch Changes

- Updated dependencies [3c1a320b5]
  - @chainlink/ea-bootstrap@2.21.0
  - @chainlink/ea-test-helpers@1.4.1

## 1.1.2

### Patch Changes

- Updated dependencies [b9982adc8]
- Updated dependencies [f710272c6]
- Updated dependencies [991fc76af]
  - @chainlink/ea-bootstrap@2.20.0
  - @chainlink/ea-test-helpers@1.4.1

## 1.1.1

### Patch Changes

- 0c98ad38b: Remove input vs. output length check

## 1.1.0

### Minor Changes

- 35fd235d5: Update Proof of Reserves to support Stader

## 1.0.0

### Major Changes

- 80d8170a5: Initial release

### Patch Changes

- Updated dependencies [5e7393deb]
- Updated dependencies [5e7393deb]
  - @chainlink/ea-bootstrap@2.19.3
  - @chainlink/ea-test-helpers@1.4.1
