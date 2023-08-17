import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    ;(process.env.FILECOIN_RPC_URL =
      process.env.FILECOIN_RPC_URL ?? 'http://127.0.0.1:1234/rpc/v0'),
      (process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key')
    process.env['BACKGROUND_EXECUTE_MS'] = '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
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
    it('should return success with one address', async () => {
      const data = {
        addresses: [{ address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' }],
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success multiple addresses', async () => {
      const data = {
        addresses: [
          { address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' },
          { address: 'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay' },
        ],
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('result is an alias for addresses', async () => {
      const data = {
        result: [
          { address: 'f2eaaj6w4evrdscw4s4o5c3df7ph725tbs3yvg6gi' },
          { address: 'f225ey7bq53ur6sgrkxgf74hl2ftxkajupatwnmay' },
        ],
      }
      mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error with empty addresses', async () => {
      const data = {
        result: [],
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
