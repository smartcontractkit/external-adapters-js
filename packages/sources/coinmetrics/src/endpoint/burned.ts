import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { totalBurned } from '.'

export const supportedEndpoints = ['burned']

export const inputParameters: InputParameters = {
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
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  new Validator(request, inputParameters)

  request.data.pageSize = 1
  request.data.isBurnedEndpointMode = true

  return totalBurned.execute(request, context, config)
}
