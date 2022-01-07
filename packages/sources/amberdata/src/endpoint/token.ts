import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['marketcap', 'token']

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    type: 'string',
  },
  resultPath: {
    required: false,
    description: 'The object path to access the value that will be returned as the result',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const coin = validator.validated.data.base
  const resultPath = validator.validated.data.resultPath || 'marketCapUSD'
  const url = `/api/v2/market/tokens/prices/${coin.toLowerCase()}/latest`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig, customError)
  const coinData = response.data.payload.find(
    (asset: Record<string, any>) => asset.symbol.toUpperCase() === coin.toUpperCase(),
  )
  response.data.result = Requester.validateResultNumber(coinData, [resultPath])

  return Requester.success(jobRunID, response, config.verbose)
}
