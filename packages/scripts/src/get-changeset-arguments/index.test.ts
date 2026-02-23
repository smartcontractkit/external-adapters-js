import {
  addTransitiveDeps,
  computeChangesetIgnoreArgs,
  getReverseDependencies,
  intersect,
  parseAdapterNames,
  resolveAdapterPackages,
} from './core'
import type { RepoAdapter } from './repoAdapter'

/**
 * Single source of truth for a mock repo. All adapter answers are derived from this:
 * - packages = union of (keys of dependencies, all dependency values, all packages in changesets)
 * - getPackagesThatDependOn: derived from dependencies
 * - getPackagesFromChangesetFiles / getChangesetFilesMentioningPackage: derived from changesets
 */
export interface MockRepoStructure {
  /** Direct dependencies: package name -> list of @chainlink package names. Keys and values are packages. */
  dependencies: Record<string, string[]>
  /** Each changeset file and the package names mentioned in it. */
  changesets: Array<{ file: string; packages: string[] }>
}

function createMockAdapter(structure: MockRepoStructure): RepoAdapter {
  const { dependencies, changesets } = structure
  const packageSet = new Set<string>()
  for (const pkg of Object.keys(dependencies)) packageSet.add(pkg)
  for (const deps of Object.values(dependencies)) {
    for (const d of deps) packageSet.add(d)
  }
  for (const { packages: pkgs } of changesets) {
    for (const p of pkgs) packageSet.add(p)
  }
  const packages = [...packageSet].sort()

  const reverseDeps = new Map<string, string[]>()
  for (const pkg of packages) {
    const deps = dependencies[pkg] ?? []
    for (const dep of deps) {
      if (!reverseDeps.has(dep)) reverseDeps.set(dep, [])
      reverseDeps.get(dep)!.push(pkg)
    }
  }
  for (const arr of reverseDeps.values()) arr.sort()

  const packagesByFile = new Map<string, string[]>()
  const filesByPackage = new Map<string, string[]>()
  for (const { file, packages: pkgs } of changesets) {
    packagesByFile.set(file, pkgs)
    for (const p of pkgs) {
      if (!filesByPackage.has(p)) filesByPackage.set(p, [])
      filesByPackage.get(p)!.push(file)
    }
  }

  return {
    packageExists(name: string) {
      return packageSet.has(name)
    },
    getDependencies(name: string) {
      return (dependencies[name] ?? []).filter((d) => packageSet.has(d))
    },
    getPackagesThatDependOn(name: string) {
      return reverseDeps.get(name) ?? []
    },
    getPackagesFromChangesetFiles(files?: string[]) {
      if (files && files.length > 0) {
        const out = new Set<string>()
        for (const file of files) {
          for (const p of packagesByFile.get(file) ?? []) out.add(p)
        }
        return [...out].sort()
      }
      const out = new Set<string>()
      for (const pkgs of packagesByFile.values()) {
        for (const p of pkgs) out.add(p)
      }
      return [...out].sort()
    },
    getChangesetFilesMentioningPackage(name: string) {
      return filesByPackage.get(name) ?? []
    },
    getAllWorkspacePackageNames() {
      return [...packages].sort()
    },
  }
}

