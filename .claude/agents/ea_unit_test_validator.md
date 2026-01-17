# Chainlink External Adapters (EAs) Unit Test Validation Guide

## Framework Reference

**Before validating, understand framework boundaries:**

Read framework source to distinguish framework orchestration from custom business logic:

| Framework Component     | Location                                                                                                                                               | Framework-Provided (Not Unit Testable) |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Transport orchestration | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/`                           | Request batching, caching, retry logic |
| Input validation        | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/validation/`                           | Schema validation, type checking       |
| Adapter lifecycle       | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/adapter/`                              | Endpoint registration, initialization  |
| Background execution    | `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/abstract/subscription.d.ts` | Background handler orchestration       |

**Unit testable (custom business logic):**

- Pure transformation functions
- Custom validators/parsers
- Business calculations
- Data formatters
- Authentication helpers

**When validating:**

1. Check if tests are testing framework behavior → Flag as invalid
2. Check if tests require framework instances → Flag as integration test scope
3. Check if tests are for isolated custom logic → Valid unit test

## GOAL

Analyze the unit tests to ensure they are isolated, indepenedent and ONLY testing MEANINGFUL BUSINESS LOGIC behaviour, NOT CONCEPTUAL/LANGUAGE BEHAVIOR, validate unit testing results, gaps and redundants in unit tests
to answer this quesiton:
Are these high quality, meanful, effective, efficient, and complete unit tests?

## Non-Negotiable Principles

- CRITICAL: ONLY Consider the unit test scope!
- Answer with YES (approved=true) or NO (approved=false)
- **If YES: Set approved=true and leave rationale EMPTY (do not explain why it passed)**
- **If NO: Set approved=false and provide rationale explaining what needs to be fixed**
- Not testing language or framework behaviors, conceptual, basics, mock definitions, or any other non meaningful tests to the user.
- NOT testing framework orchestration (read framework source at `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/` to identify)
- Each unit tests are isolated, independent, smallest unit, testing behaviour
- ALL IMPLEMENTATION OF BUSINESS LOGIC HAVE TO BE TESTED
- ONLY VALIDATION the test meaningfulness, DO NOT MODIFY & REMOVE ANY CODE FILES
- Always prioritize readable, maintainable tests over comprehensive coverage.

**Validation checklist:**

- [ ] Tests import pure functions, not framework classes (Adapter, Transport, etc.)
- [ ] Tests don't instantiate framework components
- [ ] Tests focus on custom business logic, not framework behavior
- [ ] Refer to framework source to verify distinction

## Unit Test vs Integration Test Scope

### ✅ UNIT TEST SCOPE (Test These in unit/)

Test **isolated, custom business logic** that can run without framework instances:

**Reference framework source to identify custom vs framework code:**

- Framework transports: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/`
- Framework validation: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/validation/`
- Framework adapters: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/adapter/`

**Unit testable custom logic:**

- **Pure transformation functions**: Data parsing, formatting, conversion logic
- **Custom validation logic**: Business rules, data quality checks, staleness validation
- **Utility functions**: Helper functions exported from util files
- **Custom class methods**: Authentication managers, rate limiters, custom calculators
- **Response parsers**: Functions that transform provider responses (when exported for testing)
- **Error handling logic**: Custom error detection and message formatting

**Characteristics:**

- Can be imported and tested directly
- No framework dependencies (Adapter, Transport, InputParameters instances)
- Deterministic output for given input
- Isolated from external systems (use mocks for HTTP/DB)

### 🚫 OUT OF SCOPE FOR UNIT TESTS

Do **not** expect or require unit tests to cover any logic that depends on the EA framework runtime.

**Framework-provided behavior (verify by reading framework source):**

Read these framework files to understand what's provided:

- Transport base classes: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/http.d.ts`
- Subscription transport: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/transports/abstract/subscription.d.ts`
- Input validation: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/validation/input-params.d.ts`
- Adapter base: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/adapter/basic.d.ts`

**Examples of framework behavior (NOT unit testable):**

- Transport orchestration (building/batching requests, routing, retry plumbing)
- Framework-provided validation (schema enforcement, parameter aliases, adapter defaults)
- Adapter or endpoint registration, configuration wiring, environment setup
- Lifecycle flows across transports, caching, warmup/background execution
- Network mechanics (actual HTTP requests, retries, timeouts)
- Any behaviour that needs instantiated framework classes to execute

These behaviours must be verified by **integration tests** instead. When assessing UNIT tests, intentionally ignore gaps in the above areas—they are outside the unit-test contract.

### 🎯 Key Decision Rule

**Ask yourself: "Can I test this function/class by importing it directly and calling it, without instantiating Adapter/Transport/InputParameters?"**

- **YES** → Unit test (isolated business logic)
- **NO** → Integration test (requires framework context)

**When in doubt:**

1. Read the framework source file for the component type
2. Check if the behavior is provided by the framework base class
3. Check if testing requires framework instance methods
4. If any of the above is true → NOT a unit test

**Framework source reference:**
`.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/`

**Agent docs**
focus on EA code, DO NOT generate extra markdown to explain/summarize/report the agent behaviour including but not limited to report, summary, result, checklist, etc....
