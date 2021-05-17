import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'dominance'

const inputParams = {
  market: ['market', 'to', 'quote'],
}

const convert: { [key: string]: string } = {
  BTC: 'bitcoin',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
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
