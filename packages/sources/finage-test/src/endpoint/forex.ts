import { ForexPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/forex-http'
import { ForexBaseEndpointTypes, forexPriceInputParameters } from './utils'
import { wsTransport } from '../transport/forex-ws'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { PriceAdapterRequest } from '../index'

/* 
excludesMap includes currency pairs {quote: [base ...]} which should not be inverted.
*/
const excludesMap: Record<string, string[]> = {
  USD: ['EUR', 'GBP', 'AUD', 'NZD', 'XAG', 'XAU', 'XPT', 'XPD', 'XCU'],
}

export const forexReqTransformer = (req: AdapterRequest<any>): void => {
  if (req.requestContext.endpointName == 'forex') {
    const priceRequest = req as PriceAdapterRequest<any>

    const quote = req.requestContext.data.quote
    const base = req.requestContext.data.base
    let inverse
    if (excludesMap?.[quote].includes(base)) inverse = false
    else {
      inverse = true
      priceRequest.requestContext.data.base = quote
      priceRequest.requestContext.data.quote = base
    }

    priceRequest.requestContext.priceMeta = {
      inverse,
    }
  }
}

export const endpoint = new ForexPriceEndpoint({
  name: 'forex',
  transportRoutes: new TransportRoutes<ForexBaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: forexPriceInputParameters,
  overrides: overrides.finage,
  requestTransforms: [forexReqTransformer],
})
