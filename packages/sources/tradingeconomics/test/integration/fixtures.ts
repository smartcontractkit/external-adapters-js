import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.tradingeconomics.com/markets', {
    encodedQueryParams: true,
  })
    .get('/symbol/EURUSD:CUR')
    .query({ c: 'fake-api-key:fake-api-secret' })
    .reply(
      200,
      () => [
        {
          Symbol: 'EURUSD:CUR',
          Ticker: 'EUR',
          Name: 'EURUSD',
          Country: 'Euro Area',
          Date: '2021-11-05T17:36:00',
          Type: 'currency',
          decimals: 5.0,
          state: 'OPEN      ',
          Last: 1.15591,
          Close: 1.15591,
          CloseDate: '2021-11-05T17:36:00',
          MarketCap: null,
          URL: '/euro-area/currency',
          Importance: 1,
          DailyChange: 0.0006,
          DailyPercentualChange: 0.05,
          WeeklyChange: -0.0002,
          WeeklyPercentualChange: -0.0208,
          MonthlyChange: 0.0005,
          MonthlyPercentualChange: 0.0398,
          YearlyChange: -0.0315,
          YearlyPercentualChange: -2.6553,
          YTDChange: -0.0658,
          YTDPercentualChange: -5.3828,
          day_high: 1.15629,
          day_low: 1.15142,
          yesterday: 1.1554,
          lastWeek: 1.1562,
          lastMonth: 1.1555,
          lastYear: 1.1874,
          startYear: 1.2217,
          ISIN: null,
          frequency: 'Daily, Intraday, Live Stream',
          LastUpdate: '2021-11-05T17:36:00',
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

export const mockSubscribeRequest = {
  request: {
    topic: 'subscribe',
    to: 'USDCAD:CUR',
  },
  response: [
    {
      s: 'USDCAD:CUR',
      i: 'USDCAD',
      pch: 0.26,
      nch: 0.00328,
      bid: 1.28778,
      ask: 1.28778,
      price: 1.28778,
      dt: 1659472542655,
      state: 'open',
      type: 'currency',
      dhigh: 1.2887,
      dlow: 1.2831,
      o: 1.28707,
      prev: 1.2845,
      topic: 'USDCAD',
    },
  ],
}

export const mockUnsubscribeRequest = {
  request: undefined,
  response: {},
}
