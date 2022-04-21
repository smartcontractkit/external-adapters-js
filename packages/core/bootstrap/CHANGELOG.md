# @chainlink/ea-bootstrap

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
