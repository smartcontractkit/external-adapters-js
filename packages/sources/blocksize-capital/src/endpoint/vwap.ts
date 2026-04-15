import {
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/vwap'
import { blocksizeStateSubscriptionRequestTransform } from './utils'

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'AMPL',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new PriceEndpoint({
  name: 'vwap',
  aliases: ['crypto-vwap'],
  transport,
  inputParameters,
  requestTransforms: [blocksizeStateSubscriptionRequestTransform()],
})
