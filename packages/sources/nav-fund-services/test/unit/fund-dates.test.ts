import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  FundDatesResponse,
  getFundDates,
  getFundOfficialAccountingLastAvailableDate,
} from '../../src/transport/fund-dates'

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

describe('getFundOfficialAccountingLastAvailableDate', () => {
  const mockRequester = {
    request: jest.fn(),
  } as unknown as Requester

  const fundListRow = (globalFundID: number, officialAccountingLastAvailableDate: string) => ({
    FundName: `Fund ${globalFundID}`,
    GlobalFundID: globalFundID,
    FundEndDate: '2030-12-31T00:00:00',
    FundDailyAccountingStartDate: '2020-01-01T00:00:00',
    FundDailyAccountingLastAvailableDate: null,
    FundOfficialAccountingLastAvailableDate: officialAccountingLastAvailableDate,
    PortfolioLastAvailableDate: officialAccountingLastAvailableDate,
  })

  const params = {
    globalFundID: 123,
    baseURL: 'http://base',
    apiKey: 'apiKey',
    secret: 'secret',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the date of the matching fund in MM-dd-yyyy format', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: {
        data: [fundListRow(999, '2025-06-15T00:00:00'), fundListRow(123, '2025-07-10T00:00:00')],
      },
    })

    const result = await getFundOfficialAccountingLastAvailableDate({
      ...params,
      requester: mockRequester,
    })

    expect(result).toBe('07-10-2025')
    expect(mockRequester.request).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        url: '/navapigateway/api/v1/ClientMasterData/GetFundList',
      }),
    )
  })

  it('treats the provider timestamp as UTC and drops the time of day', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: [fundListRow(123, '2025-07-10T23:59:59')] },
    })

    const result = await getFundOfficialAccountingLastAvailableDate({
      ...params,
      requester: mockRequester,
    })

    expect(result).toBe('07-10-2025')
  })

  it('throws if the fund is not in the fund list', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: [fundListRow(999, '2025-07-10T00:00:00')] },
    })

    await expect(
      getFundOfficialAccountingLastAvailableDate({
        ...params,
        requester: mockRequester,
      }),
    ).rejects.toThrow(`Fund with GlobalFundID ${params.globalFundID} not found in fund list`)
  })

  it('throws if no fund list is returned', async () => {
    mockRequester.request = jest.fn().mockResolvedValue({
      response: { data: undefined },
    })

    await expect(
      getFundOfficialAccountingLastAvailableDate({
        ...params,
        requester: mockRequester,
      }),
    ).rejects.toThrow('No fund list found')
  })
})
