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
    const indent = '\u00A0\u00A0'
    const expectedResult = `
# Changeset
## Breaking changes (major)
- Changeset description for: 'brave-jokes-melt.md'
${indent}- anchor-adapter

## Features (minor)
- Changeset description for: 'fast-zoos-itch.md'
${indent}- anchor-adapter, defi-pulse-adapter
- Changeset description for: 'nervous-jars-pretend.md'
${indent}- savax-price-adapter

## Bug fixes (patch)
- Changeset description for: 'bright-peaches-matter.md'
${indent}- anchor-adapter

|    Adapter    | Version |
| :-----------: | :-----: |
| @chainlink/anchor-adapter | 3.1.0 |
| @chainlink/defi-pulse-adapter | 1.0.50 |
| @chainlink/savax-price-adapter | 2.0.0 |
`

    expect(result).toBe(expectedResult)
  })
})
