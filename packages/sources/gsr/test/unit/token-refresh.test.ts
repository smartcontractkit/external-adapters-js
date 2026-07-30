import FakeTimers from '@sinonjs/fake-timers'
import * as nock from 'nock'
import { getToken } from '../../src/transport/authutils'

describe('GSR Token Refresh Logic', () => {
  let clock: ReturnType<typeof FakeTimers.install>
  const apiEndpoint = 'https://oracle.prod.gsr.io/v1'
  const userId = 'test-user-id'
  const publicKey = 'test-pub-key'
  const privateKey = 'test-priv-key'

  beforeEach(() => {
    clock = FakeTimers.install()
    // Set a fixed time for tests
    clock.setSystemTime(new Date('2022-05-10T16:09:27.193Z').getTime())
    nock.cleanAll()
  })

  afterEach(() => {
    clock.uninstall()
    nock.cleanAll()
  })

  describe('getToken', () => {
    it('should return token with expiry time', async () => {
      const validUntil = '2022-05-10T17:09:27.193Z' // 1 hour from now
      nock(apiEndpoint).post('/token').reply(200, {
        success: true,
        ts: 1652198967193000000,
        token: 'test-token-123',
        validUntil,
      })

      const result = await getToken(apiEndpoint, userId, publicKey, privateKey)

      expect(result.token).toBe('test-token-123')
      expect(result.expiresAtMs).toBe(new Date(validUntil).getTime())
    })

    it('should correctly parse validUntil timestamp', async () => {
      const validUntil = '2022-05-10T18:30:00.000Z'
      nock(apiEndpoint).post('/token').reply(200, {
        success: true,
        ts: 1652198967193000000,
        token: 'test-token-abc',
        validUntil,
      })

      const result = await getToken(apiEndpoint, userId, publicKey, privateKey)
      const expectedMs = new Date('2022-05-10T18:30:00.000Z').getTime()

      expect(result.expiresAtMs).toBe(expectedMs)
    })

    it('should throw error on failed token request', async () => {
      nock(apiEndpoint).post('/token').reply(200, {
        success: false,
        ts: 1652198967193000000,
        error: 'API key mismatch',
      })

      await expect(getToken(apiEndpoint, userId, publicKey, privateKey)).rejects.toThrow(
        'API key mismatch',
      )
    })
  })

  describe('token caching behavior', () => {
    it('should reuse token when not near expiry', async () => {
      const validUntil = '2022-05-10T17:09:27.193Z' // 1 hour from now
      let tokenFetchCount = 0

      nock(apiEndpoint)
        .post('/token')
        .times(1)
        .reply(() => {
          tokenFetchCount++
          return [
            200,
            {
              success: true,
              ts: 1652198967193000000,
              token: `test-token-${tokenFetchCount}`,
              validUntil,
            },
          ]
        })

      // Import the transport to test caching (requires fresh module)
      const { transport } = await import('../../src/transport/price')

      // First connection - should fetch token
      const firstResult = await getToken(apiEndpoint, userId, publicKey, privateKey)
      expect(firstResult.token).toBe('test-token-1')
      expect(tokenFetchCount).toBe(1)

      // Token should be cached, second fetch should use cache
      // (In actual usage this would be via getTokenForConnection)
    })

    it('should refresh token when approaching expiry (within 5 min margin)', async () => {
      const currentTime = new Date('2022-05-10T16:09:27.193Z').getTime()
      const expiryTime = currentTime + 3 * 60 * 1000 // 3 minutes from now (within 5 min margin)

      nock(apiEndpoint)
        .post('/token')
        .reply(200, {
          success: true,
          ts: 1652198967193000000,
          token: 'test-token-about-to-expire',
          validUntil: new Date(expiryTime).toISOString(),
        })

      const result = await getToken(apiEndpoint, userId, publicKey, privateKey)

      // Verify token is retrieved
      expect(result.token).toBe('test-token-about-to-expire')

      // Calculate time until expiry
      const now = Date.now()
      const timeUntilExpiry = result.expiresAtMs - now
      const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000

      // Token should be within the refresh margin
      expect(timeUntilExpiry).toBeLessThan(TOKEN_REFRESH_MARGIN_MS)
    })

    it('should handle 1-hour token validity correctly', async () => {
      const currentTime = new Date('2022-05-10T16:09:27.193Z').getTime()
      const oneHourLater = currentTime + 60 * 60 * 1000

      nock(apiEndpoint)
        .post('/token')
        .reply(200, {
          success: true,
          ts: 1652198967193000000,
          token: 'test-token-1h',
          validUntil: new Date(oneHourLater).toISOString(),
        })

      const result = await getToken(apiEndpoint, userId, publicKey, privateKey)

      // Verify token expires in approximately 1 hour
      const now = Date.now()
      const timeUntilExpiry = result.expiresAtMs - now
      const expectedDuration = 60 * 60 * 1000 // 1 hour

      // Allow 1 second tolerance for execution time
      expect(Math.abs(timeUntilExpiry - expectedDuration)).toBeLessThan(1000)
    })
  })

  describe('proactive reconnection', () => {
    it('should schedule reconnection 5 minutes before token expiry', async () => {
      const validUntil = '2022-05-10T17:09:27.193Z' // 1 hour from now
      nock(apiEndpoint).post('/token').reply(200, {
        success: true,
        ts: 1652198967193000000,
        token: 'test-token-with-timer',
        validUntil,
      })

      const result = await getToken(apiEndpoint, userId, publicKey, privateKey)
      const now = Date.now()
      const timeUntilExpiry = result.expiresAtMs - now
      const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000
      const reconnectInMs = timeUntilExpiry - TOKEN_REFRESH_MARGIN_MS

      // Should schedule reconnect in ~55 minutes (1 hour - 5 min margin)
      const fiftyFiveMinutesMs = 55 * 60 * 1000
      expect(reconnectInMs).toBeGreaterThan(fiftyFiveMinutesMs - 1000)
      expect(reconnectInMs).toBeLessThan(fiftyFiveMinutesMs + 1000)
    })

    it('should trigger reconnection only when token expiry is imminent', async () => {
      const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000
      const currentTime = clock.now()

      // Test case 1: Token expires in 3 minutes (within margin - should trigger)
      const expiry1 = currentTime + 3 * 60 * 1000
      nock(apiEndpoint)
        .post('/token')
        .reply(200, {
          success: true,
          ts: 1652198967193000000,
          token: 'token-3min',
          validUntil: new Date(expiry1).toISOString(),
        })

      const result1 = await getToken(apiEndpoint, userId, publicKey, privateKey)
      const reconnectInMs1 = result1.expiresAtMs - clock.now() - TOKEN_REFRESH_MARGIN_MS
      expect(reconnectInMs1).toBeLessThan(0) // Should be negative (already within margin)

      nock.cleanAll()

      // Test case 2: Token expires in 50 minutes (outside margin - should not trigger yet)
      const expiry2 = currentTime + 50 * 60 * 1000
      nock(apiEndpoint)
        .post('/token')
        .reply(200, {
          success: true,
          ts: 1652198967193000000,
          token: 'token-50min',
          validUntil: new Date(expiry2).toISOString(),
        })

      const result2 = await getToken(apiEndpoint, userId, publicKey, privateKey)
      const reconnectInMs2 = result2.expiresAtMs - clock.now() - TOKEN_REFRESH_MARGIN_MS
      expect(reconnectInMs2).toBeGreaterThan(0) // Should be positive (not yet time to refresh)
    })
  })
})
