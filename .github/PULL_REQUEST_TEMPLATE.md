## Closes #ISSUE_NUMBER_GOES_HERE

## Description

......

## Changes

- High level
- changes that
- you made

<!-- Acceptance testing steps, automated tests should _always_ be included -->

## Steps to Test

1. Steps
2. to
3. test

## Quality Assurance

- [ ] If a new adapter was made, or an existing one was modified so that its environment variables have changed, update the relevant `infra-k8s` configuration file.
- [ ] If a new adapter was made, or an existing one was modified so that its environment variables have changed, update the relevant `adapter-secrets` configuration file or update the [soak testing blacklist](/packages/scripts/src/get-changed-adapters/soakTestBlacklist.ts).
- [ ] If a new adapter was made, or a new endpoint was added, update the `test-payload.json` file with relevant requests.
- [ ] The branch naming follows git flow (`feature/x`, `chore/x`, `release/x`, `hotfix/x`, `fix/x`) or is created from Jira.
- [ ] This is related to a maximum of one Jira story or GitHub issue.
- [ ] Types are safe (avoid TypeScript/TSLint features like any and disable, instead use more specific types).
- [ ] All code changes have 100% unit and integration test coverage. If testing is not applicable or too difficult to justify doing, the reasoning should be documented explicitly in the PR.
