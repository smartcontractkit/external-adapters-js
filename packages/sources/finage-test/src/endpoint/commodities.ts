import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { commoditiesPriceInputParameters } from './utils'
import { transport } from '../transport/commodities'

export type BaseEndpointTypes = {
  Parameters: typeof commoditiesPriceInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new PriceEndpoint({
  name: 'commodities',
  transport,
  inputParameters: commoditiesPriceInputParameters,
  overrides: overrides.finage,
})
