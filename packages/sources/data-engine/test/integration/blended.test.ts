import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  BLENDED_FEEDS,
  mockBlendedErrorResponse,
  mockBlendedForexResponse,
  mockBlendedIncompleteResponse,
  mockBlendedInsufficientDataResponse,
  mockBlendedInternalErrorResponse,
  mockBlendedNyseResponse,
} from './fixtures'

describe('blended endpoint', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let spy: jest.SpyInstance

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_USERNAME = 'fake-username'
    process.env.API_PASSWORD = 'fake-password'

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
      ...BLENDED_FEEDS.nyse,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return success with blended data for a market with open and closed feeds only', async () => {
    mockBlendedForexResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'forex',
      ...BLENDED_FEEDS.forex,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 400 when overnight is provided without extended', async () => {
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nyse',
      open: BLENDED_FEEDS.nyse.open,
      closed: BLENDED_FEEDS.nyse.closed,
      overnight: BLENDED_FEEDS.nyse.overnight,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 400 when extended is provided without overnight', async () => {
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nyse',
      open: BLENDED_FEEDS.nyse.open,
      closed: BLENDED_FEEDS.nyse.closed,
      extended: BLENDED_FEEDS.nyse.extended,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 400 when required params are missing', async () => {
    const response = await testAdapter.request({
      endpoint: 'blended',
      open: BLENDED_FEEDS.forex.open,
      closed: BLENDED_FEEDS.forex.closed,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should pass through provider 400 errors', async () => {
    mockBlendedErrorResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'nasdaq',
      ...BLENDED_FEEDS.nasdaq,
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchSnapshot()
  })

  it('should pass through provider 503 insufficient data errors', async () => {
    mockBlendedInsufficientDataResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'jpx',
      ...BLENDED_FEEDS.jpx,
    })
    expect(response.statusCode).toBe(503)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 502 when provider returns 500', async () => {
    mockBlendedInternalErrorResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'krx',
      ...BLENDED_FEEDS.krx,
    })
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })

  it('should return 502 when provider returns incomplete response', async () => {
    mockBlendedIncompleteResponse()
    const response = await testAdapter.request({
      endpoint: 'blended',
      market: 'metals',
      ...BLENDED_FEEDS.metals,
    })
    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchSnapshot()
  })
})
