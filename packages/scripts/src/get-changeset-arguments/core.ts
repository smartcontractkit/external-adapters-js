import type { Repo } from './repo'

export function intersect(list1: string[], list2: string[]): string[] {
  return Array.from(new Set(list1).intersection(new Set(list2)))
}

export function getTransitiveReverseDependencies(packageNames: string[], repo: Repo): string[] {
  if (packageNames.length === 0) return []
  const missing = packageNames.find((pkg) => !repo.packageExists(pkg))
  if (missing !== undefined) {
    throw new Error(`'${missing}' is not a package in this repository.`)
  }
  const visited = new Set<string>(packageNames)
  const queue = [...packageNames]
  let i = 0
  while (i < queue.length) {
    const pkg = queue[i]
    i += 1
    const toAdd = repo.getPackagesThatDependOn(pkg).filter((r) => !visited.has(r))
    toAdd.forEach((r) => {
      visited.add(r)
      queue.push(r)
    })
  }
  return [...visited].sort()
}

/**
 * Transitive closure via BFS: for each package in packages, transitively add
 * 1. packages sharing the same changeset file
 * 2. dependencies
 * 3. reverse dependencies if the package has changes according to a changeset file
 */
export function addTransitiveDeps({
  packages,
  changedPackagesRecursive,
  repo,
}: {
  packages: string[]
  changedPackagesRecursive: string[]
  repo: Repo
}): string[] {
  const included = new Set<string>(packages)
  const queue = [...packages]
  const changedSet = new Set(changedPackagesRecursive)
  let i = 0
  while (i < queue.length) {
    const pkg = queue[i]
    i += 1

    // Rule 1: packages in the same changeset file(s) as this package
    const files = repo.getChangesetFilesMentioningPackage(pkg)
    const coMembers = repo.getPackagesFromChangesetFiles(files)
    const fromRule1 = coMembers.filter((p) => !included.has(p))
    fromRule1.forEach((p) => {
      included.add(p)
      queue.push(p)
    })

    // Rule 2: forward dependencies of this package
    const fromRule2 = repo.getDependencies(pkg).filter((p) => !included.has(p))
    fromRule2.forEach((p) => {
      included.add(p)
      queue.push(p)
    })

    // Rule 3: packages that depend on this one (only if this package is in the changed set)
    if (changedSet.has(pkg)) {
      const fromRule3 = repo.getPackagesThatDependOn(pkg).filter((p) => !included.has(p))
      fromRule3.forEach((p) => {
        included.add(p)
        queue.push(p)
      })
    }
  }
  return [...included].sort()
}

export function parseAdapterNames(args: string[]): string[] {
  return args.join(' ').replace(/,/g, ' ').split(/\s+/).filter(Boolean)
}

export function resolveAdapterPackages(adapterNames: string[], repo: Repo): string[] {
  return adapterNames.map((name) => {
    const packageName = `@chainlink/${name}-adapter`
    if (repo.packageExists(packageName)) {
      return packageName
    } else {
      throw new Error(`'${name}' is not an adapter name.`)
    }
  })
}

export interface ComputeResult {
  packagesToInclude: string[]
  packagesToIgnore: string[]
  changedPackagesRecursive: string[]
}

/**
 * Compute which packages to include (transitive) and which to ignore for
 * `yarn changeset version`. Uses only the Repo; no real I/O.
 */
export function computeChangesetIgnoreArgs(adapterPackages: string[], repo: Repo): ComputeResult {
  const changedPackagesRecursive = getTransitiveReverseDependencies(
    repo.getPackagesFromChangesetFiles(),
    repo,
  )
  const packagesToInclude = addTransitiveDeps({
    packages: adapterPackages,
    changedPackagesRecursive,
    repo,
  })
  const allPackages = repo.getAllWorkspacePackageNames()
  const includeSet = new Set(packagesToInclude)
  const packagesToIgnore = allPackages.filter((p) => !includeSet.has(p))
  return {
    packagesToInclude,
    packagesToIgnore,
    changedPackagesRecursive,
  }
}
