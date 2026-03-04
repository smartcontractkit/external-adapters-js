#!/bin/bash -e

# Returns a transitive list of reverse dependencies within the repository,
# including the input list of packages. Does not include reverse dependencies
# from devDependencies or peerDependencies.

if [[ "$#" = "0" ]]; then
  echo "Usage: $0 <list of packages to get reverse dependencies of>" >&2
  exit 1
fi

packages="$*"

for package_name in $packages; do
  if ! git grep -q '"name": "'"$package_name"'"' packages; then
    echo "'$package_name' is not a package in this repository." >&2
    exit 1
  fi
done

add_reverse_package_deps() {
  packages="$1"
  {
    for package in $packages; do
      echo $package
      # git grep is a fast way to find candidate package.json files that probably depend on $package
      for reverse_dep_package_file in $(git grep -l '"'"$package"'": "' 'packages/*/*/package.json'); do
        # Check to make sure the candidate package.json file actually depends on $package
        if jq -e --arg package "$package" '[ .dependencies | select(. | has($package)) ] | length > 0' "$reverse_dep_package_file" > /dev/null; then
          jq -r '.name' "$reverse_dep_package_file"
        fi
      done
    done
  } | sort -u
}

new_packages=$(add_reverse_package_deps "$packages")
while [[ "$new_packages" != "$packages" ]]; do
  packages="$new_packages"
  new_packages="$(add_reverse_package_deps "$packages")"
done

echo "$packages"
