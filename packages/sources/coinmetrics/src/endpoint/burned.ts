import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { totalBurned } from '.'

export const supportedEndpoints = ['burned']

export const description = `Endpoint to calculate the number of burned coins/tokens for an asset either on the previous day or on the previous block.
This endpoint requires that the asset has the following metrics available: \`FeeTotNtv\`, \`RevNtv\` and \`IssTotNtv\`.`

export type TInputParameters = { asset: string; frequency: string }
export const inputParameters: InputParameters<TInputParameters> = {
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
  new Validator<TInputParameters>(request, inputParameters)

  request.data.pageSize = 1
  request.data.isBurnedEndpointMode = true

  return totalBurned.execute(request, context, config)
}
