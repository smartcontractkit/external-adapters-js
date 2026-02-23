import type { RepoAdapter } from './repoAdapter'

/** Intersection of two lists (order of list1 preserved, then sorted) */
export function intersect(list1: string[], list2: string[]): string[] {
  const set2 = new Set(list2)
  return [...list1.filter((p) => set2.has(p))].sort()
}

/** Transitive reverse dependencies using the adapter (fixpoint of getPackagesThatDependOn) */
export function getReverseDependencies(packageNames: string[], adapter: RepoAdapter): string[] {
  if (packageNames.length === 0) return []
  for (const pkg of packageNames) {
    if (!adapter.packageExists(pkg)) {
      throw new Error(`'${pkg}' is not a package in this repository.`)
    }
  }
  let packages = [...packageNames]
  let next = new Set(packages)
  for (const pkg of packages) {
    for (const r of adapter.getPackagesThatDependOn(pkg)) next.add(r)
  }
  let nextArr = [...next].sort()
  while (nextArr.length !== packages.length || nextArr.some((p, i) => p !== packages[i])) {
    packages = nextArr
    next = new Set(packages)
    for (const pkg of packages) {
      for (const r of adapter.getPackagesThatDependOn(pkg)) next.add(r)
    }
    nextArr = [...next].sort()
  }
  return nextArr
}

function addChangedReversePackageDeps(
  packages: string[],
  changedPackagesRecursive: string[],
  adapter: RepoAdapter,
): string[] {
  const kept = new Set(packages)
  const onlyChanged = intersect(packages, changedPackagesRecursive)
  const reverse = getReverseDependencies(onlyChanged, adapter)
  for (const p of reverse) kept.add(p)
  return [...kept].sort()
}

function addPackageDeps(packages: string[], adapter: RepoAdapter): string[] {
  const result = new Set<string>(packages)
  for (const pkg of packages) {
    const deps = adapter.getDependencies(pkg)
    for (const dep of deps) result.add(dep)
  }
  return [...result].sort()
}

function addChangesetDeps(packages: string[], adapter: RepoAdapter): string[] {
  const result = new Set<string>(packages)
  for (const pkg of packages) {
    const files = adapter.getChangesetFilesMentioningPackage(pkg)
    const fromFiles = adapter.getPackagesFromChangesetFiles(files)
    for (const p of fromFiles) result.add(p)
  }
  return [...result].sort()
}

function addDeps(
  packages: string[],
  changedPackagesRecursive: string[],
  adapter: RepoAdapter,
): string[] {
  let result = addChangesetDeps(packages, adapter)
  result = addPackageDeps(result, adapter)
  result = addChangedReversePackageDeps(result, changedPackagesRecursive, adapter)
  return result
}

/** Transitive closure of changeset deps + package deps + changed reverse deps */
export function addTransitiveDeps(
  packages: string[],
  changedPackagesRecursive: string[],
  adapter: RepoAdapter,
): string[] {
  let current = [...packages]
  let next = addDeps(current, changedPackagesRecursive, adapter)
  while (next.length !== current.length || next.some((p, i) => p !== current[i])) {
    current = next
    next = addDeps(current, changedPackagesRecursive, adapter)
  }
  return current
}

/** Parse CLI-style adapter list (comma and/or space separated) into adapter names */
export function parseAdapterNames(args: string[]): string[] {
  return args.join(' ').replace(/,/g, ' ').split(/\s+/).filter(Boolean)
}

/**
 * Resolve adapter names to full package names and validate they exist.
 * Throws if any name is not an adapter in the repo.
 */
export function resolveAdapterPackages(adapterNames: string[], adapter: RepoAdapter): string[] {
  const result: string[] = []
  for (const name of adapterNames) {
    const packageName = `@chainlink/${name}-adapter`
    if (adapter.packageExists(packageName)) {
      result.push(packageName)
    } else {
      throw new Error(`'${name}' is not an adapter name.`)
    }
  }
  return result
}

export interface ComputeResult {
  packagesToInclude: string[]
  packagesToIgnore: string[]
  changedPackagesRecursive: string[]
}

/**
 * Compute which packages to include (transitive) and which to ignore for
 * `yarn changeset version`. Uses only the RepoAdapter; no real I/O.
 */
export function computeChangesetIgnoreArgs(
  adapterPackages: string[],
  adapter: RepoAdapter,
): ComputeResult {
  const changedPackagesRecursive = getReverseDependencies(
    adapter.getPackagesFromChangesetFiles(),
    adapter,
  )
  const packagesToInclude = addTransitiveDeps(adapterPackages, changedPackagesRecursive, adapter)
  const allPackages = adapter.getAllWorkspacePackageNames()
  const includeSet = new Set(packagesToInclude)
  const packagesToIgnore = allPackages.filter((p) => !includeSet.has(p))
  return {
    packagesToInclude,
    packagesToIgnore,
    changedPackagesRecursive,
  }
}
