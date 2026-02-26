import { Repo } from '../repo'

interface MockRepoStructure {
  dependencies: Record<string, string[]>
  // Maps from filename to list of packages.
  changesets: Record<string, string[]>
}

// Maps values to keys, where values are arrays.
// E.g. {a: [1,2], b: [2,3]} -> {1: [a], 2: [a,b], 3: [b]}
const invertMapping = (map: Record<string, string[]>): Record<string, string[]> => {
  const result: Record<string, string[]> = {}
  for (const [key, values] of Object.entries(map)) {
    for (const value of values) {
      result[value] ??= []
      result[value].push(key)
    }
  }
  return result
}

export const createMockRepo = ({ dependencies, changesets }: MockRepoStructure): Repo => {
  const packages = new Set([
    ...Object.keys(dependencies),
    ...Object.values(dependencies).flat(),
    ...Object.values(changesets ?? {}).flat(),
  ])

  const reverseDeps = invertMapping(dependencies)
  const changesetsByPackage = invertMapping(changesets)

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
      files ??= Object.keys(changesets)
      return [...new Set(files.flatMap((file) => changesets[file] ?? []))]
    },
    getChangesetFilesMentioningPackage(name: string) {
      return [...(changesetsByPackage[name] ?? [])]
    },
    getAllWorkspacePackageNames() {
      return [...packages]
    },
  }
}
