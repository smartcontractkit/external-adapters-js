# Copilot Instructions for Chainlink External Adapters JS Monorepo

## Big Picture Architecture
- **Monorepo Structure:** All adapters and supporting code are organized under `packages/`. Key subfolders:
  - `sources/`: Adapters that fetch data from external APIs/providers
  - `targets/`: Adapters that write data to blockchains or other destinations
  - `composites/`: Adapters that combine multiple sources for complex logic
  - `core/`: Shared framework code used by all adapters
  - `non-deployable/`: Utility adapters not meant to run standalone
  - `scripts/`: Node.js scripts for repo management and automation
  - `k6/`: Performance testing scripts
- **Grafana Integration:** Monitoring and metrics via `grafana/` (see its README for setup and usage)
- **Adapters:** Each adapter is a self-contained package with its own README, tests, and configuration. See `MASTERLIST.md` for a full inventory and details.

## Developer Workflows
- **Install dependencies:** `yarn` (from repo root)
- **Setup/build:** `yarn setup` (compiles TypeScript, prepares all packages)
- **Clean:** `yarn clean` (removes build artifacts)
- **Run adapter (HTTP server):**
  ```sh
  cd packages/sources/<adapter>
  yarn start
  ```
- **Run adapter (Docker):**
  1. `yarn generate:docker-compose`
  2. `docker-compose -f docker-compose.generated.yaml build <adapter-name>`
  3. `docker-compose -f docker-compose.generated.yaml run -p 8080:8080 -e API_KEY=... <adapter-name>`
- **Single-command Docker app:**
  ```sh
  cd grafana && ./scripts/compose.sh <adapter1> <adapter2>
  ```
- **Testing:**
  - All: `yarn test:unit` / `yarn test:integration`
  - Per adapter: `yarn test packages/sources/<adapter>/test/unit`
  - Watch mode: `yarn test --watch packages/sources/<adapter>/test/unit`

## Project-Specific Conventions
- **Environment Variables:** Each adapter requires specific env vars (see its README). Common options documented [here](https://github.com/smartcontractkit/ea-framework-js/blob/main/docs/reference-tables/ea-settings.md).
- **Versioning:** Semantic versioning, releases managed via changesets. See `External Adapters Versioning` in root README.
- **Docker Compose Naming:** Adapter services use `<adapter-name>-adapter` format.
- **Testing:** Unit/integration tests use mocks; e2e tests may require real env vars.
- **Advanced Features:** Caching, rate limiting, overrides, etc. are handled via `ea-framework-js` (see its docs).

## Integration Points & Patterns
- **External APIs:** Adapters in `sources/` integrate with third-party APIs; see each adapter's README for details.
- **Blockchain Interaction:** Adapters in `targets/` and some in `sources/` interact with blockchains (e.g., via RPC URLs).
- **Performance Testing:** Use `k6/` scripts for load/performance tests.
- **Monitoring:** Prometheus and Grafana dashboards available (see `grafana/README.md`).

## Key References
- Root `README.md`: Overall architecture, workflows, and commands
- `MASTERLIST.md`: Adapter inventory and metadata
- Each adapter's `README.md`: Env vars, endpoints, usage, and examples
- `grafana/README.md`: Monitoring setup
- [ea-framework-js docs](https://github.com/smartcontractkit/ea-framework-js/tree/main/docs): Advanced features

---
**Feedback:** If any section is unclear or missing, please specify which workflows, conventions, or integration points need more detail.
