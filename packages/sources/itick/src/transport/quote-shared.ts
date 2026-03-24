import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/quote'

export interface ResponseSchema {
  code: number // response code
  msg: string | null
  data: {
    s: string // symbol code
    ld: number // last price
    o: number // opening price
    p: number // previous closing price
    h: number // highest price
    l: number // lowest price
    t: number // timestamp of the latest trade
    v: number // trading volume
    tu: number // trading amount
    ts: number // trading status (0: normal, 1: halted, 2: delisted, 3: circut breaker)
    ch: number // change
    chp: number // change percentage
  }
}

export const createAdapterResponseFromMessage = (
  message: ResponseSchema,
): ProviderResult<BaseEndpointTypes>[] => {
  const lastPrice = message.data.ld
  return [
    {
      params: { symbol: message.data.s },
      response: {
        result: lastPrice,
        data: {
          lastPrice,
        },
      },
    },
  ]
}
