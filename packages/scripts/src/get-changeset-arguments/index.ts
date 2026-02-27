import { computePackagesToIgnore, parseAdapterNames, resolveAdapterPackages } from './lib'
import { createRealRepo } from './realRepo'

// This script takes a list of adapter names to release and outputs the
// arguments to pass to `yarn changeset version`.
// By default `yarn changeset version` will consume all changesets. If we want
// to release a subset of packages, the only way to tell changeset is to tell
// it which packages to ignore.
// It is not allowed to ignore a package in a changeset without ignoring all
// the packages in that changeset. And it is not allowed to ignore a package
// that is a dependency of a package that is not ignored.
export function run(repo = createRealRepo()): void {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error(
      'Usage: yarn get-changeset-arguments <possible empty list of adapters to release>',
    )
    process.exit(0)
  }

  try {
    const adapterNames = parseAdapterNames(args)
    const adapterPackages = resolveAdapterPackages(adapterNames, repo)
    const { packagesToInclude, packagesToIgnore, packagesToRelease } = computePackagesToIgnore(
      adapterPackages,
      repo,
    )

    if (packagesToInclude.length === 0) {
      console.error(`'${args.join(' ')}' does not result in anything to release.`)
      process.exit(1)
    }

    console.error('Not ignoring the following transitive dependencies:')
    console.error(packagesToInclude.join('\n'))
    console.error('')
    console.error('Expecting the following packages to be released:')
    console.error(packagesToRelease.join('\n'))
    console.error('')

    const output = packagesToIgnore.map((p) => `--ignore ${p}`).join(' ')
    console.log(output)
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  run()
}
