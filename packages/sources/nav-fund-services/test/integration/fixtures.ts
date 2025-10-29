import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.navfundservices.com', {
    encodedQueryParams: true,
  })
    .get('/navapigateway/api/v1/FundAccountingData/GetOfficialNAVAndPerformanceReturnsForFund')
    .query(true)
    .reply(
      200,
      {
        Data: [
          {
            'Trading Level Net ROR': {
              DTD: 0.1,
              MTD: 0.2,
              QTD: 0.3,
              YTD: 0.4,
              ITD: 0.5,
            },
            'Net ROR': {
              DTD: 0.6,
              MTD: 0.7,
              QTD: 0.8,
              YTD: 0.9,
              ITD: 1.0,
            },
            'NAV Per Share': 123.45,
            'Next NAV Price': 124.56,
            'Accounting Date': '01-01-2024',
            'Ending Balance': 1000000,
          },
        ],
      },
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
    .get('/navapigateway/api/v1/ClientMasterData/GetAccountingDataDates')
    .query(true)
    .reply(
      200,
      {
        LogID: 123456,
        FromDate: '01-01-2024',
        ToDate: '01-31-2024',
      },
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
