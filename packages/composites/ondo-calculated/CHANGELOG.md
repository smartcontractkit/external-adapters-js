# @chainlink/ondo-calculated-adapter

## 2.0.0

### Major Changes

- [#4567](https://github.com/smartcontractkit/external-adapters-js/pull/4567) [`dc405b2`](https://github.com/smartcontractkit/external-adapters-js/commit/dc405b297e07f5ad4f083466d1e9afd8b878c0b7) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Read trading session from trading hours instead of hard-coded values

  When upgrading to this version:

  1.  Point TRADING_HOURS_ADAPTER_URL to a trading hours EA with minimum version of 0.6.0
  2.  If you have DATA_ENGINE_EA_URL set, rename it to DATA_ENGINE_ADAPTER_URL
  3.  Wait for CLL's go ahead message

### Minor Changes

- [#4577](https://github.com/smartcontractkit/external-adapters-js/pull/4577) [`42f5434`](https://github.com/smartcontractkit/external-adapters-js/commit/42f5434fab7f710f7b95b450e7242309d49dcec5) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Reset internal state after in-activity

- [#4576](https://github.com/smartcontractkit/external-adapters-js/pull/4576) [`f3a5ca0`](https://github.com/smartcontractkit/external-adapters-js/commit/f3a5ca0826ae56f5b966d144b7f1274ce049b682) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Return source of session data

## 1.4.0

### Minor Changes

- [#4541](https://github.com/smartcontractkit/external-adapters-js/pull/4541) [`9406443`](https://github.com/smartcontractkit/external-adapters-js/commit/940644363ab222ec3e7ea364992e99cf2861e065) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Add EMA smoother

### Patch Changes

- [#4518](https://github.com/smartcontractkit/external-adapters-js/pull/4518) [`aceebfd`](https://github.com/smartcontractkit/external-adapters-js/commit/aceebfd801bf7e5677ffba3642bb5cbba03d4318) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Code refactor

## 1.3.0

### Minor Changes

- [#4503](https://github.com/smartcontractkit/external-adapters-js/pull/4503) [`7b04864`](https://github.com/smartcontractkit/external-adapters-js/commit/7b048642e84117f23261b5d0d9b1f21cf24e251e) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Keep internal state seperate per ticker

### Patch Changes

- [#4492](https://github.com/smartcontractkit/external-adapters-js/pull/4492) [`77b740a`](https://github.com/smartcontractkit/external-adapters-js/commit/77b740a7a2b206aeee57742b24b884c84ff34655) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Code refactor

## 1.2.0

### Minor Changes

- [#4476](https://github.com/smartcontractkit/external-adapters-js/pull/4476) [`850e204`](https://github.com/smartcontractkit/external-adapters-js/commit/850e204387f475c44ddb992fea6b335391cbf943) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Please rename DATA_ENGINE_EA_URL -> DATA_ENGINE_ADAPTER_URL, however both are supported in this version

## 1.1.0

### Minor Changes

- [#4465](https://github.com/smartcontractkit/external-adapters-js/pull/4465) [`6fa0579`](https://github.com/smartcontractkit/external-adapters-js/commit/6fa0579d08fbe4a4106e7001b40f844f87d16176) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Price smoothing

## 1.0.0

### Major Changes

- [#4455](https://github.com/smartcontractkit/external-adapters-js/pull/4455) [`83eaf39`](https://github.com/smartcontractkit/external-adapters-js/commit/83eaf39537172e393d71f6d0908cf4efe3008cd4) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Init
