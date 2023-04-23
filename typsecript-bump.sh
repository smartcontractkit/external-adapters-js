#!/bin/bash

# TYPESCRIPT_VERSION=$1

# if [[ -z "$TYPESCRIPT_VERSION" ]]; then
#   echo "No typescript version specified"
#   exit 1
# fi

# echo "Setting Typescript version: $TYPESCRIPT_VERSION"
# jq ".devDependencies.typescript = \"$TYPESCRIPT_VERSION\"" package.json > package.json.tmp
# mv package.json.tmp package.json


yarn add -E @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-config-prettier jest
yarn add -E --dev @types/eslint prettier ts-node
yarn set version stable && yarn dlx @yarnpkg/sdks vscode