describe('get-changeset-arguments core', () => {
  describe('parseAdapterNames', () => {
    it('splits on spaces', () => {
      expect(parseAdapterNames(['gold', 'coingecko'])).toEqual(['gold', 'coingecko'])
      expect(parseAdapterNames(['gold coingecko'])).toEqual(['gold', 'coingecko'])
    })
    it('splits on commas', () => {
      expect(parseAdapterNames(['gold,coingecko'])).toEqual(['gold', 'coingecko'])
    })
    it('handles comma and space', () => {
      expect(parseAdapterNames(['gold', ',', 'coingecko'])).toEqual(['gold', 'coingecko'])
      expect(parseAdapterNames(['gold , coingecko'])).toEqual(['gold', 'coingecko'])
    })
    it('filters empty segments', () => {
      expect(parseAdapterNames(['  ', 'gold', ''])).toEqual(['gold'])
    })
  })

  describe('intersect', () => {
    it('returns elements in both lists', () => {
      expect(intersect(['a', 'b', 'c'], ['b', 'd'])).toEqual(['b'])
    })
    it('returns sorted result', () => {
      expect(intersect(['c', 'a', 'b'], ['a', 'b'])).toEqual(['a', 'b'])
    })
    it('returns empty when no overlap', () => {
      expect(intersect(['a'], ['b'])).toEqual([])
    })
  })

  describe('getReverseDependencies', () => {
    it('returns empty for empty input', () => {
      const adapter = createMockAdapter({
        dependencies: {},
        changesets: [],
      })
      expect(getReverseDependencies([], adapter)).toEqual([])
    })
    it('returns input when no reverse deps', () => {
      const adapter = createMockAdapter({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: [],
      })
      expect(getReverseDependencies(['@chainlink/gold-adapter'], adapter)).toEqual([
        '@chainlink/gold-adapter',
      ])
    })
    it('includes transitive reverse deps (composite depends on core, leaf depends on composite)', () => {
      const adapter = createMockAdapter({
        dependencies: {
          '@chainlink/composite': ['@chainlink/core'],
          '@chainlink/leaf': ['@chainlink/composite'],
        },
        changesets: [],
      })
      expect(getReverseDependencies(['@chainlink/core'], adapter)).toEqual([
        '@chainlink/composite',
        '@chainlink/core',
        '@chainlink/leaf',
      ])
    })
    it('throws when package does not exist', () => {
      const adapter = createMockAdapter({
        dependencies: { '@chainlink/a-adapter': [] },
        changesets: [],
      })
      expect(() => getReverseDependencies(['@chainlink/nonexistent-adapter'], adapter)).toThrow(
        "'@chainlink/nonexistent-adapter' is not a package in this repository.",
      )
    })
  })

  describe('resolveAdapterPackages', () => {
    it('resolves valid adapter names to package names', () => {
      const adapter = createMockAdapter({
        dependencies: {
          '@chainlink/gold-adapter': [],
          '@chainlink/coingecko-adapter': [],
        },
        changesets: [],
      })
      expect(resolveAdapterPackages(['gold', 'coingecko'], adapter)).toEqual([
        '@chainlink/gold-adapter',
        '@chainlink/coingecko-adapter',
      ])
    })
    it('throws when adapter does not exist', () => {
      const adapter = createMockAdapter({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: [],
      })
      expect(() => resolveAdapterPackages(['nonexistent'], adapter)).toThrow(
        "'nonexistent' is not an adapter name.",
      )
    })
  })

  describe('addTransitiveDeps', () => {
    it('includes direct dependencies (gold depends on ea-bootstrap; changeset mentions gold)', () => {
      const adapter = createMockAdapter({
        dependencies: {
          '@chainlink/gold-adapter': ['@chainlink/ea-bootstrap'],
          '@chainlink/ea-bootstrap': [],
          '@chainlink/other': [],
        },
        changesets: [{ file: 'gold.md', packages: ['@chainlink/gold-adapter'] }],
      })
      const changed = getReverseDependencies(adapter.getPackagesFromChangesetFiles(), adapter)
      expect(addTransitiveDeps(['@chainlink/gold-adapter'], changed, adapter)).toEqual([
        '@chainlink/ea-bootstrap',
        '@chainlink/gold-adapter',
      ])
    })
    it('includes packages that share a changeset (a and b in same file)', () => {
      const adapter = createMockAdapter({
        dependencies: {
          '@chainlink/c-adapter': [],
        },
        changesets: [
          {
            file: 'f1.md',
            packages: ['@chainlink/a-adapter', '@chainlink/b-adapter'],
          },
        ],
      })
      const changed = getReverseDependencies(adapter.getPackagesFromChangesetFiles(), adapter)
      expect(addTransitiveDeps(['@chainlink/a-adapter'], changed, adapter)).toEqual([
        '@chainlink/a-adapter',
        '@chainlink/b-adapter',
      ])
    })
  })

  describe('computeChangesetIgnoreArgs', () => {
    it('returns packages to include and ignore from workspace', () => {
      const adapter = createMockAdapter({
        dependencies: {
          '@chainlink/gold-adapter': [],
          '@chainlink/other-adapter': [],
        },
        changesets: [{ file: 'gold.md', packages: ['@chainlink/gold-adapter'] }],
      })
      const result = computeChangesetIgnoreArgs(['@chainlink/gold-adapter'], adapter)
      expect(result.packagesToInclude).toContain('@chainlink/gold-adapter')
      expect(result.packagesToIgnore).toContain('@chainlink/other-adapter')
      expect(result.packagesToIgnore).not.toContain('@chainlink/gold-adapter')
      expect(result.changedPackagesRecursive).toEqual(['@chainlink/gold-adapter'])
    })
    it('includes transitive deps in packagesToInclude', () => {
      const adapter = createMockAdapter({
        dependencies: {
          '@chainlink/gold-adapter': ['@chainlink/ea-bootstrap'],
          '@chainlink/ea-bootstrap': [],
          '@chainlink/other': [],
        },
        changesets: [{ file: 'gold.md', packages: ['@chainlink/gold-adapter'] }],
      })
      const result = computeChangesetIgnoreArgs(['@chainlink/gold-adapter'], adapter)
      expect(result.packagesToInclude).toEqual([
        '@chainlink/ea-bootstrap',
        '@chainlink/gold-adapter',
      ])
      expect(result.packagesToIgnore).toEqual(['@chainlink/other'])
    })
    it('includes only the adapter when it has no deps and no shared changesets', () => {
      const adapter = createMockAdapter({
        dependencies: {
          '@chainlink/standalone-adapter': [],
          '@chainlink/other': [],
        },
        changesets: [],
      })
      const result = computeChangesetIgnoreArgs(['@chainlink/standalone-adapter'], adapter)
      expect(result.packagesToInclude).toEqual(['@chainlink/standalone-adapter'])
      expect(result.packagesToIgnore).toEqual(['@chainlink/other'])
    })
  })
})
