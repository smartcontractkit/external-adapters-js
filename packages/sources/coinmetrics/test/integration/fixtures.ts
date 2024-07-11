import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
import { WsAssetMetricsSuccessResponse } from '../../src/transport/price-ws'
import { WsCryptoLwbaSuccessResponse } from '../../src/transport/lwba'

export const mockCoinmetricsResponseSuccess = (): nock.Scope =>
  nock('https://api.coinmetrics.io/v4')
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'BTC',
      metrics: 'ReferenceRateUSD',
      frequency: '1s',
      limit_per_asset: 1,
      api_key: 'fake-api-key',
      page_size: 10000,
    })
    .reply(200, {
      data: [
        {
          asset: 'btc',
          time: '2022-03-02T16:52:24.000000000Z',
          ReferenceRateUSD: '2969.5',
        },
      ],
      next_page_token: '0.MjAyMi0wMy0wMlQxNjo1MjoyNFo',
    })
    .persist()

export const mockCoinmetricsResponseSuccess2 = (pageSize = 1): nock.Scope =>
  nock('https://api.coinmetrics.io/v4')
    .persist()
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics: 'FeeTotNtv,RevNtv,IssTotNtv',
      frequency: '1d',
      page_size: pageSize,
      api_key: 'fake-api-key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2021-11-04T00:00:00.000000000Z',
          FeeTotNtv: '14465.059425601977193289',
          IssTotNtv: '13175.1875',
          RevNtv: '14887.21684537933981053',
        },
      ],
      next_page_token: '0.MjAyMS0wOC0wNlQwMDowMDowMFo',
    })

export const mockCoinmetricsRealizedVolResponseSuccess = (): nock.Scope =>
  nock('https://api.coinmetrics.io/v4')
    .persist()
    .get('/timeseries/asset-metrics')
    .query({
      assets: 'eth',
      metrics:
        'volatility_realized_usd_rolling_24h,volatility_realized_usd_rolling_7d,volatility_realized_usd_rolling_30d',
      frequency: '10m',
      limit_per_asset: 1,
      api_key: 'fake-api-key',
    })
    .reply(200, {
      data: [
        {
          asset: 'eth',
          time: '2023-09-13T10:20:00.000000000Z',
          volatility_realized_usd_rolling_24h: '0.4853062',
          volatility_realized_usd_rolling_30d: '0.427451',
          volatility_realized_usd_rolling_7d: '0.3781615',
        },
      ],
    })

const wsResponseBody: WsAssetMetricsSuccessResponse = {
  cm_sequence_id: 0,
  type: 'price',
  time: '2020-06-08T20:54:04.000000000Z',
  asset: 'eth',
  height: 9999999,
  hash: 'YWxsIHlvdXIgYmFzZSBhcmU=',
  parent_hash: 'YmVsb25nIHRvIHVzCg==',
  ReferenceRateUSD: '1500',
}

const wsLwbaResponseBody: WsCryptoLwbaSuccessResponse = {
  pair: 'eth-usd',
  time: '2023-03-08T04:04:33.750000000Z',
  ask_price: '1562.4083581615457',
  ask_size: '31.63132041',
  bid_price: '1562.3384315992228',
  bid_size: '64.67517577',
  mid_price: '1562.3733948803842',
  spread: '0.000044756626394287605',
  cm_sequence_id: '282',
}

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      setTimeout(() => socket.send(JSON.stringify(wsResponseBody)), 10)
    }
    parseMessage()
  })
  return mockWsServer
}

export const mockCryptoLwbaWebSocketServer = (URL: string) => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const parseMessage = () => {
      setTimeout(() => socket.send(JSON.stringify(wsLwbaResponseBody)), 10)

      const wsLwbaResponseBodyInvariantViolation = {
        ...wsLwbaResponseBody,
        ask_price: Number(wsLwbaResponseBody.mid_price) - 0.1,
      }
      setTimeout(() => socket.send(JSON.stringify(wsLwbaResponseBodyInvariantViolation)), 50)
    }
    parseMessage()
  })
  return mockWsServer
}
