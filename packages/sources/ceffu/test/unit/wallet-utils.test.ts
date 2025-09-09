import { getApiKeys } from '../../src/transport/wallet/utils'

const originalEnv = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (key in originalEnv) {
      process.env[key] = originalEnv[key]
    } else {
      delete process.env[key]
    }
  }
}

describe('wallet/utils.ts', () => {
  beforeEach(() => {
    restoreEnv()
  })

  afterAll(() => {
    restoreEnv()
  })

  describe('getApiKeys', () => {
    it('should return API keys for a valid client', () => {
      const client = 'test'
      const proxy = 'https://test-proxy.com'
      const apiKey = 'test-api-key'
      const privateKey = 'test-private-key'

      process.env.WALLET_TEST_API_PROXY = proxy
      process.env.WALLET_TEST_API_KEY = apiKey
      process.env.WALLET_TEST_PRIVATE_KEY = privateKey

      const result = getApiKeys(client)

      expect(result).toEqual({ proxy, apiKey, privateKey })
    })

    it('proxy should be undefined if not provided', () => {
      const client = 'test'
      const apiKey = 'test-api-key'
      const privateKey = 'test-private-key'

      process.env.WALLET_TEST_API_KEY = apiKey
      process.env.WALLET_TEST_PRIVATE_KEY = privateKey

      const result = getApiKeys(client)

      expect(result).toEqual({ apiKey, privateKey })
    })

    it('should throw AdapterInputError when apiKey is missing', () => {
      const client = 'test'
      const proxy = 'https://test-proxy.com'
      const privateKey = 'test-private-key'

      process.env.WALLET_TEST_API_PROXY = proxy
      process.env.WALLET_TEST_PRIVATE_KEY = privateKey

      expect(() => getApiKeys(client)).toThrow(
        "Missing 'WALLET_TEST_API_KEY' or 'WALLET_TEST_PRIVATE_KEY' environment variables.",
      )
    })

    it('should throw AdapterInputError when privateKey is missing', () => {
      const client = 'test'
      const proxy = 'https://test-proxy.com'
      const apiKey = 'test-api-key'

      process.env.WALLET_TEST_API_PROXY = proxy
      process.env.WALLET_TEST_API_KEY = apiKey

      expect(() => getApiKeys(client)).toThrow(
        "Missing 'WALLET_TEST_API_KEY' or 'WALLET_TEST_PRIVATE_KEY' environment variables.",
      )
    })
  })
})
