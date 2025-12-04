# Chainlink External Adapters (EAs) Development Guide

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
- Each unit tests are isolated, independent, smallest unit, testing behaviour
- ALL IMPLEMENTATION OF BUSINESS LOGIC HAVE TO BE TESTED
- ONLY VALIDATION the test meaningfulness, DO NOT MODIFY & REMOVE ANY CODE FILES
- Always prioritize readable, maintainable tests over comprehensive coverage.

## Unit Test vs Integration Test Scope

### ✅ UNIT TEST SCOPE (Test These in unit/)

Test **isolated, custom business logic** that can run without framework instances:

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

Do **not** expect or require unit tests to cover any logic that depends on the EA framework runtime. Examples include:

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

**Agent docs**
focus on EA code, DO NOT generate extra markdown to explain/summarize/report the agent behaviour including but not limited to report, summary, result, checklist, etc....
