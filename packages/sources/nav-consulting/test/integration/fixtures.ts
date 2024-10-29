import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.navconsulting.net', {
    encodedQueryParams: true,
  })
    .get('/navapigateway/api/v1/ClientMasterData/GetFundList')
    .reply(
      200,
      () => [
        {
          FundName: 'Test Fund',
          GlobalFundID: 1,
          FundEndDate: '9998-12-31T00:00:00',
          FundDailyAccountingStartDate: '2023-09-20T00:00:00',
          FundDailyAccountingLastAvailableDate: '2024-10-23T00:00:00',
          FundOfficialAccountingLastAvailableDate: null,
          PortfolioLastAvailableDate: '2024-10-24T06:21:44.463Z',
        },
      ],
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
    .get(
      '/navapigateway/api/v1/FundAccountingData/GetBalanceSheetForFund?globalFundID=1&fromDate=10-23-2024&toDate=10-23-2024',
    )
    .reply(
      200,
      () => ({
        Data: [
          {
            Date: '2024-10-24T06:21:44.463Z',
            'Ending Net Asset Value': {
              DTD: '105',
            },
          },
        ],
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
