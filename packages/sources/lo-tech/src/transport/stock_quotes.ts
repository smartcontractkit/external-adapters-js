import { BaseEndpointTypes } from '../endpoint/stock_quotes'
import { BasePriceData, LoTechWebSocketTransport, LoTechWSResponse } from './common'

export type PriceData = BasePriceData & {
  symbol: string
  ingress_ts: number // microseconds
  publish_ts: null
  transaction_ts: number // microseconds
  price: number
  spread: number
}

export type WSResponse = LoTechWSResponse<PriceData>

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

type Region = 'us' | 'asia'

export class StockQuotesWebSocketTransport extends LoTechWebSocketTransport<
  PriceData,
  BaseEndpointTypes['Response']['Data']
> {
  constructor(region: Region) {
    super({
      loggerName: 'lo-tech - stock_quotes',
      url: (context) => context.adapterSettings.REGION_WS_API_ENDPOINT.get(region),
      apiKey: (context) => context.adapterSettings.REGION_API_KEY.get(region),
      getBase: (data) => data.symbol,
      toResponseData: (data) => {
        const mid_price = data.price
        const spread = data.spread
        const bid_price = mid_price - spread / 2
        const ask_price = mid_price + spread / 2

        return {
          mid_price,
          bid_price,
          ask_price,
          bid_volume: 0,
          ask_volume: 0,
          ingress_ts_iso: new Date(data.ingress_ts / 1000).toISOString(),
        }
      },
    })
  }
}
