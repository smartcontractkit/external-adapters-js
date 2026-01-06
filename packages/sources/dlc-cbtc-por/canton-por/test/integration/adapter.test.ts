import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { MOCK_ATTESTER_API_URL, MOCK_DA_API_URL, mockAllApis } from './fixtures'

describe('Canton PoR Adapter Integration Tests', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['CANTON_API_URL'] = `${MOCK_DA_API_URL}/instruments`
    process.env['ATTESTER_API_URL'] = MOCK_ATTESTER_API_URL

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

  describe('daSupply endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request({ endpoint: 'daSupply' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should work with daTotalSupply alias', async () => {
      const response = await testAdapter.request({ endpoint: 'daTotalSupply' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should use daSupply as default endpoint', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('attesterSupply endpoint', () => {
    it('should return success', async () => {
      const response = await testAdapter.request({ endpoint: 'attesterSupply' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should work with attesterTotalSupply alias', async () => {
      const response = await testAdapter.request({ endpoint: 'attesterTotalSupply' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
