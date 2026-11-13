import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { DxLinkEvent, DxLinkTransport, DxLinkTransportTypes, eventTimeOf } from './dxlink'
import { toNumber } from './utils'

type ParsedResult = ProviderResult<DxLinkTransportTypes<BaseEndpointTypes>>
type ParsedResponse = ParsedResult['response']

type PriceResult =
  | { kind: 'valid'; bid: number; ask: number }
  | { kind: 'invalid'; message: string }

export class StockQuotesTransport extends DxLinkTransport<BaseEndpointTypes> {
  constructor() {
    super(['Quote'])
  }

  protected parseEvent(event: DxLinkEvent) {
    const base = event.eventSymbol
    const overnight = event.bidExchangeCode === 'O' && event.askExchangeCode === 'O'
    const variants = overnight ? [false, true] : [false]
    const emit = (normal: ParsedResponse, requireVolume: ParsedResponse): ParsedResult[] =>
      variants.flatMap((isOvernight) => [
        { params: { base, isOvernight, requireVolume: false }, response: normal },
        { params: { base, isOvernight, requireVolume: true }, response: requireVolume },
      ])

    const time = eventTimeOf(event)
    if (time === null) {
      const error = {
        statusCode: 502,
        errorMessage: `Time: ${event.eventTime ?? event.time} for ${base} is invalid.`,
      }
      return emit(error, error)
    }

    const prices = parsePrices(event)
    if (prices.kind === 'invalid') {
      const error = { statusCode: 502, errorMessage: prices.message }
      return emit(error, error)
    }

    const midPrice = (prices.bid + prices.ask) / 2
    const bidVolume = volumeOrNull(event.bidSize)
    const askVolume = volumeOrNull(event.askSize)
    const response = {
      result: null,
      data: {
        mid_price: midPrice,
        midSource: 'computed' as const,
        bid_price: prices.bid,
        bid_volume: bidVolume,
        ask_price: prices.ask,
        ask_volume: askVolume,
      },
      timestamps: { providerIndicatedTimeUnixMs: time },
    }
    const requireVolumeResponse =
      bidVolume === null || askVolume === null
        ? {
            statusCode: 502,
            errorMessage: `Bid volume: ${event.bidSize} or Ask volume: ${event.askSize} for ${base} is invalid.`,
          }
        : response

    return emit(response, requireVolumeResponse)
  }
}

const parsePrices = (event: DxLinkEvent): PriceResult => {
  const bid = toNumber(event.bidPrice)
  const ask = toNumber(event.askPrice)
  if (bid === null || ask === null || bid <= 0 || ask <= 0) {
    return {
      kind: 'invalid',
      message: `Bid price: ${event.bidPrice} or Ask price: ${event.askPrice} for ${event.eventSymbol} is invalid.`,
    }
  }
  if (bid > ask) {
    return {
      kind: 'invalid',
      message: `Bid price: ${event.bidPrice} is greater than Ask price: ${event.askPrice} for ${event.eventSymbol}.`,
    }
  }
  if (!Number.isFinite((bid + ask) / 2)) {
    return {
      kind: 'invalid',
      message: `Mid price for ${event.eventSymbol} is invalid.`,
    }
  }
  return { kind: 'valid', bid, ask }
}

const volumeOrNull = (value: unknown): number | null => {
  const parsed = toNumber(value)
  return parsed !== null && parsed >= 0 ? parsed : null
}

export const transport = new StockQuotesTransport()
