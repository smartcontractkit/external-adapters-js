import {
  MarketStatusEndpoint,
  marketStatusEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/market-status'
import { BaseMarketStatusEndpointTypes } from './common'

export const inputParameters = new InputParameters({
  ...marketStatusEndpointInputParametersDefinition,
  useSecondaryForTesting: {
    description: 'Skip primary source and use secondary source for testing',
    required: false,
    type: 'boolean',
    default: false,
  },
})

export type MarketStatusEndpointTypes = BaseMarketStatusEndpointTypes & {
  Parameters: typeof inputParameters.definition
}

export const endpoint = new MarketStatusEndpoint({
  name: 'market-status',
  transport,
  inputParameters,
})
