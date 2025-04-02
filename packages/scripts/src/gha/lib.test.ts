import { getJobMatrix } from './lib'
import { mockGetWorkspacePackagesResponse } from '../fixtures/getWorkspacePackages'

jest.mock('../workspace', () => {
  return {
    getWorkspaceAdapters: () => {
      return mockGetWorkspacePackagesResponse
    },
    getWorkspacePackages: () => {
      return mockGetWorkspacePackagesResponse
    },
  }
})

describe('job matrix generation', () => {
  it('should generate a job matrix consumable by gha', async () => {
    expect(await getJobMatrix()).toMatchSnapshot()
  })
  it('should generate a job matrix suitable for pushing to ecr', async () => {
    process.env.IMAGE_PREFIX = 'public.ecr.aws/chainlink-staging/adapters/'
    process.env.BRANCH = 'EAEE'
    expect(await getJobMatrix()).toMatchSnapshot()
  })
})
