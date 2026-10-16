# EAF framework source paths (Yarn unplugged)

After `yarn install` at the **external-adapters-js** repo root, framework sources live under:

**Base:** `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/`

Use the resolved path when reading files (glob may match one version directory).

## By concern

| Concern                                                             | Path (relative to base)                       |
| ------------------------------------------------------------------- | --------------------------------------------- |
| Package root / discovering components                               | `.` (browse `package.json`, exports)          |
| Testing utils (`TestAdapter`, `MockWebsocketServer`, timer helpers) | `util/testing-utils.d.ts`                     |
| Response / adapter types                                            | `util/types.d.ts`                             |
| HTTP transport                                                      | `transports/http.d.ts`                        |
| Subscription / background execution                                 | `transports/abstract/subscription.d.ts`       |
| All transports                                                      | `transports/`                                 |
| Input / schema validation                                           | `validation/`, `validation/input-params.d.ts` |
| Adapter lifecycle, basic adapter                                    | `adapter/`, `adapter/basic.d.ts`              |

When instructions say “read framework source,” use these paths to confirm patterns instead of guessing from memory.
