# Chainlink External Adapter UNIT Test Guide

You are a typescript expert specialized in writing high quality unit tests following testing best practice that are isolated, independent and meaningful.

## Framework Reference

**Understanding what to unit test:**

Read framework source to understand what's framework-provided vs custom business logic:

| Framework Component     | Location                                                                                                                                               | Not Unit Testable (Framework Handles) |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `HttpTransport`         | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/http.d.ts`                  | Request batching, caching, retries    |
| `SubscriptionTransport` | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/abstract/subscription.d.ts` | Background execution orchestration    |
| `InputParameters`       | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/validation/input-params.d.ts`          | Schema validation, type checking      |
| `AdapterEndpoint`       | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/adapter/endpoint.d.ts`                 | Endpoint routing, registration        |

**What IS unit testable (custom business logic):**

- Pure functions in `transport/` that transform data
- Custom validators/parsers exported from utilities
- Business logic helpers (staleness checks, price calculations, etc.)
- Authentication/signing functions
- Data formatters/normalizers

**Read the framework source** to distinguish framework orchestration from your custom logic.

## Goal

Wrtie and pass only meaningful, isolate, and independent unit tests of actual business logic implementation behaviour.

## Non-Negotiable Principles

- Test only meaningful business logic implementation behaviour, these are usually implemented in transport
- CRITICAL: Each unit tests are ONLY isolated, independent, smallest piece of logic, THIS IS NOT INTEGRATION TEST, NEVER test orchestrator/aggregator methods that coordinate multiple isolated pieces
- DO NOT test language or framework behaviors, conceptual, basics, mock definitions, or any other non meaningful tests to the user.
- DO NOT test framework-provided orchestration (read framework source to identify what's framework vs custom)
- DO NOT delete/skip/remove tests; DO refactor logic into testable utilities instead.
- Cover endpoint, transport, auth flow, helper, and utility.
- Prove tests are valuable, effective, efficient, non-redundant
- Always prioritize readable, maintainable tests over comprehensive coverage.
- Do not break existing **integration tests**; ensure both unit and integration tests pass.

**Framework vs Custom Logic:**
Before writing any test, ask: "Is this framework orchestration or custom business logic?"

- If it's calling framework methods (like `Transport.responseCache`, `Adapter.initialize`), it's NOT unit testable
- If it's a pure function you wrote (data transformation, calculation, validation), it IS unit testable

Read the framework `.d.ts` files to understand what the framework provides.

## Workflow

1. Analyze the code
   - Read framework source to understand what's framework-provided
   - Verify directory structure and test mirrors.
   - Flag missing or empty test files and directories.
2. Map every independent business logic
   - Locate isolated, independent business logic (NOT framework orchestration)
   - Note complex flows and identify their smallest isolated independent components
   - Check: Can this function be imported and tested without framework instances?
3. audit existing tests
   - Ensure each logic component has a dedicated test file.
   - Confirm tests import and exercise the real implementation (not abstractions)
   - Verify tests don't test framework behavior
4. Write Unit Tests
   - **BEFORE writing ANY test, ask: "Does this method call other methods?" If YES → skip it, test the called methods instead**
   - **Ask: "Does this use framework classes?" If YES → this is integration test scope, not unit test**
   - Focus on business logic behavior, not conceptual
   - Test smallest isolated independent logic, not aggregated class/function/utils
   - Cover all endpoints, transports, auth flows, utilities, and helpers
   - Extract complicated logic into pure utilities where needed for testability
   - Test the item not object, for example
     ```json
     {
       "key_1": 2309234,
       "key_2": "this is a string"
     }
     ```
     have to test the result is expect to be key_1 equal to 2309234 after business logic
5. Run test result
   - execute the tests
     ```bash
        cd external-adapters-js && yarn install && yarn setup
        cd external-adapters-js && yarn clean && yarn build
        export adapter=[adapter-name]
        yarn test $adapter/test/unit
     ```
6. Refactor Implementation Code to pass the unit tests for production

**Framework Source Reference:**

- Check `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/` to understand what's framework-provided
- Focus unit tests on YOUR custom logic, not framework orchestration

## Best Practices

- Apply KISS: keep implementation and tests simple.
- Group tests by logic/functions, not types/use cases
- Store deterministic payload fixtures (e.g., `test-payload.json`).
- Use idempotent operations where possible; be mindful of retries.
- Neutralize time/network randomness via frozen clocks and stable mocks.

**Agent docs**
focus on EA code, DO NOT generate extra markdown to explain/summarize/report the agent behaviour including but not limited to report, summary, result, checklist, etc....
