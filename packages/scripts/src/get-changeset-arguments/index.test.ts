import {
  addTransitiveDeps,
  computePackagesToIgnore,
  getTransitiveReverseDependencies,
  intersect,
  parseAdapterNames,
  resolveAdapterPackages,
} from './core'
import { run } from './index'
import type { Repo } from './repo'

export interface MockRepoStructure {
  dependencies: Record<string, string[]>
  // Maps from filename to list of packages.
  changesets?: Record<string, string[]>
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

function createMockRepo({ dependencies, changesets }: MockRepoStructure): Repo {
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
      expect(intersect(['c', 'b', 'a'], ['d', 'c', 'b'])).toEqual(['b', 'c'])
    })

    it('returns empty when no overlap', () => {
      expect(intersect(['a'], ['b'])).toEqual([])
    })
  })

  describe('getTransitiveReverseDependencies', () => {
    it('returns empty for empty input', () => {
      const repo = createMockRepo({
        dependencies: {},
        changesets: {},
      })
      expect(getTransitiveReverseDependencies([], repo)).toEqual([])
    })

    it('returns input when no reverse deps', () => {
      const repo = createMockRepo({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: {},
      })

      expect(getTransitiveReverseDependencies(['@chainlink/gold-adapter'], repo)).toEqual([
        '@chainlink/gold-adapter',
      ])
    })

    it('includes transitive reverse deps', () => {
      const XSUSHI = '@chainlink/xsushi-price-adapter'
      const TOKEN_ALLOCATION = '@chainlink/token-allocation-adapter'
      const COINGECKO = '@chainlink/coingecko-adapter'

      const repo = createMockRepo({
        dependencies: {
          [XSUSHI]: [TOKEN_ALLOCATION],
          [TOKEN_ALLOCATION]: [COINGECKO],
        },
        changesets: {},
      })
      expect(getTransitiveReverseDependencies([COINGECKO], repo)).toEqual([
        COINGECKO,
        TOKEN_ALLOCATION,
        XSUSHI,
      ])
    })
  })

  describe('resolveAdapterPackages', () => {
    it('resolves valid adapter names to package names', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': [],
          '@chainlink/coingecko-adapter': [],
        },
        changesets: {},
      })
      expect(resolveAdapterPackages(['gold'], repo)).toEqual(['@chainlink/gold-adapter'])
      expect(resolveAdapterPackages(['gold', 'coingecko'], repo)).toEqual([
        '@chainlink/gold-adapter',
        '@chainlink/coingecko-adapter',
      ])
    })

    it('throws when adapter does not exist', () => {
      const repo = createMockRepo({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: {},
      })
      expect(() => resolveAdapterPackages(['nonexistent'], repo)).toThrow(
        "'nonexistent' is not an adapter name.",
      )
    })
  })

  describe('addTransitiveDeps', () => {
    it('includes direct dependencies', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': ['@chainlink/data-engine-adapter'],
        },
        changesets: {
          'gold.md': ['@chainlink/gold-adapter'],
        },
      })
      expect(
        addTransitiveDeps({
          packages: ['@chainlink/gold-adapter'],
          changedPackagesRecursive: ['@chainlink/gold-adapter'],
          repo,
        }),
      ).toEqual(['@chainlink/data-engine-adapter', '@chainlink/gold-adapter'])
    })

    it('includes packages that share a changeset', () => {
      const changed = ['@chainlink/ea-scripts', '@chainlink/gold-adapter']
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': [],
        },
        changesets: {
          'gold.md': changed,
        },
      })
      expect(
        addTransitiveDeps({
          packages: ['@chainlink/gold-adapter'],
          changedPackagesRecursive: changed,
          repo,
        }),
      ).toEqual(changed)
    })

    it('includes reverse dependencies of a changed package', () => {
      const GOLD = '@chainlink/gold-adapter'
      const DATA_ENGINE = '@chainlink/data-engine-adapter'
      const changed = [DATA_ENGINE]
      const repo = createMockRepo({
        dependencies: {
          [GOLD]: [DATA_ENGINE],
        },
        changesets: {
          'change.md': changed,
        },
      })
      const result = addTransitiveDeps({
        packages: [DATA_ENGINE],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toEqual([DATA_ENGINE, GOLD])
    })

    it('does not includes changed reverse dependencies of an unchanged package', () => {
      const ONDO = '@chainlink/ondo-calculated-adapter'
      const GOLD = '@chainlink/gold-adapter'
      const DATA_ENGINE = '@chainlink/data-engine-adapter'
      const repo = createMockRepo({
        dependencies: {
          [GOLD]: [DATA_ENGINE],
          [ONDO]: [DATA_ENGINE],
        },
        changesets: {
          'ondo.md': ONDO,
          'gold.md': GOLD,
        },
      })
      const result = addTransitiveDeps({
        packages: [ONDO],
        changedPackagesRecursive: [ONDO, GOLD],
        repo,
      })
      expect(result).toEqual([DATA_ENGINE, ONDO])
    })

    it('should include co-members of changesets transitively', () => {
      const A = '@chainlink/a-adapter'
      const B = '@chainlink/b-adapter'
      const C = '@chainlink/c-adapter'
      const repo = createMockRepo({
        dependencies: {},
        changesets: {
          'f1.md': [A, B],
          'f2.md': [B, C],
        },
      })
      const result = addTransitiveDeps({
        packages: [A],
        changedPackagesRecursive: [A, B, C],
        repo,
      })
      expect(result).toEqual([A, B, C])
    })

    it('should include dependencies transitively', () => {
      const XSUSHI = '@chainlink/xsushi-price-adapter'
      const TOKEN_ALLOCATION = '@chainlink/token-allocation-adapter'
      const COINGECKO = '@chainlink/coingecko-adapter'

      const repo = createMockRepo({
        dependencies: {
          [XSUSHI]: [TOKEN_ALLOCATION],
          [TOKEN_ALLOCATION]: [COINGECKO],
        },
        changesets: {},
      })
      const result = addTransitiveDeps({
        packages: [XSUSHI],
        changedPackagesRecursive: [],
        repo,
      })
      expect(result).toEqual([COINGECKO, TOKEN_ALLOCATION, XSUSHI])
    })

    it('should include reverse dependencies transitively', () => {
      const XSUSHI = '@chainlink/xsushi-price-adapter'
      const TOKEN_ALLOCATION = '@chainlink/token-allocation-adapter'
      const COINGECKO = '@chainlink/coingecko-adapter'

      const repo = createMockRepo({
        dependencies: {
          [XSUSHI]: [TOKEN_ALLOCATION],
          [TOKEN_ALLOCATION]: [COINGECKO],
        },
        changesets: {
          'token-allocation.md': [TOKEN_ALLOCATION],
          'coingecko.md': [COINGECKO],
        },
      })
      const result = addTransitiveDeps({
        packages: [COINGECKO],
        changedPackagesRecursive: [TOKEN_ALLOCATION, COINGECKO],
        repo,
      })
      expect(result).toEqual([COINGECKO, TOKEN_ALLOCATION, XSUSHI])
    })

    it('should include changeset co-members from multiple changesets', () => {
      const repo = createMockRepo({
        dependencies: {},
        changesets: {
          'f1.md': ['@chainlink/pkg', '@chainlink/other1'],
          'f2.md': ['@chainlink/pkg', '@chainlink/other2'],
        },
      })
      const result = addTransitiveDeps({
        packages: ['@chainlink/pkg'],
        changedPackagesRecursive: ['@chainlink/pkg', '@chainlink/other1', '@chainlink/other2'],
        repo,
      })
      expect(result).toEqual(['@chainlink/other1', '@chainlink/other2', '@chainlink/pkg'])
    })
  })

  describe('computePackagesToIgnore', () => {
    it('returns packages to include and ignore from workspace', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': [],
          '@chainlink/other-adapter': [],
        },
        changesets: {
          'gold.md': ['@chainlink/gold-adapter'],
        },
      })
      const result = computePackagesToIgnore(['@chainlink/gold-adapter'], repo)
      expect(result.packagesToInclude).toContain('@chainlink/gold-adapter')
      expect(result.packagesToIgnore).toContain('@chainlink/other-adapter')
      expect(result.packagesToIgnore).not.toContain('@chainlink/gold-adapter')
      expect(result.packagesToRelease).toEqual(['@chainlink/gold-adapter'])
    })

    it('includes transitive deps in packagesToInclude', () => {
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': ['@chainlink/ea-bootstrap'],
          '@chainlink/ea-bootstrap': [],
          '@chainlink/other': [],
        },
        changesets: {
          'gold.md': ['@chainlink/gold-adapter'],
        },
      })
      const result = computePackagesToIgnore(['@chainlink/gold-adapter'], repo)
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
        changesets: {},
      })
      const result = computePackagesToIgnore(['@chainlink/standalone-adapter'], repo)
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
      const repo = createMockRepo({ dependencies: {}, changesets: {} })

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
        changesets: {
          'gold.md': ['@chainlink/gold-adapter'],
        },
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
        changesets: {},
      })

      expect(() => run(repo)).toThrow('process.exit(1)')
      expect(consoleErrorSpy).toHaveBeenCalledWith("'nonexistent' is not an adapter name.")
      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })
})
