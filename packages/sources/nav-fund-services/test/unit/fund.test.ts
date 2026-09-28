import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { getFund, getFundList } from '../../src/transport/fund'

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

describe('getFundList', () => {
  const mockRequester = {
    request: jest.fn(),
  } as unknown as Requester

  const mockResponse = [
    {
      FundName: 'Some Fund',
      GlobalFundID: 123,
      FundEndDate: '2030-12-31T00:00:00',
      FundDailyAccountingStartDate: '2020-01-01T00:00:00',
      FundDailyAccountingLastAvailableDate: null,
      FundOfficialAccountingLastAvailableDate: '2025-07-10T00:00:00',
      PortfolioLastAvailableDate: '2025-07-10T00:00:00',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the fund list on success', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: mockResponse },
    })
    const result = await getFundList({
      baseURL: 'http://base',
      apiKey: 'apiKey',
      secret: 'secret',
      requester: mockRequester,
    })
    expect(result).toEqual(mockResponse)
    expect(mockRequester.request).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        baseURL: 'http://base',
        method: 'GET',
        url: '/navapigateway/api/v1/ClientMasterData/GetFundList',
      }),
    )
  })

  it('returns an empty list when the provider returns no funds', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: [] },
    })
    const result = await getFundList({
      baseURL: 'http://base',
      apiKey: 'apiKey',
      secret: 'secret',
      requester: mockRequester,
    })
    expect(result).toEqual([])
  })

  it('throws if no data returned', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: undefined },
    })
    await expect(
      getFundList({
        baseURL: 'http://base',
        apiKey: 'apiKey',
        secret: 'secret',
        requester: mockRequester,
      }),
    ).rejects.toThrow('No fund list found')
  })

  it('throws if the data is not an array', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: { Data: [] } },
    })
    await expect(
      getFundList({
        baseURL: 'http://base',
        apiKey: 'apiKey',
        secret: 'secret',
        requester: mockRequester,
      }),
    ).rejects.toThrow('No fund list found')
  })
})
