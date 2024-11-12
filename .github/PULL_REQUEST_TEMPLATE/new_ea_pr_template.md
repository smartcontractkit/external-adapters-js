## Description

`<description>`

## Steps to Test

1. `yarn && yarn setup`
2. `yarn test packages/<composites|sources|targets>/<adapter-name>/test`
3. ...

## New Adapter Checklist

- [ ] Adapter was created by following [Creating a New Adapter](../../CONTRIBUTING.md#creating-a-new-adapter)
- [ ] Unit and integration tests cover all helper methods and endpoints.
- [ ] Endpoints and input parameters are defined in the respective endpoint files.
- [ ] Transports are defined in respective transport files and are connected to endpoints.
- [ ] All environment variables are defined in `src/config/index.ts` (ex. `API_KEY` and `API_SECRET` if applicable).
- [ ] Rate limits are provided to Adapter interface in `src/index.ts`
- [ ] `src/config/` contains symbol overrides in `overrides.json`, and special param "includes" in `includes.json` (only a subset of these may be required for a given EA).
- [ ] Adapter package version set to `0.0.0`.
- [ ] Changesets: Follow [Generating Changesets](../../CONTRIBUTING.md#generating-changesets) to create 1 Major changeset for the new EA itself.
