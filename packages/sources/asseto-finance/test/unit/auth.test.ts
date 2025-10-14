import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { AuthManager, AuthResponseSchema, AuthSettings } from '../../src/transport/helpers/auth'

describe('AuthManager', () => {
  const mockSettings: AuthSettings = {
    API_ENDPOINT: 'https://open.syncnav.com/api',
    CLIENT_ID: 'test-client-id',
    CLIENT_SECRET: 'test-client-secret',
    GRANT_TYPE: 'client_credentials',
    BACKGROUND_EXECUTE_MS: 1000,
  }

  let mockRequester: jest.Mocked<Requester>
  let authManager: AuthManager

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockRequester = {
      request: jest.fn(),
    } as any

    authManager = new AuthManager(mockRequester, mockSettings)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getBearerToken', () => {
    it('should fetch and return a new token', async () => {
      const mockAuthResponse: AuthResponseSchema = {
        token_type: 'Bearer',
        expires: 3600,
        access_token: 'test-token',
      }

      mockRequester.request.mockResolvedValueOnce({
        response: {
          status: 200,
          data: mockAuthResponse,
        },
      } as any)

      const token = await authManager.getBearerToken()

      expect(token).toBe('test-token')
      expect(mockRequester.request).toHaveBeenCalledTimes(1)
    })

    it('should reuse cached token if not expired', async () => {
      const mockAuthResponse: AuthResponseSchema = {
        token_type: 'Bearer',
        expires: 3600,
        access_token: 'test-token',
      }

      mockRequester.request.mockResolvedValueOnce({
        response: {
          status: 200,
          data: mockAuthResponse,
        },
      } as any)

      await authManager.getBearerToken()
      const token = await authManager.getBearerToken()

      expect(token).toBe('test-token')
      expect(mockRequester.request).toHaveBeenCalledTimes(1)
    })

    it('should fetch new token when existing token is expired', async () => {
      const mockAuthResponse1: AuthResponseSchema = {
        token_type: 'Bearer',
        expires: 3,
        access_token: 'token-1',
      }
      const mockAuthResponse2: AuthResponseSchema = {
        token_type: 'Bearer',
        expires: 3600,
        access_token: 'token-2',
      }

      mockRequester.request
        .mockResolvedValueOnce({
          response: { status: 200, data: mockAuthResponse1 },
        } as any)
        .mockResolvedValueOnce({
          response: { status: 200, data: mockAuthResponse2 },
        } as any)

      let token = await authManager.getBearerToken()
      expect(token).toBe('token-1')

      jest.advanceTimersByTime(1500)

      token = await authManager.getBearerToken()

      expect(token).toBe('token-2')
      expect(mockRequester.request).toHaveBeenCalledTimes(2)
    })

    it('should throw error when auth response is not 200', async () => {
      mockRequester.request.mockResolvedValueOnce({
        response: {
          status: 401,
          data: {},
        },
      } as any)

      await expect(authManager.getBearerToken()).rejects.toThrow(AdapterError)
    })

    it('should throw error when access_token is missing', async () => {
      mockRequester.request.mockResolvedValueOnce({
        response: {
          status: 200,
          data: {
            token_type: 'Bearer',
            expires: 3600,
          },
        },
      } as any)

      await expect(authManager.getBearerToken()).rejects.toThrow(AdapterError)
    })

    it('should throw error when expires is missing', async () => {
      mockRequester.request.mockResolvedValueOnce({
        response: {
          status: 200,
          data: {
            token_type: 'Bearer',
            access_token: 'test-token',
          },
        },
      } as any)

      await expect(authManager.getBearerToken()).rejects.toThrow(AdapterError)
    })
  })
})
