import { getJobMatrix } from './lib'

describe('job matrix generation', () => {
  it('should generate a job matrix consumable by gha', () => {
    expect(getJobMatrix()).toMatchSnapshot()
  })
  it('should generate a job matrix suitable for pushing to ecr', () => {
    process.env.IMAGE_PREFIX = 'public.ecr.aws/chainlink-staging/adapters/'
    process.env.TAG = 'EAEE'
    expect(getJobMatrix()).toMatchSnapshot()
  })
})
