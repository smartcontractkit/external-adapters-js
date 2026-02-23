/**
 * Abstraction over repo structure and I/O. Implementations can use real git/fs/yarn
 * or provide mock data for tests so tests are independent of repo layout.
 */
export interface RepoAdapter {
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
