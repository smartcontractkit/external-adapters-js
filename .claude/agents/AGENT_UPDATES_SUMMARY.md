# Test Agent Updates Summary

## What Changed

All four test-related agent files have been updated to properly reference the EA framework source code instead of including hardcoded code snippets.

## Updated Files

1. `.claude/agents/ea_integration_test_writer.md` - Integration test writer
2. `.claude/agents/ea_integration_test_validator.md` - Integration test validator
3. `.claude/agents/ea_unit_test_writer.md` - Unit test writer
4. `.claude/agents/ea_unit_test_validator.md` - Unit test validator

## Key Changes

### 1. Framework Source References

**Before:**

- Hardcoded code snippets and examples
- Static information that could become outdated

**After:**

- References to framework `.d.ts` files with full paths
- Instructions to read framework source for current definitions
- Example path: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/`

### 2. Framework Component Tables

Added reference tables pointing to specific framework files:

```markdown
| Component             | Framework Source                          | Description          |
| --------------------- | ----------------------------------------- | -------------------- |
| TestAdapter           | .../util/testing-utils.d.ts               | Test harness         |
| HttpTransport         | .../transports/http.d.ts                  | REST transport       |
| SubscriptionTransport | .../transports/abstract/subscription.d.ts | Background execution |
```

### 3. Dynamic Framework Lookups

**Integration Test Writer:**

- Added framework reference section at the top
- Updated transport type references to point to `.d.ts` files
- Updated testing utilities references
- Added instructions to read framework source for API details

**Integration Test Validator:**

- Added framework reference section for validation
- Instructions to check framework source to verify proper usage
- References to transport types for validation

**Unit Test Writer:**

- Added framework vs custom logic distinction
- Instructions to read framework source to identify what's testable
- Clear separation of framework orchestration vs custom business logic

**Unit Test Validator:**

- Added framework boundary validation
- Instructions to check framework source to distinguish scope
- Clear criteria for what requires framework instances (not unit testable)

## Benefits

### 1. Always Up-to-Date

- Agents reference the actual framework source that's in the project
- No hardcoded snippets that could become stale
- Framework version changes are automatically reflected

### 2. Single Source of Truth

- Framework `.d.ts` files are the authority
- No duplicate information to maintain
- Reduces inconsistency risk

### 3. Better Understanding

- Agents learn to read and understand framework source
- Can adapt to framework changes
- Promotes deeper understanding over memorization

### 4. Framework-Aware Testing

- Clear distinction between framework behavior and custom logic
- Better unit vs integration test scoping
- Proper validation of framework component usage

## Framework Reference Paths

All agents now reference:

```
Framework Root:
.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/

Key Directories:
├── adapter/              # Adapter and endpoint types
├── transports/           # Transport implementations
│   ├── http.d.ts
│   ├── websocket.d.ts
│   └── abstract/         # Base transport classes
├── validation/           # Input validation
├── util/                 # Utilities
│   ├── testing-utils.d.ts  # Test harness
│   └── types.d.ts          # Response types
├── config/               # Configuration
├── cache/                # Cache implementations
└── rate-limiting/        # Rate limiting
```

## How Agents Use Framework References

### Pattern 1: Before Writing Tests

```
1. Read framework source to understand component behavior
2. Identify what's framework-provided vs custom logic
3. Write tests accordingly
```

### Pattern 2: During Validation

```
1. Check if test uses framework components correctly
2. Verify framework source for expected patterns
3. Validate scope (unit vs integration)
```

## Example Updates

### Before:

````markdown
Use `TestAdapter` from testing utils:

```ts
import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
// hardcoded example
```
````

````

### After:
```markdown
**Reference the framework testing utilities:**
- Location: `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/util/testing-utils.d.ts`
- Read the `.d.ts` file for complete API and type definitions

Use `TestAdapter` from testing utils:

```ts
import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
// minimal example - refer to framework source for details
````

````

## Migration Impact

### No Breaking Changes
- Agents still write and validate tests the same way
- Added guidance on where to find framework details
- Enhanced with dynamic framework lookup capability

### Improved Accuracy
- Tests match current framework version
- Better scoping of unit vs integration tests
- Proper framework component usage validation

## Future Maintenance

When framework updates:
1. ✅ No agent prompt updates needed
2. ✅ Agents read new framework source automatically
3. ✅ Tests adapt to new framework patterns
4. ✅ Validation checks new framework behavior

The only time agent prompts need updating is if:
- Testing philosophy changes
- New test patterns are established
- Framework architecture fundamentally changes (rare)

## Verification

To verify agents are working correctly:

1. **Check framework references resolve:**
   ```bash
   ls .yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/util/testing-utils.d.ts
````

2. **Test with Python orchestration:**

   ```bash
   python source_ea_agent.py requirements.yaml
   ```

3. **Verify tests generated match current framework patterns**

All agents now properly reference and utilize the framework source code dynamically!
