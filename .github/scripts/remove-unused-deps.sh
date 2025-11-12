#!/bin/bash -e

for x in packages/*/*/tsconfig.test.json; do
  package_dir=$(dirname "$x")
  unused_deps=($(yarn depcheck $package_dir --json | jq -r '.dependencies[]'))
  if [ ${#unused_deps[@]} -gt 0 ]; then
    echo "Removing ${unused_deps[*]} from $package_dir"
    yarn --cwd "$package_dir" remove "${unused_deps[@]}" > /dev/null
  fi
done
