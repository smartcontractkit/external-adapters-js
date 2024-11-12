import { mockResponseSuccess } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['ACCESS_KEY'] = process.env['ACCESS_KEY'] || 'fake-access-key'
    process.env['PASSPHRASE'] = process.env['PASSPHRASE'] || 'fake-passphrase'
    process.env['SIGNING_KEY'] = process.env['SIGNING_KEY'] || 'fake-signing-key'
    process.env['PORTFOLIO_ID'] = process.env['PORTFOLIO_ID'] || 'fake-portfolio'
    process.env['RPC_URL'] =
      process.env['RPC_URL'] || 'https://mainnet.infura.io:443/v3/fake-infura-key'

    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('portfolio api', () => {
    it('should return success', async () => {
      mockResponseSuccess()
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
