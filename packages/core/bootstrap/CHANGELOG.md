# @chainlink/ea-bootstrap

## 2.29.2

### Patch Changes

- [#3533](https://github.com/smartcontractkit/external-adapters-js/pull/3533) [`563b976`](https://github.com/smartcontractkit/external-adapters-js/commit/563b976bd699a28e42120fdbcf730a1d4b5c2db5) Thanks [@renovate](https://github.com/apps/renovate)! - Bump @types/node version

- [#3532](https://github.com/smartcontractkit/external-adapters-js/pull/3532) [`876b8ba`](https://github.com/smartcontractkit/external-adapters-js/commit/876b8ba9472009f843076d3d25588b6c89bd489c) Thanks [@renovate](https://github.com/apps/renovate)! - Bump lodash

## 2.29.1

### Patch Changes

- [#3260](https://github.com/smartcontractkit/external-adapters-js/pull/3260) [`13cfd21`](https://github.com/smartcontractkit/external-adapters-js/commit/13cfd215dcbd14c31f173bd874da36d636434627) Thanks [@renovate](https://github.com/apps/renovate)! - Bump TS version

## 2.29.0

### Minor Changes

- [#3506](https://github.com/smartcontractkit/external-adapters-js/pull/3506) [`9cb8367`](https://github.com/smartcontractkit/external-adapters-js/commit/9cb8367d566a7540c36e4a2133dea5aad27bf212) Thanks [@cawthorne](https://github.com/cawthorne)! - Include source EA name in composite EA response.

  Also updates CVI, BLOCKDAEMON and L2_SEQUENCER_HEALTH EA names for telemetry compatibility reasons.

## 2.28.0

### Minor Changes

- [#3464](https://github.com/smartcontractkit/external-adapters-js/pull/3464) [`2c75000`](https://github.com/smartcontractkit/external-adapters-js/commit/2c7500055fa2e736fee811896723f297f8faf60e) Thanks [@cawthorne](https://github.com/cawthorne)! - Add meta: adapterName field to EA reponses, for EA Telemetry.

### Patch Changes

- [#3480](https://github.com/smartcontractkit/external-adapters-js/pull/3480) [`13c68c5`](https://github.com/smartcontractkit/external-adapters-js/commit/13c68c550cd0131940c41eb28d2f257d68d6312c) Thanks [@mxiao-cll](https://github.com/mxiao-cll)! - Bump axios

- [#3371](https://github.com/smartcontractkit/external-adapters-js/pull/3371) [`78f9b06`](https://github.com/smartcontractkit/external-adapters-js/commit/78f9b0664d96551f6a239951c60d4a907ddfe0d9) Thanks [@renovate](https://github.com/apps/renovate)! - Bump WS

## 2.27.2

### Patch Changes

- [#3201](https://github.com/smartcontractkit/external-adapters-js/pull/3201) [`efb5b9c`](https://github.com/smartcontractkit/external-adapters-js/commit/efb5b9cd2d4f4deeb967584b38b3e8d211884d0e) Thanks [@karen-stepanyan](https://github.com/karen-stepanyan)! - Fixed type issues with axios config

## 2.27.1

### Patch Changes

- c600ca386: Upgrade typescript version to 5.0.4

## 2.27.0

### Minor Changes

- 3dc13a0bc: Remove resultPath from cache key generation

## 2.26.1

### Patch Changes

- 2fdaa5aa4: Bump v3 version

## 2.26.0

### Minor Changes

- b29509be0: Updated Requester.validateResultNumber to take acceptZeroValue option

### Patch Changes

- 65014014d: Upgraded typescript version to 4.9.5

## 2.25.2

### Patch Changes

- 838c9d927: Add NFT Blue Chip Index Adapter

## 2.25.1

### Patch Changes

- 0719f739b: Treat literal "" env var values as empty

## 2.25.0

### Minor Changes

- fc46b78fc: Made max payload size configurable with min/max limits
- 1de0689c6: Deprecated the METRICS_NAME env var so the app_name label will always use the adapter name. Current users of this env var would notice metric name changes from their unique one.
  Added a warning log when METRICS_ENABLED is set to false.
  Added a log to show the full metrics endpoint on startup rather than just the port number.

## 2.24.0

### Minor Changes

- 842651f93: Show request data when requester.request fails

### Patch Changes

- e8576df4e: Added warning logs for DEBUG and NODE_ENV

## 2.23.0

### Minor Changes

- 221ab1e5f: Warn on custom rate limit capacity

### Patch Changes

- 13eb04f5a: Added warning log when LOG_LEVEL set to DEBUG or TRACE

## 2.22.2

### Patch Changes

- 572b89314: Fixed a potential issue where log censoring could crash the EA due to circular references
- 068dd3672: changed websocket only request timeout message

## 2.22.1

### Patch Changes

- 26b046b1e: Fixed conflicting redis client dependencies

## 2.22.0

### Minor Changes

- b8061e1d5: Removed UUID environment variable. UUID was used for generating cache group keys. There is no action needed if
  you were not using UUID environment variable and/or
  running single instance of EA or
  using UUID with multiple instances of the same EA with a shared cache.
  If you were using UUID to run multiple instances of the same EA with isolated cache, you should use CACHE_KEY_GROUP environment variable instead. Applicable only in remote cache scenarios like when using redis for cache.

## 2.21.0

### Minor Changes

- 3c1a320b5: Added new logging censorship implementation

## 2.20.0

### Minor Changes

- b9982adc8: requestor now accepts customError functions that return either a string or a boolean and includes message if string

### Patch Changes

- f710272c6: Only clear metrics registry when METRICS_ENABLED=false
- 991fc76af: Change default EA HOST value to 0.0.0.0

## 2.19.3

### Patch Changes

- 5e7393deb: Lower API_TIMEOUT to 10000 (10s)
- 5e7393deb: Add API_TIMEOUT to env default overrides, with an override of 30s for Kaiko

## 2.19.2

### Patch Changes

- 3a0e5aaa9: Expanded coverage of redacting secrets in logs

## 2.19.1

### Patch Changes

- 05a3f9464: Prevent updating properties of WS connection/subscription missing from state

## 2.19.0

### Minor Changes

- 88fdcb137: Changed METRICS_ENABLED environment variable to 'true' which enables metrics endpoint by default

### Patch Changes

- 5a1adab07: Make data provider errors be correctly labeled as "dataProviderError" instead of "connectionError"
- ed54a688b: Increase Redis timeout & max items to reflect max load
- 530753225: Await subscribe for WS connections

## 2.18.2

### Patch Changes

- 3b7c79459: Improved redis cache performance with auto-pipelining

## 2.18.1

### Patch Changes

- c14139f55: Fixed an issue where the burst limiter would never recover from exceeding the limit

## 2.18.0

### Minor Changes

- 48730a71c: Fixed websocket metric value going negative

## 2.17.1

### Patch Changes

- cf38319c3: Support includes param in request as string[]

## 2.17.0

### Minor Changes

- d63612a03: Refactor getIncludesOptions to be a generic util.getPairOptions method in bootstrap
- 110f3ab5c: Added logError method, for logging for errors outside of iologger in bootstrap. Updated iologger to log error type. Added WS adapter timeout log. Updated error messages for source & composite adapters

## 2.16.0

### Minor Changes

- afaf0017e: Add Stader Labs Adapter to Core Legos

## 2.15.1

### Patch Changes

- 03071f0d0: Fix: On WS correctly shut down non-warmer Cache Warmers

## 2.15.0

### Minor Changes

- 8161e1e18: fix broken endpoint override when endpoint missing from request

## 2.14.1

### Patch Changes

- 2e9b730ba: Revert cache warmer type safety throws

## 2.14.0

### Minor Changes

- 0d3eda653: avoid throwing hard error in batch warmer when joining a child warmer instead of a batch warmer

## 2.13.0

### Minor Changes

- bff852d48: add better logging when batch warmer errors out

## 2.12.0

### Minor Changes

- 6054a7b69: add better logging when batch warmer errors out

### Patch Changes

- 816b3d307: transform ether.js RPC errors

## 2.11.0

### Minor Changes

- fe96b484a: @chainlink/ea-bootstrap type coverage

## 2.10.0

### Minor Changes

- fdc7405f2: add extra logging for EA failures

### Patch Changes

- 45a63d02d: Clarified "TTL exceeds maximum TTL" log warning message

## 2.9.0

### Minor Changes

- 8866db3a1: Removed request_origin label from metrics & tests. Added 'result' to excluded properties in cache key & feed ID generation.

### Patch Changes

- fb75088f2: clean all redux state after server shutdown

## 2.8.0

### Minor Changes

- 346fa7d45: added telemetry data to EA responses

### Patch Changes

- 979dbe1d7: with DEBUG=true iso time is used for logs, instead of epoch time

## 2.7.0

### Minor Changes

- 568e86deb: Updated core & EAs to use the new, more specific versions of AdapterError class, to better pinpoint the kind of errors that are occurring
- d360ce8ef: Updated withMetrics middleware to record new error types to prometheus
- 3000778b5: Added data_provider_request_attempts & data_provider_request_duration_seconds metrics to requester. Added error type label to ws_subscription_errors metric.
- 6abc1eb98: allow custom error messages when a result cannot be found from the DP's response and left a warning for pairs not updating on weekends in Polygon EA
- b0f0cd681: Added additional error types to HttpRequestType enum. Extended AdapterError to allow many different types of error to be thrown.
- 8e59df0fa: ensure that providerStatusCode set to 200 when request is successful

### Patch Changes

- e6f8af918: Clarified error/log messages when there's likely DP issues
- 7313ac0a4: Use logical OR instead of null coalesce for LOG_LEVEL

## 2.6.0

### Minor Changes

- 66396e888: Added request_origin label to metrics, to indicate the source ip of requests
- 307aa10ec: Add new Lido adapter

## 2.5.2

### Patch Changes

- f9b76857b: Fix cache batch warming key generation by ignoring overrides, others

## 2.5.1

### Patch Changes

- 1b94b51b2: Fix default EA host, add EA_HOST env var

## 2.5.0

### Minor Changes

- f99b2750a: Change the internal HTTP server framework from Express to Fastify

### Patch Changes

- dc5c138da: Enable EA level override of framework env: WARMUP_ENABLED

## 2.4.0

### Minor Changes

- dee93ac7b: Increased the default max Redis cache from 100 to 500

## 2.3.0

### Minor Changes

- 54514ec52: Add blocksize-capital EA

## 2.2.0

### Minor Changes

- 9a68af1e1: Remove rate limiting and slowdown middlewares

## 2.1.0

### Minor Changes

- 4f0191ae8: fix issue where config.verbose set to true when API_VERBOSE env var is set to false

## 2.0.0

### Major Changes

- 7c0e0d672: Change to deterministic cache key generation

### Patch Changes

- b6a12af05: added base input params section in README

## 1.18.0

### Minor Changes

- 62095689f: add granular status code

## 1.17.1

### Patch Changes

- 1a65c7b7d: Revert Overrider casing change

## 1.17.0

### Minor Changes

- f9d466a77: Changed the default API timeout from 5 seconds back to 30 seconds

## 1.16.0

### Minor Changes

- 6d0ffbbbc: decrease default API_TIMEOUT environment variable to 5s

## 1.15.0

### Minor Changes

- 6d0ffbbbc: decrease default API_TIMEOUT environment variable to 5s

## 1.14.1

### Patch Changes

- a14d1b69a: Change delay functions into using sleep util

## 1.14.0

### Minor Changes

- 57b29ab0c: This change ensures that there are no duplicate aliases for input parameters. It also includes a test in the bootstrap validator test.
- 1b342b00e: Add base env defaults to core bootstrap
- cd9ccdc89: (feat): Add new middleware: Error Backoff
- 1b342b00e: Add CACHE_ENABLED to envDefaultOverrides
- d7857c911: Created Overrider class to handle overrides & implemented Overrider class for CoinGecko EA

### Patch Changes

- a51daa9c8: Refactor sleep util function into bootstrap util
- e538ee7be: refactor sortedFilter into util
- e538ee7be: (fix): Ensure Burst Limit's second retry correctly updates state's sliding window

## 1.13.1

### Patch Changes

- 382c16ac3: Add global handler for unhandled promise rejections

## 1.13.0

### Minor Changes

- 8d6ff4693: Added buildUrl & buildUrlPath methods to util. Updated source adapters to use these methods for building URLs with user input.
- 196336176: Token Allocation passes through input parameters

## 1.12.2

### Patch Changes

- effb61e40: Fix optional chain for ws last updated

## 1.12.1

### Patch Changes

- e75038240: Log full output result in withIOLogger

## 1.12.0

### Minor Changes

- d0b872f6c: Status codes are no longer normalized (e.g. 429s have the metric label '429' instead of '4xx')

## 1.11.2

### Patch Changes

- ab17812c7: Update Validator behavior with input options sets

## 1.11.1

### Patch Changes

- 341f2bd4d: Small reorg
- 9041e0252: refactorted config into folder, moved ea presets into adapter folders, changed validator to accept ea presets

## 1.11.0

### Minor Changes

- eecdac90b: Prevent getFeedId errors from killing the process on node v17

## 1.10.6

### Patch Changes

- 57be274ff: update provider limits
- 540e563a9: Prevent process crash when cache warmer data is missing
- 72f96124d: Add WS testing fw

## 1.10.5

### Patch Changes

- 4865d3b46: Add JPEG'd adapter

## 1.10.4

### Patch Changes

- 4d6b8a050: Satoshitango rate limit change

## 1.10.3

### Patch Changes

- Revert: Allow indefinite subscriptions by leaving out unsubscribe handler

## 1.10.2

### Patch Changes

- 452ba71f0: Allow indefinite subscriptions by leaving out unsubscribe handler

## 1.10.1

### Patch Changes

- 4476ff385: Modify Coingecko RENFIL override

## 1.10.0

### Minor Changes

- 99ed864d0: Added RENFIL -> FIL overrides for coingecko, coinmarketcap, nomics, tiingo, and set override ID for RENFIL on coinpaprika

### Patch Changes

- de5d083e8: added shouldThrowError option in Validator class which handles error throwing for bad input
- de5d083e8: removed error log from validator.ts
- de5d083e8: removed throw when input is invalid. Validator handles internally

## 1.9.1

### Patch Changes

- da1207541: Add fallback to local cache for WS
- 1b6d4f1dd: Include 'endpoint' as a base input parameter

## 1.9.0

### Minor Changes

- a74101705: Ignore health checks in rate limiter
- 703b60579: added 'type' label for metrics for failed requests

## 1.8.0

### Minor Changes

- 1b54ee913: Add internal properties to validator so it doesn't remove them

## 1.7.1

### Patch Changes

- dfc4545b3: Btc_com rate limit

## 1.7.0

### Minor Changes

- 85360aa9: remove source maps

## 1.6.0

### Minor Changes

- f272a595: Implement cache fallback method
- 1d55bbde: Change data provider error surfacing, return 200 and use new providerStatusCode field

## 1.5.0

### Minor Changes

- 9b3cd511: limit number of times ws message handled

## 1.4.0

### Minor Changes

- 1b015ae2: Modify the way metrics are calculated on DP errors for the http_total_requests metric

## 1.3.6

### Patch Changes

- 39e18f66: Redis request coalescing sends a string value

## 1.3.5

### Patch Changes

- Add additional logs for Redis

## 1.3.4

### Patch Changes

- 790b2fa4: Add Coinpaprika KNC override

## 1.3.3

### Patch Changes

- 946b778c: Increase default local cache MAX_ITEMS to 1000

## 1.3.2

### Patch Changes

- a212f2cb2: WS bug fixes
- Only set Redis URL when defined as an env var

## 1.3.1

### Patch Changes

- 9e3e1cbb6: Provide fixed feed_id for cache warmer requests
- a3b352bb5: Fix rate limit capacity parsing
- 97bbbfc69: This PR fixes an issue with the cache warmer metrics that was causing them to go into the negatives

## 1.3.0

### Minor Changes

- c93e5654: Add new input parameter configuration in Validator class
- ccff5d7f: Upgrade Redis to V4

### Patch Changes

- b78f8e06: Print out actual used port when bootstrapping server

## 1.2.2

### Patch Changes

- 34b40ed33: Fix rate limit capacity parsing

## 1.2.1

### Patch Changes

- WS deserializer now only returns string if the payload is not JSON

## 1.2.0

### Minor Changes

- 9de168b08: Disable per minute and per second rate limits through env vars

## 1.1.0

### Minor Changes

- e96b85614: Validate empty string required request parameters
- f10887669: Ignore empty string environment variables

### Patch Changes

- 6cddc7e33: send shutdown signal to cache warmer
- 757539a82: Added "WTI" preset for Tiingo
- 4ad7ac890: WS deserializer for string type

## 1.0.2

### Patch Changes

- ** DUMMY VERSION BUMP - Test release pipeline **

## 1.0.1

### Patch Changes

- Add FIL preset for Coingecko

## 1.0.0

### Major Changes

- EAv2 Release. Start of individual EA versioning.
