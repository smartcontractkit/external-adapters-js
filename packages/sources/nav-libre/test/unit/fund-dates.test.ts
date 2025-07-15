import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { FundDatesResponse, getFundDates } from '../../src/transport/fund-dates'

describe('getFundDates', () => {
  const mockRequester = {
    request: jest.fn(),
  } as unknown as Requester

  const mockResponse: FundDatesResponse = {
    LogID: 1,
    FromDate: '01-01-2023',
    ToDate: '01-31-2023',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns fund dates on success', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: mockResponse },
    })
    const result = await getFundDates({
      globalFundID: 123,
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
      getFundDates({
        globalFundID: 123,
        baseURL: 'http://base',
        apiKey: 'apiKey',
        secret: 'secret',
        requester: mockRequester,
      }),
    ).rejects.toThrow()
  })
})
