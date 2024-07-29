import { getApiKeys } from '../../src/transport/utils'
import { config } from '../../src/config'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

describe('execute', () => {
  const signingKey = 'fake-signing-key'
  const accessKey = 'fake-access-key'
  const passPhrase = 'fake-passphrase'
  const signingKey1 = 'fake-signing-key1'
  const accessKey1 = 'fake-access-key1'
  const passPhrase1 = 'fake-passphrase1'

  beforeAll(async () => {
    config.initialize()
    config.settings.ACCESS_KEY = accessKey
    config.settings.SIGNING_KEY = signingKey
    config.settings.PASSPHRASE = passPhrase
  })

  describe('no apiKey provided', () => {
    it('should use default env variable', async () => {
      const [signingKey, accessKey, passPhrase] = getApiKeys('', config.settings)

      expect(signingKey).toBe(signingKey)
      expect(accessKey).toBe(accessKey)
      expect(passPhrase).toBe(passPhrase)
    })
  })

  describe('apiKey provided', () => {
    it('should use apiKey', async () => {
      process.env['KEY1_ACCESS_KEY'] = accessKey1
      process.env['KEY1_PASSPHRASE'] = passPhrase1
      process.env['KEY1_SIGNING_KEY'] = signingKey1

      const [signingKey, accessKey, passPhrase] = getApiKeys('KEY1', config.settings)

      expect(signingKey).toBe(signingKey1)
      expect(accessKey).toBe(accessKey1)
      expect(passPhrase).toBe(passPhrase1)
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
