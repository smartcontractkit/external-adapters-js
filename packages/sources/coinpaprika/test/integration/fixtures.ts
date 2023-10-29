import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockCryptoResponseSuccess = (): nock.Scope =>
  nock('https://api.coinpaprika.com', {
    encodedQueryParams: true,
  })
    .get('/v1/tickers')
    .query({ quotes: 'USD' })
    .reply(
      200,
      () => [
        {
          id: 'eth-ethereum',
          name: 'Ethereum',
          symbol: 'ETH',
          rank: 2,
          circulating_supply: 118033526,
          total_supply: 118033574,
          max_supply: 0,
          beta_value: 1.08967,
          first_data_at: '2015-08-07T00:00:00Z',
          last_updated: '2021-10-22T18:11:05Z',
          quotes: {
            USD: {
              price: 4949.2425813062,
              volume_24h: 24136641726.138,
              volume_24h_change_24h: -35.07,
              market_cap: 466143026900,
              market_cap_change_24h: -3.44,
              percent_change_15m: 0.14,
              percent_change_30m: -0.18,
              percent_change_1h: -0.64,
              percent_change_6h: -4.09,
              percent_change_12h: -4.65,
              percent_change_24h: -3.45,
              percent_change_7d: 2.23,
              percent_change_30d: 28.11,
              percent_change_1y: 844.08,
              ath_price: 4365.2053035,
              ath_date: '2021-05-12T06:06:20Z',
              percent_from_price_ath: -9.53,
            },
          },
        },
        {
          id: 'btc-bitcoin',
          name: 'Bitcoin',
          symbol: 'BTC',
          rank: 2,
          circulating_supply: 118033526,
          total_supply: 118033574,
          max_supply: 0,
          beta_value: 1.08967,
          first_data_at: '2015-08-07T00:00:00Z',
          last_updated: '2021-10-22T18:11:05Z',
          quotes: {
            USD: {
              price: 40000.2425813062,
              volume_24h: 24136641726.138,
              volume_24h_change_24h: -35.07,
              market_cap: 466143026900,
              market_cap_change_24h: -3.44,
              percent_change_15m: 0.14,
              percent_change_30m: -0.18,
              percent_change_1h: -0.64,
              percent_change_6h: -4.09,
              percent_change_12h: -4.65,
              percent_change_24h: -3.45,
              percent_change_7d: 2.23,
              percent_change_30d: 28.11,
              percent_change_1y: 844.08,
              ath_price: 40000.2053035,
              ath_date: '2021-05-12T06:06:20Z',
              percent_from_price_ath: -9.53,
            },
          },
        },
        {
          id: 'fake-btc-bitcoin',
          name: 'Fakecoin',
          symbol: 'BTC',
          rank: 2,
          circulating_supply: 118033526,
          total_supply: 118033574,
          max_supply: 0,
          beta_value: 1.08967,
          first_data_at: '2015-08-07T00:00:00Z',
          last_updated: '2021-10-22T18:11:05Z',
          quotes: {
            USD: {
              price: 0.11,
              volume_24h: 24136641726.138,
              volume_24h_change_24h: -35.07,
              market_cap: 466143026900,
              market_cap_change_24h: -3.44,
              percent_change_15m: 0.14,
              percent_change_30m: -0.18,
              percent_change_1h: -0.64,
              percent_change_6h: -4.09,
              percent_change_12h: -4.65,
              percent_change_24h: -3.45,
              percent_change_7d: 2.23,
              percent_change_30d: 28.11,
              percent_change_1y: 844.08,
              ath_price: 40000.2053035,
              ath_date: '2021-05-12T06:06:20Z',
              percent_from_price_ath: -9.53,
            },
          },
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
    .get(`/v1/global`)
    .reply(
      200,
      () => ({
        market_cap_usd: 2559344984924,
        volume_24h_usd: 217605673763,
        bitcoin_dominance_percentage: 44.68,
        cryptocurrencies_number: 5438,
        market_cap_ath_value: 2729904005915,
        market_cap_ath_date: '2021-10-21T09:45:00Z',
        volume_24h_ath_value: 33401557439370,
        volume_24h_ath_date: '2021-10-22T12:50:00Z',
        volume_24h_percent_from_ath: -99.35,
        volume_24h_percent_to_ath: 9999.99,
        market_cap_change_24h: -1.86,
        volume_24h_change_24h: -18.21,
        last_updated: 1634927806,
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
    .get('/v1/coins')
    .reply(200, [
      {
        id: 'eth-ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        rank: 2,
        is_new: false,
        is_active: true,
        type: 'token',
      },
      {
        id: 'ampl-ampleforth',
        name: 'Ampleforth',
        symbol: 'AMPL',
        rank: 289,
        is_new: false,
        is_active: true,
        type: 'token',
      },
      {
        id: 'fake-btc-bitcoin',
        name: 'Fakecoin',
        symbol: 'BTC',
        rank: 1000,
        is_new: false,
        is_active: true,
        type: 'token',
      },
      {
        id: 'btc-bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        rank: 1,
        is_new: false,
        is_active: true,
        type: 'token',
      },
    ])
    .persist()
    .get('/v1/tickers/eth-ethereum')
    .query({ quotes: 'USD' })
    .reply(
      200,
      {
        id: 'eth-ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        rank: 2,
        circulating_supply: 118033526,
        total_supply: 118033574,
        max_supply: 0,
        beta_value: 1.08967,
        first_data_at: '2015-08-07T00:00:00Z',
        last_updated: '2021-10-22T18:11:05Z',
        quotes: {
          USD: {
            price: 3949.2425813062,
            volume_24h: 24136641726.138,
            volume_24h_change_24h: -35.07,
            market_cap: 466143026900,
            market_cap_change_24h: -3.44,
            percent_change_15m: 0.14,
            percent_change_30m: -0.18,
            percent_change_1h: -0.64,
            percent_change_6h: -4.09,
            percent_change_12h: -4.65,
            percent_change_24h: -3.45,
            percent_change_7d: 2.23,
            percent_change_30d: 28.11,
            percent_change_1y: 844.08,
            ath_price: 4365.2053035,
            ath_date: '2021-05-12T06:06:20Z',
            percent_from_price_ath: -9.53,
          },
        },
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
    .get('/v1/tickers/fake-btc-bitcoin')
    .query({ quotes: 'USD' })
    .reply(
      200,
      {
        id: 'fake-btc-bitcoin',
        name: 'Fakecoin',
        symbol: 'BTC',
        rank: 2,
        circulating_supply: 118033526,
        total_supply: 118033574,
        max_supply: 0,
        beta_value: 1.08967,
        first_data_at: '2015-08-07T00:00:00Z',
        last_updated: '2021-10-22T18:11:05Z',
        quotes: {
          USD: {
            price: 0.11,
            volume_24h: 24136641726.138,
            volume_24h_change_24h: -35.07,
            market_cap: 466143026900,
            market_cap_change_24h: -3.44,
            percent_change_15m: 0.14,
            percent_change_30m: -0.18,
            percent_change_1h: -0.64,
            percent_change_6h: -4.09,
            percent_change_12h: -4.65,
            percent_change_24h: -3.45,
            percent_change_7d: 2.23,
            percent_change_30d: 28.11,
            percent_change_1y: 844.08,
            ath_price: 40000.2053035,
            ath_date: '2021-05-12T06:06:20Z',
            percent_from_price_ath: -9.53,
          },
        },
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
    .get('/v1/tickers/ampl-ampleforth/historical')
    .query({
      start: /^\d{4}-\d{2}-\d{2}$/,
      interval: '24h',
    })
    .reply(200, [
      {
        timestamp: '2022-01-30T00:00:00Z',
        price: 0.949723,
        volume_24h: 1354916,
        market_cap: 106686649,
      },
    ])
    .persist()
    .get('/v1/tickers/eth-ethereum/historical')
    .query({
      start: /^\d{4}-\d{2}-\d{2}$/,
      interval: '24h',
    })
    .reply(200, [
      {
        timestamp: '2022-01-30T00:00:00Z',
        price: 4000,
        volume_24h: 11111,
        market_cap: 999999999,
      },
    ])
    .persist()

export const mockCryptoWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(
        JSON.stringify({
          id: 'eth-ethereum',
          sym: 'ETH',
          ts: 1676916987,
          quotes: {
            USD: {
              m: 218206664352,
              p: 1820,
              v24h: 18368605422,
            },
          },
        }),
      )
    })
  })
  return mockWsServer
}
