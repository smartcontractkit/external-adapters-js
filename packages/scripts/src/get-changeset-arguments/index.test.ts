import {
  addTransitiveDeps,
  computeChangesetIgnoreArgs,
  getTransitiveReverseDependencies,
  intersect,
  parseAdapterNames,
  resolveAdapterPackages,
} from './core'
import { run } from './index'
import type { Repo } from './repo'

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

function createMockRepo(structure: MockRepoStructure): Repo {
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

  describe('getTransitiveReverseDependencies', () => {
    it('returns empty for empty input', () => {
      const repo = createMockRepo({
        dependencies: {},
        changesets: [],
      })
      expect(getTransitiveReverseDependencies([], repo)).toEqual([])
    })
    it('returns input when no reverse deps', () => {
      const repo = createMockRepo({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: [],
      })
      expect(getTransitiveReverseDependencies(['@chainlink/gold-adapter'], repo)).toEqual([
        '@chainlink/gold-adapter',
      ])
    })
    it('includes transitive reverse deps (composite depends on core, leaf depends on composite)', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/composite': ['@chainlink/core'],
          '@chainlink/leaf': ['@chainlink/composite'],
        },
        changesets: [],
      })
      expect(getTransitiveReverseDependencies(['@chainlink/core'], repo)).toEqual([
        '@chainlink/composite',
        '@chainlink/core',
        '@chainlink/leaf',
      ])
    })
    it('throws when package does not exist', () => {
      const repo = createMockRepo({
        dependencies: { '@chainlink/a-adapter': [] },
        changesets: [],
      })
      expect(() =>
        getTransitiveReverseDependencies(['@chainlink/nonexistent-adapter'], repo),
      ).toThrow("'@chainlink/nonexistent-adapter' is not a package in this repository.")
    })
  })

  describe('resolveAdapterPackages', () => {
    it('resolves valid adapter names to package names', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': [],
          '@chainlink/coingecko-adapter': [],
        },
        changesets: [],
      })
      expect(resolveAdapterPackages(['gold', 'coingecko'], repo)).toEqual([
        '@chainlink/gold-adapter',
        '@chainlink/coingecko-adapter',
      ])
    })
    it('throws when adapter does not exist', () => {
      const repo = createMockRepo({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: [],
      })
      expect(() => resolveAdapterPackages(['nonexistent'], repo)).toThrow(
        "'nonexistent' is not an adapter name.",
      )
    })
  })

  describe('addTransitiveDeps', () => {
    it('includes direct dependencies (gold depends on ea-bootstrap; changeset mentions gold)', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': ['@chainlink/ea-bootstrap'],
          '@chainlink/ea-bootstrap': [],
          '@chainlink/other': [],
        },
        changesets: [{ file: 'gold.md', packages: ['@chainlink/gold-adapter'] }],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      expect(addTransitiveDeps(['@chainlink/gold-adapter'], changed, repo)).toEqual([
        '@chainlink/ea-bootstrap',
        '@chainlink/gold-adapter',
      ])
    })
    it('includes packages that share a changeset (a and b in same file)', () => {
      const repo = createMockRepo({
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
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      expect(addTransitiveDeps(['@chainlink/a-adapter'], changed, repo)).toEqual([
        '@chainlink/a-adapter',
        '@chainlink/b-adapter',
      ])
    })
  })

  describe('computeChangesetIgnoreArgs', () => {
    it('returns packages to include and ignore from workspace', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': [],
          '@chainlink/other-adapter': [],
        },
        changesets: [{ file: 'gold.md', packages: ['@chainlink/gold-adapter'] }],
      })
      const result = computeChangesetIgnoreArgs(['@chainlink/gold-adapter'], repo)
      expect(result.packagesToInclude).toContain('@chainlink/gold-adapter')
      expect(result.packagesToIgnore).toContain('@chainlink/other-adapter')
      expect(result.packagesToIgnore).not.toContain('@chainlink/gold-adapter')
      expect(result.changedPackagesRecursive).toEqual(['@chainlink/gold-adapter'])
    })
    it('includes transitive deps in packagesToInclude', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': ['@chainlink/ea-bootstrap'],
          '@chainlink/ea-bootstrap': [],
          '@chainlink/other': [],
        },
        changesets: [{ file: 'gold.md', packages: ['@chainlink/gold-adapter'] }],
      })
      const result = computeChangesetIgnoreArgs(['@chainlink/gold-adapter'], repo)
      expect(result.packagesToInclude).toEqual([
        '@chainlink/ea-bootstrap',
        '@chainlink/gold-adapter',
      ])
      expect(result.packagesToIgnore).toEqual(['@chainlink/other'])
    })
    it('includes only the adapter when it has no deps and no shared changesets', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/standalone-adapter': [],
          '@chainlink/other': [],
        },
        changesets: [],
      })
      const result = computeChangesetIgnoreArgs(['@chainlink/standalone-adapter'], repo)
      expect(result.packagesToInclude).toEqual(['@chainlink/standalone-adapter'])
      expect(result.packagesToIgnore).toEqual(['@chainlink/other'])
    })
  })

  describe('run', () => {
    const originalArgv = process.argv
    let exitSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance
    let consoleLogSpy: jest.SpyInstance

    beforeEach(() => {
      exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`)
      }) as never)
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      process.argv = originalArgv
      exitSpy.mockRestore()
      consoleErrorSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })

    it('prints usage to stderr and exits 0 when no args', () => {
      process.argv = ['node', 'script']
      const repo = createMockRepo({ dependencies: {}, changesets: [] })

      expect(() => run(repo)).toThrow('process.exit(0)')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Usage: yarn get-changeset-arguments <possible empty list of adapters to release>',
      )
      expect(exitSpy).toHaveBeenCalledWith(0)
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('prints --ignore args to stdout and exits successfully when given valid adapter', () => {
      process.argv = ['node', 'script', 'gold']
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': [],
          '@chainlink/other-adapter': [],
        },
        changesets: [{ file: 'gold.md', packages: ['@chainlink/gold-adapter'] }],
      })

      run(repo)

      expect(exitSpy).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy.mock.calls[0][0]).toBe('--ignore @chainlink/other-adapter')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Not ignoring the following transitive dependencies:',
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Expecting the following packages to be released:',
      )
    })

    it('prints error to stderr and exits 1 when adapter name is invalid', () => {
      process.argv = ['node', 'script', 'nonexistent']
      const repo = createMockRepo({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: [],
      })

      expect(() => run(repo)).toThrow('process.exit(1)')
      expect(consoleErrorSpy).toHaveBeenCalledWith("'nonexistent' is not an adapter name.")
      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })
})
