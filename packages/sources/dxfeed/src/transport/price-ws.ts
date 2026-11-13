import { BaseEndpointTypes } from '../endpoint/price'
import { DxLinkEvent, DxLinkEventType, DxLinkTransport } from './dxlink'
import { toNumber } from './utils'

// Session-agnostic by design: price has no session parameter, so the newest
// provider time wins across Trade and TradeETH. After a restart a regular
// Trade can be served to an extended/overnight stream until the newer TradeETH
// replay arrives; the reconnect snapshot burst closes that window. This is
// incumbent behaviour, not a regression.
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
