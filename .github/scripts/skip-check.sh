#!/bin/bash

COMMIT_SHA=$1
CHECK_NAME=$2

if [[ ! $COMMIT_SHA ]]; then
  echo "A commit SHA needs to be provided"
  exit 1
elif [[ ! $CHECK_NAME ]]; then
  echo "A name for the check to skip needs to be provided"
  exit 1
fi

curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/smartcontractkit/external-adapters-js/check-runs \
  -d "{
    \"name\": \"$CHECK_NAME\",
    \"head_sha\": \"$COMMIT_SHA\",
    \"status\": \"completed\",
    \"conclusion\": \"skipped\"
  }"