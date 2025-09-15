import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/sftp'
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

describe('SFTP Transport Integration Tests', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'ftse_sftp'

  const adapterSettings = makeStub('adapterSettings', {
    SFTP_HOST: 'test.example.com',
    SFTP_PORT: 22,
    SFTP_USERNAME: 'testuser',
    SFTP_PASSWORD: 'testpass',
    BACKGROUND_EXECUTE_MS: 10_000,
  } as unknown as BaseEndpointTypes['Settings'])

  const responseCache = {
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: SftpTransport

  beforeEach(async () => {
    jest.resetAllMocks()
    transport = new SftpTransport()
    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  describe('Configuration', () => {
    it('should return correct subscription TTL from config', () => {
      const mockSettings = makeStub('mockSettings', {
        BACKGROUND_EXECUTE_MS: 30000,
      } as unknown as BaseEndpointTypes['Settings'])

      const ttl = transport.getSubscriptionTtlFromConfig(mockSettings)
      expect(ttl).toBe(30000)
    })
  })
})
