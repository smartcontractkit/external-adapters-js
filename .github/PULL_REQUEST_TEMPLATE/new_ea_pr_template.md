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
- [ ] API credentials (ex. `API_KEY` and `API_SECRET` if applicable) are found in `schemas/env.json`.
- [ ] Any rate limits are set in `config/limits.json` and known symbol overrides in `config/overrides.json`.
- [ ] Adapter package version set to `0.0.0`.
- [ ] 2 Changesets: 1 Major upgrade for the new EA itself, and 1 Minor upgrade for `ea-bootstrap` regarding the addition of a new adapter to `legos`.
