import { RequestHelper } from '../../src/transport/helpers/request'

describe('RequestHelper', () => {
  const baseURL = 'https://open.syncnav.com/api'
  const bearerToken = 'test-token-123'
  const fundId = 456

  describe('createNavRequest', () => {
    it('should create request with correct URL and auth header', () => {
      const request = RequestHelper.createNavRequest(baseURL, bearerToken, fundId)

      expect(request).toEqual({
        baseURL,
        url: '/funds/456/nav-daily',
        headers: {
          Authorization: 'Bearer test-token-123',
        },
      })
    })
  })

  describe('createReserveRequest', () => {
    it('should create request with correct URL and auth header', () => {
      const request = RequestHelper.createReserveRequest(baseURL, bearerToken, fundId)

      expect(request).toEqual({
        baseURL,
        url: '/funds/456/reserves',
        headers: {
          Authorization: 'Bearer test-token-123',
        },
      })
    })
  })
})
