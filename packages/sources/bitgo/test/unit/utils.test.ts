import { getApiInfo } from '../../src/transport/utils'
import { config } from '../../src/config'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

describe('execute', () => {
  const apiKey1 = 'fake-signing-key1'
  const apiEndpoint1 = 'fake-access-key1'
  const apiLimit1 = '10'

  beforeAll(async () => {
    config.initialize()
    config.settings.API_LIMIT = 100
  })

  describe('apiKey provided', () => {
    it('should use apiKey', async () => {
      process.env['KEY1_API_KEY'] = apiKey1
      process.env['KEY1_API_ENDPOINT'] = apiEndpoint1
      process.env['KEY1_API_LIMIT'] = apiLimit1

      const { apiKey, apiEndpoint, apiLimit } = getApiInfo('KEY1', config.settings)

      expect(apiKey).toBe(apiKey1)
      expect(apiEndpoint).toBe(apiEndpoint1)
      expect(apiLimit).toBe(Number(apiLimit1))
    })
  })

  describe('invalid api limit', () => {
    it('should use default limit', async () => {
      process.env['KEY1_API_KEY'] = apiKey1
      process.env['KEY1_API_ENDPOINT'] = apiEndpoint1
      process.env['KEY1_API_LIMIT'] = 'lol'

      const { apiKey, apiEndpoint, apiLimit } = getApiInfo('KEY1', config.settings)

      expect(apiKey).toBe(apiKey1)
      expect(apiEndpoint).toBe(apiEndpoint1)
      expect(apiLimit).toBe(config.settings.API_LIMIT)
    })
  })

  describe('no api limit', () => {
    it('should use default limit', async () => {
      process.env['KEY1_API_KEY'] = apiKey1
      process.env['KEY1_API_ENDPOINT'] = apiEndpoint1

      const { apiKey, apiEndpoint, apiLimit } = getApiInfo('KEY1', config.settings)

      expect(apiKey).toBe(apiKey1)
      expect(apiEndpoint).toBe(apiEndpoint1)
      expect(apiLimit).toBe(config.settings.API_LIMIT)
    })
  })

  describe('invalid apiKey provided', () => {
    it('should throw exception', async () => {
      const call = () => {
        getApiInfo('KEY2', config.settings)
      }
      expect(call).toThrow(AdapterInputError)
    })
  })
})
