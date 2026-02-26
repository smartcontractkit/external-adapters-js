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
      expect(
        addTransitiveDeps({
          packages: ['@chainlink/gold-adapter'],
          changedPackagesRecursive: changed,
          repo,
        }),
      ).toEqual(['@chainlink/ea-bootstrap', '@chainlink/gold-adapter'])
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
      expect(
        addTransitiveDeps({
          packages: ['@chainlink/a-adapter'],
          changedPackagesRecursive: changed,
          repo,
        }),
      ).toEqual(['@chainlink/a-adapter', '@chainlink/b-adapter'])
    })
    it('includes reverse dependencies of a changed package (rule 3)', () => {
      // core is in a changeset; composite depends on core. Without rule 3, composite would not be included.
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/composite': ['@chainlink/core'],
          '@chainlink/core': [],
        },
        changesets: [{ file: 'core.md', packages: ['@chainlink/core'] }],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      const result = addTransitiveDeps({
        packages: ['@chainlink/core'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toContain('@chainlink/core')
      expect(result).toContain('@chainlink/composite')
      expect(result).toEqual(['@chainlink/composite', '@chainlink/core'])
    })
    it('rule 1: BFS propagates so co-members of co-members are included', () => {
      // a-b in f1, b-c in f2. Start with [a]. Process a -> add b (rule 1). Process b -> add c (rule 1). Fails if queue is not used.
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/a-adapter': [],
          '@chainlink/b-adapter': [],
          '@chainlink/c-adapter': [],
        },
        changesets: [
          { file: 'f1.md', packages: ['@chainlink/a-adapter', '@chainlink/b-adapter'] },
          { file: 'f2.md', packages: ['@chainlink/b-adapter', '@chainlink/c-adapter'] },
        ],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      const result = addTransitiveDeps({
        packages: ['@chainlink/a-adapter'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toEqual([
        '@chainlink/a-adapter',
        '@chainlink/b-adapter',
        '@chainlink/c-adapter',
      ])
    })
    it('rule 2: includes transitive forward dependencies (BFS propagates)', () => {
      // gold -> ea-bootstrap -> ea-util. Without rule 2 or without queue propagation we would miss ea-util.
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/gold-adapter': ['@chainlink/ea-bootstrap'],
          '@chainlink/ea-bootstrap': ['@chainlink/ea-util'],
          '@chainlink/ea-util': [],
          '@chainlink/other': [],
        },
        changesets: [{ file: 'gold.md', packages: ['@chainlink/gold-adapter'] }],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      const result = addTransitiveDeps({
        packages: ['@chainlink/gold-adapter'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toEqual([
        '@chainlink/ea-bootstrap',
        '@chainlink/ea-util',
        '@chainlink/gold-adapter',
      ])
    })
    it('rule 3: includes transitive reverse dependencies (BFS propagates)', () => {
      // core in changeset; composite depends on core; leaf depends on composite. All in changed. Process core -> add composite; process composite -> add leaf.
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/leaf': ['@chainlink/composite'],
          '@chainlink/composite': ['@chainlink/core'],
          '@chainlink/core': [],
        },
        changesets: [{ file: 'core.md', packages: ['@chainlink/core'] }],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      const result = addTransitiveDeps({
        packages: ['@chainlink/core'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toEqual(['@chainlink/composite', '@chainlink/core', '@chainlink/leaf'])
    })
    it('rule 1: package in multiple changeset files pulls in all co-members from all files', () => {
      // pkg is in both f1 (with other1) and f2 (with other2). Both other1 and other2 must be included.
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/pkg': [],
          '@chainlink/other1': [],
          '@chainlink/other2': [],
        },
        changesets: [
          { file: 'f1.md', packages: ['@chainlink/pkg', '@chainlink/other1'] },
          { file: 'f2.md', packages: ['@chainlink/pkg', '@chainlink/other2'] },
        ],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      const result = addTransitiveDeps({
        packages: ['@chainlink/pkg'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toContain('@chainlink/other1')
      expect(result).toContain('@chainlink/other2')
      expect(result).toContain('@chainlink/pkg')
      expect(result).toHaveLength(3)
    })
    it('rule 3: does not add reverse deps when package is not in changed set', () => {
      // standalone is not in any changeset; something depends on it. With the guard we must not add that dependent.
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/standalone-adapter': [],
          '@chainlink/dependent-adapter': ['@chainlink/standalone-adapter'],
        },
        changesets: [], // no changesets, so changedPackagesRecursive will be []
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      expect(changed).toEqual([])
      const result = addTransitiveDeps({
        packages: ['@chainlink/standalone-adapter'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toEqual(['@chainlink/standalone-adapter'])
      expect(result).not.toContain('@chainlink/dependent-adapter')
    })
  })

  describe('scenarios from PRs (get-changeset-arguments.sh)', () => {
    it('PR 4190: packages in same changeset must be released together (cmeth, nav-fund-services, solana-functions)', () => {
      // Steps to Test in PR 4190: input cmeth, nav-fund-services; solana-functions got included because required by one of the test changesets.
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/cmeth-adapter': [],
          '@chainlink/nav-fund-services-adapter': [],
          '@chainlink/solana-functions-adapter': [],
        },
        changesets: [
          {
            file: 'shared.md',
            packages: [
              '@chainlink/cmeth-adapter',
              '@chainlink/nav-fund-services-adapter',
              '@chainlink/solana-functions-adapter',
            ],
          },
        ],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      const result = addTransitiveDeps({
        packages: ['@chainlink/cmeth-adapter', '@chainlink/nav-fund-services-adapter'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toContain('@chainlink/cmeth-adapter')
      expect(result).toContain('@chainlink/nav-fund-services-adapter')
      expect(result).toContain('@chainlink/solana-functions-adapter')
      expect(result).toHaveLength(3)
    })

    it('PR 4257: only add reverse deps of changed packages (view-function-multi-chain, proof-of-reserves, ea-test-helpers; exclude coinbase)', () => {
      // proof-of-reserves depends on view-function-multi-chain and ea-test-helpers; coinbase depends on ea-test-helpers.
      // Release only view-function-multi-chain. We must include proof-of-reserves (reverse dep of changed) and ea-test-helpers (dep of proof-of-reserves).
      // We must NOT include coinbase: ea-test-helpers has no changes, so we do not add reverse deps of ea-test-helpers.
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/proof-of-reserves-adapter': [
            '@chainlink/view-function-multi-chain-adapter',
            '@chainlink/ea-test-helpers',
          ],
          '@chainlink/view-function-multi-chain-adapter': [],
          '@chainlink/ea-test-helpers': [],
          '@chainlink/coinbase-adapter': ['@chainlink/ea-test-helpers'],
        },
        changesets: [{ file: 'vf.md', packages: ['@chainlink/view-function-multi-chain-adapter'] }],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      const result = addTransitiveDeps({
        packages: ['@chainlink/view-function-multi-chain-adapter'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toContain('@chainlink/view-function-multi-chain-adapter')
      expect(result).toContain('@chainlink/proof-of-reserves-adapter')
      expect(result).toContain('@chainlink/ea-test-helpers')
      expect(result).not.toContain('@chainlink/coinbase-adapter')
    })

    it('PR 4616: do not add reverse deps of non-changed packages (ondo-calculated, gold, data-engine)', () => {
      // PR 4616: ondo-calculated and gold both depend on data-engine; data-engine has no changes.
      // Release only ondo-calculated. We must include data-engine (dep) but must NOT include gold
      // (reverse dep of data-engine), because data-engine is not in the changed set.
      // Use empty changesets so changed=[], matching "only add reverse deps of changed packages".
      const repo = createMockRepo({
        dependencies: {
          '@chainlink/ondo-calculated-adapter': ['@chainlink/data-engine-adapter'],
          '@chainlink/gold-adapter': ['@chainlink/data-engine-adapter'],
          '@chainlink/data-engine-adapter': [],
        },
        changesets: [],
      })
      const changed = getTransitiveReverseDependencies(repo.getPackagesFromChangesetFiles(), repo)
      expect(changed).toEqual([])
      const result = addTransitiveDeps({
        packages: ['@chainlink/ondo-calculated-adapter'],
        changedPackagesRecursive: changed,
        repo,
      })
      expect(result).toEqual([
        '@chainlink/data-engine-adapter',
        '@chainlink/ondo-calculated-adapter',
      ])
      expect(result).not.toContain('@chainlink/gold-adapter')
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
