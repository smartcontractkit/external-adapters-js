import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { PriceMessage } from './price'

const MESSAGE_TTL_SECONDS = 300
const coverTimeToMs = (time?: number) => (time ? Math.floor(time * 1000) : undefined)
const isMessageOld = (time?: number) =>
  time ? Date.now() - time > MESSAGE_TTL_SECONDS * 1000 : false

export class PriceCache {
  bidCache: Map<string, { price: number; volume: number; time?: number }> = new Map()
  askCache: Map<string, { price: number; volume: number; time?: number }> = new Map()
  private logger = makeLogger('PriceCache')

  processBidAsk(streamId: string, bid?: PriceMessage, ask?: PriceMessage) {
    this.setBookSide(streamId, 'bid', bid)
    this.setBookSide(streamId, 'ask', ask)
  }

  private setBookSide(streamId: string, side: 'bid' | 'ask', msg?: PriceMessage) {
    const cache = side === 'bid' ? this.bidCache : this.askCache
    const price = msg?.value
    const volume = msg?.size
    const time = coverTimeToMs(msg?.unixTimestamp)

    if (isMessageOld(time)) {
      this.logger.warn(
        `${side} message ${JSON.stringify(msg)} is more than ${MESSAGE_TTL_SECONDS}s old`,
      )
      return
    }
    if (price == undefined || Number.isNaN(price) || volume === undefined || Number.isNaN(volume)) {
      this.logger.debug(`Invalid or missing ${side} ${JSON.stringify(msg)}`)
      return
    }
    cache.set(streamId, {
      price,
      volume,
      time,
    })
  }

  getPriceResponse(streamId: string, last?: PriceMessage) {
    const result = last?.value
    if (result === undefined || Number.isNaN(result)) {
      this.logger.info(`Invalid or missing last: ${JSON.stringify(last)}`)
      return []
    }

    const time = coverTimeToMs(last?.unixTimestamp)
    if (isMessageOld(time)) {
      this.logger.warn(
        `Last message ${JSON.stringify(last)} is more than ${MESSAGE_TTL_SECONDS}s old`,
      )
      return []
    }

    return [
      {
        params: { base: streamId, rawEndpoint: 'stock' },
        response: {
          result,
          data: {
            result,
          },
          ...(time && {
            timestamps: {
              providerIndicatedTimeUnixMs: time,
            },
          }),
        },
      },
    ]
  }

  getBidAskResponse(streamId: string) {
    const bid = this.bidCache.get(streamId)
    const ask = this.askCache.get(streamId)

    if (bid && ask) {
      let midPrice: number
      if (bid.price == 0) {
        midPrice = ask.price
      } else if (ask.price == 0) {
        midPrice = bid.price
      } else {
        midPrice = (bid.price + ask.price) / 2
      }

      const time = Math.max(bid.time || 0, ask.time || 0)
      return [
        {
          params: { base: streamId, rawEndpoint: 'stock_quotes' },
          response: {
            result: null,
            data: {
              mid_price: midPrice,
              bid_price: bid.price,
              bid_volume: bid.volume,
              ask_price: ask.price,
              ask_volume: ask.volume,
            },
            ...(time && {
              timestamps: {
                providerIndicatedTimeUnixMs: time,
              },
            }),
          },
        },
      ]
    } else {
      this.logger.info(`Missing bid or ask for ${streamId}`)
      return []
    }
  }
}
