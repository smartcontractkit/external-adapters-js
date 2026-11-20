import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  MockCache,
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
import { providerRecord, scoresFixture, scoresWith, tokenResponseBody } from '../fixtures'

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

describe('ssa provider errors', () => {
  let testAdapter: TestAdapter<SettingsDefinition> & { mockCache: MockCache }
  let oldEnv: NodeJS.ProcessEnv

  const request = (security_id: string) => testAdapter.request({ endpoint: 'ssa', security_id })

  const mockToken = () =>
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(200, tokenResponseBody)
      .persist()

  const mockScores = (body: unknown, status = 200): nock.Scope =>
    nock('http://api.com')
      .get(dataPath)
      .reply(status, body as unknown as nock.Body)
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
  })

  afterAll(async () => {
    restoreEnv(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
  })

  it('returns a 502 and no result for a provider non-200', async () => {
    mockScores({ message: 'provider failed' }, 500)

    const response = await request('SP-500')

    expect(response.statusCode).toBe(502)
    expect(response.json().result).toBeUndefined()
    expect(response.json().errorMessage).toContain('status 500')
  })

  it('returns a 502 and no result for a 2xx whose status is not 200', async () => {
    mockScores({ message: 'created' }, 201)

    const response = await request('SP-201')

    expect(response.statusCode).toBe(502)
    expect(response.json().result).toBeUndefined()
    expect(response.json().errorMessage).toContain('status 201')
  })

  it.each([
    ['a non-array payload', 'SP-NONARRAY', {}],
    ['a null element', 'SP-NULL', [null]],
    ['a non-object element', 'SP-NONOBJECT', ['SP-EURC']],
    ['a non-string security id', 'SP-NONSTRING', [{ security_id: 1 }]],
    [
      'a duplicate id',
      'SP-DUP',
      [
        { security_id: 'SP-DUP', ssa: '2', last_modified_date_time: '2025-12-19T00:00:00Z' },
        { security_id: 'SP-DUP', ssa: '2', last_modified_date_time: '2025-12-19T00:00:00Z' },
      ],
    ],
  ])('returns a 502 with timestamps for %s', async (_, securityId, body) => {
    mockScores(body)

    const response = await request(securityId)

    expect(response.statusCode).toBe(502)
    expect(response.json().result).toBeUndefined()
    expect(response.json().errorMessage).toContain('malformed payload')
    expect(response.json().timestamps.providerDataRequestedUnixMs).toBeGreaterThan(0)
    expect(response.json().timestamps.providerDataReceivedUnixMs).toBeGreaterThan(0)
  })

  it('returns a 502 naming a configured id that is absent', async () => {
    mockScores(scoresFixture())

    const response = await request('SP-ABSENT')

    expect(response.statusCode).toBe(502)
    expect(response.json().result).toBeUndefined()
    expect(response.json().errorMessage).toContain('SP-ABSENT')
  })

  it('returns a 502 for a score outside the range', async () => {
    mockScores([...scoresWith('SP-EURC'), providerRecord({ security_id: 'SP-SCORE-6', ssa: '6' })])

    const response = await request('SP-SCORE-6')

    expect(response.statusCode).toBe(502)
    expect(response.json().result).toBeUndefined()
    expect(response.json().errorMessage).toContain('SSA score')
  })

  it('returns a 502 for an unparseable timestamp', async () => {
    mockScores([
      ...scoresWith('SP-EURC'),
      providerRecord({ security_id: 'SP-BAD-TIMESTAMP', last_modified_date_time: 'not-a-date' }),
    ])

    const response = await request('SP-BAD-TIMESTAMP')

    expect(response.statusCode).toBe(502)
    expect(response.json().result).toBeUndefined()
    expect(response.json().errorMessage).toContain('last_modified_date_time')
  })
})
