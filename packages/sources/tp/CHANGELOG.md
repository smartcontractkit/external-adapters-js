# @chainlink/tp-adapter

## 1.8.5

### Patch Changes

- [#3558](https://github.com/smartcontractkit/external-adapters-js/pull/3558) [`62f0f3b`](https://github.com/smartcontractkit/external-adapters-js/commit/62f0f3b031052e808224b80f7cfce4073c967664) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

- [#3562](https://github.com/smartcontractkit/external-adapters-js/pull/3562) [`8cc19c5`](https://github.com/smartcontractkit/external-adapters-js/commit/8cc19c591a7db6764d49290c14aa8bbdb8eef54d) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

## 1.8.4

### Patch Changes

- [#3533](https://github.com/smartcontractkit/external-adapters-js/pull/3533) [`563b976`](https://github.com/smartcontractkit/external-adapters-js/commit/563b976bd699a28e42120fdbcf730a1d4b5c2db5) Thanks [@renovate](https://github.com/apps/renovate)! - Bump @types/node version

## 1.8.3

### Patch Changes

- [#3530](https://github.com/smartcontractkit/external-adapters-js/pull/3530) [`690c025`](https://github.com/smartcontractkit/external-adapters-js/commit/690c025c0a3e0863679418d26dc41c8b662978d8) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

- [#3260](https://github.com/smartcontractkit/external-adapters-js/pull/3260) [`13cfd21`](https://github.com/smartcontractkit/external-adapters-js/commit/13cfd215dcbd14c31f173bd874da36d636434627) Thanks [@renovate](https://github.com/apps/renovate)! - Bump TS version

## 1.8.2

### Patch Changes

- [#3501](https://github.com/smartcontractkit/external-adapters-js/pull/3501) [`7194e0f`](https://github.com/smartcontractkit/external-adapters-js/commit/7194e0f459a01568babe7b6ff84c7145bcba12ba) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Add XPD to includes file

## 1.8.1

### Patch Changes

- [#3480](https://github.com/smartcontractkit/external-adapters-js/pull/3480) [`13c68c5`](https://github.com/smartcontractkit/external-adapters-js/commit/13c68c550cd0131940c41eb28d2f257d68d6312c) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

## 1.8.0

### Minor Changes

- [#3461](https://github.com/smartcontractkit/external-adapters-js/pull/3461) [`f12b69f`](https://github.com/smartcontractkit/external-adapters-js/commit/f12b69f370fd24bd063105a140c6d79ed1f00fe7) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Use ICAP as metric name instead of IC

## 1.7.0

### Minor Changes

- [#3458](https://github.com/smartcontractkit/external-adapters-js/pull/3458) [`583b182`](https://github.com/smartcontractkit/external-adapters-js/commit/583b18259fd7e6ea3d68357c6887309100ec594c) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Seperate TP vs IC on dashboard

## 1.6.0

### Minor Changes

- [#3449](https://github.com/smartcontractkit/external-adapters-js/pull/3449) [`2e7c23b`](https://github.com/smartcontractkit/external-adapters-js/commit/2e7c23b72994935eaeea0c6f268eb5257ba504c4) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Combined TP and ICAP EAs into a single EA and removed ICAP.URL must have query param appended as selector in bridge URL, eg: https://<tp-ea>:8080?streamName=icapThis change will save subscription costs as all data for both DPs is sent on 1 WS connection and each additional connection requires additional subscriptions (and cost).Should be backwards compatible for TP ONLY

## 1.5.1

### Patch Changes

- [#3436](https://github.com/smartcontractkit/external-adapters-js/pull/3436) [`9a4d510`](https://github.com/smartcontractkit/external-adapters-js/commit/9a4d510dff13669760a91738dbe7df524f077483) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.5.0

### Minor Changes

- [#3417](https://github.com/smartcontractkit/external-adapters-js/pull/3417) [`0496a7f`](https://github.com/smartcontractkit/external-adapters-js/commit/0496a7feaf701cff7c8c92052dffc45e36910bc2) Thanks [@martin-cll](https://github.com/martin-cll)! - Enable full symbol override

### Patch Changes

- [#3419](https://github.com/smartcontractkit/external-adapters-js/pull/3419) [`8958e04`](https://github.com/smartcontractkit/external-adapters-js/commit/8958e04d4aae22fbe5b66b920f91a3bda7f4b454) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Add mapping comment

- [#3415](https://github.com/smartcontractkit/external-adapters-js/pull/3415) [`8d83d60`](https://github.com/smartcontractkit/external-adapters-js/commit/8d83d60953e04b1f797f21f1504a3976ea0a4f36) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

## 1.4.12

### Patch Changes

- [#3383](https://github.com/smartcontractkit/external-adapters-js/pull/3383) [`db9ac3b`](https://github.com/smartcontractkit/external-adapters-js/commit/db9ac3ba972d8e088b59c26d32d69cd6c9d97d01) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Fix ICAP cache TTL refresh on heartbeat bug

## 1.4.11

### Patch Changes

- [#3372](https://github.com/smartcontractkit/external-adapters-js/pull/3372) [`d08f378`](https://github.com/smartcontractkit/external-adapters-js/commit/d08f378e44e3f9587861421066163325c621d150) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

## 1.4.10

### Patch Changes

- [#3350](https://github.com/smartcontractkit/external-adapters-js/pull/3350) [`6518e4d`](https://github.com/smartcontractkit/external-adapters-js/commit/6518e4dc6baca3c6289c595e29d48e149824054d) Thanks [@austinborn](https://github.com/austinborn)! - Bumped framework version

## 1.4.9

### Patch Changes

- [#3344](https://github.com/smartcontractkit/external-adapters-js/pull/3344) [`9f98cbf`](https://github.com/smartcontractkit/external-adapters-js/commit/9f98cbf6f7418d563f7165e97748680ec6b82b58) Thanks [@mjk90](https://github.com/mjk90)! - Bumped framework version

## 1.4.8

### Patch Changes

- [#3324](https://github.com/smartcontractkit/external-adapters-js/pull/3324) [`459c6f2`](https://github.com/smartcontractkit/external-adapters-js/commit/459c6f22acc97fb741d13a342a6aae68d6e63480) Thanks [@alecgard](https://github.com/alecgard)! - Bumped framework version

## 1.4.7

### Patch Changes

- [#3263](https://github.com/smartcontractkit/external-adapters-js/pull/3263) [`ec4f2aa`](https://github.com/smartcontractkit/external-adapters-js/commit/ec4f2aad68d478f5cc133608d89f15e2847688a5) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.4.6

### Patch Changes

- [#3241](https://github.com/smartcontractkit/external-adapters-js/pull/3241) [`ebb0af9`](https://github.com/smartcontractkit/external-adapters-js/commit/ebb0af92e5912ff9f069d9f4ed3c1238aef3e1b0) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.4.5

### Patch Changes

- [#3233](https://github.com/smartcontractkit/external-adapters-js/pull/3233) [`e95cbbe`](https://github.com/smartcontractkit/external-adapters-js/commit/e95cbbe59ddc286d59db6d5f95f8591c256fb2e0) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.4.4

### Patch Changes

- [#3210](https://github.com/smartcontractkit/external-adapters-js/pull/3210) [`1fb155a`](https://github.com/smartcontractkit/external-adapters-js/commit/1fb155a791512a7786fe5239901a5c66bc1afbd9) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Add support for cache TTL refresh on heartbeat messages

## 1.4.3

### Patch Changes

- [#3209](https://github.com/smartcontractkit/external-adapters-js/pull/3209) [`4724c2e`](https://github.com/smartcontractkit/external-adapters-js/commit/4724c2e421755be8fa4ad8277a0c403a6899babc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.4.2

### Patch Changes

- [#3144](https://github.com/smartcontractkit/external-adapters-js/pull/3144) [`0ba803f66`](https://github.com/smartcontractkit/external-adapters-js/commit/0ba803f667fd4a52678bfca48d37aa8b44d5139d) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - set inverse:false for XAU, XAG, XPT

## 1.4.1

### Patch Changes

- [#3130](https://github.com/smartcontractkit/external-adapters-js/pull/3130) [`45038be71`](https://github.com/smartcontractkit/external-adapters-js/commit/45038be71ca433291229324174c50023b2513afc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.4.0

### Minor Changes

- [#3127](https://github.com/smartcontractkit/external-adapters-js/pull/3127) [`fa78cc773`](https://github.com/smartcontractkit/external-adapters-js/commit/fa78cc773dbe01d75cdb3cb69c00fec0cede2da5) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - Support inverse for XPT

## 1.3.0

### Minor Changes

- [#3112](https://github.com/smartcontractkit/external-adapters-js/pull/3112) [`e614829b4`](https://github.com/smartcontractkit/external-adapters-js/commit/e614829b4bb2d919b8e14c5f97233bc4655ede1d) Thanks [@alecgard](https://github.com/alecgard)! - Add XAU and DAG inverse config

## 1.2.2

### Patch Changes

- [#3090](https://github.com/smartcontractkit/external-adapters-js/pull/3090) [`a1c6726d9`](https://github.com/smartcontractkit/external-adapters-js/commit/a1c6726d9fc51ec1cf6f19e9152d5741493e1ed4) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Add generated known issues section to readme

## 1.2.1

### Patch Changes

- [#3055](https://github.com/smartcontractkit/external-adapters-js/pull/3055) [`0f47b6639`](https://github.com/smartcontractkit/external-adapters-js/commit/0f47b663912413c83d266d95f7aa27089c0d1941) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Bumped framework version

## 1.2.0

### Minor Changes

- [#3000](https://github.com/smartcontractkit/external-adapters-js/pull/3000) [`e5743fc20`](https://github.com/smartcontractkit/external-adapters-js/commit/e5743fc2031b309e4bf6cb9ceb1d52f7ea06386d) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - fix on JPY/USD - returning 100x the expected value. Implement inverse.

## 1.1.13

### Patch Changes

- [#2967](https://github.com/smartcontractkit/external-adapters-js/pull/2967) [`a7c807fc6`](https://github.com/smartcontractkit/external-adapters-js/commit/a7c807fc6ce96059c1324381ea75417872849d30) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Add examples to input parameters

## 1.1.12

### Patch Changes

- [#2968](https://github.com/smartcontractkit/external-adapters-js/pull/2968) [`9fc4e5d04`](https://github.com/smartcontractkit/external-adapters-js/commit/9fc4e5d0457379600bcc763c20217dc2331cf941) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.1.11

### Patch Changes

- [#2959](https://github.com/smartcontractkit/external-adapters-js/pull/2959) [`e7a0196e8`](https://github.com/smartcontractkit/external-adapters-js/commit/e7a0196e8a36c012d482737820b2c89e3ace0e02) Thanks [@amit-momin](https://github.com/amit-momin)! - Bumped framework version

- [#2957](https://github.com/smartcontractkit/external-adapters-js/pull/2957) [`4f17496e9`](https://github.com/smartcontractkit/external-adapters-js/commit/4f17496e90ce4e552bd73e106b5573d812f1e14c) Thanks [@alecgard](https://github.com/alecgard)! - Bumped framework version

- [#2953](https://github.com/smartcontractkit/external-adapters-js/pull/2953) [`3c304b311`](https://github.com/smartcontractkit/external-adapters-js/commit/3c304b311ed864b4bbda580bcbeb0e28bb9298bc) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Bumped framework version

## 1.1.10

### Patch Changes

- 011aec39e: Bumped framework version

## 1.1.9

### Patch Changes

- 1a00fdfc1: Bumped framework version
- 715221438: Bumped framework version

## 1.1.8

### Patch Changes

- eff4c4cf5: Bumped framework version
- 14a549217: Bumped framework version. Replaced PriceEndpoint with ForexPriceEndpoint for relevant endpoints

## 1.1.7

### Patch Changes

- 244e02abf: Refactored file structure

## 1.1.6

### Patch Changes

- 862ed8d89: Removed unused dependencies

## 1.1.5

### Patch Changes

- cc0d39064: Bumped framework version
- fb1b11b77: Bumped framework version

## 1.1.4

### Patch Changes

- bfa201d6d: Bumped framework version
- bfa201d6d: Bumped framework version
- c600ca386: Upgrade typescript version to 5.0.4
- bfa201d6d: Bumped framework version

## 1.1.3

### Patch Changes

- 9bcb13c90: Bumped framework version

## 1.1.2

### Patch Changes

- 31af84e69: Bumped framework version

## 1.1.1

### Patch Changes

- 77ad946a9: Bumped framework version

## 1.1.0

### Minor Changes

- 90b5ae406: Update WS_API_ENDPOINT for TP and ICAP EAs

### Patch Changes

- 4245b4d8b: Bumped framework version

## 1.0.0

### Major Changes

- 9fb3f4584: TP EA release
