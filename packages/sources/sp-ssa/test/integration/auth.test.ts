import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
import { ssaTransport } from '../../src/transport/ssa'
import { scoresFixture, tokenResponseBody, unauthorizedBody } from '../fixtures'

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

describe('ssa auth', () => {
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv

  const request = (security_id: string) => testAdapter.request({ endpoint: 'ssa', security_id })

  const mockToken = () =>
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(200, tokenResponseBody)
      .persist()

  const mockScores = (body: unknown = scoresFixture()): nock.Scope =>
    nock('http://api.com')
      .get(dataPath)
      .reply(200, body as unknown as nock.Body)
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
    ssaTransport.authManager.invalidate()
    ;(ssaTransport as unknown as { authFailureUntil: number }).authFailureUntil = 0
  })

  afterAll(async () => {
    restoreEnv(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it('sends the recorded token request contract', async () => {
    nock.cleanAll()
    const contract = nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .matchHeader('authorization', 'Basic client-id')
      .matchHeader('content-type', 'application/x-www-form-urlencoded')
      .reply(200, tokenResponseBody)
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .matchHeader('authorization', 'Basic client-id')
      .matchHeader('content-type', 'application/x-www-form-urlencoded')
      .reply(200, tokenResponseBody)
      .persist()
    mockScores()

    const response = await request('SP-USDG')

    expect(response.statusCode).toBe(200)
    expect(contract.isDone()).toBe(true)
  })

  it('stops provider calls and writes a cooldown error after a persistent auth failure', async () => {
    let dataCalls = 0
    nock('http://api.com')
      .get(dataPath)
      .reply(() => {
        dataCalls++
        return [401, unauthorizedBody]
      })
      .persist()

    const failed = await request('SP-AUTH')

    expect(failed.statusCode).toBe(502)
    expect(dataCalls).toBe(2)

    let cooldownMessage = ''
    for (let attempt = 0; attempt < 100 && !cooldownMessage.includes('cooldown'); attempt++) {
      const response = await request('SP-AUTH')
      expect(response.statusCode).toBe(502)
      cooldownMessage = response.json().errorMessage
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    expect(cooldownMessage).toContain('cooldown')
    expect(dataCalls).toBe(2)
  })
})
