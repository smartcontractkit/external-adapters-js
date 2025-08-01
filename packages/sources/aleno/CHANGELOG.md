# @chainlink/aleno-adapter

## 2.1.4

### Patch Changes

- [#3936](https://github.com/smartcontractkit/external-adapters-js/pull/3936) [`6147728`](https://github.com/smartcontractkit/external-adapters-js/commit/6147728aa69ec39fc180a11a34757d1c730ad6af) Thanks [@Fletch153](https://github.com/Fletch153)! - Bumped framework version

## 2.1.3

### Patch Changes

- [#3835](https://github.com/smartcontractkit/external-adapters-js/pull/3835) [`e3a12d8`](https://github.com/smartcontractkit/external-adapters-js/commit/e3a12d8d3b89c37dd3f217378ad07856c0d17d5b) Thanks [@dskloetc](https://github.com/dskloetc)! - Remove unused config variable API_ENDPOINT.

- [#3840](https://github.com/smartcontractkit/external-adapters-js/pull/3840) [`8b08579`](https://github.com/smartcontractkit/external-adapters-js/commit/8b085790e1fcd3543ec0ea540e1915bacd998ec4) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

## 2.1.2

### Patch Changes

- [#3805](https://github.com/smartcontractkit/external-adapters-js/pull/3805) [`2d18954`](https://github.com/smartcontractkit/external-adapters-js/commit/2d1895428866a279ca2464f494c5c3efcece1f3b) Thanks [@renovate](https://github.com/apps/renovate)! - Update NodeJS to version 22.14.0

- [#3820](https://github.com/smartcontractkit/external-adapters-js/pull/3820) [`9aac776`](https://github.com/smartcontractkit/external-adapters-js/commit/9aac77624c45153c21febeb38e5112de70f87a0b) Thanks [@dskloetc](https://github.com/dskloetc)! - Log confirmedSubscriptions properly

- [#3819](https://github.com/smartcontractkit/external-adapters-js/pull/3819) [`a84ca7f`](https://github.com/smartcontractkit/external-adapters-js/commit/a84ca7f22e057836e354613bdedc2d4eb19c5a9b) Thanks [@dskloetc](https://github.com/dskloetc)! - Bug fix: Recreate subscriptions after reconnecting

- [#3801](https://github.com/smartcontractkit/external-adapters-js/pull/3801) [`c40ad81`](https://github.com/smartcontractkit/external-adapters-js/commit/c40ad81e979aed773a0dda68381bacdc6bc7f1d4) Thanks [@renovate](https://github.com/apps/renovate)! - Update TypeScript version to 5.8.3

- [#3810](https://github.com/smartcontractkit/external-adapters-js/pull/3810) [`e47e08a`](https://github.com/smartcontractkit/external-adapters-js/commit/e47e08ac2b6224751d9cf486caee7964b6f58ad9) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

## 2.1.1

### Patch Changes

- [#3788](https://github.com/smartcontractkit/external-adapters-js/pull/3788) [`ef5fdd1`](https://github.com/smartcontractkit/external-adapters-js/commit/ef5fdd152d6615ed979198d05427705a6ccb6359) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

## 2.1.0

### Minor Changes

- [#3754](https://github.com/smartcontractkit/external-adapters-js/pull/3754) [`67df1a7`](https://github.com/smartcontractkit/external-adapters-js/commit/67df1a783fb7e21ee5589b7651f9c63689cc122f) Thanks [@dskloetc](https://github.com/dskloetc)! - Remove REST transport. Will fall back to SocketIO transport even if REST is requested.

## 2.0.0

### Major Changes

- [#3728](https://github.com/smartcontractkit/external-adapters-js/pull/3728) [`0c2f278`](https://github.com/smartcontractkit/external-adapters-js/commit/0c2f278e486d7da630c1b41356e35038e1bf697b) Thanks [@dskloetc](https://github.com/dskloetc)! - Subscribe and unsubscribe to assets on-demand. This requires using a different value for `WS_API_ENDPOINT`: "https://state-price-socket.aleno.ai" instead of "https://ws-state-price.aleno.ai". The default value has been changed but users who set this value explicitly will have to change it.

### Patch Changes

- [#3739](https://github.com/smartcontractkit/external-adapters-js/pull/3739) [`6920e67`](https://github.com/smartcontractkit/external-adapters-js/commit/6920e67081583de936806af89c44e1be807fc878) Thanks [@dskloetc](https://github.com/dskloetc)! - Bumped framework version

## 1.1.1

### Patch Changes

- [#3725](https://github.com/smartcontractkit/external-adapters-js/pull/3725) [`93e165f`](https://github.com/smartcontractkit/external-adapters-js/commit/93e165fdad43a92de0a57a2b54a763e97322e80b) Thanks [@dskloetc](https://github.com/dskloetc)! - Change type definition of ResponseSchema to match API

## 1.1.0

### Minor Changes

- [#3719](https://github.com/smartcontractkit/external-adapters-js/pull/3719) [`3a472a9`](https://github.com/smartcontractkit/external-adapters-js/commit/3a472a95b7c84f1f645f101e3cf1a39279a8c2c1) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Update route to use standard ws

## 1.0.6

### Patch Changes

- [#3713](https://github.com/smartcontractkit/external-adapters-js/pull/3713) [`4753dfa`](https://github.com/smartcontractkit/external-adapters-js/commit/4753dfa17038ec4f0b8041becb216dfaec9e9f3f) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

## 1.0.5

### Patch Changes

- [#3673](https://github.com/smartcontractkit/external-adapters-js/pull/3673) [`1e1c478`](https://github.com/smartcontractkit/external-adapters-js/commit/1e1c4785e78eeeda775b6a7630594498f60ad9bf) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - Bumped framework version

## 1.0.4

### Patch Changes

- [#3656](https://github.com/smartcontractkit/external-adapters-js/pull/3656) [`f32e247`](https://github.com/smartcontractkit/external-adapters-js/commit/f32e2477bcc37a8e37b73676616c8d9e5dce9a45) Thanks [@renovate](https://github.com/apps/renovate)! - Update Node.js to v22.13.1

- [#3564](https://github.com/smartcontractkit/external-adapters-js/pull/3564) [`3fac674`](https://github.com/smartcontractkit/external-adapters-js/commit/3fac674cfeb93f73009959ba2ea0fbf342c3c66d) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependency nock to v13.5.6

## 1.0.3

### Patch Changes

- [#3629](https://github.com/smartcontractkit/external-adapters-js/pull/3629) [`0bede17`](https://github.com/smartcontractkit/external-adapters-js/commit/0bede1726a01a0fc4c5831be521b974dfac79234) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version, includes fastify v4 to v5 upgrade

## 1.0.2

### Patch Changes

- [#3619](https://github.com/smartcontractkit/external-adapters-js/pull/3619) [`55df8b1`](https://github.com/smartcontractkit/external-adapters-js/commit/55df8b1867403001c5bb11339bb2244e6c219c3f) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

- [#3618](https://github.com/smartcontractkit/external-adapters-js/pull/3618) [`e30440e`](https://github.com/smartcontractkit/external-adapters-js/commit/e30440e20f06c72eb701ac539692815e77978a73) Thanks [@mmcallister-cll](https://github.com/mmcallister-cll)! - Bumped framework version

## 1.0.1

### Patch Changes

- [#3598](https://github.com/smartcontractkit/external-adapters-js/pull/3598) [`f9a4dc2`](https://github.com/smartcontractkit/external-adapters-js/commit/f9a4dc24e77f1f5b5e967b5f2d03eb58c15ef9b2) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

- [#3595](https://github.com/smartcontractkit/external-adapters-js/pull/3595) [`8a15f40`](https://github.com/smartcontractkit/external-adapters-js/commit/8a15f408d53ccbf131e16c39faefa0ecabbe6ac7) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bumped framework version

## 1.0.0

### Major Changes

- [#3571](https://github.com/smartcontractkit/external-adapters-js/pull/3571) [`b7bd1ca`](https://github.com/smartcontractkit/external-adapters-js/commit/b7bd1ca4abfff356a633e4de5226228207da170c) Thanks [@Subarna-Singh](https://github.com/Subarna-Singh)! - Aleno Base State Adapter
