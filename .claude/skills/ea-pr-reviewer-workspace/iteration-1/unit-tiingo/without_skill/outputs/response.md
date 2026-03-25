# Tiingo unit tests — scope and meaning (no skill)

## Verdict

The only unit file under `packages/sources/tiingo/test/unit` is `transport-utils.test.ts`. Its examples exercise **adapter-specific business logic** (Tiingo WebSocket message shape and primary/secondary URL failover), not External Adapter Framework behavior. Under a **strict unit-test scope**, the suite is **narrow**: it covers two small pure helpers in `src/transport/utils.ts` and leaves other substantial logic in that module untested at the unit layer.

## What is under test

| Area               | Assertion focus                                                              | Classification                                                                                                |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `wsMessageContent` | Lowercasing, `base/quote` vs concatenated ticker for forex (`skipSlash`)     | **Business / integration contract** for the Tiingo WS payload the adapter sends                               |
| `wsSelectUrl`      | Primary URL for “early” attempts, secondary on the 6th slot in the 5+1 cycle | **Business logic** documented in source (failover cadence tied to `streamHandlerInvocationsWithNoConnection`) |

Neither block validates framework classes (`WebSocketTransport`, transports, HTTP stack) or Jest itself. The `makeLogger` mock only isolates module load from real logging; assertions are not about the logger.

## Gaps vs strict unit scope

`src/transport/utils.ts` also contains:

- `buildBatchedRequestBody` — chunking (100 tickers), deduped lowercase tickers, conditional `resampleFreq`
- `buildBatchedRequestBodyForPrice` — per-param request construction
- `constructEntry` — empty-provider handling, `cvwap` suffix stripping, mapping `resultPath` from `priceData[0]`

None of these have corresponding files under `test/unit/`. Integration tests elsewhere may cover end-to-end behavior, but **strict unit scope** for Tiingo transport helpers is only partially met.

## Conclusion

- **Meaningful for business logic?** Yes, for the two helpers that are tested: they encode Tiingo-specific formatting and failover rules.
- **Framework tests?** No.
- **Strict unit-test scope?** The existing tests are appropriately scoped as **unit tests** (pure inputs/outputs, no I/O). The **package’s unit-test coverage** of transport business logic is **thin** relative to the size of `utils.ts`.
