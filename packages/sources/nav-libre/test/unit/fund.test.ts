import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import * as authModule from '../../src/transport/authentication'
import { getFund } from '../../src/transport/fund'

describe('getFund', () => {
  const mockRequester = {
    request: jest.fn(),
  } as unknown as Requester

  const mockResponse = [
    {
      'Accounting Date': '01-01-2023',
      'NAV Per Share': 123.45,
    },
  ]

  let getRequestHeadersStub: jest.SpyInstance
  beforeEach(() => {
    jest.clearAllMocks()
    getRequestHeadersStub = jest.spyOn(authModule, 'getRequestHeaders').mockReturnValue({})
  })

  afterEach(() => {
    getRequestHeadersStub.mockRestore()
  })
  it('returns fund data on success', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: {
        data: { Data: mockResponse },
      },
    })
    const result = await getFund(
      123,
      '01-01-2000',
      '01-05-2000',
      'http://base',
      'apiKey',
      'secret',
      mockRequester,
    )
    expect(result).toEqual(mockResponse)
  })

  it('throws if no data returned', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: undefined },
    })
    await expect(
      getFund(123, '01-01-2000', '01-05-2000', 'http://base', 'apiKey', 'secret', mockRequester),
    ).rejects.toThrow()
  })
})
