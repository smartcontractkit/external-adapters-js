import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'

import { BaseEndpointTypes } from '../endpoint/funding-rate'

const logger = makeLogger('MobulaStateFundingRate')

export const EXCHANGES = ['binance', 'deribit'] as const

export type Exchange = (typeof EXCHANGES)[number]

/*
Example response message:
{
  "binanceFundingRate": {
    "symbol": "BTCUSDC",
    "fundingTime": 1739836800000,
    "fundingRate": 0.002964,
    "marketPrice": "95747.20000000",
    "epochDurationMs": 28800000
  },
  "deribitFundingRate":{
    "symbol": "BTC",
    "fundingTime": 1739862000000,
    "fundingRate": 0.0006396231268993106,
    "marketPrice": 95356.66,
    "epochDurationMs": 28800000
  }
}
*/

interface FundingRateResponse {
  symbol: string
  fundingTime: number
  fundingRate: number
  marketPrice: string | number
  epochDurationMs: number
}

export type WSResponse = {
  [E in Exchange as `${E}FundingRate`]: FundingRateResponse
} & {
  queryDetails: {
    base: string
    quote: string | null
  }
}

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WSResponse
  }
}

const symbolToParams = new Map<string, { base: string; quote: string }>()

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_FUNDING_RATE_API_ENDPOINT,
  builders: {
    subscribeMessage: (params, context) => {
      const symbol = `${params.base}${params.quote}`
      symbolToParams.set(symbol, { base: params.base, quote: params.quote })
      return {
        type: 'funding',
        authorization: context.adapterSettings.API_KEY,
        payload: {
          symbol,
        },
      }
    },
    // Mobula does not support unsubscribing.
    unsubscribeMessage: () => undefined,
  },
  handlers: {
    message(message) {
      const results: Array<ProviderResult<WsTransportTypes>> = []
      const querySymbol = `${message.queryDetails.base}${message.queryDetails.quote ?? ''}`
      if (message.binanceFundingRate) {
        const result = getFundingRateResult(querySymbol, 'binance', message.binanceFundingRate)
        if (result) results.push(result)
      }
      if (message.deribitFundingRate) {
        const result = getFundingRateResult(querySymbol, 'deribit', message.deribitFundingRate)
        if (result) results.push(result)
      }
      return results
    },
  },
})

const getFundingRateResult = (
  querySymbol: string,
  exchange: Exchange,
  fundingRate: FundingRateResponse,
): ProviderResult<WsTransportTypes> | undefined => {
  const params = symbolToParams.get(querySymbol)
  if (!params) {
    logger.error(`No params found for symbol ${querySymbol}`)
    return
  }

  return {
    params: { ...params, exchange },
    response: {
      result: fundingRate.fundingRate,
      data: {
        result: fundingRate.fundingRate,
        fundingTime: fundingRate.fundingTime,
        epochDurationMs: fundingRate.epochDurationMs,
      },
    },
  }
}
