import {
  StockEndpoint,
  stockEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter/stock'
import { httpTransport } from '../transport/price-http'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { wsTransport } from '../transport/price-ws'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

export const inputParameters = new InputParameters(stockEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new StockEndpoint({
  name: 'price',
  aliases: ['stock'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  inputParameters: inputParameters,
})
