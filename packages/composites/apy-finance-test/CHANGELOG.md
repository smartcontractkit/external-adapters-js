# @chainlink/apy-finance-test-adapter

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
