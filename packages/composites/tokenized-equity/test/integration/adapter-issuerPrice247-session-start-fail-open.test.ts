import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

// The fail-open position of ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION
// (=false): indeterminate sessions are served with a warning instead of 503. Env is
// fixed at adapter startup, so this gets its own file. Flag-off no-regression is
// covered by adapter-issuerPrice247.test.ts; fail-closed behavior by
// adapter-issuerPrice247-session-start.test.ts.

const feedId = '0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1'
const NOW = new Date('2024-01-06T15:00:00.000Z').getTime() // Sat 10:00 ET

const ns = (iso: string): string => (BigInt(new Date(iso).getTime()) * 10n ** 6n).toString()

const reportMarketStatus = 0 // UNKNOWN — indeterminate

const mockDataEngine = (): nock.Scope =>
  nock('http://data-engine', { encodedQueryParams: true })
    .post('/', { data: { endpoint: 'deutscheBoerse-v11', feedId } })
    .reply(200, () => ({
      result: null,
      data: {
        mid: '250000000000000000000',
        lastSeenTimestampNs: ns('2024-01-06T14:00:00.000Z'),
        bid: '249900000000000000000',
        bidVolume: 4,
        ask: '250100000000000000000',
        askVolume: 6,
        lastTradedPrice: '250000000000000000000',
        marketStatus: reportMarketStatus,
        decimals: 18,
      },
      statusCode: 200,
    }))
    .persist()

const mockTradingHours = (): nock.Scope =>
  nock('http://tradinghours', { encodedQueryParams: true })
    .post('/', (body) => body?.data?.endpoint === 'market-session')
    .reply(200, { result: null, data: { result: [] }, statusCode: 200 })
    .persist()

describe('issuer-price-247 session-start gating, fail-open on indeterminate', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.DATA_ENGINE_ADAPTER_URL = 'http://data-engine'
    process.env.TRADING_HOURS_ADAPTER_URL = 'http://tradinghours'
    process.env.ETHEREUM_RPC_URL = 'fake-eth-url'
    process.env.BASE_RPC_URL = 'fake-base-url'
    process.env.ROBINHOOD_MAINNET_RPC_URL = 'fake-robinhood-url'
    process.env.ROBINHOOD_MAINNET_CHAIN_ID = '4663'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '1000'
    process.env.ISSUER_247_SESSION_START_GATING_ENABLED = 'true'
    process.env.ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION = 'false'
    spy = jest.spyOn(Date, 'now').mockReturnValue(NOW)

    mockDataEngine()
    mockTradingHours()

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

  it('serves an UNKNOWN-status report (200) instead of 503, without a gatingSessionSource', async () => {
    const response = await testAdapter.request({
      endpoint: 'issuer-price-247',
      targetEndpoint: 'v11',
      feedId,
      resultPath: 'lastTradedPrice',
      decimals: 8,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe('25000000000')
    expect(response.json().data.gatingSessionSource).toBeUndefined()
  })
})
