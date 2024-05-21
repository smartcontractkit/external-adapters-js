import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockBalancesResponseSuccess, mockWalletsResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const balanceData = {
    portfolio: 'abcd1234-123a-1234-ab12-12a34bcd56e7',
    symbol: 'BTC',
  }
  const walletData = {
    endpoint: 'wallet',
    portfolio: 'abcd1234-123a-1234-ab12-12a34bcd56e7',
    symbols: ['BTC'],
    type: 'vault',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['ACCESS_KEY'] = 'fake-access-key'
    process.env['PASSPHRASE'] = 'fake-passphrase'
    process.env['SIGNING_KEY'] = 'fake-signing-key'
    process.env['BACKGROUND_EXECUTE_MS'] = '0'

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

  describe('balance endpoint', () => {
    it('should return success', async () => {
      mockBalancesResponseSuccess()
      const response = await testAdapter.request(balanceData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('wallet endpoint', () => {
    it('should return success', async () => {
      mockWalletsResponseSuccess()
      const response = await testAdapter.request(walletData)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
