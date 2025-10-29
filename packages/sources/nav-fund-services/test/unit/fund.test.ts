import { Requester } from '@chainlink/external-adapter-framework/util/requester'
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns fund data on success', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: {
        data: { Data: mockResponse },
      },
    })
    const result = await getFund({
      globalFundID: 123,
      fromDate: '01-01-2000',
      toDate: '01-05-2000',
      baseURL: 'http://base',
      apiKey: 'apiKey',
      secret: 'secret',
      requester: mockRequester,
    })
    expect(result).toEqual(mockResponse)
  })

  it('throws if no data returned', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: undefined },
    })
    await expect(
      getFund({
        globalFundID: 123,
        fromDate: '01-01-2000',
        toDate: '01-05-2000',
        baseURL: 'http://base',
        apiKey: 'apiKey',
        secret: 'secret',
        requester: mockRequester,
      }),
    ).rejects.toThrow()
  })
})
