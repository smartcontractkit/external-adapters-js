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

describe('subscription registered during an in-flight batch', () => {
  let testAdapter: TestAdapter<SettingsDefinition> & { mockCache: MockCache }
  let oldEnv: NodeJS.ProcessEnv

  const request = (security_id: string) => testAdapter.request({ endpoint: 'ssa', security_id })

  const waitFor = async (condition: () => boolean, attempts = 100): Promise<void> => {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (condition()) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    expect(condition()).toBe(true)
  }

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.AUTH_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '0'
    process.env.CACHE_POLLING_MAX_RETRIES = '20'
    process.env.CACHE_POLLING_SLEEP_MS = '20'
    process.env.API_TIMEOUT = '2000'
    process.env.RETRY = '0'
    delete process.env.ORIGIN

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(200, tokenResponseBody)
      .persist()
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })
  })

  afterAll(async () => {
    restoreEnv(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it('serves a subscription registered during a batch on the next tick', async () => {
    const writeSpy = jest.spyOn(testAdapter.mockCache, 'setMany')
    let batchStarted = false
    const slowBatch = nock('http://api.com').get(dataPath).delay(300).reply(200, scoresFixture())
    slowBatch.on('request', () => {
      batchStarted = true
    })
    nock('http://api.com').get(dataPath).reply(200, scoresFixture()).persist()

    const first = request('SP-EURC')
    await waitFor(() => batchStarted)
    const second = request('SP-USDC')

    const [firstResponse, secondResponse] = await Promise.all([first, second])

    expect(firstResponse.statusCode).toBe(200)
    expect(secondResponse.statusCode).toBe(200)

    const cacheKey = (security_id: string) =>
      ssaTransport.responseCache.getCacheKey(ssaTransport.name, { security_id })
    const firstKey = cacheKey('SP-EURC')
    const secondKey = cacheKey('SP-USDC')
    const batches = writeSpy.mock.calls.map(([entries]) => entries.map(({ key }) => key))
    const firstBatch = batches.findIndex((keys) => keys.includes(firstKey))
    const secondBatch = batches.findIndex((keys) => keys.includes(secondKey))

    expect(firstBatch).toBeGreaterThanOrEqual(0)
    expect(batches[firstBatch]).toEqual([firstKey])
    expect(secondBatch).toBeGreaterThan(firstBatch)
    expect(batches[secondBatch]).toEqual(expect.arrayContaining([firstKey, secondKey]))
  })
})
