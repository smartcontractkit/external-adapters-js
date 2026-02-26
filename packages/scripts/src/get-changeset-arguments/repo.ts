/**
 * Abstraction over repo structure and I/O. Implementations can use real git/fs/yarn
 * or provide mock data for tests so tests are independent of repo layout.
 */
export interface Repo {
  /** Whether a package with this name exists in the repo */
  packageExists(packageName: string): boolean

  /** Direct @chainlink/* dependencies of the package that exist in the repo */
  getDependencies(packageName: string): string[]

  /** Package names that list the given package in their dependencies */
  getPackagesThatDependOn(packageName: string): string[]

  /** Package names mentioned in changeset files (optionally only in given file paths) */
  getPackagesFromChangesetFiles(files?: string[]): string[]

  /** Paths of changeset files that mention this package (e.g. 'pkg': major) */
  getChangesetFilesMentioningPackage(packageName: string): string[]

  /** All workspace package names, excluding the root monorepo package */
  getAllWorkspacePackageNames(): string[]
}

/** Input shape for creating a Repo from in-memory data (e.g. mock or discovered from fs). */
export interface RepoStructure {
  dependencies: Record<string, string[]>
  /** Maps changeset filename to list of package names mentioned. */
  changesets: Record<string, string[]>
}

// Maps values to keys, where values are arrays.
// E.g. {a: [1,2], b: [2,3]} -> {1: [a], 2: [a,b], 3: [b]}
const invertMapping = (map: Record<string, string[]>): Record<string, string[]> =>
  Object.entries(map).reduce<Record<string, string[]>>((acc, [key, values]) => {
    for (const value of values) {
      acc[value] ??= []
      acc[value].push(key)
    }
    return acc
  }, {})

export const createRepoFromStructure = ({ dependencies, changesets }: RepoStructure): Repo => {
  const packages = new Set([
    ...Object.keys(dependencies),
    ...Object.values(dependencies).flat(),
    ...Object.values(changesets ?? {}).flat(),
  ])

  const reverseDeps = invertMapping(dependencies)
  const changesetsByPackage = invertMapping(changesets ?? {})

  return {
    packageExists(name: string) {
      return packages.has(name)
    },
    getDependencies(name: string) {
      return [...(dependencies[name] ?? [])]
    },
    getPackagesThatDependOn(name: string) {
      return [...(reverseDeps[name] ?? [])]
    },
    getPackagesFromChangesetFiles(files?: string[]) {
      const filesToUse = files ?? Object.keys(changesets ?? {})
      return [...new Set(filesToUse.flatMap((file) => changesets?.[file] ?? []))]
    },
    getChangesetFilesMentioningPackage(name: string) {
      return [...(changesetsByPackage[name] ?? [])]
    },
    getAllWorkspacePackageNames() {
      return [...packages]
    },
  }
}
