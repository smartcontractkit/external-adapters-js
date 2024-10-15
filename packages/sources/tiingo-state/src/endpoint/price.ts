import {
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { wsTransport } from '../transport/price'
import { config } from '../config'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'wstETH',
    quote: 'ETH',
  },
])

export type BaseCryptoEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new PriceEndpoint({
  name: 'price',
  aliases: ['crypto', 'state'],
  transportRoutes: new TransportRoutes<BaseCryptoEndpointTypes>().register('ws', wsTransport),
  defaultTransport: 'ws',
  inputParameters: inputParameters,
})
