import { BaseEndpointTypes } from '../endpoint/price'
import { DxLinkEvent, DxLinkEventType, DxLinkTransport } from './dxlink'
import { toNumber } from './utils'

export class PriceTransport extends DxLinkTransport<BaseEndpointTypes> {
  constructor() {
    // Negotiate both field sets; eventTypesForSymbol gates the subscriptions.
    super(['Trade', 'TradeETH'])
  }

  protected eventTypesForSymbol(symbol: string): DxLinkEventType[] {
    // Match the incumbent: :USLF24 gets Trade + TradeETH; bare tickers get Trade.
    return symbol.toUpperCase().includes(':USLF24') ? ['Trade', 'TradeETH'] : ['Trade']
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
