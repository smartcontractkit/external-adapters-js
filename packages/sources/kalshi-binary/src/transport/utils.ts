export interface ProviderResponse<T> {
  data: T
}

export interface KalshiMarketResponse {
  market: {
    ticker: string
    event_ticker: string
    status: string
    result?: string
    yes_bid: number
    yes_ask: number
    no_bid: number
    no_ask: number
    open_interest: number
    category: string
    close_time: string
    updated_at: string
  }
}

export interface MarketRequestParams {
  market_ticker: string
}

export interface MarketResponseData {
  result: number
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
}

export interface AdapterConfig {
  API_ENDPOINT: string
  KALSHI_API_KEY: string
}

export const marketStatusMap: Record<string, number> = {
  active: 1,
  closed: 2,
  settled: 3,
}

export const settlementFlagMap: Record<string, number> = {
  yes: 1,
  no: 2,
}

export function getMarketStatus(status: string): number {
  return marketStatusMap[status] ?? 0
}

export function getSettlementFlag(result: string | undefined): number {
  if (!result) return 0
  return settlementFlagMap[result] ?? 0
}

export function calculateMidPrice(bid: number, ask: number): number {
  return (bid + ask) / 2
}

export function parseTimestampToUnixSeconds(isoTimestamp: string): number {
  return Math.floor(new Date(isoTimestamp).getTime() / 1000)
}

export function parseTimestampToUnixMs(isoTimestamp: string): number {
  return new Date(isoTimestamp).getTime()
}

export function buildRequestConfig(
  param: MarketRequestParams,
  config: AdapterConfig,
): {
  params: MarketRequestParams[]
  request: {
    baseURL: string
    url: string
    headers: {
      accept: string
      Authorization: string
    }
  }
} {
  return {
    params: [param],
    request: {
      baseURL: config.API_ENDPOINT,
      url: `/markets/${param.market_ticker}`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${config.KALSHI_API_KEY}`,
      },
    },
  }
}

export interface ParsedMarketResult {
  params: MarketRequestParams
  response:
    | {
        errorMessage: string
        statusCode: number
      }
    | {
        result: number
        data: MarketResponseData
        timestamps: {
          providerIndicatedTimeUnixMs: number
        }
      }
}

export function parseMarketResponse(
  params: MarketRequestParams[],
  response: ProviderResponse<KalshiMarketResponse>,
): ParsedMarketResult[] {
  if (!response.data || !response.data.market) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: `The data provider didn't return any value for ${param.market_ticker}`,
          statusCode: 502,
        },
      }
    })
  }

  const market = response.data.market

  const yesBidPrice = market.yes_bid
  const yesAskPrice = market.yes_ask
  const noBidPrice = market.no_bid
  const noAskPrice = market.no_ask
  const yesMidPrice = calculateMidPrice(yesBidPrice, yesAskPrice)
  const noMidPrice = calculateMidPrice(noBidPrice, noAskPrice)

  const marketStatus = getMarketStatus(market.status)
  const settlementFlag = getSettlementFlag(market.result)

  const closeTimestamp = parseTimestampToUnixSeconds(market.close_time)
  const updatedAt = parseTimestampToUnixSeconds(market.updated_at)

  const timestamps = {
    providerIndicatedTimeUnixMs: parseTimestampToUnixMs(market.updated_at),
  }

  return params.map((param) => {
    return {
      params: param,
      response: {
        result: marketStatus,
        data: {
          result: marketStatus,
          market_ticker: market.ticker,
          event_ticker: market.event_ticker,
          market_status: marketStatus,
          settlement_flag: settlementFlag,
          yes_bid_price: yesBidPrice,
          yes_ask_price: yesAskPrice,
          no_bid_price: noBidPrice,
          no_ask_price: noAskPrice,
          yes_mid_price: yesMidPrice,
          no_mid_price: noMidPrice,
          open_interest: market.open_interest,
          category: market.category,
          close_timestamp: closeTimestamp,
          updated_at: updatedAt,
        },
        timestamps,
      },
    }
  })
}
