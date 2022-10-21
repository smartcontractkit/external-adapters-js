import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['retheth']

export interface ResponseSchema {
  // TODO fill in with json rpc response
}

export type TInputParameters = {
  quote?: 'ETH' | 'USD'
}

export const description =
  'This endpoint returns the price of rETH/ETH according to the staking contract on Ethereum mainnet (L1).'

export const inputParameters: InputParameters<TInputParameters> = {
  quote: {
    description: 'Quote currency to pull price for',
    type: 'string',
    required: false,
    options: ['ETH', 'USD'],
    default: 'ETH',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath
  const quote = validator.validated.data.quote

  // const rethEth = ethers...getExchangeRate()

  // let result = rethEth

  if (quote === 'USD') {
    // const ethUsd = ethers...getlatest()...
    // result = new Decimal(rethEth).mul(new Decimal(ethUsd)).toNumber()
  }

  // const result = Requester.validateResultNumber(response.data, result)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
