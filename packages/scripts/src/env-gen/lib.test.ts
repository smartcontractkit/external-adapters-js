import { getMergedEnvs } from './lib'
describe('for each consumer package', () => {
  it('should create merged envs  ', () => {
    expect(getMergedEnvs()).toMatchSnapshot()
  })
})
