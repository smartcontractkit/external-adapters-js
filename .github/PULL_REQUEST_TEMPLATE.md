<!-- Employees: Please use Clubhouse/Shortcuts's "Open PR" button from the relevant story or include links to relevant Clubhouse/Shortcut stories in your branch name, commit messages, or pull request comments. Do not add links to your pull request description, they will be ignored. https://help.clubhouse.io/hc/en-us/articles/207540323-Using-The-Clubhouse-GitHub-Integration -->

<!-- Employees: Delete this section. -->

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

- [ ] Ran `yarn changeset` if adapter source code was changed
- [ ] If a new adapter was made, or an existing one was modified so that its environment variables have changed, update the relevant `<ADAPTER_PACKAGE>/schemas/env.json` and `<ADAPTER_PACKAGE>/README.md`
- [ ] If a new adapter was made, or an existing one was modified so that its environment variables have changed, update the relevant `infra-k8s` configuration file.
- [ ] The branch naming follows git flow (`feature/x`, `chore/x`, `release/x`, `hotfix/x`, `fix/x`) or is created from Clubhouse/Shortcut
- [ ] This is related to a maximum of one Clubhouse/Shortcut story or GitHub issue
- [ ] Types are safe (avoid TypeScript/TSLint features like any and disable, instead use more specific types)
