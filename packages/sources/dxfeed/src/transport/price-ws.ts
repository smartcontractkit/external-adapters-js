import { BaseEndpointTypes } from '../endpoint/price'
import { DxLinkEvent, DxLinkTransport } from './dxlink'
import { toNumber } from './utils'

export class PriceTransport extends DxLinkTransport<BaseEndpointTypes> {
  constructor() {
    // Trade is the regular-hours print and TradeETH is the extended-hours print. Both are
    // subscribed for every symbol; the base transport keeps the newest provider time, so an
    // overnight request gets the freshest print without session or clock logic here.
    super(['Trade', 'TradeETH'])
  }

  protected parseEvent(event: DxLinkEvent) {
    const base = event.eventSymbol
    const price = toNumber(event.price)
    if (price === null) {
      return [
        {
          params: { base },
          response: {
            statusCode: 502,
            errorMessage: `Price: ${event.price} for ${base} is invalid.`,
          },
        },
      ]
    }

    return [
      {
        params: { base },
        response: {
          result: price,
          data: { result: price },
          timestamps: { providerIndicatedTimeUnixMs: toNumber(event.time) ?? undefined },
        },
      },
    ]
  }
}

export const transport = new PriceTransport()
