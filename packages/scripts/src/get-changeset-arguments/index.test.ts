import {
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

  describe('computePackagesToIgnore', () => {
    const DATA_ENGINE = '@chainlink/data-engine-adapter'
    const GOLD = '@chainlink/gold-adapter'
    const ONDO = '@chainlink/ondo-calculated-adapter'
    const SCRIPTS = '@chainlink/ea-scripts'
    const XSUSHI = '@chainlink/xsushi-price-adapter'
    const TOKEN_ALLOCATION = '@chainlink/token-allocation-adapter'
    const COINGECKO = '@chainlink/coingecko-adapter'

    it('should return packages to include, ignore and release', () => {
      const repo = createMockRepo({
        dependencies: {},
        changesets: {
          'gold.md': [GOLD],
          'ondo.md': [ONDO],
        },
      })
      const result = computePackagesToIgnore([GOLD], repo)
      expect(result).toEqual({
        packagesToIgnore: [ONDO],
        packagesToInclude: [GOLD],
        packagesToRelease: [GOLD],
      })
    })

    it('should include direct dependencies', () => {
      const repo = createMockRepo({
        dependencies: {
          [GOLD]: [DATA_ENGINE],
        },
        changesets: {
          'gold.md': [GOLD],
        },
      })
      const result = computePackagesToIgnore([GOLD], repo)
      expect(result).toEqual({
        packagesToIgnore: [],
        packagesToInclude: [DATA_ENGINE, GOLD],
        packagesToRelease: [GOLD],
      })
    })

    it('should include packages that share a changeset', () => {
      const repo = createMockRepo({
        dependencies: {},
        changesets: {
          'gold.md': [SCRIPTS, GOLD],
        },
      })
      const result = computePackagesToIgnore([GOLD], repo)
      expect(result).toEqual({
        packagesToIgnore: [],
        packagesToInclude: [SCRIPTS, GOLD],
        packagesToRelease: [SCRIPTS, GOLD],
      })
    })

    it('should include reverse dependencies of a changed package', () => {
      const repo = createMockRepo({
        dependencies: {
          [GOLD]: [DATA_ENGINE],
        },
        changesets: {
          'change.md': [DATA_ENGINE],
        },
      })
      const result = computePackagesToIgnore([GOLD], repo)
      expect(result).toEqual({
        packagesToIgnore: [],
        packagesToInclude: [DATA_ENGINE, GOLD],
        packagesToRelease: [DATA_ENGINE, GOLD],
      })
    })

    it('should not include changed reverse dependencies of an unchanged package', () => {
      const repo = createMockRepo({
        dependencies: {
          [GOLD]: [DATA_ENGINE],
          [ONDO]: [DATA_ENGINE],
        },
        changesets: {
          'ondo.md': [ONDO],
          'gold.md': [GOLD],
        },
      })
      const result = computePackagesToIgnore([GOLD], repo)
      expect(result).toEqual({
        packagesToIgnore: [ONDO],
        packagesToInclude: [DATA_ENGINE, GOLD],
        packagesToRelease: [GOLD],
      })
    })

    it('should include co-members of changesets transitively', () => {
      const repo = createMockRepo({
        dependencies: {},
        changesets: {
          'ondo.md': [ONDO, SCRIPTS],
          'gold.md': [GOLD, SCRIPTS],
          'coingecko.md': [COINGECKO],
        },
      })
      const result = computePackagesToIgnore([GOLD], repo)
      expect(result).toEqual({
        packagesToIgnore: [COINGECKO],
        packagesToInclude: [SCRIPTS, GOLD, ONDO],
        packagesToRelease: [SCRIPTS, GOLD, ONDO],
      })
    })

    it('should include dependencies transitively', () => {
      const repo = createMockRepo({
        dependencies: {
          [XSUSHI]: [TOKEN_ALLOCATION],
          [TOKEN_ALLOCATION]: [COINGECKO],
        },
        changesets: {
          'xsushi.md': [XSUSHI],
          'gold.md': [GOLD],
        },
      })
      const result = computePackagesToIgnore([XSUSHI], repo)
      expect(result).toEqual({
        packagesToIgnore: [GOLD],
        packagesToInclude: [COINGECKO, TOKEN_ALLOCATION, XSUSHI],
        packagesToRelease: [XSUSHI],
      })
    })

    it('should include reverse dependencies transitively', () => {
      const repo = createMockRepo({
        dependencies: {
          [XSUSHI]: [TOKEN_ALLOCATION],
          [TOKEN_ALLOCATION]: [COINGECKO],
        },
        changesets: {
          'token-allocation.md': [TOKEN_ALLOCATION],
          'coingecko.md': [COINGECKO],
          'gold.md': [GOLD],
        },
      })
      const result = computePackagesToIgnore([COINGECKO], repo)
      expect(result).toEqual({
        packagesToIgnore: [GOLD],
        packagesToInclude: [COINGECKO, TOKEN_ALLOCATION, XSUSHI],
        packagesToRelease: [COINGECKO, TOKEN_ALLOCATION, XSUSHI],
      })
    })
  })

  describe('run', () => {
    const originalArgv = process.argv
    let exitSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance
    let consoleLogSpy: jest.SpyInstance

    const expectOutput = ({ stdout, stderr }: { stdout: string[]; stderr: string[] }) => {
      stdout.forEach((line, index) => {
        expect(consoleLogSpy).toHaveBeenNthCalledWith(index + 1, line)
      })
      expect(consoleLogSpy).toHaveBeenCalledTimes(stdout.length)

      stderr.forEach((line, index) => {
        expect(consoleErrorSpy).toHaveBeenNthCalledWith(index + 1, line)
      })
      expect(consoleErrorSpy).toHaveBeenCalledTimes(stderr.length)
    }

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

      expectOutput({
        stdout: [],
        stderr: [
          'Usage: yarn get-changeset-arguments <possible empty list of adapters to release>',
        ],
      })
      expect(exitSpy).toHaveBeenCalledWith(0)
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

      expectOutput({
        stdout: ['--ignore @chainlink/other-adapter'],
        stderr: [
          'Not ignoring the following transitive dependencies:',
          '@chainlink/gold-adapter',
          '',
          'Expecting the following packages to be released:',
          '@chainlink/gold-adapter',
          '',
        ],
      })
    })

    it('prints error to stderr and exits 1 when adapter name is invalid', () => {
      process.argv = ['node', 'script', 'nonexistent']
      const repo = createMockRepo({
        dependencies: { '@chainlink/gold-adapter': [] },
        changesets: {},
      })

      expect(() => run(repo)).toThrow('process.exit(1)')

      expectOutput({
        stdout: [],
        stderr: ["'nonexistent' is not an adapter name."],
      })
    })
  })
})
