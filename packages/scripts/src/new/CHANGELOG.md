# Changelog

## 1.1.0

### Added

- Detailed README and CHANGELOG
- An example e2e test to `source` generator
- Additional variations of $ADAPTER_NAME (capitalized, all caps w/ underscores, and name w/ '-adapter' suffix)
- Added new stubs to `composite` template to avoid having a bunch of `source` adapter specific content in the README
- Check to see if the target adapter directory already exists to avoid overwriting it

### Changed

- Beefed up `sed` replacements by placing anchors to insert variations of $ADAPTER_NAME into template files
- Made `composite` generator current

### Removed

- Removed code that added content to packages/tsconfig\*.json since CONTRIBUTING.md indicated it shouldntt be there
- Dropped `jq` as a dependency to run the script (replaced by `sed`)

## 1.0.0

The original release of this script and all changes made to it up to August 5th, 2022
