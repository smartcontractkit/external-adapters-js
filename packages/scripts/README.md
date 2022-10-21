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
