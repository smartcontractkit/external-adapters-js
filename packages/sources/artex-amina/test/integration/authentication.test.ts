import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import nock from 'nock'
import { AminaAuth, AminaAuthSettings } from '../../src/transport/authentication'
import { AMINA_HOST, AUTH_PATH, authBody, UUID_PATTERN, WireHeaders } from '../fixtures/amina'

LoggerFactoryProvider.set()
metrics.initialize()

const settings: AminaAuthSettings = {
  API_ENDPOINT: AMINA_HOST,
  AMINA_USER_ID: '12345678',
  AMINA_PASSWORD: 'super-secret-password',
  AMINA_HMAC_SECRET: 'super-secret-hmac',
  AMINA_AGREEMENT_NUMBER: '123456-1',
}

const makeRequester = () =>
  new Requester(
    { waitForRateLimit: () => Promise.resolve(), msUntilNextExecution: () => 0 } as never,
    {
      RETRY: 0,
      API_TIMEOUT: 5_000,
      REQUESTER_SLEEP_BEFORE_REQUEUEING_MS: 0,
      MAX_HTTP_REQUEST_QUEUE_LENGTH: 100,
    } as never,
  )

describe('AminaAuth', () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('shares a single login between two callers started together', async () => {
    let loginRequests = 0
    nock(AMINA_HOST)
      .post(AUTH_PATH)
      .times(1)
      .delayConnection(50)
      .reply(() => {
        loginRequests += 1
        return [200, authBody()]
      })

    const auth = new AminaAuth(makeRequester(), settings)

    const [first, second] = await Promise.all([auth.getAccessToken(), auth.getAccessToken()])

    expect(first).toBe(authBody().accessToken)
    expect(second).toBe(first)
    expect(loginRequests).toBe(1)
  })

  it('sends distinct request and correlation ids on the auth request', async () => {
    let captured: WireHeaders | undefined
    nock(AMINA_HOST)
      .post(AUTH_PATH)
      .times(1)
      .reply(function () {
        captured = this.req.headers
        return [200, authBody()]
      })

    const auth = new AminaAuth(makeRequester(), settings)
    await auth.getAccessToken()

    expect(captured).toBeDefined()
    const requestId = (captured as WireHeaders)['x-request-id']
    const correlationId = (captured as WireHeaders)['x-correlation-id']
    expect(requestId).toMatch(UUID_PATTERN)
    expect(correlationId).toMatch(UUID_PATTERN)
    expect(requestId).not.toBe(correlationId)
  })
})
