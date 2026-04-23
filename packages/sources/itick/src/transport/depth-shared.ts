import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../endpoint/depth'

export interface ResponseSchema {
  code: number // response code
  msg: string | null
  data: {
    s: string // symbol code
    r?: string // region code, only present in websocket responses
    a: {
      // ask
      po: number // price level
      p: number // price
      v: number // volume
      o: number // order count
    }[]
    b: {
      // bid
      po: number // price level
      p: number // price
      v: number // volume
      o: number // order count
    }[]
  }
}

export const createAdapterResponseFromMessage = (
  message: ResponseSchema,
  // Only used by rest endpoint as it doesn't include the region in the response
  defaultRegion = 'unknown-region',
): ProviderResult<BaseEndpointTypes>[] => {
  const ask = message.data.a[0] ?? null
  const bid = message.data.b[0] ?? null
  if (ask === null || bid === null) {
    throw new AdapterError({
      statusCode: 500,
      message: 'Ask or bid data is missing',
    })
  }
  const askPrice = ask.p
  const bidPrice = bid.p
  const midPrice = (askPrice + bidPrice) / 2
  const askVolume = ask.v
  const bidVolume = bid.v
  const symbol = message.data.s
  const region = message.data.r ?? defaultRegion
  return [
    {
      params: { base: symbol, region },
      response: {
        result: midPrice,
        data: {
          symbol,
          askPrice,
          bidPrice,
          midPrice,
          askVolume,
          bidVolume,
        },
      },
    },
  ]
}
