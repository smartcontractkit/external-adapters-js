import { computePackagesToIgnore, parseAdapterNames, resolveAdapterPackages } from '../lib'
import { createRepoFromStructure } from '../repo'

describe('lib', () => {
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

  describe('resolveAdapterPackages', () => {
    it('resolves valid adapter names to package names', () => {
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
      const repo = createRepoFromStructure({
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
})
