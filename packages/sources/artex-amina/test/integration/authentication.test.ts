import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import nock from 'nock'
import { AminaAuth, AminaAuthSettings } from '../../src/transport/authentication'
import { AMINA_HOST, AUTH_PATH, authBody } from '../fixtures/amina'

LoggerFactoryProvider.set()
metrics.initialize()

const settings: AminaAuthSettings = {
  API_ENDPOINT: AMINA_HOST,
  AMINA_USER_ID: '12345678',
  AMINA_PASSWORD: 'super-secret-password',
  AMINA_HMAC_SECRET: 'super-secret-hmac',
  AMINA_AGREEMENT_NUMBER: '123456-1',
}

describe('AminaAuth concurrent callers', () => {
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

    const requester = new Requester(
      { waitForRateLimit: () => Promise.resolve(), msUntilNextExecution: () => 0 } as never,
      {
        RETRY: 0,
        API_TIMEOUT: 5_000,
        REQUESTER_SLEEP_BEFORE_REQUEUEING_MS: 0,
        MAX_HTTP_REQUEST_QUEUE_LENGTH: 100,
      } as never,
    )
    const auth = new AminaAuth(requester, settings)

    const [first, second] = await Promise.all([auth.getAccessToken(), auth.getAccessToken()])

    expect(first).toBe(authBody().accessToken)
    expect(second).toBe(first)
    expect(loginRequests).toBe(1)
  })
})
