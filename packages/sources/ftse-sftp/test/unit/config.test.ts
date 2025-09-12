import { config, NAME } from '../../src/config'

describe('SFTP Generic Config', () => {
  describe('adapter name', () => {
    it('should have correct adapter name', () => {
      expect(NAME).toBe('FTSE_SFTP_ADAPTER')
    })
  })

  describe('configuration object', () => {
    it('should be defined', () => {
      expect(config).toBeDefined()
    })

    it('should be a valid AdapterConfig instance', () => {
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })
  })
})
