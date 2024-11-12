# @chainlink/layer2-sequencer-health-adapter

## 4.5.2

### Patch Changes

- [#3533](https://github.com/smartcontractkit/external-adapters-js/pull/3533) [`563b976`](https://github.com/smartcontractkit/external-adapters-js/commit/563b976bd699a28e42120fdbcf730a1d4b5c2db5) Thanks [@renovate](https://github.com/apps/renovate)! - Bump @types/node version

- [#3534](https://github.com/smartcontractkit/external-adapters-js/pull/3534) [`d8023b9`](https://github.com/smartcontractkit/external-adapters-js/commit/d8023b911fd37ccdc2b41788b072fb9c875fff31) Thanks [@renovate](https://github.com/apps/renovate)! - Bump nock

- Updated dependencies [[`563b976`](https://github.com/smartcontractkit/external-adapters-js/commit/563b976bd699a28e42120fdbcf730a1d4b5c2db5), [`d8023b9`](https://github.com/smartcontractkit/external-adapters-js/commit/d8023b911fd37ccdc2b41788b072fb9c875fff31), [`876b8ba`](https://github.com/smartcontractkit/external-adapters-js/commit/876b8ba9472009f843076d3d25588b6c89bd489c)]:
  - @chainlink/ea-test-helpers@1.4.5
  - @chainlink/ea-bootstrap@2.29.2

## 4.5.1

### Patch Changes

- [#3260](https://github.com/smartcontractkit/external-adapters-js/pull/3260) [`13cfd21`](https://github.com/smartcontractkit/external-adapters-js/commit/13cfd215dcbd14c31f173bd874da36d636434627) Thanks [@renovate](https://github.com/apps/renovate)! - Bump TS version

- Updated dependencies [[`13cfd21`](https://github.com/smartcontractkit/external-adapters-js/commit/13cfd215dcbd14c31f173bd874da36d636434627), [`056ca36`](https://github.com/smartcontractkit/external-adapters-js/commit/056ca36cc51772f3e0cda1db8d6edd7e4a333db6)]:
  - @chainlink/ea-test-helpers@1.4.4
  - @chainlink/ea-bootstrap@2.29.1

## 4.5.0

### Minor Changes

- [#3506](https://github.com/smartcontractkit/external-adapters-js/pull/3506) [`9cb8367`](https://github.com/smartcontractkit/external-adapters-js/commit/9cb8367d566a7540c36e4a2133dea5aad27bf212) Thanks [@cawthorne](https://github.com/cawthorne)! - Include source EA name in composite EA response.

  Also updates CVI, BLOCKDAEMON and L2_SEQUENCER_HEALTH EA names for telemetry compatibility reasons.

### Patch Changes

- [#3490](https://github.com/smartcontractkit/external-adapters-js/pull/3490) [`c5b2ce9`](https://github.com/smartcontractkit/external-adapters-js/commit/c5b2ce9d5ee154a089058dac394418fc884e20f3) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Upgrade starknet

- Updated dependencies [[`9cb8367`](https://github.com/smartcontractkit/external-adapters-js/commit/9cb8367d566a7540c36e4a2133dea5aad27bf212)]:
  - @chainlink/ea-bootstrap@2.29.0
  - @chainlink/ea-test-helpers@1.4.3

## 4.4.1

### Patch Changes

- Updated dependencies [[`13c68c5`](https://github.com/smartcontractkit/external-adapters-js/commit/13c68c550cd0131940c41eb28d2f257d68d6312c), [`78f9b06`](https://github.com/smartcontractkit/external-adapters-js/commit/78f9b0664d96551f6a239951c60d4a907ddfe0d9), [`2c75000`](https://github.com/smartcontractkit/external-adapters-js/commit/2c7500055fa2e736fee811896723f297f8faf60e)]:
  - @chainlink/ea-bootstrap@2.28.0
  - @chainlink/ea-test-helpers@1.4.3

## 4.4.0

### Minor Changes

- [#3405](https://github.com/smartcontractkit/external-adapters-js/pull/3405) [`f0ae649`](https://github.com/smartcontractkit/external-adapters-js/commit/f0ae6491033e1913c1eb683c36a6b1903749194b) Thanks [@mohamed-mehany](https://github.com/mohamed-mehany)! - Adds L2EP support for zkSync chain

## 4.3.0

### Minor Changes

- [#3331](https://github.com/smartcontractkit/external-adapters-js/pull/3331) [`72dc80b`](https://github.com/smartcontractkit/external-adapters-js/commit/72dc80b106761d08fc4329d55b2516509d44b227) Thanks [@KodeyThomas](https://github.com/KodeyThomas)! - Adds Scroll Healthcheck endpoint

## 4.2.0

### Minor Changes

- [#3302](https://github.com/smartcontractkit/external-adapters-js/pull/3302) [`1d7c2e8`](https://github.com/smartcontractkit/external-adapters-js/commit/1d7c2e8455f1e209eb411c6b14097dfb1fa992db) Thanks [@mohamed-mehany](https://github.com/mohamed-mehany)! - Refactors L2EP EA logic to include chain specific delta values

## 4.1.0

### Minor Changes

- [#3273](https://github.com/smartcontractkit/external-adapters-js/pull/3273) [`38be814`](https://github.com/smartcontractkit/external-adapters-js/commit/38be8149a31628d25e84daa41d3af9f25622439f) Thanks [@mohamed-mehany](https://github.com/mohamed-mehany)! - Updates Metis healthcheck endpoint

## 4.0.0

### Major Changes

- [#3170](https://github.com/smartcontractkit/external-adapters-js/pull/3170) [`5681441`](https://github.com/smartcontractkit/external-adapters-js/commit/568144119651ffc5f016f1c25dc99b819e283236) Thanks [@chris-de-leon-cll](https://github.com/chris-de-leon-cll)! - Bumps starknet.js to latest 6.x beta version
  Adds starknet RPC support
  Deprecates starknet sequencer and gateway URLs
  Updates error handling for starknet empty transaction health check

### Patch Changes

- [#3205](https://github.com/smartcontractkit/external-adapters-js/pull/3205) [`a3303c5`](https://github.com/smartcontractkit/external-adapters-js/commit/a3303c5c0b7f2e97bd7e07f805ca7ecd14f72cee) Thanks [@mohamed-mehany](https://github.com/mohamed-mehany)! - Removes Optimism healthcheck endpoint

- Updated dependencies [[`efb5b9c`](https://github.com/smartcontractkit/external-adapters-js/commit/efb5b9cd2d4f4deeb967584b38b3e8d211884d0e)]:
  - @chainlink/ea-bootstrap@2.27.2
  - @chainlink/ea-test-helpers@1.4.3

## 3.0.0

### Major Changes

- [#3153](https://github.com/smartcontractkit/external-adapters-js/pull/3153) [`b1bfa12b3`](https://github.com/smartcontractkit/external-adapters-js/commit/b1bfa12b36b5ce66631a440127e18ca497ce7df5) Thanks [@mohamed-mehany](https://github.com/mohamed-mehany)! - Disable empty transaction check for Arbitrum and Metis

## 2.7.0

### Minor Changes

- [#3108](https://github.com/smartcontractkit/external-adapters-js/pull/3108) [`2ead0dc48`](https://github.com/smartcontractkit/external-adapters-js/commit/2ead0dc48a71a2dd20f5822eb9c0b07d61d00eae) Thanks [@mohamed-mehany](https://github.com/mohamed-mehany)! - Adds Scroll network layer 2 sequencer health adapter

## 2.6.1

### Patch Changes

- [#3004](https://github.com/smartcontractkit/external-adapters-js/pull/3004) [`bcc834129`](https://github.com/smartcontractkit/external-adapters-js/commit/bcc83412932e1440441e4aca390df5505ee53d85) Thanks [@alecgard](https://github.com/alecgard)! - L2 Sequencer Health: Default Optimism to not use the Transaction check as final decider of health.

## 2.6.0

### Minor Changes

- [#2977](https://github.com/smartcontractkit/external-adapters-js/pull/2977) [`d271dd2d7`](https://github.com/smartcontractkit/external-adapters-js/commit/d271dd2d7a7fa58ce1b3a8cd480e77bc69805c3b) Thanks [@austinborn](https://github.com/austinborn)! - Add a requireTxFailure input param which has conditional defaults depending on the network. The default behavior is the same as before for all networks except Base, which now does not use a tx call as the final decider of health.

### Patch Changes

- [#2975](https://github.com/smartcontractkit/external-adapters-js/pull/2975) [`b0ae518ab`](https://github.com/smartcontractkit/external-adapters-js/commit/b0ae518ab8c684db9f334f948fdd072d2133202d) Thanks [@alecgard](https://github.com/alecgard)! - Include the network in L2 Sequencer Health logs

## 2.5.0

### Minor Changes

- 4af9088cf: Layer2 Sequencer Health: Support Base chain

## 2.4.1

### Patch Changes

- 72e343619: Fixed block staleness check

## 2.4.0

### Minor Changes

- 8d15f80bd: Update starknet.js dependency to 6.0.0-beta.15

### Patch Changes

- c600ca386: Upgrade typescript version to 5.0.4
- Updated dependencies [c600ca386]
  - @chainlink/ea-bootstrap@2.27.1
  - @chainlink/ea-test-helpers@1.4.3

## 2.3.10

### Patch Changes

- Updated dependencies [3dc13a0bc]
  - @chainlink/ea-bootstrap@2.27.0
  - @chainlink/ea-test-helpers@1.4.2

## 2.3.9

### Patch Changes

- Updated dependencies [2fdaa5aa4]
  - @chainlink/ea-bootstrap@2.26.1
  - @chainlink/ea-test-helpers@1.4.2

## 2.3.8

### Patch Changes

- 65014014d: Upgraded typescript version to 4.9.5
- Updated dependencies [b29509be0]
- Updated dependencies [65014014d]
  - @chainlink/ea-bootstrap@2.26.0
  - @chainlink/ea-test-helpers@1.4.2

## 2.3.7

### Patch Changes

- Updated dependencies [838c9d927]
  - @chainlink/ea-bootstrap@2.25.2
  - @chainlink/ea-test-helpers@1.4.1

## 2.3.6

### Patch Changes

- Updated dependencies [0719f739b]
  - @chainlink/ea-bootstrap@2.25.1
  - @chainlink/ea-test-helpers@1.4.1

## 2.3.5

### Patch Changes

- Updated dependencies [fc46b78fc]
- Updated dependencies [1de0689c6]
  - @chainlink/ea-bootstrap@2.25.0
  - @chainlink/ea-test-helpers@1.4.1

## 2.3.4

### Patch Changes

- 8038c75f0: Moved missing endpoint log to adapter startup
- Updated dependencies [e8576df4e]
- Updated dependencies [842651f93]
  - @chainlink/ea-bootstrap@2.24.0
  - @chainlink/ea-test-helpers@1.4.1

## 2.3.3

### Patch Changes

- Updated dependencies [13eb04f5a]
- Updated dependencies [221ab1e5f]
  - @chainlink/ea-bootstrap@2.23.0
  - @chainlink/ea-test-helpers@1.4.1

## 2.3.2

### Patch Changes

- Updated dependencies [572b89314]
- Updated dependencies [068dd3672]
  - @chainlink/ea-bootstrap@2.22.2
  - @chainlink/ea-test-helpers@1.4.1

## 2.3.1

### Patch Changes

- Updated dependencies [26b046b1e]
  - @chainlink/ea-bootstrap@2.22.1
  - @chainlink/ea-test-helpers@1.4.1

## 2.3.0

### Minor Changes

- 865e6c7c7: Add patch for the ethereum-cryptopgraphy package so that the EA can successfully build using the StarknetJS dependency. In addition to the patch, this change also adds support for tracking the health of the Starkware Sequencer.

### Patch Changes

- Updated dependencies [b8061e1d5]
  - @chainlink/ea-bootstrap@2.22.0
  - @chainlink/ea-test-helpers@1.4.1

## 2.2.2

### Patch Changes

- Updated dependencies [3c1a320b5]
  - @chainlink/ea-bootstrap@2.21.0
  - @chainlink/ea-test-helpers@1.4.1

## 2.2.1

### Patch Changes

- Updated dependencies [b9982adc8]
- Updated dependencies [f710272c6]
- Updated dependencies [991fc76af]
  - @chainlink/ea-bootstrap@2.20.0
  - @chainlink/ea-test-helpers@1.4.1

## 2.2.0

### Minor Changes

- 688e3a8ae: Reverting code

## 2.1.0

### Minor Changes

- e60cb853e: add changes to support fetching Starkware Sequencer health

## 2.0.1

### Patch Changes

- Updated dependencies [5e7393deb]
- Updated dependencies [5e7393deb]
  - @chainlink/ea-bootstrap@2.19.3
  - @chainlink/ea-test-helpers@1.4.1

## 2.0.0

### Major Changes

- bbcf0eea4: Added CHAIN_ID environment variable and validation for connecting to blockchain endpoints. **WARNING:** Before upgrading, ensure the default CHAIN_ID value is correct for the chain(s) you use. If not, you need to explicitly set this env var. Please refer to the individual adapter README for more information.

### Patch Changes

- Updated dependencies [3a0e5aaa9]
  - @chainlink/ea-bootstrap@2.19.2
  - @chainlink/ea-test-helpers@1.4.1

## 1.6.4

### Patch Changes

- Updated dependencies [05a3f9464]
  - @chainlink/ea-bootstrap@2.19.1
  - @chainlink/ea-test-helpers@1.4.1

## 1.6.3

### Patch Changes

- Updated dependencies [5a1adab07]
- Updated dependencies [ed54a688b]
- Updated dependencies [530753225]
- Updated dependencies [88fdcb137]
  - @chainlink/ea-bootstrap@2.19.0
  - @chainlink/ea-test-helpers@1.4.1

## 1.6.2

### Patch Changes

- Updated dependencies [3b7c79459]
  - @chainlink/ea-bootstrap@2.18.2
  - @chainlink/ea-test-helpers@1.4.1

## 1.6.1

### Patch Changes

- Updated dependencies [c14139f55]
  - @chainlink/ea-bootstrap@2.18.1
  - @chainlink/ea-test-helpers@1.4.1

## 1.6.0

### Minor Changes

- 33c515d0d: add updated gas too low error message when checking for Arbitrum Nitro health

## 1.5.11

### Patch Changes

- Updated dependencies [48730a71c]
  - @chainlink/ea-bootstrap@2.18.0
  - @chainlink/ea-test-helpers@1.4.1

## 1.5.10

### Patch Changes

- Updated dependencies [a54b4216b]
  - @chainlink/ea-test-helpers@1.4.1

## 1.5.9

### Patch Changes

- Updated dependencies [cf38319c3]
  - @chainlink/ea-bootstrap@2.17.1
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.8

### Patch Changes

- Updated dependencies [d63612a03]
- Updated dependencies [110f3ab5c]
  - @chainlink/ea-bootstrap@2.17.0
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.7

### Patch Changes

- Updated dependencies [afaf0017e]
  - @chainlink/ea-bootstrap@2.16.0
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.6

### Patch Changes

- Updated dependencies [03071f0d0]
  - @chainlink/ea-bootstrap@2.15.1
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.5

### Patch Changes

- Updated dependencies [8161e1e18]
  - @chainlink/ea-bootstrap@2.15.0
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.4

### Patch Changes

- Updated dependencies [2e9b730ba]
  - @chainlink/ea-bootstrap@2.14.1
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.3

### Patch Changes

- Updated dependencies [0d3eda653]
  - @chainlink/ea-bootstrap@2.14.0
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.2

### Patch Changes

- Updated dependencies [bff852d48]
  - @chainlink/ea-bootstrap@2.13.0
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.1

### Patch Changes

- 816b3d307: catch onchain errors and set 'network'
- Updated dependencies [6054a7b69]
- Updated dependencies [816b3d307]
  - @chainlink/ea-bootstrap@2.12.0
  - @chainlink/ea-test-helpers@1.4.0

## 1.5.0

### Minor Changes

- fe96b484a: Replace @chainlink/types exports with @chainlink/ea-bootstrap exports

### Patch Changes

- Updated dependencies [fe96b484a]
- Updated dependencies [fe96b484a]
  - @chainlink/ea-test-helpers@1.4.0
  - @chainlink/ea-bootstrap@2.11.0

## 1.4.2

### Patch Changes

- Updated dependencies [fdc7405f2]
- Updated dependencies [45a63d02d]
  - @chainlink/ea-bootstrap@2.10.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.4.1

### Patch Changes

- Updated dependencies [8866db3a1]
- Updated dependencies [fb75088f2]
  - @chainlink/ea-bootstrap@2.9.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.4.0

### Minor Changes

- f805344df: add support for metis to layer2-sequencer-health EA

### Patch Changes

- Updated dependencies [346fa7d45]
- Updated dependencies [979dbe1d7]
  - @chainlink/ea-bootstrap@2.8.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.3.0

### Minor Changes

- 5dc77bbd9: improve logging when EA checks for the sequencer health to clarify that errors are expected and that there is no issue with the EA

### Patch Changes

- 568e86deb: Updated core & EAs to use the new, more specific versions of AdapterError class, to better pinpoint the kind of errors that are occurring
- Updated dependencies [568e86deb]
- Updated dependencies [e6f8af918]
- Updated dependencies [d360ce8ef]
- Updated dependencies [3000778b5]
- Updated dependencies [6abc1eb98]
- Updated dependencies [7313ac0a4]
- Updated dependencies [b0f0cd681]
- Updated dependencies [8e59df0fa]
  - @chainlink/ea-bootstrap@2.7.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.16

### Patch Changes

- Updated dependencies [66396e888]
- Updated dependencies [307aa10ec]
  - @chainlink/ea-bootstrap@2.6.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.15

### Patch Changes

- Updated dependencies [f9b76857b]
  - @chainlink/ea-bootstrap@2.5.2
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.14

### Patch Changes

- Updated dependencies [1b94b51b2]
  - @chainlink/ea-bootstrap@2.5.1
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.13

### Patch Changes

- Updated dependencies [dc5c138da]
- Updated dependencies [f99b2750a]
  - @chainlink/ea-bootstrap@2.5.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.12

### Patch Changes

- Updated dependencies [dee93ac7b]
  - @chainlink/ea-bootstrap@2.4.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.11

### Patch Changes

- Updated dependencies [54514ec52]
  - @chainlink/ea-bootstrap@2.3.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.10

### Patch Changes

- Updated dependencies [9a68af1e1]
  - @chainlink/ea-bootstrap@2.2.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.9

### Patch Changes

- Updated dependencies [4f0191ae8]
  - @chainlink/ea-bootstrap@2.1.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.8

### Patch Changes

- Updated dependencies [b6a12af05]
- Updated dependencies [7c0e0d672]
  - @chainlink/ea-bootstrap@2.0.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.7

### Patch Changes

- Updated dependencies [62095689f]
  - @chainlink/ea-bootstrap@1.18.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.6

### Patch Changes

- Updated dependencies [1a65c7b7d]
  - @chainlink/ea-bootstrap@1.17.1
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.5

### Patch Changes

- Updated dependencies [f9d466a77]
  - @chainlink/ea-bootstrap@1.17.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.4

### Patch Changes

- Updated dependencies [6d0ffbbbc]
  - @chainlink/ea-bootstrap@1.16.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.3

### Patch Changes

- Updated dependencies [6d0ffbbbc]
  - @chainlink/ea-bootstrap@1.15.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.2

### Patch Changes

- Updated dependencies [a14d1b69a]
  - @chainlink/ea-bootstrap@1.14.1
  - @chainlink/ea-test-helpers@1.2.0

## 1.2.1

### Patch Changes

- 4e078a0bc: Export default environment variables for testing

## 1.2.0

### Minor Changes

- 1b342b00e: Add CACHE_ENABLED to envDefaultOverrides

### Patch Changes

- Updated dependencies [57b29ab0c]
- Updated dependencies [a51daa9c8]
- Updated dependencies [e538ee7be]
- Updated dependencies [1b342b00e]
- Updated dependencies [e538ee7be]
- Updated dependencies [cd9ccdc89]
- Updated dependencies [1b342b00e]
- Updated dependencies [d7857c911]
  - @chainlink/ea-bootstrap@1.14.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.1.10

### Patch Changes

- Updated dependencies [382c16ac3]
  - @chainlink/ea-bootstrap@1.13.1
  - @chainlink/ea-test-helpers@1.2.0

## 1.1.9

### Patch Changes

- Updated dependencies [8d6ff4693]
- Updated dependencies [196336176]
  - @chainlink/ea-bootstrap@1.13.0
  - @chainlink/ea-test-helpers@1.2.0

## 1.1.8

### Patch Changes

- Updated dependencies [effb61e40]
  - @chainlink/ea-bootstrap@1.12.2
  - @chainlink/ea-test-helpers@1.2.0

## 1.1.7

### Patch Changes

- Updated dependencies [e75038240]
  - @chainlink/ea-bootstrap@1.12.1
  - @chainlink/ea-test-helpers@1.2.0

## 1.1.6

### Patch Changes

- e91884b91: Use static private key instead of randomly generating one

## 1.1.5

### Patch Changes

- Updated dependencies [4dd7722b0]
  - @chainlink/ea-test-helpers@1.2.0

## 1.1.4

### Patch Changes

- Updated dependencies [d0b872f6c]
  - @chainlink/ea-bootstrap@1.12.0
  - @chainlink/ea-test-helpers@1.1.0

## 1.1.3

### Patch Changes

- Updated dependencies [ab17812c7]
  - @chainlink/ea-bootstrap@1.11.2
  - @chainlink/ea-test-helpers@1.1.0

## 1.1.2

### Patch Changes

- 9041e0252: refactorted config into folder, moved ea presets into adapter folders, changed validator to accept ea presets
- Updated dependencies [341f2bd4d]
- Updated dependencies [9041e0252]
  - @chainlink/ea-bootstrap@1.11.1
  - @chainlink/ea-test-helpers@1.1.0

## 1.1.1

### Patch Changes

- Updated dependencies [eecdac90b]
  - @chainlink/ea-bootstrap@1.11.0
  - @chainlink/ea-test-helpers@1.1.0

## 1.1.0

### Minor Changes

- 048a65b7b: update ea to newest pattern

### Patch Changes

- Updated dependencies [57be274ff]
- Updated dependencies [540e563a9]
- Updated dependencies [72f96124d]
  - @chainlink/ea-bootstrap@1.10.6
  - @chainlink/ea-test-helpers@1.1.0

## 1.0.26

### Patch Changes

- Updated dependencies [4865d3b46]
  - @chainlink/ea-bootstrap@1.10.5
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.25

### Patch Changes

- Updated dependencies [4d6b8a050]
  - @chainlink/ea-bootstrap@1.10.4
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.24

### Patch Changes

- Updated dependencies
  - @chainlink/ea-bootstrap@1.10.3
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.23

### Patch Changes

- Updated dependencies [452ba71f0]
  - @chainlink/ea-bootstrap@1.10.2
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.22

### Patch Changes

- Updated dependencies [4476ff385]
  - @chainlink/ea-bootstrap@1.10.1
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.21

### Patch Changes

- de5d083e8: removed throw when input is invalid. Validator handles internally
- Updated dependencies [de5d083e8]
- Updated dependencies [de5d083e8]
- Updated dependencies [99ed864d0]
- Updated dependencies [de5d083e8]
  - @chainlink/ea-bootstrap@1.10.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.20

### Patch Changes

- 6b3fa8c3c: changed explicit typescript 'any' types to correct ones
- Updated dependencies [da1207541]
- Updated dependencies [1b6d4f1dd]
  - @chainlink/ea-bootstrap@1.9.1
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.19

### Patch Changes

- Updated dependencies [a74101705]
- Updated dependencies [703b60579]
  - @chainlink/ea-bootstrap@1.9.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.18

### Patch Changes

- Updated dependencies [1b54ee913]
  - @chainlink/ea-bootstrap@1.8.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.17

### Patch Changes

- Updated dependencies [dfc4545b3]
  - @chainlink/ea-bootstrap@1.7.1
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.16

### Patch Changes

- Updated dependencies [85360aa9]
  - @chainlink/ea-bootstrap@1.7.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.15

### Patch Changes

- Updated dependencies [f272a595]
- Updated dependencies [1d55bbde]
  - @chainlink/ea-bootstrap@1.6.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.14

### Patch Changes

- Updated dependencies [9b3cd511]
  - @chainlink/ea-bootstrap@1.5.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.13

### Patch Changes

- Updated dependencies [1b015ae2]
  - @chainlink/ea-bootstrap@1.4.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.12

### Patch Changes

- Updated dependencies [39e18f66]
  - @chainlink/ea-bootstrap@1.3.6
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.11

### Patch Changes

- Updated dependencies
  - @chainlink/ea-bootstrap@1.3.5
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.10

### Patch Changes

- Updated dependencies [790b2fa4]
  - @chainlink/ea-bootstrap@1.3.4
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.9

### Patch Changes

- Updated dependencies [946b778c]
  - @chainlink/ea-bootstrap@1.3.3
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.8

### Patch Changes

- Updated dependencies [a212f2cb2]
- Updated dependencies
  - @chainlink/ea-bootstrap@1.3.2
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.7

### Patch Changes

- Updated dependencies [9e3e1cbb6]
- Updated dependencies [a3b352bb5]
- Updated dependencies [97bbbfc69]

  - @chainlink/ea-bootstrap@1.3.1
  - @chainlink/ea-test-helpers@1.0.1

- Updated dependencies [b78f8e06]
- Updated dependencies [c93e5654]
- Updated dependencies [ccff5d7f]
  - @chainlink/ea-bootstrap@1.3.0

## 1.0.6

### Patch Changes

- Updated dependencies [34b40ed33]
  - @chainlink/ea-bootstrap@1.2.2
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.5

### Patch Changes

- Updated dependencies
  - @chainlink/ea-bootstrap@1.2.1
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.4

### Patch Changes

- Updated dependencies [9de168b08]
  - @chainlink/ea-bootstrap@1.2.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.3

### Patch Changes

- Updated dependencies [6cddc7e33]
- Updated dependencies [757539a82]
- Updated dependencies [e96b85614]
- Updated dependencies [4ad7ac890]
- Updated dependencies [f10887669]
  - @chainlink/ea-bootstrap@1.1.0
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.2

### Patch Changes

- ** DUMMY VERSION BUMP - Test release pipeline **
- Updated dependencies
  - @chainlink/ea-bootstrap@1.0.2
  - @chainlink/ea-test-helpers@1.0.1

## 1.0.1

### Patch Changes

- Updated dependencies
  - @chainlink/ea-bootstrap@1.0.1
  - @chainlink/ea-test-helpers@1.0.0

## 1.0.0

### Major Changes

- EAv2 Release. Start of individual EA versioning.
