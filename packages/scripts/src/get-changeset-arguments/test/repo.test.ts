import { createRepoFromStructure } from '../repo'

describe('createRepoFromStructure', () => {
  describe('packageExists', () => {
    it('returns true for package in dependencies', () => {
      const repo = createRepoFromStructure({
        dependencies: { '@chainlink/foo-adapter': [] },
        changesets: {},
      })
      expect(repo.packageExists('@chainlink/foo-adapter')).toBe(true)
    })

    it('returns true for package only in changesets', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: { 'gold.md': ['@chainlink/gold-adapter'] },
      })
      expect(repo.packageExists('@chainlink/gold-adapter')).toBe(true)
    })

    it('returns false for unknown package', () => {
      const repo = createRepoFromStructure({
        dependencies: { '@chainlink/foo-adapter': [] },
        changesets: {},
      })
      expect(repo.packageExists('@chainlink/nonexistent')).toBe(false)
    })
  })

  describe('getDependencies', () => {
    it('returns empty array when package has no deps', () => {
      const repo = createRepoFromStructure({
        dependencies: { '@chainlink/foo-adapter': [] },
        changesets: {},
      })
      expect(repo.getDependencies('@chainlink/foo-adapter')).toEqual([])
    })

    it('returns direct dependencies', () => {
      const repo = createRepoFromStructure({
        dependencies: {
          '@chainlink/bar-adapter': ['@chainlink/foo-adapter'],
        },
        changesets: {},
      })
      expect(repo.getDependencies('@chainlink/bar-adapter')).toEqual(['@chainlink/foo-adapter'])
    })

    it('returns empty array for unknown package', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: {},
      })
      expect(repo.getDependencies('@chainlink/unknown')).toEqual([])
    })
  })

  describe('getPackagesThatDependOn', () => {
    it('returns empty array when no one depends on package', () => {
      const repo = createRepoFromStructure({
        dependencies: { '@chainlink/foo-adapter': [] },
        changesets: {},
      })
      expect(repo.getPackagesThatDependOn('@chainlink/foo-adapter')).toEqual([])
    })

    it('returns packages that list the given package as dependency', () => {
      const repo = createRepoFromStructure({
        dependencies: {
          '@chainlink/foo-adapter': [],
          '@chainlink/bar-adapter': ['@chainlink/foo-adapter'],
          '@chainlink/baz-adapter': ['@chainlink/foo-adapter'],
        },
        changesets: {},
      })
      const dependants = repo.getPackagesThatDependOn('@chainlink/foo-adapter')
      expect(dependants).toEqual(['@chainlink/bar-adapter', '@chainlink/baz-adapter'])
    })

    it('returns empty array for unknown package', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: {},
      })
      expect(repo.getPackagesThatDependOn('@chainlink/unknown')).toEqual([])
    })
  })

  describe('getPackagesFromChangesetFiles', () => {
    it('returns all packages from all changesets when no files given', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: {
          'a.md': ['@chainlink/foo-adapter'],
          'b.md': ['@chainlink/bar-adapter', '@chainlink/foo-adapter'],
        },
      })
      expect(repo.getPackagesFromChangesetFiles()).toEqual([
        '@chainlink/foo-adapter',
        '@chainlink/bar-adapter',
      ])
    })

    it('returns packages only from given files', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: {
          'a.md': ['@chainlink/foo-adapter'],
          'b.md': ['@chainlink/bar-adapter'],
        },
      })
      expect(repo.getPackagesFromChangesetFiles(['a.md'])).toEqual(['@chainlink/foo-adapter'])
      expect(repo.getPackagesFromChangesetFiles(['a.md', 'b.md'])).toEqual([
        '@chainlink/foo-adapter',
        '@chainlink/bar-adapter',
      ])
    })

    it('returns empty array when changesets empty', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: {},
      })
      expect(repo.getPackagesFromChangesetFiles()).toEqual([])
    })
  })

  describe('getChangesetFilesMentioningPackage', () => {
    it('returns files that mention the package', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: {
          'gold.md': ['@chainlink/gold-adapter', '@chainlink/scripts'],
          'scripts.md': ['@chainlink/scripts'],
        },
      })
      expect(repo.getChangesetFilesMentioningPackage('@chainlink/scripts')).toEqual([
        'gold.md',
        'scripts.md',
      ])
      expect(repo.getChangesetFilesMentioningPackage('@chainlink/gold-adapter')).toEqual([
        'gold.md',
      ])
    })

    it('returns empty array when package not in any changeset', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: { 'a.md': ['@chainlink/foo-adapter'] },
      })
      expect(repo.getChangesetFilesMentioningPackage('@chainlink/bar-adapter')).toEqual([])
    })
  })

  describe('getAllWorkspacePackageNames', () => {
    it('returns all packages from dependencies and changesets', () => {
      const repo = createRepoFromStructure({
        dependencies: {
          '@chainlink/bar-adapter': ['@chainlink/foo-adapter'],
        },
        changesets: { 'gold.md': ['@chainlink/gold-adapter'] },
      })
      expect(repo.getAllWorkspacePackageNames()).toEqual([
        '@chainlink/bar-adapter',
        '@chainlink/foo-adapter',
        '@chainlink/gold-adapter',
      ])
    })

    it('returns empty array for empty structure', () => {
      const repo = createRepoFromStructure({
        dependencies: {},
        changesets: {},
      })
      expect(repo.getAllWorkspacePackageNames()).toEqual([])
    })
  })
})
