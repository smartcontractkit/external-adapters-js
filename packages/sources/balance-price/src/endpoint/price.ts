import {
  AdapterEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { wsTransport } from '../transport/price'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'BTC',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: wsTransport,
  inputParameters,
  overrides: overrides['balance-price'],
})
