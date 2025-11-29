import CryptoJS from 'crypto-js'
import { getRequestHeaders } from '../../src/transport/authentication'

describe('authentication', () => {
  describe('getRequestHeaders', () => {
    it('should generate correct signature for example from documentation', () => {
      // Example from R25 API documentation
      const method = 'GET'
      const path = '/api/public/current/nav'
      const params = {
        chainType: 'chain',
        tokenName: 'rcusd',
      }
      const timestamp = 1731344153448
      const apiKey = 'xxx'
      const secret = 'xxxxxxxx'

      // Expected signature string from documentation:
      // get
      // /api/public/current/nav
      // chainType=chain&tokenName=rcusd
      // 1731344153448
      // xxx
      const expectedStringToSign = [
        'get',
        '/api/public/current/nav',
        'chainType=chain&tokenName=rcusd',
        '1731344153448',
        'xxx',
      ].join('\n')

      const expectedSignature = CryptoJS.HmacSHA256(expectedStringToSign, secret).toString(
        CryptoJS.enc.Hex,
      )

      const headers = getRequestHeaders({
        method,
        path,
        params,
        apiKey,
        secret,
        timestamp,
      })

      expect(headers['x-api-key']).toBe(apiKey)
      expect(headers['x-utc-timestamp']).toBe(timestamp.toString())
      expect(headers['x-signature']).toBe(expectedSignature)
    })

    it('should generate consistent signatures for the same input', () => {
      const method = 'GET'
      const path = '/api/public/current/nav'
      const params = {
        chainType: 'polygon',
        tokenName: 'rcusdp',
      }
      const timestamp = 1234567890123
      const apiKey = 'test-api-key'
      const secret = 'test-secret'

      const headers1 = getRequestHeaders({
        method,
        path,
        params,
        apiKey,
        secret,
        timestamp,
      })

      const headers2 = getRequestHeaders({
        method,
        path,
        params,
        apiKey,
        secret,
        timestamp,
      })

      expect(headers1['x-signature']).toBe(headers2['x-signature'])
    })

    it('should sort query parameters alphabetically', () => {
      const method = 'GET'
      const path = '/api/public/current/nav'
      // Intentionally unsorted parameters
      const params = {
        tokenName: 'rcusdp',
        chainType: 'polygon',
      }
      const timestamp = 1234567890123
      const apiKey = 'test-api-key'
      const secret = 'test-secret'

      // The signature should be the same regardless of the order params are provided
      const headers1 = getRequestHeaders({
        method,
        path,
        params,
        apiKey,
        secret,
        timestamp,
      })

      // Try with sorted params
      const sortedParams = {
        chainType: 'polygon',
        tokenName: 'rcusdp',
      }

      const headers2 = getRequestHeaders({
        method,
        path,
        params: sortedParams,
        apiKey,
        secret,
        timestamp,
      })

      expect(headers1['x-signature']).toBe(headers2['x-signature'])
    })

    it('should use lowercase method name', () => {
      const method = 'GET'
      const path = '/api/public/current/nav'
      const params = {
        chainType: 'polygon',
        tokenName: 'rcusdp',
      }
      const timestamp = 1234567890123
      const apiKey = 'test-api-key'
      const secret = 'test-secret'

      const headers = getRequestHeaders({
        method,
        path,
        params,
        apiKey,
        secret,
        timestamp,
      })

      // Verify it's using lowercase by checking signature matches expected
      const expectedStringToSign = [
        'get', // lowercase
        path,
        'chainType=polygon&tokenName=rcusdp',
        timestamp.toString(),
        apiKey,
      ].join('\n')

      const expectedSignature = CryptoJS.HmacSHA256(expectedStringToSign, secret).toString(
        CryptoJS.enc.Hex,
      )

      expect(headers['x-signature']).toBe(expectedSignature)
    })
  })
})
