import { SettingsDefinitionFromConfig } from '@chainlink/external-adapter-framework/config'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { config } from '../../src/config'
import { providerRecord, scoresFixture, tokenFixture } from './fixtures'

type SettingsDefinition = SettingsDefinitionFromConfig<typeof config>

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<SettingsDefinition>
  let oldEnv: NodeJS.ProcessEnv
  let scoresStatus = 200
  let scoresBody: unknown = scoresFixture()

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

    const mockDate = new Date('2025-01-17T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    nock('http://token.com')
      .post('/token', 'grant_type=client_credentials&scope=rtg_ssa')
      .reply(200, tokenFixture)
      .persist()
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<SettingsDefinition>,
    })

    nock('http://api.com')
      .get('/api/v1/ssa/getAllScores')
      .reply(() => [scoresStatus, scoresBody])
      .persist()
  })

  beforeEach(() => {
    scoresStatus = 200
    scoresBody = scoresFixture()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  it.each(['sp-eurc', 'SP-EURC'])(
    'returns the SSA score and provider timestamp for %s',
    async (securityId) => {
      const response = await request(securityId)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    },
  )

  it('returns 400 when security_id is missing', async () => {
    const response = await testAdapter.request({ endpoint: 'ssa' })
    expect(response.statusCode).toBe(400)
    expect(JSON.stringify(response.json())).toContain('security_id')
  })

  it('returns 502 when the security_id is not in the provider response', async () => {
    const response = await request('SP-UNKNOWN')
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('SP-UNKNOWN')
  })

  it('returns 502 when the provider score is invalid', async () => {
    scoresBody = [providerRecord({ security_id: 'SP-GUSD', ssa: '6' })]
    const response = await request('SP-GUSD')
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('SSA score')
  })

  it('returns 502 when the provider timestamp is unparseable', async () => {
    scoresBody = [providerRecord({ security_id: 'SP-USDC', last_modified_date_time: 'not-a-date' })]
    const response = await request('SP-USDC')
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('last_modified_date_time')
  })

  it.each([
    ['non-array', 'SP-TUSD', {}],
    [
      'duplicate',
      'SP-DUP',
      [providerRecord({ security_id: 'SP-DUP' }), providerRecord({ security_id: 'SP-DUP' })],
    ],
    ['null element', 'SP-NULL', [null]],
    ['non-string id', 'SP-NUM', [{ security_id: 1 }]],
  ])('returns 502 when the provider payload is malformed (%s)', async (_, id, body) => {
    scoresBody = body
    const response = await request(id)
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain('malformed payload')
    expect(response.json().timestamps.providerDataRequestedUnixMs).toBeGreaterThan(0)
  })

  it.each([
    [500, 'status 500'],
    [201, 'status 201'],
  ])('returns 502 when the provider returns a non-200 status %i', async (status, expected) => {
    scoresStatus = status
    scoresBody = { message: 'x' }
    const response = await request(status === 201 ? 'SP-201' : 'SP-DAI')
    expect(response.statusCode).toBe(502)
    expect(response.json().errorMessage).toContain(expected)
    expect(response.json().timestamps.providerDataRequestedUnixMs).toBeGreaterThan(0)
  })
})
