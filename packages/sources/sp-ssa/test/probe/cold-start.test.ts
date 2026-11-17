import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
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

describe('cold start', () => {
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv

  const request = (security_id: string) => testAdapter.request({ endpoint: 'ssa', security_id })

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.AUTH_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '0'
    process.env.CACHE_POLLING_MAX_RETRIES = '4'
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

  it('serves a first request from the poll window and returns 504 for a slower reply', async () => {
    nock('http://api.com').get(dataPath).reply(200, scoresFixture()).persist()

    const fast = await request('SP-EURC')
    expect(fast.statusCode).toBe(200)
    expect(fast.json().result).toBe(2)

    nock.cleanAll()
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(200, tokenResponseBody)
      .persist()
    nock('http://api.com').get(dataPath).delay(500).reply(200, scoresFixture()).persist()

    const slow = await request('SP-USDC')
    expect(slow.statusCode).toBe(504)

    await new Promise((resolve) => setTimeout(resolve, 1200))
    const cached = await request('SP-USDC')
    expect(cached.statusCode).toBe(200)
    expect(cached.json().result).toBe(2)
  })
})
