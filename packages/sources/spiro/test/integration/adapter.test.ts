import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  API,
  mockNav,
  mockPor,
  mockProviderError,
  navEntry,
  navResponse,
  porResponse,
} from './fixtures'

const expectSnapshot = (response: { statusCode: number; json: () => unknown }) => {
  expect({ statusCode: response.statusCode, body: response.json() }).toMatchSnapshot()
}

describe('execute', () => {
  let spy: ReturnType<typeof jest.spyOn>
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    process.env.API_ENDPOINT = `${API}/api/chainlink/funds`
    process.env.API_KEY = 'fake-key'
    process.env.METRICS_ENABLED = 'true'
    process.env.EXPERIMENTAL_METRICS_ENABLED = 'true'
    process.env.METRICS_PORT = '0'
    process.env.RETRY = '0'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '100'
    process.env.LOG_LEVEL = 'error'

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  it('returns the latest NAV entry', async () => {
    const fundId = 'michigan-pilot'
    mockNav(
      fundId,
      navResponse(fundId, {
        data: [
          navEntry(fundId, {
            net_asset_value_date: '2026-10-11',
            net_asset_value: '0.990000',
            assets_under_management: '5300000.00',
          }),
          navEntry(fundId, {
            net_asset_value_date: '2026-10-13',
            net_asset_value: '1.000000',
            assets_under_management: '5400000.00',
          }),
          navEntry(fundId, {
            net_asset_value_date: '2026-10-12',
            net_asset_value: '0.995000',
            assets_under_management: '5350000.00',
          }),
        ],
      }),
    )

    const response = await testAdapter.request({
      endpoint: 'nav',
      fundId,
      // Undeclared parameters are ignored by the framework and do not enter the feedId.
      reportValue: 'assets_under_management',
    })
    expectSnapshot(response)
  })

  it('returns the PoR total reserves', async () => {
    const fundId = 'michigan-pilot'
    mockPor(fundId, porResponse())
    const response = await testAdapter.request({ endpoint: 'por', fundId })
    expectSnapshot(response)
  })

  it.each(['nav', 'por'])('returns 502 when ripcord is true for %s', async (endpoint) => {
    const fundId = `ripcord-${endpoint}`
    const detail = endpoint === 'nav' ? 'source unavailable' : 'attestation pending'
    if (endpoint === 'nav') {
      mockNav(fundId, navResponse(fundId, { ripcord: true, ripcordDetails: [detail] }))
    } else {
      mockPor(fundId, porResponse({ ripcord: true, ripcordDetails: [detail] }))
    }

    const response = await testAdapter.request({ endpoint, fundId })
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('Ripcord indicator true')
    expect(response.json().errorMessage).toContain(detail)
  })

  const providerErrorCases: ['nav' | 'por', number, object][] = [
    ['nav', 401, { error: 'unauthorized' }],
    ['por', 404, { error: 'unknown fund' }],
  ]

  it.each(providerErrorCases)(
    'returns 502 for provider %s status %i',
    async (endpoint, status, body) => {
      const fundId = `provider-error-${endpoint}-${status}`
      mockProviderError(endpoint, fundId, status, body)

      const response = await testAdapter.request({ endpoint, fundId })
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain(String(status))
      expect(response.json().errorMessage).toContain(JSON.stringify(body))
    },
  )

  it.each(['nav', 'por'])('rejects invalid fundIds for %s', async (endpoint) => {
    for (const fundId of ['CaseFund', '../etc/passwd']) {
      const response = await testAdapter.request({ endpoint, fundId })
      expect(response.statusCode).toBe(400)
      expect(response.json().error.message).toContain('Invalid fundId')
    }

    const missing = await testAdapter.request({ endpoint })
    expect(missing.statusCode).toBe(400)
    expect(missing.json().error.message).toContain('fundId')
  })

  it('returns 502 for empty NAV data', async () => {
    const fundId = 'empty-nav'
    mockNav(fundId, navResponse(fundId, { data: [] }))
    const response = await testAdapter.request({ endpoint: 'nav', fundId })
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('did not return any NAV entries')
  })

  it('returns 502 for invalid NAV decimal', async () => {
    const fundId = 'invalid-nav-decimal'
    mockNav(fundId, navResponse(fundId, { data: [navEntry(fundId, { net_asset_value: '0x10' })] }))
    const response = await testAdapter.request({ endpoint: 'nav', fundId })
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('net_asset_value is not a valid value: 0x10')
  })

  it('returns 502 for invalid PoR reserve', async () => {
    const fundId = 'invalid-por-reserve'
    mockPor(fundId, porResponse({ totalReserve: '5.4e6' }))
    const response = await testAdapter.request({ endpoint: 'por', fundId })
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('totalReserve is not a valid value: 5.4e6')
  })
})
