# @chainlink/token-balance-adapter

## 3.2.0

### Minor Changes

- [#4020](https://github.com/smartcontractkit/external-adapters-js/pull/4020) [`2f9d34f`](https://github.com/smartcontractkit/external-adapters-js/commit/2f9d34f2139db1e4b3b6e9529e50b8135f9c4149) Thanks [@dskloetc](https://github.com/dskloetc)! - Add solana-balance endpoint

## 3.1.0

### Minor Changes

- [#4012](https://github.com/smartcontractkit/external-adapters-js/pull/4012) [`99cf756`](https://github.com/smartcontractkit/external-adapters-js/commit/99cf756b1d07493b55f98a5a527d23efd1bbdff0) Thanks [@dskloetc](https://github.com/dskloetc)! - Add xrp endpoint

### Patch Changes

- [#4010](https://github.com/smartcontractkit/external-adapters-js/pull/4010) [`d46cac7`](https://github.com/smartcontractkit/external-adapters-js/commit/d46cac7f28a517b7ba662c2c9244ae209a2185fa) Thanks [@dskloetc](https://github.com/dskloetc)! - Validate xrpl input in endpoint instead of transport

## 3.0.0

### Major Changes

- [#3965](https://github.com/smartcontractkit/external-adapters-js/pull/3965) [`ddc377c`](https://github.com/smartcontractkit/external-adapters-js/commit/ddc377c047fe2030ce67737000b2edb182cbbefd) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - USDO - Add Solana Reserves

## 2.0.1

### Patch Changes

- [#3969](https://github.com/smartcontractkit/external-adapters-js/pull/3969) [`4ea6925`](https://github.com/smartcontractkit/external-adapters-js/commit/4ea69250920f66e44e92bcb9040261a0116175c7) Thanks [@dskloetc](https://github.com/dskloetc)! - Rename an internal file

## 2.0.0

### Major Changes

- [#3946](https://github.com/smartcontractkit/external-adapters-js/pull/3946) [`50a3b70`](https://github.com/smartcontractkit/external-adapters-js/commit/50a3b70267e598627e63fab2ac56cbd9cb974985) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - Remove Withdrawal Queue

## 1.5.1

### Patch Changes

- [#3936](https://github.com/smartcontractkit/external-adapters-js/pull/3936) [`6147728`](https://github.com/smartcontractkit/external-adapters-js/commit/6147728aa69ec39fc180a11a34757d1c730ad6af) Thanks [@Fletch153](https://github.com/Fletch153)! - Bumped framework version

## 1.5.0

### Minor Changes

- [#3886](https://github.com/smartcontractkit/external-adapters-js/pull/3886) [`63a5a5f`](https://github.com/smartcontractkit/external-adapters-js/commit/63a5a5f485d38729392d88d37e4f234727c4afb6) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - Switch from using latestAnswer to latestRoundData

- [#3891](https://github.com/smartcontractkit/external-adapters-js/pull/3891) [`a955e95`](https://github.com/smartcontractkit/external-adapters-js/commit/a955e958d8f2c457506da4eb3a409728ee2077a0) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - Include USYC token for type tbill in token-balance endpoint

### Patch Changes

- [#3897](https://github.com/smartcontractkit/external-adapters-js/pull/3897) [`b7921cc`](https://github.com/smartcontractkit/external-adapters-js/commit/b7921cc4dd89f9bf510968daa0f69d5ddb3c441f) Thanks [@dskloetc](https://github.com/dskloetc)! - Log warning instead of error when XRPL_RPC_URL is not set.

## 1.4.0

### Minor Changes

- [#3869](https://github.com/smartcontractkit/external-adapters-js/pull/3869) [`7c291f5`](https://github.com/smartcontractkit/external-adapters-js/commit/7c291f59c2f3862db84f94a0208b1b5f3debc01c) Thanks [@dskloetc](https://github.com/dskloetc)! - Add XRPL endpoint. This requires setting the XRPL_RPC_URL environment variable to work.

## 1.3.1

### Patch Changes

- [#3840](https://github.com/smartcontractkit/external-adapters-js/pull/3840) [`8b08579`](https://github.com/smartcontractkit/external-adapters-js/commit/8b085790e1fcd3543ec0ea540e1915bacd998ec4) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

## 1.3.0

### Minor Changes

- [#3813](https://github.com/smartcontractkit/external-adapters-js/pull/3813) [`6b11b60`](https://github.com/smartcontractkit/external-adapters-js/commit/6b11b6099a0711973476d8f7b2ad2a73a60121fa) Thanks [@dskloetc](https://github.com/dskloetc)! - Limit concurrent RPCs made for tbill balances.

- [#3821](https://github.com/smartcontractkit/external-adapters-js/pull/3821) [`233d11d`](https://github.com/smartcontractkit/external-adapters-js/commit/233d11d88bd853825f656c9322ef2e10a3ed8660) Thanks [@dskloetc](https://github.com/dskloetc)! - Only count TBILL withdrawal queue entries for the relevant addresses

### Patch Changes

- [#3805](https://github.com/smartcontractkit/external-adapters-js/pull/3805) [`2d18954`](https://github.com/smartcontractkit/external-adapters-js/commit/2d1895428866a279ca2464f494c5c3efcece1f3b) Thanks [@renovate](https://github.com/apps/renovate)! - Update NodeJS to version 22.14.0

- [#3809](https://github.com/smartcontractkit/external-adapters-js/pull/3809) [`cf1f461`](https://github.com/smartcontractkit/external-adapters-js/commit/cf1f461401f2ee3105ff72f73c10e2d464ea3a44) Thanks [@dskloetc](https://github.com/dskloetc)! - Utility to limit concurrent contract RPCs

- [#3801](https://github.com/smartcontractkit/external-adapters-js/pull/3801) [`c40ad81`](https://github.com/smartcontractkit/external-adapters-js/commit/c40ad81e979aed773a0dda68381bacdc6bc7f1d4) Thanks [@renovate](https://github.com/apps/renovate)! - Update TypeScript version to 5.8.3

- [#3810](https://github.com/smartcontractkit/external-adapters-js/pull/3810) [`e47e08a`](https://github.com/smartcontractkit/external-adapters-js/commit/e47e08ac2b6224751d9cf486caee7964b6f58ad9) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

## 1.2.1

### Patch Changes

- [#3788](https://github.com/smartcontractkit/external-adapters-js/pull/3788) [`ef5fdd1`](https://github.com/smartcontractkit/external-adapters-js/commit/ef5fdd152d6615ed979198d05427705a6ccb6359) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

## 1.2.0

### Minor Changes

- [#3732](https://github.com/smartcontractkit/external-adapters-js/pull/3732) [`0ae0700`](https://github.com/smartcontractkit/external-adapters-js/commit/0ae07005a03447e3156b328355b8ebf8cb963529) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - OpenEden USDO PoR

### Patch Changes

- [#3739](https://github.com/smartcontractkit/external-adapters-js/pull/3739) [`6920e67`](https://github.com/smartcontractkit/external-adapters-js/commit/6920e67081583de936806af89c44e1be807fc878) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

## 1.1.0

### Minor Changes

- [#3722](https://github.com/smartcontractkit/external-adapters-js/pull/3722) [`d97b7be`](https://github.com/smartcontractkit/external-adapters-js/commit/d97b7bef892b19ecfbfcf24aebcf3d9adde1f7ba) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Version 1.0.8 and 1.0.9 introduces a bug where you must set ETHEREUM_RPC_CHAIN_ID env var to 1. This version fixed the bug now you don't have to set ETHEREUM_RPC_CHAIN_ID it will default to 1

## 1.0.9

### Patch Changes

- [#3713](https://github.com/smartcontractkit/external-adapters-js/pull/3713) [`4753dfa`](https://github.com/smartcontractkit/external-adapters-js/commit/4753dfa17038ec4f0b8041becb216dfaec9e9f3f) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

## 1.0.8

### Patch Changes

- [#3690](https://github.com/smartcontractkit/external-adapters-js/pull/3690) [`b87bad3`](https://github.com/smartcontractkit/external-adapters-js/commit/b87bad3245edf127342801e780358a5301b1581b) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Ether Fi

## 1.0.7

### Patch Changes

- [#3673](https://github.com/smartcontractkit/external-adapters-js/pull/3673) [`1e1c478`](https://github.com/smartcontractkit/external-adapters-js/commit/1e1c4785e78eeeda775b6a7630594498f60ad9bf) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - Bumped framework version

## 1.0.6

### Patch Changes

- [#3656](https://github.com/smartcontractkit/external-adapters-js/pull/3656) [`f32e247`](https://github.com/smartcontractkit/external-adapters-js/commit/f32e2477bcc37a8e37b73676616c8d9e5dce9a45) Thanks [@renovate](https://github.com/apps/renovate)! - Update Node.js to v22.13.1

- [#3564](https://github.com/smartcontractkit/external-adapters-js/pull/3564) [`3fac674`](https://github.com/smartcontractkit/external-adapters-js/commit/3fac674cfeb93f73009959ba2ea0fbf342c3c66d) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependency nock to v13.5.6

## 1.0.5

### Patch Changes

- [#3637](https://github.com/smartcontractkit/external-adapters-js/pull/3637) [`68d4356`](https://github.com/smartcontractkit/external-adapters-js/commit/68d4356abe89ae7da7e3ac302c1094ed33897417) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Add endpoint to handle JLP tokens on Solana for Solv

## 1.0.4

### Patch Changes

- [#3629](https://github.com/smartcontractkit/external-adapters-js/pull/3629) [`0bede17`](https://github.com/smartcontractkit/external-adapters-js/commit/0bede1726a01a0fc4c5831be521b974dfac79234) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version, includes fastify v4 to v5 upgrade

## 1.0.3

### Patch Changes

- [#3619](https://github.com/smartcontractkit/external-adapters-js/pull/3619) [`55df8b1`](https://github.com/smartcontractkit/external-adapters-js/commit/55df8b1867403001c5bb11339bb2244e6c219c3f) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

- [#3618](https://github.com/smartcontractkit/external-adapters-js/pull/3618) [`e30440e`](https://github.com/smartcontractkit/external-adapters-js/commit/e30440e20f06c72eb701ac539692815e77978a73) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Bumped framework version

## 1.0.2

### Patch Changes

- [#3598](https://github.com/smartcontractkit/external-adapters-js/pull/3598) [`f9a4dc2`](https://github.com/smartcontractkit/external-adapters-js/commit/f9a4dc24e77f1f5b5e967b5f2d03eb58c15ef9b2) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

- [#3595](https://github.com/smartcontractkit/external-adapters-js/pull/3595) [`8a15f40`](https://github.com/smartcontractkit/external-adapters-js/commit/8a15f408d53ccbf131e16c39faefa0ecabbe6ac7) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

## 1.0.1

### Patch Changes

- [#3585](https://github.com/smartcontractkit/external-adapters-js/pull/3585) [`46b9d57`](https://github.com/smartcontractkit/external-adapters-js/commit/46b9d5749276ee140138ddedb619e3d1c205c5e9) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - log descriptive error if ethers call fails

## 1.0.0

### Major Changes

- [#3570](https://github.com/smartcontractkit/external-adapters-js/pull/3570) [`1cd8872`](https://github.com/smartcontractkit/external-adapters-js/commit/1cd8872c70800dbcb7400756e0a336abe61d91ab) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Initial release of token-balance EA
