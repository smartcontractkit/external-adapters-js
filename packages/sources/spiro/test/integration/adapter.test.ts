import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  mockNavEmpty,
  mockNavOutOfOrder,
  mockNavRipcord,
  mockNavSuccess,
  mockPorRipcord,
  mockPorSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: ReturnType<typeof jest.spyOn>
  let testAdapter: TestAdapter<any>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    process.env.API_ENDPOINT = 'http://test-api.com'
    process.env.API_KEY = 'fake-key'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'
    process.env.EXPERIMENTAL_METRICS_ENABLED = 'true'

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<any>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('nav endpoint', () => {
    it('should return success with the sample request/response shape', async () => {
      mockNavSuccess('michigan-pilot')
      const response = await testAdapter.request({
        endpoint: 'nav',
        fundId: 'michigan-pilot',
        reportValue: 'net_asset_value',
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toEqual({
        result: 1,
        nav: 1,
        aum: 5400000,
        navDate: '2026-10-13',
        navDateTimestampMs: 1791849600000,
        ripcord: false,
        ripcordAsInt: 0,
      })
      expect(body.result).toBe(1)
      expect(body.meta.adapterName).toBe('SPIRO')
      expect(body.meta.transportName).toBe('default_single_transport')
      expect(body.meta.metrics.feedId).toBe(
        '{"fundId":"michigan-pilot","reportValue":"net_asset_value"}',
      )
      expect(typeof body.timestamps.providerDataRequestedUnixMs).toBe('number')
      expect(typeof body.timestamps.providerDataReceivedUnixMs).toBe('number')
    })

    it('should report aum when reportValue is assets_under_management', async () => {
      mockNavSuccess('aum-fund')
      const response = await testAdapter.request({
        endpoint: 'nav',
        fundId: 'aum-fund',
        reportValue: 'assets_under_management',
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.result).toBe(5400000)
      expect(body.result).toBe(5400000)
      expect(body.data.aum).toBe(5400000)
      expect(body.data.nav).toBe(1)
    })

    it('should select the latest NAV entry by net_asset_value_date regardless of array order', async () => {
      mockNavOutOfOrder('order-fund')
      const response = await testAdapter.request({
        endpoint: 'nav',
        fundId: 'order-fund',
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.navDate).toBe('2026-10-13')
      expect(body.data.result).toBe(1)
      expect(body.data.navDateTimestampMs).toBe(1791849600000)
    })

    it('should return 502 on ripcord=true', async () => {
      mockNavRipcord('ripcord-fund')
      const response = await testAdapter.request({
        endpoint: 'nav',
        fundId: 'ripcord-fund',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain('Ripcord indicator true')
      expect(response.json().errorMessage).toContain('NAV data source unavailable')
    })

    it('should return 200 with ripcord state when noErrorOnRipcord is set', async () => {
      mockNavRipcord('ripcord-ok-fund')
      const response = await testAdapter.request({
        endpoint: 'nav',
        fundId: 'ripcord-ok-fund',
        noErrorOnRipcord: true,
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.ripcord).toBe(true)
      expect(body.data.ripcordAsInt).toBe(1)
      expect(body.data.result).toBe(1)
    })

    it('should return 502 when the NAV array is empty', async () => {
      mockNavEmpty('empty-fund')
      const response = await testAdapter.request({
        endpoint: 'nav',
        fundId: 'empty-fund',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain('did not return any value')
    })

    it('should reject an invalid reportValue with 400', async () => {
      const response = await testAdapter.request({
        endpoint: 'nav',
        fundId: 'michigan-pilot',
        reportValue: 'not_a_value',
      })
      expect(response.statusCode).toBe(400)
    })
  })

  describe('por endpoint', () => {
    it('should return success with the sample request/response shape', async () => {
      mockPorSuccess('michigan-pilot')
      const response = await testAdapter.request({
        endpoint: 'por',
        fundId: 'michigan-pilot',
        reportValue: 'totalReserve',
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toEqual({
        result: 5400000,
        totalReserves: 5400000,
        ripcord: false,
        ripcordAsInt: 0,
      })
      expect(body.result).toBe(5400000)
      expect(body.meta.adapterName).toBe('SPIRO')
      // calculateFeedId lowercases param values; downstream feed tickets
      // (OPDATA-9357/9356) must use this exact lowercase string.
      expect(body.meta.metrics.feedId).toBe(
        '{"fundId":"michigan-pilot","reportValue":"totalreserve"}',
      )
      expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(1791849900000)
    })

    it('should return 502 on ripcord=true', async () => {
      mockPorRipcord('por-ripcord-fund')
      const response = await testAdapter.request({
        endpoint: 'por',
        fundId: 'por-ripcord-fund',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain('Reserve attestation pending')
    })

    it('should return 200 with ripcord state when noErrorOnRipcord is set', async () => {
      mockPorRipcord('por-ripcord-ok-fund')
      const response = await testAdapter.request({
        endpoint: 'por',
        fundId: 'por-ripcord-ok-fund',
        noErrorOnRipcord: true,
      })
      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.ripcord).toBe(true)
      expect(body.data.ripcordAsInt).toBe(1)
      expect(body.data.totalReserves).toBe(5400000)
    })

    it('should reject an unknown fund id shape with 400 when fundId is missing', async () => {
      const response = await testAdapter.request({
        endpoint: 'por',
        reportValue: 'totalReserve',
      })
      expect(response.statusCode).toBe(400)
    })
  })
})
