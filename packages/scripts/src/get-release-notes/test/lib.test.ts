import { getReleaseNotes } from '../lib'
import { mockGetWorkspacePackagesResponse } from '../fixtures/getWorkspacePackages'
import { mockReaddirSyncResponse, mockFileContentsMap } from '../fixtures/fs'

jest.mock('../../workspace', () => {
  return {
    getWorkspacePackages: () => {
      return mockGetWorkspacePackagesResponse
    },
  }
})

jest.mock('fs', () => {
  return {
    readFileSync: (path: string) => {
      const output = mockFileContentsMap[path] || ''

      return output.replace(/  +/g, '')
    },
    readdirSync: () => {
      return mockReaddirSyncResponse
    },
  }
})

describe('getReleaseNotes', () => {
  it('should return markdown with changeset descriptions and adapter versions', async () => {
    const result = getReleaseNotes()
    const expectedResult = `
# Changeset
## Breaking changes (major)
- Changeset description for: 'brave-jokes-melt.md'
## Features (minor)
- Changeset description for: 'fast-zoos-itch.md'
- Changeset description for: 'nervous-jars-pretend.md'
## Bug fixes (patch)
- Changeset description for: 'bright-peaches-matter.md'

|    Adapter    | Version |
| :-----------: | :-----: |
| @chainlink/anchor-adapter | 3.1.0 |
| @chainlink/defi-pulse-adapter | 1.0.50 |
| @chainlink/savax-price-adapter | 2.0.0 |
`

    expect(result).toBe(expectedResult)
  })
})
