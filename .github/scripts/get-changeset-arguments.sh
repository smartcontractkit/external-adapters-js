#!/bin/bash -e

# This script takes a list of adapter names to release and outputs the
# arguments to pass to `yarn changeset version`.
#
# By default `yarn changeset version` will consume all changesets. If we want
# to release a subset of packages, the only way to tell changeset is to tell
# it which packages to ignore.
# It is not allowed to ignore a package in a changeset without ignoring all
# the packages in that changeset. And it is not allowed to ignore a package
# that is a dependency of a package that is not ignored.

if [[ -z "$*" ]]; then
  # Output to stderr and exit 0 because an empty list is valid input and
  # should result in zero changeset arguments.
  # So there should be no output to stdout and success exit code.
  echo "Usage: $0 <possible empty list of adapters to release>" >&2
  exit 0
fi

add_package_deps() {
  packages="$1"
  {
    for package in $packages; do
      echo $package
      package_file="$(git grep -l '"name": "'"$package"'"' packages)"
      jq -r '.dependencies | keys[]' "$package_file" | grep '@chainlink/' | grep -v '@chainlink/external-adapter-framework'
    done
  } | sort -u
}

get_packages_from_changeset_files() {
  git grep -Eh "^'@chainlink/[^']*-adapter': (major|minor|patch)$" "$@" | sed -E "s#^'(@chainlink/[^']*-adapter)': (major|minor|patch).*\$#\\1#" | sort -u
}

add_changeset_deps() {
  packages="$1"
  {
    for package in $packages; do
      pattern="^'$package': (major|minor|patch)\$"
      for changeset_file in $(git grep -lE "$pattern" .changeset); do
        get_packages_from_changeset_files "$changeset_file"
      done
    done
  } | sort -u
}

add_deps() {
  packages="$1"
  packages=$(add_changeset_deps "$packages")
  packages=$(add_package_deps "$packages")
  echo "$packages"
}

add_transitive_deps() {
  packages="$1"
  new_packages=$(add_deps "$packages")
  while [[ "$new_packages" != "$packages" ]]; do
    packages="$new_packages"
    new_packages="$(add_deps "$packages")"
  done
  echo "$packages"
}

get_adapter_packages() {
  adapter_names="$(echo "$*" | sed -e 's/ *, */ /g')"
  for adapter_name in $adapter_names; do
    package_name="@chainlink/${adapter_name}-adapter"
    if git grep -q '"name": "'"$package_name"'"' packages; then
      echo "$package_name"
    else
      echo "'$adapter_name' is not an adapter name." >&2
      exit 1
    fi
  done
}

adapter_packages="$(get_adapter_packages $*)"

packages_to_include="$(add_transitive_deps "$adapter_packages")"

if [[ -z "$packages_to_include" ]]; then
  echo "'$*' does not result in anything to release." >&2
  exit 1
fi

echo "Not ignoring the following transitive dependencies:" >&2
echo "$packages_to_include" >&2

all_packages=$(yarn workspaces list --json | jq -r '.name' | grep -v '@chainlink/external-adapters-js')
packages_to_ignore=$(echo "$all_packages" | grep -vFf <(echo "$packages_to_include"))

echo "$packages_to_ignore" | sed -E 's|^.+|--ignore &|' | tr '\n' ' '
