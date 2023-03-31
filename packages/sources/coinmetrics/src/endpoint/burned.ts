import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  EndpointTypes,
  Frequency,
  FrequencyInputOptions,
  TotalBurnedTransport,
} from './total-burned'

const inputParams = {
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
} satisfies InputParameters

export const endpoint = new AdapterEndpoint<EndpointTypes>({
  name: 'burned',
  transport: new TotalBurnedTransport(),
  inputParameters: inputParams,
})
