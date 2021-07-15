import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['dominance']

export const inputParameters: InputParameters = {
  market: ['market', 'to', 'quote'],
}

const convert: { [key: string]: string } = {
  BTC: 'bitcoin',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/v1/global'
  const options = {
    ...config.api,
    url,
  }
  const symbol: string = validator.validated.data.market.toUpperCase()

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, [
    `${convert[symbol]}_dominance_percentage`,
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
