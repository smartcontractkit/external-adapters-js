import * as path from 'path'
import { discoverRepoStructure } from '../realRepo'

describe('discoverRepoStructure', () => {
  const originalCwd = process.cwd()

  beforeEach(() => {
    process.chdir(originalCwd)
  })

  it('discovers packages and changesets from fixture when cwd is fixture dir', () => {
    const fixtureDir = path.join(__dirname, 'fixture')
    process.chdir(fixtureDir)

    const structure = discoverRepoStructure()
    expect(structure).toEqual({
      dependencies: {
        '@chainlink/foo-adapter': [],
        '@chainlink/bar-adapter': ['@chainlink/foo-adapter'],
        '@chainlink/scripts': [],
      },
      changesets: {
        'gold.md': ['@chainlink/foo-adapter', '@chainlink/bar-adapter', '@chainlink/ea-scripts'],
      },
    })
  })
})
