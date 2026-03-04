import CryptoJS from 'crypto-js'
import { getRequestHeaders } from '../../src/transport/authentication'

describe('authentication', () => {
  describe('getRequestHeaders', () => {
    it('should generate correct signature for Matrixdock V2 auth', () => {
      // Example based on Matrixdock documentation:
      // Prehash: timestamp + method + api_path + '&' + query_string
      // Example: 1731931956000GET/mapi/v1/wallet/withdrawals&currency=BTC&limit=50
      const method = 'GET'
      const path = '/rwa/api/v1/quote/price'
      const queryString = 'symbol=XAUM'
      const timestamp = 1770185497979
      const apiKey = 'test-api-key'
      const secret = 'test-secret'

      const headers = getRequestHeaders({
        method,
        path,
        queryString,
        apiKey,
        secret,
        timestamp,
      })

      // Verify correct prehash construction: {timestamp}{METHOD}{path}&{queryString}
      const expectedPrehash = `${timestamp}GET${path}&${queryString}`
      const expectedSignature = CryptoJS.HmacSHA256(expectedPrehash, secret).toString(
        CryptoJS.enc.Hex,
      )

      expect(headers['X-MatrixPort-Access-Key']).toBe(apiKey)
      expect(headers['X-Timestamp']).toBe(timestamp.toString())
      expect(headers['X-Auth-Version']).toBe('v2')
      expect(headers['X-Signature']).toBe(expectedSignature)
    })

    it('should generate consistent signatures for the same input', () => {
      const method = 'GET'
      const path = '/rwa/api/v1/quote/price'
      const queryString = 'symbol=XAUM'
      const timestamp = 1234567890123
      const apiKey = 'test-api-key'
      const secret = 'test-secret'

      const headers1 = getRequestHeaders({
        method,
        path,
        queryString,
        apiKey,
        secret,
        timestamp,
      })

      const headers2 = getRequestHeaders({
        method,
        path,
        queryString,
        apiKey,
        secret,
        timestamp,
      })

      expect(headers1['X-Signature']).toBe(headers2['X-Signature'])
    })

    it('should use uppercase method name in prehash', () => {
      const path = '/rwa/api/v1/quote/price'
      const queryString = 'symbol=XAUM'
      const timestamp = 1234567890123
      const apiKey = 'test-api-key'
      const secret = 'test-secret'

      // Test with lowercase method
      const headersLower = getRequestHeaders({
        method: 'get',
        path,
        queryString,
        apiKey,
        secret,
        timestamp,
      })

      // Test with uppercase method
      const headersUpper = getRequestHeaders({
        method: 'GET',
        path,
        queryString,
        apiKey,
        secret,
        timestamp,
      })

      // Both should produce the same signature (method is uppercased internally)
      expect(headersLower['X-Signature']).toBe(headersUpper['X-Signature'])
    })

    it('should construct correct prehash format', () => {
      const method = 'GET'
      const path = '/mapi/v1/wallet/withdrawals'
      const queryString = 'currency=BTC&limit=50'
      const timestamp = 1731931956000
      const apiKey = 'test-key'
      const secret = 'test-secret'

      const headers = getRequestHeaders({
        method,
        path,
        queryString,
        apiKey,
        secret,
        timestamp,
      })

      // Expected prehash from Matrixdock docs: 1731931956000GET/mapi/v1/wallet/withdrawals&currency=BTC&limit=50
      const expectedPrehash = '1731931956000GET/mapi/v1/wallet/withdrawals&currency=BTC&limit=50'
      const expectedSignature = CryptoJS.HmacSHA256(expectedPrehash, secret).toString(
        CryptoJS.enc.Hex,
      )

      expect(headers['X-Signature']).toBe(expectedSignature)
    })

    it('should return all required headers', () => {
      const timestamp = 1234567890123
      const apiKey = 'my-api-key'
      const secret = 'my-secret'
      const path = '/rwa/api/v1/quote/price'
      const queryString = 'symbol=XAUM'

      const headers = getRequestHeaders({
        method: 'GET',
        path,
        queryString,
        apiKey,
        secret,
        timestamp,
      })

      const expectedPrehash = `${timestamp}GET${path}&${queryString}`
      const expectedSignature = CryptoJS.HmacSHA256(expectedPrehash, secret).toString(
        CryptoJS.enc.Hex,
      )

      expect(headers).toEqual({
        'X-MatrixPort-Access-Key': apiKey,
        'X-Signature': expectedSignature,
        'X-Timestamp': timestamp.toString(),
        'X-Auth-Version': 'v2',
      })
    })

    it('should generate different signatures for different secrets', () => {
      const baseParams = {
        method: 'GET',
        path: '/rwa/api/v1/quote/price',
        queryString: 'symbol=XAUM',
        apiKey: 'test-api-key',
        timestamp: 1234567890123,
      }

      const headers1 = getRequestHeaders({
        ...baseParams,
        secret: 'secret-one',
      })

      const headers2 = getRequestHeaders({
        ...baseParams,
        secret: 'secret-two',
      })

      expect(headers1['X-Signature']).not.toBe(headers2['X-Signature'])
    })

    it('should generate different signatures for different timestamps', () => {
      const baseParams = {
        method: 'GET',
        path: '/rwa/api/v1/quote/price',
        queryString: 'symbol=XAUM',
        apiKey: 'test-api-key',
        secret: 'test-secret',
      }

      const headers1 = getRequestHeaders({
        ...baseParams,
        timestamp: 1234567890123,
      })

      const headers2 = getRequestHeaders({
        ...baseParams,
        timestamp: 1234567890124,
      })

      expect(headers1['X-Signature']).not.toBe(headers2['X-Signature'])
    })
  })
})
