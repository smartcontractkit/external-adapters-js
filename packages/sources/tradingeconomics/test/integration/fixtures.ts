import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.tradingeconomics.com/markets', {
    encodedQueryParams: true,
  })
    .get('/symbol/EURUSD:CUR')
    .query({ c: 'fake-api-key:fake-api-secret', f: 'json' })
    .reply(
      200,
      [
        {
          Symbol: 'EURUSD:CUR',
          Ticker: 'EUR',
          Name: 'EURUSD',
          Country: 'Euro Area',
          Date: '2021-11-05T17:36:00Z',
          Type: 'currency',
          decimals: 5.0,
          state: 'OPEN',
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
    .persist()
    .get('/symbol/AAPL:US')
    .query({ c: 'fake-api-key:fake-api-secret', f: 'json' })
    .reply(
      200,
      [
        {
          Symbol: 'AAPL:US',
          Ticker: 'AAPL',
          Name: 'Apple',
          Country: 'United States',
          Date: '2023-05-02T19:58:28.92Z',
          Type: 'stocks',
          decimals: 2,
          state: 'CLOSED',
          Last: 168.54,
          Close: 168.54,
          CloseDate: '2023-05-02T00:00:00',
          MarketCap: 2659985600000,
          URL: '/aapl:us',
          Importance: 500,
          DailyChange: -1.05,
          DailyPercentualChange: -0.6191,
          WeeklyChange: 4.77,
          WeeklyPercentualChange: 2.9126,
          MonthlyChange: 2.37,
          MonthlyPercentualChange: 1.4263,
          YearlyChange: 9.06,
          YearlyPercentualChange: 5.681,
          YTDChange: 38.61,
          YTDPercentualChange: 29.716,
          day_high: 170.35,
          day_low: 167.54,
          yesterday: 169.59,
          lastWeek: 163.77,
          lastMonth: 166.17,
          lastYear: 159.48,
          startYear: 129.93,
          ISIN: 'US0378331005',
          unit: 'USD',
          frequency: 'Live',
          LastUpdate: '2023-05-03T10:23:00',
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

export const mockWebSocketServer = (url: string) => {
  const mockWsServer = new MockWebsocketServer(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      if (message.toString().includes(':CUR')) {
        // price endpoint
        socket.send(
          JSON.stringify({
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
          }),
        )
        setTimeout(() => {
          socket.send(JSON.stringify({ topic: 'keepalive' }))
        }, 10000)
      } else {
        // stock endpoint
        socket.send(
          JSON.stringify({
            s: 'AAPL:US',
            price: 160.32,
            dt: 1659472542655,
            topic: 'AAPL:US',
          }),
        )
      }
    })
  })
  return mockWsServer
}
