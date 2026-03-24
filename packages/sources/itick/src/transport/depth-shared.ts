import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/depth'

export interface ResponseSchema {
  code: number // response code
  msg: string | null
  data: {
    s: string // symbol code
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
): ProviderResult<BaseEndpointTypes>[] => {
  const ask = message.data.a[0] ?? null
  const bid = message.data.b[0] ?? null
  const askPrice = ask?.p ?? null
  const bidPrice = bid?.p ?? null
  const midPrice = askPrice !== null && bidPrice !== null ? (askPrice + bidPrice) / 2 : null
  const askVolume = ask?.v ?? null
  const bidVolume = bid?.v ?? null
  return [
    {
      params: { symbol: message.data.s },
      response: {
        result: midPrice,
        data: {
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
