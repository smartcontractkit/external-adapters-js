#!/bin/bash

function bump() (
  cd $1
  echo $1
  
  # Get current version
  current_version=$(jq -r '.dependencies."@chainlink/external-adapter-framework"' package.json)
  # Install latest version, pinned
  yarn add @chainlink/external-adapter-framework -E > /dev/null # Silence output
  latest_version=$(jq -r '.dependencies."@chainlink/external-adapter-framework"' package.json) # Get final version

  if [[ $current_version == $latest_version ]] ; then
    echo "Package $1 already at latest version $latest_version"
  else
    echo "Bumped framework version in package $1 from version $current_version to version $latest_version"
  fi
)

cd packages

if [[ -n "$1" ]]; then
  # Run bump only for one package
  if jq -e 'if (.dependencies."@chainlink/external-adapter-framework" != null) then true else false end' "sources/${1}/package.json" > /dev/null ; then
    echo "Will only bump framework version for package sources/$1"
    bump "sources/$1"
  else
    echo "Package $1 does not exist or use EA v3"
  fi
else
  echo "Bumping versions for all available source packages and scripts"
  bump scripts/

  for d in sources/* ; do
    if [[ $d == "sources/README.md" ]] ; then
      continue
    fi

    if jq -e 'if (.dependencies."@chainlink/external-adapter-framework" != null) then true else false end' "${d}/package.json" > /dev/null ; then
      bump "$d"
    fi
  done
fi

cd ..

# Remove the auth token from .yarnrc to avoid leaking tokens
git restore .yarnrc.yml

