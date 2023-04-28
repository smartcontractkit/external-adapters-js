import {
  CryptoPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { VALID_QUOTES, config } from '../config'
import { httpTransport } from './price-http'
import { wsTransport } from './price-ws'

export type AssetMetricsRequestBody = {
  base: string
  quote: VALID_QUOTES
}

export const assetMetricsInputParameters = new InputParameters({
  ...priceEndpointInputParametersDefinition,
  quote: {
    ...priceEndpointInputParametersDefinition.quote,
    options: Object.values(VALID_QUOTES),
  },
})

// Common endpoint type shared by the REST and WS transports
export type AssetMetricsEndpointTypes = {
  Parameters: typeof assetMetricsInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const transportRoutes = new TransportRoutes<AssetMetricsEndpointTypes>()
  .register('ws', wsTransport)
  .register('rest', httpTransport)

export const endpoint = new CryptoPriceEndpoint<AssetMetricsEndpointTypes>({
  name: 'price',
  aliases: ['price-ws'],
  transportRoutes,
  defaultTransport: 'ws',
  inputParameters: assetMetricsInputParameters,
})
