## Description

`<description>`

## Steps to Test

1. `yarn && yarn setup`
2. `yarn test packages/<composites|sources|targets>/<adapter-name>/test`
3. ...

## New Adapter Checklist

- [ ] Adapter was created by following [Creating a New Adapter](../../CONTRIBUTING.md#creating-a-new-adapter)
- [ ] Endpoints are built following the style of the [example adapters](../../packages/examples).
- [ ] Unit and integration tests cover all helper methods and endpoints.
- [ ] Input/outputs are built to spec.
- [ ] Code is documented with `const description = "..."` in each endpoint, and `description: "..."` in `schemas/env.json`.
- [ ] Input parameters are defined in `const inputParameters = {...}` and `export type TInputParameters = {...}` in each endpoint file.
- [ ] All environment variables are defined in `schemas/env.json` (ex. `API_KEY` and `API_SECRET` if applicable).
- [ ] `config/` contains rate limits in `limits.json`, symbol overrides in `overrides.json`, and special param "includes" in `includes.json` (only a subset of these may be required for a given EA).
- [ ] Adapter package version set to `0.0.0`.
- [ ] 2 Changesets: Follow [Generating Changesets](../../CONTRIBUTING.md#generating-changesets) to create 1 Major changeset for the new EA itself.
