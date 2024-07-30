import { getApiKeys } from '../../src/transport/utils'
import { config } from '../../src/config'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

describe('execute', () => {
  const apiKey = 'fake-api-key'
  const alterApiKey = 'fake-alter-api-key'

  beforeAll(async () => {
    config.initialize()
    config.settings.API_KEY = apiKey
  })

  describe('no apiKey provided', () => {
    it('should use default env variable', async () => {
      const key = getApiKeys('', config.settings)

      expect(key).toBe(apiKey)
    })
  })

  describe('apiKey provided', () => {
    it('should use apiKey', async () => {
      process.env['KEY1_API_KEY'] = alterApiKey

      const key = getApiKeys('KEY1', config.settings)

      expect(key).toBe(alterApiKey)
    })
  })

  describe('invalid apiKey provided', () => {
    it('should throw exception', async () => {
      const call = () => {
        getApiKeys('KEY2', config.settings)
      }
      expect(call).toThrow(AdapterInputError)
    })
  })
})
