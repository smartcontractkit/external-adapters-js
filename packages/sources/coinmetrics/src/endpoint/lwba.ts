import {
  AdapterEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { assetQuoteWebsocketTransport, pairQuoteWebsocketTransport } from '../transport/lwba'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

const assets: string[] = ['bnb', 'uni', 'sol', 'ltc', 'xrp']

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: number
    mid: number
    ask: number
    asksize: number
    bid: number
    bidsize: number
    spread: number
    Data: {
      result: number
      bid: number
      mid: number
      ask: number
    }
  }
}

export const endpoint = new AdapterEndpoint<BaseEndpointTypes>({
  name: 'crypto-lwba',
  aliases: ['cryptolwba', 'crypto_lwba'],
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
