import type { Repo } from './repo'

export function intersect(list1: string[], list2: string[]): string[] {
  return [...new Set(list1).intersection(new Set(list2))].sort()
}

/**
 * Generic BFS utility: traverses a graph defined by `getNeighbors`,
 * starting from `startNodes`. Returns all reachable nodes (sorted).
 */
function bfsTransitiveClosure(
  startNodes: string[],
  getNeighbors: (node: string) => string[],
): string[] {
  if (startNodes.length === 0) return []
  const visited = new Set<string>(startNodes)
  const queue = [...startNodes]
  let i = 0
  while (i < queue.length) {
    const node = queue[i]
    i += 1
    const neighbors = getNeighbors(node).filter((n) => !visited.has(n))
    neighbors.forEach((n) => {
      visited.add(n)
      queue.push(n)
    })
  }
  return [...visited].sort()
}

export function getTransitiveReverseDependencies(packageNames: string[], repo: Repo): string[] {
  return bfsTransitiveClosure(packageNames, (pkg) => repo.getPackagesThatDependOn(pkg))
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
  const changedSet = new Set(changedPackagesRecursive)
  return bfsTransitiveClosure(packages, (pkg) => {
    const result = new Set<string>()
    // Rule 1: packages in the same changeset file(s) as this package
    const files = repo.getChangesetFilesMentioningPackage(pkg)
    repo.getPackagesFromChangesetFiles(files).forEach((p) => result.add(p))

    // Rule 2: forward dependencies of this package
    repo.getDependencies(pkg).forEach((p) => result.add(p))

    // Rule 3: packages that depend on this one (only if this package is in the changed set)
    if (changedSet.has(pkg)) {
      repo.getPackagesThatDependOn(pkg).forEach((p) => result.add(p))
    }

    return Array.from(result)
  })
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
