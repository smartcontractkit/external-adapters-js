import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'

import { BaseEndpointTypes } from '../endpoint/funding-rate'

const logger = makeLogger('MobulaFundingRate')

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
  "deribitFundingRate": {
    "symbol": "BTC",
    "fundingTime": 1739862000000,
    "fundingRate": 0.0006396231268993106,
    "marketPrice": 95356.66,
    "epochDurationMs": 28800000
  },
  "queryDetails": {
    "base": "BTC",
    "quote": "USDC"
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
  [K: `${string}FundingRate`]: FundingRateResponse
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

export const wsTransport = new WebSocketTransport<WsTransportTypes>({
  url: (context) => context.adapterSettings.WS_FUNDING_RATE_API_ENDPOINT,
  builders: {
    subscribeMessage: (params, context) => {
      return {
        type: 'funding',
        authorization: context.adapterSettings.API_KEY,
        payload: {
          symbol: params.base,
          quote: params.quote,
          ...(params.protocol && { protocol: params.protocol }),
        },
      }
    },
    // Mobula does not support unsubscribing.
    unsubscribeMessage: () => undefined,
  },
  handlers: {
    message(message) {
      logger.info({ msg: 'Received WS message', data: JSON.stringify(message) })
      const results: Array<ProviderResult<WsTransportTypes>> = []
      const queryDetails = message.queryDetails
      Object.entries(message).forEach(([key, value]) => {
        if (!key.endsWith('FundingRate')) {
          return
        }

        if (!value) {
          // Dont add results when the value is null - one of the exchanges could be unavailable
          return
        }

        const exchange = key.slice(0, -'FundingRate'.length).toLowerCase()
        results.push(...getFundingRateResults(exchange, queryDetails, value as FundingRateResponse))
      })
      return results
    },
  },
})

const getFundingRateResults = (
  exchange: string,
  queryDetails: WSResponse['queryDetails'],
  fundingRate: FundingRateResponse,
): ProviderResult<WsTransportTypes>[] => {
  // Symbol may contain protocol prefix, e.g. "xyz:SILVER"
  const symbolParts = String(fundingRate.symbol).split(':')
  const protocol = symbolParts.length > 1 ? symbolParts[0] : undefined
  const response = {
    result: null,
    data: {
      fundingRate: fundingRate.fundingRate,
      fundingTimestamp: Math.trunc(fundingRate.fundingTime / 1000),
      epochDuration: Math.trunc(fundingRate.epochDurationMs / 1000),
    },
  }
  const baseParams = {
    base: queryDetails.base,
    quote: queryDetails.quote ?? '',
    exchange,
  }
  const results: ProviderResult<WsTransportTypes>[] = [{ params: baseParams, response }]
  if (protocol) {
    results.push({ params: { ...baseParams, protocol }, response })
  }
  return results
}
