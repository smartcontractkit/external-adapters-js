import {
  LwbaEndpoint,
  LwbaResponseDataFields,
  lwbaEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { assetQuoteWebsocketTransport, pairQuoteWebsocketTransport } from '../transport/lwba'

export const inputParameters = new InputParameters(lwbaEndpointInputParametersDefinition, [
  {
    base: 'ETH',
    quote: 'USD',
  },
])

const assets: string[] = ['bnb', 'uni', 'sol', 'ltc', 'xrp', 'arb']

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: LwbaResponseDataFields
}

export const endpoint = new LwbaEndpoint<BaseEndpointTypes>({
  name: 'crypto-lwba',
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('asset', assetQuoteWebsocketTransport)
    .register('pair', pairQuoteWebsocketTransport),
  customRouter: (req, _) => {
    const { base } = req.requestContext.data as typeof inputParameters.validated & {
      transport?: string
    }
    const route = assets.includes(base.toLowerCase()) ? 'asset' : 'pair'

    return route
  },
  inputParameters,
})
