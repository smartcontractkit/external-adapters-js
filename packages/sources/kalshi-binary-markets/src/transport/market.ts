import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/market'

export interface MarketData {
  can_close_early: boolean
  category: string
  close_time: string
  event_ticker: string
  expiration_time: string
  last_price: number
  liquidity: number
  market_type: string
  no_ask: number
  no_bid: number
  open_interest: number
  status: string
  ticker: string
  yes_ask: number
  yes_bid: number
  result: string | null
}

export interface ResponseSchema {
  market: MarketData
}

type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

export const convertStatusToCode = (status: string): number => {
  switch (status) {
    case 'active':
      return 0
    case 'closed':
      return 1
    case 'settled':
      return 2
    default:
      return 0
  }
}

export const convertResultToFlag = (result: string | null): number => {
  if (result === null) return 0
  if (result === 'yes') return 1
  if (result === 'no') return 2
  return 0
}

export const parseTimestamp = (isoString: string): number => {
  return Math.floor(new Date(isoString).getTime() / 1000)
}

export const calculateMidPrice = (bid: number, ask: number): number => {
  return (bid + ask) / 2
}

export const buildMarketResult = (
  market: MarketData,
  updatedAt: number,
): {
  market_ticker: string
  event_ticker: string
  market_status: number
  settlement_flag: number
  yes_bid_price: number
  yes_ask_price: number
  no_bid_price: number
  no_ask_price: number
  yes_mid_price: number
  no_mid_price: number
  open_interest: number
  category: string
  close_timestamp: number
  updated_at: number
} => {
  return {
    market_ticker: market.ticker,
    event_ticker: market.event_ticker,
    market_status: convertStatusToCode(market.status),
    settlement_flag: convertResultToFlag(market.result),
    yes_bid_price: market.yes_bid,
    yes_ask_price: market.yes_ask,
    no_bid_price: market.no_bid,
    no_ask_price: market.no_ask,
    yes_mid_price: calculateMidPrice(market.yes_bid, market.yes_ask),
    no_mid_price: calculateMidPrice(market.no_bid, market.no_ask),
    open_interest: market.open_interest,
    category: market.category,
    close_timestamp: parseTimestamp(market.close_time),
    updated_at: updatedAt,
  }
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => ({
      params: [param],
      request: {
        baseURL: config.API_ENDPOINT,
        url: `/markets/${param.market_ticker}`,
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${config.API_KEY}`,
        },
      },
    }))
  },
  parseResponse: (params, response) => {
    if (!response.data?.market) {
      return params.map((param) => ({
        params: param,
        response: {
          errorMessage: `No market data returned for ${param.market_ticker}`,
          statusCode: 502,
        },
      }))
    }

    const market = response.data.market
    const updatedAt = Math.floor(Date.now() / 1000)

    return params.map((param) => {
      return {
        params: param,
        response: {
          result: null,
          data: {
            result: buildMarketResult(market, updatedAt),
          },
        },
      }
    })
  },
})
