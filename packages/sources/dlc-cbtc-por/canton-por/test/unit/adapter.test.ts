import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

const MOCK_DA_API_URL = 'https://test.digitalasset.api'
const MOCK_ATTESTER_API_URL = 'https://test.attester.api'

/**
 * Integration tests for the adapter endpoints.
 * Unit tests for parsing logic are in da-supply.test.ts and attester-supply.test.ts.
 */
describe('Canton PoR Adapter', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CANTON_API_URL'] = `${MOCK_DA_API_URL}/instruments`
    process.env['ATTESTER_API_URL'] = MOCK_ATTESTER_API_URL

    const mockDate = new Date('2024-01-01T12:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Mock Digital Asset API
    nock(MOCK_DA_API_URL)
      .get('/instruments')
      .reply(200, {
        instruments: [
          {
            id: 'CBTC',
            name: 'CBTC',
            symbol: 'CBTC',
            totalSupply: '21000000.1234567890',
            totalSupplyAsOf: null,
            decimals: 10,
            supportedApis: {},
          },
        ],
        nextPageToken: null,
      })
      .persist()

    // Mock Attester API
    nock(MOCK_ATTESTER_API_URL)
      .get('/app/get-total-cbtc-supply')
      .reply(200, {
        status: 'ready',
        total_supply_cbtc: '7.899823260000001',
        last_updated: '2025-01-01T00:00:00.000Z',
      })
      .persist()

    const adapter = (await import('../../src')).adapter
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

  describe('daSupply endpoint (Digital Asset API)', () => {
    it('should return total supply as scaled BigInt string', async () => {
      const response = await testAdapter.request({ endpoint: 'daSupply' })
      expect(response.statusCode).toBe(200)

      const json = response.json()
      expect(json.result).toBe('210000001234567890')
      expect(json.data.result).toBe('210000001234567890')
    })

    it('should use daSupply as default endpoint', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe('210000001234567890')
    })
  })

  describe('attesterSupply endpoint (Attester API)', () => {
    it('should return total supply as scaled BigInt string', async () => {
      const response = await testAdapter.request({ endpoint: 'attesterSupply' })
      expect(response.statusCode).toBe(200)

      const json = response.json()
      // 7.899823260000001 truncated to 10 decimals = 7.8998232600 = 78998232600
      expect(json.result).toBe('78998232600')
      expect(json.data.result).toBe('78998232600')
    })
  })
})
