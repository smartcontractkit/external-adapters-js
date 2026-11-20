import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  API_ENDPOINT,
  API_KEY,
  AUTH_ENDPOINT,
  CLIENT_ID,
  mockLoginSuccess,
  mockScoresSuccess,
} from '../integration/fixtures'

const ENV_KEYS = ['API_ENDPOINT', 'AUTH_API_ENDPOINT', 'SPGI_CLIENT_ID', 'SPGI_APIKEY']

describe('probe: numeric scaling', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = API_ENDPOINT
    process.env.AUTH_API_ENDPOINT = AUTH_ENDPOINT
    process.env.SPGI_CLIENT_ID = CLIENT_ID
    process.env.SPGI_APIKEY = API_KEY

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    ENV_KEYS.forEach((key) => {
      if (oldEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = oldEnv[key]
      }
    })
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  it('publishes the string score as an integer and the record time in seconds', async () => {
    mockLoginSuccess()
    mockScoresSuccess()

    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-EURC' })
    const body = response.json()

    expect(response.statusCode).toBe(200)
    expect(typeof body.result).toBe('number')
    expect(Number.isInteger(body.result)).toBe(true)
    expect(body.result).toBe(2)
    expect(body.data.exchangeRate).toBe(2)
    expect(typeof body.data.exchangeRate).toBe('number')
    expect(body.data.validFromTimestamp).toBe(1766102400)
    expect(body.data.observationsTimestamp).toBe(1766102400)
    expect(body.timestamps.providerIndicatedTimeUnixMs).toBe(1766102400000)
  })
})
