# @chainlink/gold-adapter

## 1.3.2

### Patch Changes

- Updated dependencies [[`8ce9820`](https://github.com/smartcontractkit/external-adapters-js/commit/8ce9820f7043b5ea503b7e9dec88c3cc917c05e1)]:
  - @chainlink/data-engine-adapter@1.5.0

## 1.3.1

### Patch Changes

- [#5030](https://github.com/smartcontractkit/external-adapters-js/pull/5030) [`d9b1620`](https://github.com/smartcontractkit/external-adapters-js/commit/d9b1620f9b26ca07ebc38f8d427c42558f200226) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

- [#4970](https://github.com/smartcontractkit/external-adapters-js/pull/4970) [`70fbfdb`](https://github.com/smartcontractkit/external-adapters-js/commit/70fbfdb141092faf3d9e04a84b071dc268a26d15) Thanks [@mohamed-mehany](https://github.com/mohamed-mehany)! - Add generic getFeedData function that auto-detects report version from feedId and routes to the correct endpoint, enabling V11 support in glv-token and gmx-tokens adapters

- Updated dependencies [[`d9b1620`](https://github.com/smartcontractkit/external-adapters-js/commit/d9b1620f9b26ca07ebc38f8d427c42558f200226), [`70fbfdb`](https://github.com/smartcontractkit/external-adapters-js/commit/70fbfdb141092faf3d9e04a84b071dc268a26d15)]:
  - @chainlink/data-engine-adapter@1.4.0

## 1.3.0

### Minor Changes

- [#4867](https://github.com/smartcontractkit/external-adapters-js/pull/4867) [`62aafe1`](https://github.com/smartcontractkit/external-adapters-js/commit/62aafe1ce5aa1b5c9504772589202c5045afe68d) Thanks [@dskloetc](https://github.com/dskloetc)! - Change default deviation cap

## 1.2.2

### Patch Changes

- Updated dependencies [[`8896a3e`](https://github.com/smartcontractkit/external-adapters-js/commit/8896a3ee432046f1ea6c0266d54a280c4b89cf12), [`d1e26b8`](https://github.com/smartcontractkit/external-adapters-js/commit/d1e26b8437792b971b905746fe74b3ad0e2fe6cb)]:
  - @chainlink/data-engine-adapter@1.3.0

## 1.2.1

### Patch Changes

- [#4622](https://github.com/smartcontractkit/external-adapters-js/pull/4622) [`8488e03`](https://github.com/smartcontractkit/external-adapters-js/commit/8488e033e8783383b0a25d440b89b6e5d6d470b4) Thanks [@johnnymugs](https://github.com/johnnymugs)! - Bumped framework version

- Updated dependencies [[`8488e03`](https://github.com/smartcontractkit/external-adapters-js/commit/8488e033e8783383b0a25d440b89b6e5d6d470b4), [`6849d0b`](https://github.com/smartcontractkit/external-adapters-js/commit/6849d0b0d6f6a1292c60ca0890467dd0c8279a23)]:
  - @chainlink/data-engine-adapter@1.2.0

## 1.2.0

### Minor Changes

- [#4675](https://github.com/smartcontractkit/external-adapters-js/pull/4675) [`543bb3b`](https://github.com/smartcontractkit/external-adapters-js/commit/543bb3ba7889e83696a720bdffeb358624063e44) Thanks [@dskloetc](https://github.com/dskloetc)! - Guard against XAU price changing when the market is closed

## 1.1.0

### Minor Changes

- [#4645](https://github.com/smartcontractkit/external-adapters-js/pull/4645) [`e4a80f1`](https://github.com/smartcontractkit/external-adapters-js/commit/e4a80f163d06903ee8d6c6e49beee4b95a680a1b) Thanks [@dskloetc](https://github.com/dskloetc)! - Change default smoothing parameter from 1000 to 500 seconds.

### Patch Changes

- [#4598](https://github.com/smartcontractkit/external-adapters-js/pull/4598) [`14788ce`](https://github.com/smartcontractkit/external-adapters-js/commit/14788cecd69a8655f95b1af159fcbfae2d30b9fc) Thanks [@Fletch153](https://github.com/Fletch153)! - Bumped framework version

- Updated dependencies [[`14788ce`](https://github.com/smartcontractkit/external-adapters-js/commit/14788cecd69a8655f95b1af159fcbfae2d30b9fc)]:
  - @chainlink/data-engine-adapter@1.1.2

## 1.0.0

### Major Changes

- [#4630](https://github.com/smartcontractkit/external-adapters-js/pull/4630) [`3eafcef`](https://github.com/smartcontractkit/external-adapters-js/commit/3eafcefd100adbd877b5bd62babfd0ad47ccab9f) Thanks [@dskloetc](https://github.com/dskloetc)! - Initial implementation of gold adapter
