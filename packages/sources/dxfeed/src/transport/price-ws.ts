import { makeLogger } from '@chainlink/external-adapter-framework/util'
import type { BaseEndpointTypes } from '../endpoint/price'
import { buildDxLinkWsTransport, TRADE_ETH_EVENT_TYPE, TRADE_EVENT_TYPE } from './dxlink'
import { toNumber } from './utils'

const logger = makeLogger('PriceWsTransport')

const USLF24_SUFFIX = ':USLF24'

export const transport = buildDxLinkWsTransport<BaseEndpointTypes>({
  buildSubscriptions: (params) => {
    const ticker = params.base.toUpperCase()
    const trade = { symbol: ticker, type: TRADE_EVENT_TYPE }

    return ticker.includes(USLF24_SUFFIX)
      ? [trade, { symbol: ticker, type: TRADE_ETH_EVENT_TYPE }]
      : [trade]
  },

  parseFeedData: (events, guard) => {
    const results = []
    for (const { eventType, records } of events) {
      if (eventType !== TRADE_EVENT_TYPE && eventType !== TRADE_ETH_EVENT_TYPE) {
        continue
      }

      for (const record of records) {
        const base = String(record.eventSymbol)
        const price = toNumber(record.price)
        const time = toNumber(record.time)

        if (time !== null && !guard.keep(base, time)) {
          continue
        }

        if (price === null) {
          logger.warn(`Dropping ${base} ${eventType} with an invalid price`)
          results.push({
            params: { base },
            response: {
              statusCode: 502,
              errorMessage: `Price: ${String(record.price)} for ${base} is invalid.`,
            },
          })
          continue
        }

        results.push({
          params: { base },
          response: {
            result: price,
            data: {
              result: price,
            },
            timestamps: {
              providerIndicatedTimeUnixMs: time ?? undefined,
            },
          },
        })
      }
    }
    return results
  },
})
