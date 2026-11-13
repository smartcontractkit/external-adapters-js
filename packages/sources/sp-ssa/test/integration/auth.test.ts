import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
import { scoresFixture, tokenFixture } from './fixtures'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>
type ReplyResult = [200 | 201 | 401 | 500, Record<string, unknown> | Record<string, unknown>[]]

describe('auth', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv
  let tokenHandler: () => ReplyResult = () => [200, tokenFixture]
  let dataHandler: () => ReplyResult | Promise<ReplyResult> = () => [200, scoresFixture()]
  let nowMs = 0

  const request = (security_id: string) => testAdapter.request({ endpoint: 'ssa', security_id })

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.TOKEN_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '0'
    process.env.API_TIMEOUT = '100'
    process.env.RETRY = '1'
    process.env.REQUESTER_SLEEP_BEFORE_REQUEUEING_MS = '1'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    nowMs = mockDate.getTime()
    spy = jest.spyOn(Date, 'now').mockReturnValue(nowMs)

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })

    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(() => tokenHandler())
      .persist()
    nock('http://api.com')
      .get('/api/v1/ssa/getAllScores')
      .reply(() => dataHandler())
      .persist()
  })

  beforeEach(() => {
    nowMs += 61_000
    spy.mockReturnValue(nowMs)
    tokenHandler = () => [200, tokenFixture]
    dataHandler = () => [200, scoresFixture()]
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  it.each([
    [
      'HTTP 200 error body',
      'SP-TOKEN-BODY',
      () => {
        tokenHandler = () => [200, { statusCode: 400, body: 'Authorization header is missing' }]
      },
    ],
    [
      'HTTP 401',
      'SP-TOKEN-401',
      () => {
        tokenHandler = () => [401, { errorCode: 'invalid_client' }]
      },
    ],
    [
      'HTTP 201',
      'SP-TOKEN-201',
      () => {
        tokenHandler = () => [201, tokenFixture]
      },
    ],
  ])('returns 502 for a token endpoint %s', async (_, securityId, configure) => {
    configure()
    const response = await request(securityId)
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('token')
  })

  it('returns 502 when the provider request times out', async () => {
    dataHandler = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve([200, scoresFixture()]), 300)
      })
    const response = await request('SP-TIMEOUT')
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('timeout')
  })

  it('does not include the access token in an error response', async () => {
    dataHandler = () => [500, { message: 'test-access-token' }]
    const response = await request('SP-SECRET')
    expect(response.statusCode).toBe(502)
    expect(JSON.stringify(response.json())).not.toContain('test-access-token')
  })
})
