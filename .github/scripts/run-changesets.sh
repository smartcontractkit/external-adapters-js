#!/bin/bash -e

# Run changesets
yarn changeset version

# Recover all our changes (readmes, version bump)
git stash pop