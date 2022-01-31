# Scripts

Folder containing various scripts and functions to make development simpler.

**Table of Contents**

- [README Generator](#Readme-Generator)

## [README Generator](./src/generate-readme)

The README Generator is a tool used to automatically regenerate README files for source adapters. When a new source adapter is added or existing ones updated, the script will automatically regenerate the files on commit. There are a number of ways to use the tool:

### Auto-Generation

When a user runs `git commit -m "<Message here>"`, the script takes all staged files and compiles a list of updated source adapters from the list. This is done in the [husky pre-commit step](../../.husky/pre-commit). It will then filter out adapters from the [blacklist](./src/generate-readme/readmeBlacklist.json) so it only operates on adapters that meet the requirements for README auto-generation. Namely, composite adapters, target adapters, adapters without integration tests, and adapters with incorrect file structures are currently blacklisted. Finally, the script runs through each adapter and collects data from relevant files, then constructs each README and saves them if no errors occurred in the collection process. If you make changes to many adapters in a single PR, expect the README generation process to take up to ~10 seconds to complete. If you modify the integration tests for many adapters, expect it to significantly longer.

### Manual Usage

If you would like to see the output of the constructed README ahead of time, you can run the script from the command line. This operation will not stage the README unless you pass a specific flag to it, and if an adapter does not meet the requirements for the README to be generated, the script will exit without saving any change.

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
