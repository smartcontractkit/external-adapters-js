# Source EA Agent

AI-powered tool that scaffolds Chainlink Source External Adapters from YAML specifications.

## How It Works

The agent uses the [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk) to orchestrate a 4-phase workflow:

```
YAML Spec → Developer → Code Review → Integration Tests → Unit Tests → Done
```

```mermaid
flowchart TD
    A[YAML Spec] --> B[EA Developer]
    B --> C[Code Reviewer]
    C -->|rejected| B
    C -->|approved| D[Integration Test Writer]
    D --> E{Validator}
    E -->|rejected| D
    E -->|3 approvals| F[Unit Test Writer]
    F --> G{Validator}
    G -->|rejected| F
    G -->|3 approvals| H[Done]
```

| Phase | What Happens |
|-------|--------------|
| **1. Development** | Scaffolds EA with `yarn new`, implements transports/endpoints using framework components |
| **2. Code Review** | Validates code quality; loops back to developer if rejected |
| **3. Integration Tests** | Writes tests, validates with 3 approval rounds |
| **4. Unit Tests** | Writes tests, validates with 3 approval rounds |

## Using the Framework

The agent generates EAs using **[@chainlink/external-adapter-framework](https://www.npmjs.com/package/@chainlink/external-adapter-framework)**.

The developer agent reads the framework's `.d.ts` type definitions to understand available components:

```
.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/
  node_modules/@chainlink/external-adapter-framework/
    ├── transports/     # HttpTransport, WebSocketTransport, SseTransport
    ├── adapter/        # Adapter, PriceAdapter, endpoints
    ├── config/         # AdapterConfig
    └── validation/     # InputParameters, errors
```

Based on the YAML requirements, the agent selects appropriate components:

| Component | Options | Selected When |
|-----------|---------|---------------|
| Transport | `HttpTransport`, `WebSocketTransport`, `SseTransport` | REST API, streaming, SSE |
| Endpoint | `PriceEndpoint`, `LwbaEndpoint`, `AdapterEndpoint` | Price feeds, bid/ask, generic |
| Adapter | `PriceAdapter`, `Adapter` | Price feeds, other |

### Generated Structure

```
packages/sources/<adapter-name>/
├── src/
│   ├── index.ts           # Adapter with expose()
│   ├── config/index.ts    # AdapterConfig
│   ├── endpoint/*.ts      # Endpoints
│   └── transport/*.ts     # Transports
├── test/
│   ├── integration/
│   └── unit/
└── test-payload.json
```

## Quick Start

### Prerequisites

- Python 3.11+ with [uv](https://github.com/astral-sh/uv)
- Claude Code CLI: `npm install -g @anthropic-ai/claude-code`
- `ANTHROPIC_API_KEY` environment variable

### Run

```bash
cd ea-agent && uv sync
uv run python src/source_ea_agent.py requests/OPDATA-123-my-adapter.yaml
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | required | Claude API key |
| `WORKFLOW_MODEL` | `claude-opus-4-5@20251101` | Model to use |
| `VERBOSE_LOGGING` | `true` | Log all messages |

## GitHub Actions

The agent runs automatically via `.github/workflows/generate-ea.yml`.

### Trigger Options

1. **Add YAML to PR** — Push a YAML file to `ea-agent/requests/`
2. **Comment** — Type `/generate-ea` on any PR with a YAML file

### What Happens

1. Detects YAML in `ea-agent/requests/`
2. Runs all 4 phases
3. Commits generated code to PR

## Project Structure

```
ea-agent/
├── src/source_ea_agent.py    # Main orchestrator
├── scripts/setup-ea-env.sh   # CI environment setup
└── requests/                 # YAML requirement files

.claude/agents/
├── ea_developer.md           # Development agent prompt
├── ea_code_reviewer.md       # Code review agent prompt
├── ea_integration_test_*.md  # Integration test agents
└── ea_unit_test_*.md         # Unit test agents
```

## Interactive Use

Reference agent prompts directly in Cursor with `@` mentions:

```
@ea_developer.md Scaffold an EA for packages/sources/my-adapter
```

| Agent | File | Purpose |
|-------|------|---------|
| Developer | `@ea_developer.md` | Scaffold new adapter |
| Reviewer | `@ea_code_reviewer.md` | Review code quality |
| Test Writers | `@ea_*_test_writer.md` | Write tests |
| Test Validators | `@ea_*_test_validator.md` | Validate tests |
