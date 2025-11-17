#!/bin/bash -e

# Return a list of packages that is pending release
git grep -Eh "^'@chainlink/[^']*': (major|minor|patch)$" .changeset |
  sed -E "s#^'(@chainlink/[^']*)': (major|minor|patch).*\$#- \\1#" |
  sort -u
