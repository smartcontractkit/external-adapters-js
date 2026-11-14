import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
import type { SsaTransport } from '../../src/transport/ssa'
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
  let transport: SsaTransport

  const request = (security_id: string) => testAdapter.request({ endpoint: 'ssa', security_id })

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = 'http://api.com'
    process.env.TOKEN_ENDPOINT = 'http://token.com/token'
    process.env.CLIENT_ID = 'client-id'
    process.env.API_KEY = 'api-key'
    process.env.BACKGROUND_EXECUTE_MS_HTTP = '0'
    process.env.API_TIMEOUT = '100'
    process.env.RETRY = '0'
    process.env.REQUESTER_SLEEP_BEFORE_REQUEUEING_MS = '1'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    nowMs = mockDate.getTime()
    spy = jest.spyOn(Date, 'now').mockReturnValue(nowMs)

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(() => tokenHandler())
      .persist()
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })
    transport = (await import('../../src/transport/ssa')).ssaTransport

    nock('http://api.com')
      .get('/api/v1/ssa/getAllScores')
      .reply(() => dataHandler())
      .persist()
  })

  beforeEach(() => {
    nowMs += 61_000
    spy.mockReturnValue(nowMs)
    transport.authManager.invalidate()
    // A late background 401 from the previous case can set the cooldown after
    // the clock move; reset it so each case starts without a stale cooldown.
    ;(transport as unknown as { authFailureUntil: number }).authFailureUntil = 0
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

  it('returns 502 for a token endpoint HTTP 200 error body', async () => {
    tokenHandler = () => [200, { statusCode: 400, body: 'Authorization header is missing' }]
    const response = await request('SP-TOKEN-BODY')
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
})
