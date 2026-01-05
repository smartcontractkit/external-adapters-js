import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

const MOCK_API_URL = 'https://test.digitalasset.api'

/**
 * Integration tests for the adapter endpoints.
 * Unit tests for parsing logic are in supply.test.ts.
 */
describe('Canton Digital Assets PoR Adapter', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CANTON_API_URL'] = `${MOCK_API_URL}/instruments`

    const mockDate = new Date('2024-01-01T12:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    nock(MOCK_API_URL)
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

  it('should return total supply as scaled BigInt string', async () => {
    const response = await testAdapter.request({ endpoint: 'supply' })
    expect(response.statusCode).toBe(200)

    const json = response.json()
    expect(json.result).toBe('210000001234567890')
    expect(json.data.result).toBe('210000001234567890')
  })

  it('should respond to totalSupply alias', async () => {
    const response = await testAdapter.request({ endpoint: 'totalSupply' })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe('210000001234567890')
  })

  it('should respond to reserves alias', async () => {
    const response = await testAdapter.request({ endpoint: 'reserves' })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe('210000001234567890')
  })

  it('should use supply as default endpoint', async () => {
    const response = await testAdapter.request({})
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe('210000001234567890')
  })
})
