import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { SftpTransport } from '../../src/transport/sftp'
import { mockSftpClientInstance } from '../mocks/sftpClient'

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
    ;(transport as any).config = {
      SFTP_HOST: 'test.example.com',
      SFTP_PORT: 22,
      SFTP_USERNAME: 'testuser',
      SFTP_PASSWORD: 'testpass',
    }

    // Reset mock state - the comprehensive mock resets itself in constructor
    // but we can also reset specific states here if needed
    mockSftpClientInstance.setShouldFailConnection(false)
  })

  describe('SFTP connection management', () => {
    it('should reuse existing connection', async () => {
      // First connection
      await (transport as any).connectToSftp()
      expect((transport as any).isConnected).toBe(true)

      // Second call should reuse connection
      await (transport as any).connectToSftp()
      expect((transport as any).isConnected).toBe(true)
    })

    it('should handle SFTP connection failures', async () => {
      mockSftpClientInstance.setShouldFailConnection(true)

      await expect((transport as any).connectToSftp()).rejects.toThrow(AdapterInputError)
      expect((transport as any).isConnected).toBe(false)
    })
  })

  describe('Configuration', () => {
    it('should return correct subscription TTL from config', () => {
      const mockSettings = {
        BACKGROUND_EXECUTE_MS: 30000,
      } as any

      const ttl = transport.getSubscriptionTtlFromConfig(mockSettings)
      expect(ttl).toBe(30000)
    })

    it('should return default TTL when BACKGROUND_EXECUTE_MS is not set', () => {
      const mockSettings = {} as any

      const ttl = transport.getSubscriptionTtlFromConfig(mockSettings)
      expect(ttl).toBe(60000)
    })

    it('should use default port when SFTP_PORT is not specified', async () => {
      ;(transport as any).config = {
        SFTP_HOST: 'test.example.com',
        SFTP_PORT: undefined,
        SFTP_USERNAME: 'testuser',
        SFTP_PASSWORD: 'testpass',
      }

      await (transport as any).connectToSftp()
      expect((transport as any).isConnected).toBe(true)
    })
  })
})
