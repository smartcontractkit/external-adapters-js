import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  MOCK_ATTESTER_API_URLS,
  MOCK_BITCOIN_RPC_URL,
  MOCK_DA_API_URL,
  mockAllApis,
} from './fixtures'

describe('DLC CBTC PoR Adapter', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CANTON_API_URL'] = `${MOCK_DA_API_URL}/instruments`
    process.env['ATTESTER_API_URLS'] = MOCK_ATTESTER_API_URLS
    process.env['BITCOIN_RPC_ENDPOINT'] = MOCK_BITCOIN_RPC_URL
    process.env['CHAIN_NAME'] = 'canton-mainnet'
    process.env['BACKGROUND_EXECUTE_MS'] = '10000'

    const mockDate = new Date('2024-01-01T12:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockAllApis()

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

  describe('attesterSupply endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request({ endpoint: 'attesterSupply' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should use attesterSupply as default endpoint', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('daSupply endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request({ endpoint: 'daSupply' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('reserves endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
