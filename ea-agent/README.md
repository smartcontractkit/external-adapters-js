# EA Scaffolding Agent

AI-powered tool that scaffolds Chainlink External Adapters from YAML specifications.

## What is This?

This agent automates the creation of External Adapters (EAs) by orchestrating multiple AI agents through a three-phase workflow:

1. **Initialization** — Copies the package template and generates adapter code (transports, endpoints, config)
2. **Integration Testing** — Writes and validates integration tests with a write-validate loop
3. **Unit Testing** — Writes and validates unit tests with a write-validate loop

Each testing phase uses a writer agent followed by a validator agent, iterating until tests pass validation (up to 3 approvals required).

## Components

```
ea-agent/
├── src/
│   └── agent.py           # Main orchestrator (runs the 3-phase workflow)
├── package-template/      # EA scaffold template (copied for each new adapter)
│   ├── src/
│   │   ├── endpoint/      # Endpoint definitions (price, nav, lwba, reserve)
│   │   ├── transport/     # Transport implementations (http, ws, custom)
│   │   └── config/        # Adapter configuration
│   └── test/
│       ├── integration/   # Integration test templates
│       └── unit/          # Unit test templates
└── requests/              # YAML requirement files (input specs)

.claude/agents/
├── ea_developer.md              # System prompt: scaffolds the EA
├── ea_integration_test_writer.md    # System prompt: writes integration tests
├── ea_integration_test_validator.md # System prompt: validates integration tests
├── ea_unit_test_writer.md           # System prompt: writes unit tests
└── ea_unit_test_validator.md        # System prompt: validates unit tests
```

## Usage

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) package manager
- `ANTHROPIC_API_KEY` environment variable

### Run the Agent

```bash
uv run ea-agent/src/agent.py ea-agent/requests/OPDATA-999999-ea-name.yaml
```

The YAML file should contain the EA specification including:
- Adapter name and endpoints
- Request/response schemas
- API details (endpoint URLs, authentication)
- Transport type (HTTP, WebSocket, custom)

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (required) | API key for Claude |
| `WORKFLOW_MODEL` | `claude-opus-4-5@20251101` | Model to use |
| `VERBOSE_LOGGING` | `true` | Log all agent messages |
| `JSON_LOG_PATH` | — | Path for streaming JSON logs |
| `SUMMARY_LOG_PATH` | — | Path for final summary JSON |

### Output

The agent creates a new adapter package at:
```
packages/sources/<adapter-name>/
```

With complete source code, tests, and configuration ready for build and deployment.

