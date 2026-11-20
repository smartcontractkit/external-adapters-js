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

describe('ssa provider timeout', () => {
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = { ...process.env }
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.AUTH_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '0'
    process.env.CACHE_POLLING_SLEEP_MS = '10'
    process.env.API_TIMEOUT = '100'
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

  it('returns a 502 timeout error with the request timestamps', async () => {
    nock('http://api.com').get(dataPath).delay(500).reply(200, scoresFixture()).persist()

    const started = Date.now()
    const response = await testAdapter.request({ endpoint: 'ssa', security_id: 'SP-TIMEOUT' })
    const elapsed = Date.now() - started

    expect(response.statusCode).toBe(502)
    expect(response.json().result).toBeUndefined()
    expect(response.json().errorMessage).toMatch(/timeout of 100ms exceeded/i)
    const { providerDataRequestedUnixMs, providerDataReceivedUnixMs } = response.json().timestamps
    expect(providerDataRequestedUnixMs).toBeGreaterThan(0)
    expect(providerDataReceivedUnixMs).toBeGreaterThan(0)
    // The handler must return before the provider's 500 ms reply; a request
    // without the configured timeout would take at least that long.
    expect(providerDataReceivedUnixMs - providerDataRequestedUnixMs).toBeLessThan(500)
    expect(elapsed).toBeLessThan(500)
  })
})
