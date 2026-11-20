import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  MockCache,
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
import { ssaTransport } from '../../src/transport/ssa'
import { scoresFixture, tokenResponseBody } from '../fixtures'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>

const dataPath = '/api/v1/ssa/getAllScores'

const restoreEnv = (oldEnv: NodeJS.ProcessEnv) => {
  for (const key of Object.keys(process.env)) {
    if (!(key in oldEnv)) {
      delete process.env[key]
    }
  }
  setEnvVariables(oldEnv)
}

describe('ssa endpoint', () => {
  let testAdapter: TestAdapter<SettingsDefinition> & { mockCache: MockCache }
  let oldEnv: NodeJS.ProcessEnv

  const request = (security_id: string) => testAdapter.request({ endpoint: 'ssa', security_id })

  const mockToken = () =>
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(200, tokenResponseBody)
      .persist()

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.AUTH_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '0'
    process.env.CACHE_POLLING_SLEEP_MS = '10'
    process.env.API_TIMEOUT = '2000'
    process.env.RETRY = '0'
    delete process.env.ORIGIN

    jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-06-01T00:00:00.000Z').getTime())

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    mockToken()
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })
  })

  beforeEach(() => {
    nock.cleanAll()
    mockToken()
  })

  afterAll(async () => {
    restoreEnv(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    jest.restoreAllMocks()
  })

  it('sends the recorded SSA request contract', async () => {
    const contract = nock('http://api.com')
      .get(dataPath)
      .matchHeader('accept', 'application/json')
      .matchHeader('content-type', 'application/json')
      .matchHeader('authorization', `Bearer ${tokenResponseBody.access_token}`)
      .matchHeader('apikey', 'api-key')
      .reply(200, scoresFixture())
    nock('http://api.com')
      .get(dataPath)
      .matchHeader('accept', 'application/json')
      .matchHeader('content-type', 'application/json')
      .matchHeader('authorization', `Bearer ${tokenResponseBody.access_token}`)
      .matchHeader('apikey', 'api-key')
      .reply(200, scoresFixture())
      .persist()

    const response = await request('SP-USDe')

    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(5)
    expect(contract.isDone()).toBe(true)
  })

  it('serves two subscriptions with one batched provider call', async () => {
    const cacheKey = (security_id: string) =>
      ssaTransport.responseCache.getCacheKey(ssaTransport.name, { security_id })
    const originalSet = testAdapter.mockCache.set.bind(testAdapter.mockCache)
    let getCalls = 0
    const getCallsAtWrite = new Map<string, number[]>()
    jest
      .spyOn(testAdapter.mockCache, 'set')
      .mockImplementation(async (key: string, value: Readonly<unknown>, ttl: number) => {
        getCallsAtWrite.set(key, [...(getCallsAtWrite.get(key) ?? []), getCalls])
        await originalSet(key, value, ttl)
      })
    nock('http://api.com')
      .get(dataPath)
      .reply(() => {
        getCalls++
        return [200, scoresFixture()]
      })
      .persist()

    const [eurc, usdc] = await Promise.all([request('SP-EURC'), request('SP-USDC')])

    expect(eurc.statusCode).toBe(200)
    expect(eurc.json()).toMatchSnapshot()
    expect(eurc.json()).toMatchObject({
      result: 2,
      data: { result: 2 },
      timestamps: { providerIndicatedTimeUnixMs: 1766102400000 },
    })
    expect(Object.keys(eurc.json().data)).toEqual(['result'])
    expect(usdc.statusCode).toBe(200)
    expect(usdc.json()).toMatchObject({
      result: 2,
      data: { result: 2 },
      timestamps: { providerIndicatedTimeUnixMs: 1766016000000 },
    })

    const eurcWrite = getCallsAtWrite.get(cacheKey('SP-EURC'))
    const usdcWrite = getCallsAtWrite.get(cacheKey('SP-USDC'))
    expect(eurcWrite).toBeDefined()
    expect(usdcWrite).toBeDefined()
    expect(usdcWrite?.[0]).toBe(eurcWrite?.[0])
  })

  it('serves case variants of one id from the canonical cache entry', async () => {
    nock('http://api.com').get(dataPath).reply(200, scoresFixture()).persist()
    const cacheKey = (security_id: string) =>
      ssaTransport.responseCache.getCacheKey(ssaTransport.name, { security_id })

    expect(cacheKey('SP-USDE')).toBe(cacheKey('SP-USDe'))

    const first = await request('SP-USDe')
    expect(first.statusCode).toBe(200)
    expect(first.json()).toMatchObject({
      result: 5,
      data: { result: 5 },
      timestamps: { providerIndicatedTimeUnixMs: 1768348800000 },
    })

    const second = await request('SP-USDE')
    expect(second.statusCode).toBe(200)
    expect(second.json()).toMatchObject({ result: 5, data: { result: 5 } })

    // Let the background tick that now holds the SP-USDE variant write the
    // canonical entry before the third request reads it.
    await new Promise((resolve) => setTimeout(resolve, 200))
    const cached = await testAdapter.mockCache.get(cacheKey('SP-USDe'))
    expect(cached).toMatchObject({ statusCode: 200, result: 5, data: { result: 5 } })
    expect((cached as { errorMessage?: string }).errorMessage).toBeUndefined()

    const third = await request('SP-USDe')
    expect(third.statusCode).toBe(200)
    expect(third.json()).toMatchObject({ result: 5, data: { result: 5 } })
  })

  it('returns 400 for a request without a security_id', async () => {
    const response = await testAdapter.request({ endpoint: 'ssa' })
    expect(response.statusCode).toBe(400)
    expect(JSON.stringify(response.json())).toContain('security_id')
  })

  it('returns 400 for a whitespace-only security_id', async () => {
    const response = await testAdapter.request({ endpoint: 'ssa', security_id: '   ' })
    expect(response.statusCode).toBe(400)
    expect(JSON.stringify(response.json())).toContain('security_id')
  })
})
