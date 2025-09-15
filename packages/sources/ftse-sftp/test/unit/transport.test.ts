import { config } from '../../src/config'
import { SftpTransport } from '../../src/transport/sftp'

// Mock the framework dependencies
jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => ({
  SubscriptionTransport: class MockSubscriptionTransport {
    responseCache = {
      write: jest.fn(),
    }
    name = 'test'
    constructor() {
      // Mock constructor
    }
    async initialize() {
      // Mock initialization
    }
    async backgroundHandler() {
      // Mock background handler
    }
  },
}))

jest.mock('@chainlink/external-adapter-framework/util', () => ({
  makeLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  })),
  sleep: jest.fn(),
}))

jest.mock('ssh2-sftp-client', () => require('../mocks/sftpClient'))

describe('SFTP Transport Integration Tests', () => {
  let transport: SftpTransport

  beforeEach(() => {
    transport = new SftpTransport()

    // Mock the config
    ;(transport as unknown as { config: typeof config.settings }).config = {
      SFTP_HOST: 'test.example.com',
      SFTP_PORT: 22,
      SFTP_USERNAME: 'testuser',
      SFTP_PASSWORD: 'testpass',
      BACKGROUND_EXECUTE_MS: 10_000,
    }
  })

  describe('Configuration', () => {
    it('should return correct subscription TTL from config', () => {
      const mockSettings: typeof config.settings = {
        SFTP_HOST: 'test.example.com',
        SFTP_PORT: 22,
        SFTP_USERNAME: 'testuser',
        SFTP_PASSWORD: 'testpass',
        BACKGROUND_EXECUTE_MS: 30000,
      }

      const ttl = transport.getSubscriptionTtlFromConfig(mockSettings)
      expect(ttl).toBe(30000)
    })
  })
})
