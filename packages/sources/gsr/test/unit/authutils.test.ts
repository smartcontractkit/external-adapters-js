import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import crypto from 'crypto'
import nock from 'nock'
import { getToken, renewToken } from '../../src/transport/authutils'

LoggerFactoryProvider.set()

describe('GSR access token expiry', () => {
  const apiHost = 'https://oracle.prod.gsr.io'
  const apiEndpoint = `${apiHost}/v1`
  const userId = 'test-user-id'
  const publicKey = 'test-pub-key'
  const privateKey = 'test-priv-key'

  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('surfaces the expiry encoded in validUntil', async () => {
    const validUntil = '2022-05-10T17:09:27.193Z'
    nock(apiHost).post('/v1/token').reply(200, {
      success: true,
      ts: 1652198967193000000,
      token: 'test-token-123',
      validUntil,
    })

    const result = await getToken(apiEndpoint, userId, publicKey, privateKey)

    expect(result.token).toBe('test-token-123')
    expect(result.expiresAtMs).toBe(new Date(validUntil).getTime())
  })

  it('handles the 1 hour validity window GSR issues in production', async () => {
    const issuedAt = new Date('2022-05-10T16:09:27.193Z').getTime()
    const validUntil = new Date(issuedAt + 60 * 60 * 1000).toISOString()
    nock(apiHost).post('/v1/token').reply(200, {
      success: true,
      ts: 1652198967193000000,
      token: 'test-token-1h',
      validUntil,
    })

    const result = await getToken(apiEndpoint, userId, publicKey, privateKey)

    expect(result.expiresAtMs - issuedAt).toBe(60 * 60 * 1000)
  })

  it('throws when the provider rejects the token request', async () => {
    nock(apiHost).post('/v1/token').reply(200, {
      success: false,
      ts: 1652198967193000000,
      error: 'API key mismatch',
    })

    await expect(getToken(apiEndpoint, userId, publicKey, privateKey)).rejects.toThrow(
      'API key mismatch',
    )
  })

  it('reduces a failed request to the HTTP status so credentials stay out of logs', async () => {
    nock(apiHost).post('/v1/token').reply(520, 'origin error')

    let caught: unknown
    try {
      await getToken(apiEndpoint, userId, publicKey, privateKey)
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toEqual('Access token request failed: HTTP 520')
    expect((caught as { config?: unknown }).config).toBeUndefined()
    expect((caught as { request?: unknown }).request).toBeUndefined()
    expect(JSON.stringify(caught)).not.toContain(publicKey)
  })

  it("keeps GSR's own error text from a failed response", async () => {
    nock(apiHost)
      .post('/v1/token')
      .reply(401, { success: false, ts: 1, error: 'Signature mismatch' })

    await expect(getToken(apiEndpoint, userId, publicKey, privateKey)).rejects.toThrow(
      'Access token request failed: HTTP 401: Signature mismatch',
    )
  })
})

describe('GSR access token renewal', () => {
  const apiHost = 'https://oracle.prod.gsr.io'
  const apiEndpoint = `${apiHost}/v1`
  const userId = 'test-user-id'
  const privateKey = 'test-priv-key'
  const existingToken = 'existing-token'

  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('renews via PUT and signs over the token rather than the API key', async () => {
    let seenBody: Record<string, unknown> = {}
    const validUntil = '2022-05-10T17:09:27.193Z'
    nock(apiHost)
      .put('/v1/token', (body) => {
        seenBody = body
        return true
      })
      .reply(200, {
        success: true,
        ts: 1652198967193000000,
        token: 'renewed-token',
        validUntil,
      })

    const result = await renewToken(apiEndpoint, userId, privateKey, existingToken)

    expect(result.token).toBe('renewed-token')
    expect(result.expiresAtMs).toBe(new Date(validUntil).getTime())

    // Renewal presents the existing token, never the API key.
    expect(seenBody['token']).toBe(existingToken)
    expect(seenBody['apiKey']).toBeUndefined()
    expect(seenBody['userId']).toBe(userId)

    const expectedSignature = crypto
      .createHmac('sha256', privateKey)
      .update(`userId=${userId}&token=${existingToken}&ts=${seenBody['ts']}`)
      .digest('hex')
    expect(seenBody['signature']).toBe(expectedSignature)
  })

  it('throws when the provider refuses the renewal', async () => {
    nock(apiHost).put('/v1/token').reply(200, {
      success: false,
      ts: 1652198967193000000,
      error: 'Signature mismatch',
    })

    // The caller falls back to closing the connection on this rejection.
    await expect(renewToken(apiEndpoint, userId, privateKey, existingToken)).rejects.toThrow(
      'Signature mismatch',
    )
  })

  it('reduces a failed renewal to the HTTP status so credentials stay out of logs', async () => {
    nock(apiHost).put('/v1/token').reply(500, 'origin error')

    let caught: unknown
    try {
      await renewToken(apiEndpoint, userId, privateKey, existingToken)
    } catch (e) {
      caught = e
    }

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toEqual('Access token renewal failed: HTTP 500')
    expect((caught as { config?: unknown }).config).toBeUndefined()
    expect((caught as { request?: unknown }).request).toBeUndefined()
    expect(JSON.stringify(caught)).not.toContain(existingToken)
  })
})
