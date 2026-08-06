import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import nock from 'nock'
import { getToken } from '../../src/transport/authutils'

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
})
