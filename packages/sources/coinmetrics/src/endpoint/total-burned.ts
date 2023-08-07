import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { InputParametersDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { TotalBurnedTransport } from '../transport/total-burned'
export enum Frequency {
  ONE_DAY = '1d',
  ONE_BLOCK = '1b',
}

const ENPDOINT_NAME = 'total-burned'

export const FrequencyInputOptions = [Frequency.ONE_DAY, Frequency.ONE_BLOCK]

export const baseInputParametersDefinition = {
  asset: {
    description:
      'The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets)',
    type: 'string',
    required: true,
  },
  frequency: {
    description: 'At which interval to calculate the number of coins/tokens burned',
    type: 'string',
    required: false,
    options: FrequencyInputOptions,
    default: Frequency.ONE_DAY,
  },
  pageSize: {
    description: 'Number of results to get per page. From 1 to 10000',
    default: 10_000,
    type: 'number',
    required: false,
  },
} as const satisfies InputParametersDefinition

export const inputParameters = new InputParameters(baseInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint({
  name: ENPDOINT_NAME,
  transport: new TotalBurnedTransport(),
  inputParameters,
})
