import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockBlendedErrorResponse,
  mockBlendedIncompleteResponse,
  mockBlendedInsufficientDataResponse,
  mockBlendedInternalErrorResponse,
  mockBlendedNyseResponse,
  mockBlendedTwoSessionResponse,
  SPY_FEEDS,
} from './fixtures'

describe('blended endpoint', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let spy: jest.SpyInstance

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_USERNAME = 'fake-username'
    process.env.API_PASSWORD = 'fake-password'
    // Disable requester retries so provider errors surface deterministically
    // (the randomized backoff can outlast the test adapter's cache polling window)
    process.env.RETRY = '0'

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

  it('should return success with blended data for a market with all four session feeds', async () => {
    mockBlendedNyseResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nyse',
      ...SPY_FEEDS,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe('64640960000000000000000')
    expect(response.json()).toMatchSnapshot()
  })

  it('should return success with blended data for a market with open and closed feeds only', async () => {
    mockBlendedTwoSessionResponse('wti')
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'wti',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe('64640960000000000000000')
    expect(response.json()).toMatchSnapshot()
  })

  it('should populate the result from resultPath when provided', async () => {
    mockBlendedTwoSessionResponse('nymex')
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nymex',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
      resultPath: 'rawPrice',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe('64640960000000000000001')
    expect(response.json()).toMatchSnapshot()
  })

  it('should scale the resultPath value when decimals is provided', async () => {
    mockBlendedTwoSessionResponse('nymex_brent')
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nymex_brent',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
      resultPath: 'rawPrice',
      decimals: 8,
    })
    expect(response.statusCode).toBe(200)
    // 64640960000000000000001 at 18 decimals scaled to 8 decimals (truncated)
    expect(response.json().result).toBe('6464096000000')
    expect(response.json()).toMatchSnapshot()
  })

  it('should scale the default indicatorPrice when decimals is provided without resultPath', async () => {
    mockBlendedTwoSessionResponse('comex_copper')
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'comex_copper',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
      decimals: 8,
    })
    expect(response.statusCode).toBe(200)
    // default resultPath is indicatorPrice: 64640960000000000000000 at 18 decimals scaled to 8 (truncated)
    expect(response.json().result).toBe('6464096000000')
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 400 when resultPath points to a field that does not exist', async () => {
    mockBlendedTwoSessionResponse('forex')
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'forex',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
      resultPath: 'nonExistentField',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 400 when overnight is provided without extended', async () => {
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nyse',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
      overnight: SPY_FEEDS.overnight,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 400 when extended is provided without overnight', async () => {
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nyse',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
      extended: SPY_FEEDS.extended,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 400 when required params are missing', async () => {
    const response = await testAdapter.request({
      endpoint: 'blended',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 502 when provider returns 400', async () => {
    mockBlendedErrorResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nasdaq',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
    })
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 502 when provider returns 503 insufficient data', async () => {
    mockBlendedInsufficientDataResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'jpx',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
    })
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 502 when provider returns 500', async () => {
    mockBlendedInternalErrorResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'krx',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
    })
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 502 when provider returns incomplete response', async () => {
    mockBlendedIncompleteResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'metals',
      open: SPY_FEEDS.open,
      closed: SPY_FEEDS.closed,
    })
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })
})
