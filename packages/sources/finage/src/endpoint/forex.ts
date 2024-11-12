import { ForexPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/forex-http'
import { ForexBaseEndpointTypes, forexPriceInputParameters } from './utils'
import { wsTransport } from '../transport/forex-ws'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { PriceAdapterRequest } from '../index'

/* 
to improve data quality for forex feeds

On receiving FOO/USD request, if FOO is on the list of assets that are queried in the standard direction (EUR, GBP, AUD, NZD, XAG, XAU, XPT, XPD, XCU)
 then handle as normal, else invert the request

excludesMap includes currency pairs {quote: [base ...]} which should not be inverted.
*/
const excludesMap: Record<string, string[]> = {
  USD: ['EUR', 'GBP', 'AUD', 'NZD', 'XAG', 'XAU', 'XPT', 'XPD', 'XCU', 'PLN'],
}

export const forexReqTransformer = (
  req: AdapterRequest<typeof forexPriceInputParameters.validated>,
): void => {
  if (req.requestContext.endpointName == endpoint.name) {
    const priceRequest = req as PriceAdapterRequest<typeof forexPriceInputParameters.validated>

    priceRequest.requestContext.priceMeta = {
      inverse: false,
    }

    const quote = String(req.requestContext.data.quote).toUpperCase()
    const base = String(req.requestContext.data.base).toUpperCase()

    if (excludesMap[quote] && !excludesMap[quote].includes(base)) {
      priceRequest.requestContext.data.base = quote
      priceRequest.requestContext.data.quote = base
      priceRequest.requestContext.priceMeta.inverse = true
    }
  }
}

// List of bases whose pairs should be routed to REST only
const assets: string[] = ['AED', 'CNY', 'IDR', 'PHP', 'THB', 'TZS', 'VND']

export const endpoint = new ForexPriceEndpoint({
  name: 'forex',
  transportRoutes: new TransportRoutes<ForexBaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (req, adapterConfig) => {
    const { base, quote } = req.requestContext
      .data as typeof forexPriceInputParameters.validated & {
      transport?: string
    }
    // Always route the listed assets to rest since Finage does not provide adequate
    // updates for them over websocket
    // Checking both 'base' and 'quote' due to inverses of pairs
    if (assets.includes(base.toUpperCase()) || assets.includes(quote.toUpperCase())) {
      return 'rest'
    } else {
      return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
    }
  },
  inputParameters: forexPriceInputParameters,
  overrides: overrides.finage,
  requestTransforms: [forexReqTransformer],
})
