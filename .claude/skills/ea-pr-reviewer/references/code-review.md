# Code review rubric (EA production readiness)

## Goal

Review EA **source** code for quality, correctness, and proper External Adapter Framework (EAF) usage. Be strict: the adapter should be production-ready.

**Framework location:** See `eaf-framework-paths.md` in this folder for unplugged paths under `.yarn/unplugged/.../external-adapter-framework/`.

## Review checklist

### 1. Framework component selection

**Principle:** Use the most specific framework component available for the use case.

- Transport matches data source (REST → `HttpTransport`, WebSocket → `WebSocketTransport`, SSE → `SseTransport`).
- Endpoint type matches data (e.g. price → `PriceEndpoint`, bid/ask → `LwbaEndpoint`, stocks → `StockEndpoint`, PoR → PoR endpoints).
- Adapter type matches endpoints (`PriceAdapter`, `PoRAdapter`, etc.).
- Use `EmptyInputParameters` when there are no input params (not `new InputParameters({}, [{}])`).
- Use framework response types (`SingleNumberResultResponse`, etc.).
- Configuration uses `AdapterConfig` with proper types.

### 2. Code quality

**DRY:** No duplicated logic; shared constants/types extracted; no copy-paste blocks.

**KISS:** No unnecessary abstractions; no over-engineering; direct readable code; avoid shallow wrappers around native/framework APIs.

**Single responsibility:** Transport fetches data; endpoint routes; config holds settings.

**Readability:** Clear names; consistent style; sensible structure; avoid overly dense one-liners.

### 3. Correctness

**Types:** Solid TypeScript; no `any` without justification; I/O types match framework expectations; generics constrained.

**Numbers:** Large integers via `BigInt`, `bignumber.js`, or `ethers.toBigInt()`; decimals via `decimal.js`; no unsafe `parseInt`/`parseFloat` on large values; preserve precision appropriate for on-chain feeds (e.g. 18 decimals).

**Errors:** Framework error types (`AdapterError`, `AdapterInputError`, etc.); actionable messages; no silent swallow without logging; provider failures handled gracefully.

### 4. Performance

- `prepareRequests` batches efficiently (not N identical upstream calls for N params).
- Minimal API usage; no redundant fetching.
- No obvious leaks; parsing stays lean.

### 5. Configuration

URLs and secrets from config, not hardcoded. Required vs optional clear. Sensible defaults. Types match reality (string, number, boolean, enum).

### 6. Libraries vs raw HTTP

| Use case       | Library                   | Instead of        |
| -------------- | ------------------------- | ----------------- |
| EVM calls      | `ethers`                  | Raw JSON-RPC HTTP |
| Solana         | `@solana/web3.js`         | Raw HTTP          |
| Large integers | `bignumber.js` / `BigInt` | `Number`          |
| Decimal math   | `decimal.js`              | Native floats     |

### 7. Transports

**HttpTransport:** Minimal `prepareRequests`; `parseResponse` maps to params; errors handled; response types match endpoints.

**WebSocketTransport:** Correct `url`; `handlers.message` parses correctly; subscribe/unsubscribe builders if needed.

**Custom:** Extends correct base (e.g. `SubscriptionTransport`); background execution correct.

### 8. Input parameters

Typed params; required vs optional clear; useful aliases; clear descriptions.

## Review process

1. Read relevant files under the EA package (`src/`, `config/`, `transport/`, `endpoint/`).
2. Evaluate against this checklist.
3. Allow justified exceptions when requirements demand them.
4. Decide if the result is production-ready.

## Severity

**Must fix (blocks approval):** Wrong framework component; numeric precision loss; missing critical error handling; hardcoded secrets/URLs; pathological request patterns (N calls where one batch suffices).

**Should fix:** Minor style noise; verbose but correct code; missing optional optimizations.

**Context-dependent:** Custom transports, justified raw HTTP, unusual requirements—flag for humans with context.

## Output for this dimension

- `approved`: boolean
- `rationale`: string — if not approved, issues with paths and fixes. Prefer lines like: `[file:line] category: description. Fix: suggestion`
