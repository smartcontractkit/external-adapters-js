# Scripts

Folder containing various scripts and functions to make development simpler.

**Table of Contents**

- [Master List Generator](#master-list-generator)
- [README Generator](#readme-generator)

---

## [Master List Generator](./src/generate-master-list)

The Master List Generator is a tool used to automatically generate the root [MASTERLIST.md](../../MASTERLIST.md), [composites/README.md](../composites/README.md), [sources/README.md](../sources/README.md), and [targets/README.md](../targets/README.md). There are a number of ways to use the tool:

### Auto-Generation

When code is merged to `develop`, a github workflow runs the `generate:master-list` script, which collects data on each adapter such as endpoints, package versions, and test support.

### Manual Usage

If you would like to see the output of the script ahead of time, you can run it from the command line. This operation will generate the new documentation locally, and skips any adapters that have issues when trying to pull config data from them.

**Note: All examples assume the user is in the [root](../../) of the `external-adapters-js` repo.**

Generate all adapter list documentation:

```bash
yarn generate:master-list
```

Generate all adapter list documentation with verbose logging. This is useful when determining the reason for `unknown` entries in the master list:

```bash
yarn generate:readme -v
```

---

## [README Generator](./src/generate-readme)

The README Generator is a tool used to automatically regenerate README files for source adapters. When a new source adapter is added or existing ones updated, the script will automatically regenerate the files in a separate PR when changes are merged to `develop`. There are a number of ways to use the tool:

### Auto-Generation

When code is merged to `develop`, a github workflow runs the `generate:readme` script, which pulls all adapters from the `/source` directory, then filters out adapters from the [blacklist](./src/generate-readme/readmeBlacklist.json) so it only operates on adapters that meet the requirements for README auto-generation. The removed set includes composite adapters, target adapters, adapters without integration tests, and adapters with incorrect file structures. Finally, the script runs through each adapter and collects data from relevant files, then constructs each README and saves them if no errors occurred during the collection process. The generation process as a whole takes several minutes if you wish to generate READMEs for every adapter, but this will usually only need to happen in the github workflows.

### Manual Usage

If you would like to see the output of the constructed README(s) ahead of time, you can run the script from the command line. This operation will generate the new READMEs locally, but if an adapter does not meet the requirements for the README to be generated, the script will exit without saving any change.

**Note: All examples assume the user is in the [root](../../) of the `external-adapters-js` repo.**

Generate a single README (excluding blacklist):

```bash
yarn generate:readme <adapter-name>
```

Generate multiple READMEs (excluding blacklist):

```bash
yarn generate:readme <adapter-1> <adapter-2> ...
```

Generate README with verbose logging:

```bash
yarn generate:readme -v <adapter-name> ...
```

Generate all non-blacklisted READMEs (`-v` is encouraged for monitoring since this operation takes a while):

```bash
yarn generate:readme -a -v
```

Generate README for any adapter outside the source directory (only works for 1 adapter at a time):

```bash
yarn generate:readme -t <path-to-adapter>
```

# [New EA Generator](./src/new)

This script is used to initialize a new V2 external adapter by updating the monorepo's configuration and then creating all required files for a new `source` or `composite` adapter under `packages/$ADAPTER_NAME`

## Usage

To use this script, run `yarn new source|composite adapter-name` at the root of the monorepo.

## Behavior

At a high level, this generator copies template files from [packages/examples](../examples/) and does a few replacements on text anchors.

After the generator has been run, several of the files it creates will require manual changes and verification. Further details are bleow.

### Files created by the generator

Please use the following legend for this section:

| Color                                                                                      | Meaning                                                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| <span style="color:green">Green</span>                                                     | Boilerplate that shouldn't require changes                         |
| <span style="color:yellow">Yellow</span>                                                   | Example content that can be leveraged or deleted                   |
| <span style="color:red">Red</span>                                                         | Content that requires manual verification and/or changes           |
| <span style="color:magenta">(source)</span> or <span style="color:cyan">(composite)</span> | A file that's exclusive to either `source` or `composite` adapters |

- dist/
- schemas/
  - <span style="color:red">env.json</span>
- src/
  - config/
    - <span style="color:yellow">includes.json</span> <span style="color:magenta">(source)</span>
    - <span style="color:red">index.ts</span>
    - <span style="color:yellow">limits.json</span> <span style="color:magenta">(source)</span>
    - <span style="color:yellow">symbols.json</span> <span style="color:magenta">(source)</span>
  - endpoint/
    - <span style="color:yellow">example.ts</span>
    - <span style="color:red">index.ts</span>
  - <span style="color:green">adapter.ts</span>
  - <span style="color:green">index.ts</span>
  - <span style="color:yellow">dataProvider.ts</span> <span style="color:cyan">(composite)</span>
  - <span style="color:yellow">types.ts</span>
  - test/
    - e2e/ <span style="color:magenta">(source)</span>
      - <span style="color:yellow">example.test.ts</span> <span style="color:magenta">(source)</span>
      - <span style="color:green">README.md</span> <span style="color:magenta">(source)</span>
    - integration/
      - \_\_snapshots\_\_/
      - <span style="color:yellow">example.test.ts</span>
      - <span style="color:red">fixtures.test.ts</span>
      - <span style="color:green">README.md</span>
    - unit/
      - <span style="color:yellow">example.test.ts</span>
      - <span style="color:green">README.md</span>
  - <span style="color:red">CHANGELOG.md</span>
  - <span style="color:red">package.json</span>
  - <span style="color:yellow">README.md</span>
  - <span style="color:red">test-payload.json</span>
  - <span style="color:green">tsconfig.json</span>
  - <span style="color:green">tsconfig.test.json</span>

### Required post-generation changes

Below are the files that require manual changes once the generator has been run

- schemas/
  - <span style="color:red">env.json</span>: Top level configuration file for the EA. Has a title, description, and parameter fields that need to be verified, and will likely need to be changed.
- src/
  - config/
    - <span style="color:yellow">includes.json</span> <span style="color:magenta">(source)</span>: Complex transformation rules for symbols
    - <span style="color:red">index.ts</span>: [EA configuration](../core/bootstrap/remotedev.sh#configuration) used by the EA, including defauls to use in the absence of environment variables.
    - <span style="color:yellow">limits.json</span> <span style="color:magenta">(source)</span>: Configuration for [rate limiting](../core/bootstrap/README.md#rate-limiting)
    - <span style="color:yellow">symbols.json</span> <span style="color:magenta">(source)</span>: Simple transformations for currency symbols (ex: BTC -> WBTC)
  - endpoint/ (source)
    - <span style="color:red">index.ts</span>: The index for all endpoints in the `source` EA. Must be updated to reflect the EA's endpoints when implemented
    - <span style="color:yellow">example.ts</span>: The generator provides sample code for an `/example` endpoint. This code is mostly present for use as an example.
  - <span style="color:yellow">types.ts</span>: Central type definitions for the EA
  - test/
    - e2e/ <span style="color:magenta">(source)</span>
      - <span style="color:yellow">example.test.ts</span> <span style="color:magenta">(source)</span>: An example end-to-end test that can be used as a template for real tests
  - integration/
    - <span style="color:yellow">example.test.ts</span>: An example integration test that can be used as a template for real tests
    - <span style="color:red">fixtures.test.ts</span>: Mocks that must be updated to reflect the EA's actual endpoints
  - unit/
    - <span style="color:yellow">example.test.ts</span> (source): An example unit test that can be used as a template for real tests
      =An item that can be deleted if unused
  - <span style="color:red">CHANGELOG.md</span>: Should be updated with v1.0.0 information prior to submitting a pull request
  - <span style="color:yellow">README.md</span>: Should not be changed if creating a `source` adapter because [READMEs are generated](src/generate-readme). **Must be updated if creating a `composite` adapter.**
  - <span style="color:red">package.json</span>: Should verify title, description, and version.
  - <span style="color:red">test-payload.json</span>: Payload used by the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#define-a-liveness-command) to verify that the EA process is healthy. Should be updated to reflect the `InputParameters` of the default endpoint.

### Additional changes made by the generator

The generator will update several files in the monorepo to inform the monorepo of the newly created adapter. Below are all the files that are changed when the generator is run:

- packages/core/legos/
  - package.json <span style="color:magenta">(source)</span>: Adds the adapter to `dependencies`
  - tsconfig.json <span style="color:magenta">(source)</span>: Adds the adapter to `references`
  - tsconfig.test.json <span style="color:magenta">(source)</span>: Adds the adapter to `references`
  - sources.ts <span style="color:magenta">(source)</span>: Adds the adapter to the default export
