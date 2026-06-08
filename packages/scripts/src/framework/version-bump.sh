#!/usr/bin/env bash -e

LATEST_VERSION=$(npm view @chainlink/external-adapter-framework version)''

function bump() (
  package=$1
  cd $package
  # echo "Checking $package..."

  if jq -e "if (.dependencies.\"@chainlink/external-adapter-framework\" != null and .dependencies.\"@chainlink/external-adapter-framework\" != \"$LATEST_VERSION\") then true else false end" package.json > /dev/null ; then
    current_version=$(jq -r '.dependencies."@chainlink/external-adapter-framework"' package.json) 
    echo "Bumping dependency for package $package from $current_version to $LATEST_VERSION"
    jq ".dependencies.\"@chainlink/external-adapter-framework\" = \"$LATEST_VERSION\"" package.json > package.json.tmp
    mv package.json.tmp package.json
    changed=true
  fi

  if jq -e "if (.devDependencies.\"@chainlink/external-adapter-framework\" != null and .devDependencies.\"@chainlink/external-adapter-framework\" != \"$LATEST_VERSION\") then true else false end" package.json > /dev/null ; then
    current_version=$(jq -r '.devDependencies."@chainlink/external-adapter-framework"' package.json) 
    echo "Bumping dev dependency for package $package from $current_version to $LATEST_VERSION"
    jq ".devDependencies.\"@chainlink/external-adapter-framework\" = \"$LATEST_VERSION\"" package.json > package.json.tmp
    mv package.json.tmp package.json
    changed=true
  fi

  # Ignore scripts and root, those are not adapters
  if [[ $changed && "$package" != "../" && "$package" != "scripts" ]]; then
    echo "Package $package was changed, adding to list..."
    echo "'$(jq -r '.name' package.json)': patch" >> ../../../changed_eas.tmp
  fi
)

touch changed_eas.tmp
cd packages

# Build list of packages or get it from the command line args
if [[ -n "$1" ]]; then
  echo "Will use package list from CLI args."
  packages=$@
else
  echo "Building list with all packages..."
  packages=$(find . -type d \( -path "*/sources/*" -o -path "*/composites/*" -o -path "*/targets/*" -o -path "*/non-deployable/*" \) -maxdepth 2 -print)
  packages+=('scripts')
  packages+=('../') # root package
fi

# Do a manual replacement of the versions
echo "Checking packages one by one..."
for p in ${packages[@]}; do
  bump "$p"
done

# # Run yarn to update all dependencies for the monorepo
cd ..
echo "Running yarn..."
yarn > /dev/null

if [ -s changed_eas.tmp ]; then
  # We create a separate changeset file for each package so we don't enforce
  # releasing all packages at the same time.
  mapfile -t changeset_lines < changed_eas.tmp
  count=${#changeset_lines[@]}
  # Create changeset names with a single call to yarn node as calling it 100+
  # times is quite slow.
  mapfile -t changeset_names < <(cd packages/scripts && yarn node -e "
    const { humanId } = require('human-id')
    for (let i = 0; i < $count; i++) console.log(humanId({ separator: '-', capitalize: false }))
  ")
  for i in "${!changeset_lines[@]}"; do
    # Generate changeset (manually for now, since the changesets CLI has no options to automate this part)
    changeset_filename="${changeset_names[$i]}.md"
    echo "Creating changeset ($changeset_filename)..."
    printf '%s\n%s\n%s\n\nBumped framework version\n' "---" "${changeset_lines[$i]}" "---" > ".changeset/$changeset_filename"
  done
else
  echo "No adapters were changed, no need to create a changeset."
fi

# Clean up tmp files
rm changed_eas.tmp

echo "Done!"

